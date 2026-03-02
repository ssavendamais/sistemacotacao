'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─────────────────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/**
 * Verifica se o usuário é super_admin OU admin/owner da organização informada.
 * Usado pelas actions que org admins também podem executar.
 */
export async function requireOrgAdmin(organizationId: string) {
  const { supabase, user } = await getAuthUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('global_role')
    .eq('id', user.id)
    .single()

  if (profile?.global_role === 'super_admin') return { supabase, user }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Acesso negado. Apenas admins da organização podem executar esta ação.')
  }

  return { supabase, user }
}

// ─────────────────────────────────────────────────────────
// Criar convite por link
// ─────────────────────────────────────────────────────────

export type InvitationRole = 'admin' | 'member' | 'vendedor'

export async function createInvitation(data: {
  organizationId: string
  email: string
  role: InvitationRole
}): Promise<{ token: string | null; error: string | null }> {
  const { supabase, user } = await requireOrgAdmin(data.organizationId)

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: data.organizationId,
      email: data.email,
      role: data.role,
      invited_by: user.id,
    })
    .select('token')
    .single()

  if (error) return { token: null, error: error.message }

  revalidatePath('/empresario/usuarios')
  return { token: invitation.token, error: null }
}

// ─────────────────────────────────────────────────────────
// Buscar convite por token (página pública /convite/[token])
// ─────────────────────────────────────────────────────────

export type InvitationPublic = {
  id: string
  email: string
  role: InvitationRole
  organization_id: string
  expires_at: string
  accepted_at: string | null
  organizations: { name: string; tipo: string } | null
}

export async function getInvitationByToken(token: string): Promise<{
  invitation: InvitationPublic | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      role,
      organization_id,
      expires_at,
      accepted_at,
      organizations ( name, tipo )
    `)
    .eq('token', token)
    .single()

  if (error || !data) return { invitation: null, error: 'Convite não encontrado ou inválido.' }

  const isExpired = new Date(data.expires_at) < new Date()
  if (isExpired) return { invitation: null, error: 'Este convite expirou.' }

  if (data.accepted_at) return { invitation: null, error: 'Este convite já foi utilizado.' }

  return { invitation: data as unknown as InvitationPublic, error: null }
}

// ─────────────────────────────────────────────────────────
// Aceitar convite — cria usuário + membership
// ─────────────────────────────────────────────────────────

export async function acceptInvitation(data: {
  token: string
  nome: string
  username: string
  password: string
}): Promise<{ success: boolean; error: string | null }> {
  // 1. Validar convite
  const { invitation, error: invError } = await getInvitationByToken(data.token)
  if (invError || !invitation) return { success: false, error: invError ?? 'Convite inválido.' }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 2. Criar usuário no Auth
  const orgTipo = invitation.organizations?.tipo ?? 'lojista'
  const perfilTipo = orgTipo === 'fornecedor' ? 'fornecedor' : 'empresario'

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: invitation.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      nome: data.nome,
      tipo: perfilTipo,
    },
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Erro ao criar usuário.' }
  }

  const userId = authData.user.id

  // 3. Atualizar profile com username
  await adminClient
    .from('profiles')
    .update({ username: data.username })
    .eq('id', userId)

  // 4. Criar membership na organização
  const { error: memberError } = await adminClient.from('memberships').insert({
    user_id: userId,
    organization_id: invitation.organization_id,
    role: invitation.role,
    is_active: true,
  })

  if (memberError) return { success: false, error: memberError.message }

  // 5. Definir org ativa
  await adminClient
    .from('profiles')
    .update({ active_organization_id: invitation.organization_id })
    .eq('id', userId)

  // 6. Marcar convite como aceito
  await adminClient
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', data.token)

  return { success: true, error: null }
}

// ─────────────────────────────────────────────────────────
// Reset de senha — org admin ou super_admin
// ─────────────────────────────────────────────────────────

export async function sendPasswordReset(
  targetEmail: string,
  organizationId?: string
): Promise<{ success: boolean; error: string | null }> {
  // Guard: super_admin pode resetar qualquer um; org admin só da sua org
  const { supabase, user } = await getAuthUser()

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('global_role')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = callerProfile?.global_role === 'super_admin'

  if (!isSuperAdmin && organizationId) {
    await requireOrgAdmin(organizationId)
  } else if (!isSuperAdmin) {
    throw new Error('Acesso negado.')
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: targetEmail,
  })

  if (error) return { success: false, error: error.message }

  return { success: true, error: null }
}
