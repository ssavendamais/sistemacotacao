'use server'

import { createClient } from '@/lib/supabase/server'
import type { MembershipRole, Organization, OrganizationTipo } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// ─────────────────────────────────────────────────────────
// Criar organização + membership como 'owner'
// ─────────────────────────────────────────────────────────

export async function createOrganization(data: {
  name: string
  cnpj?: string | null
  tipo: OrganizationTipo
  slug?: string | null
}): Promise<{ organization: Organization | null; error: string | null }> {
  const { supabase, user } = await getAuthenticatedUser()

  // 1. Inserir a organização
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      cnpj: data.cnpj ?? null,
      tipo: data.tipo,
      slug: data.slug ?? null,
    })
    .select()
    .single()

  if (orgError) {
    return { organization: null, error: orgError.message }
  }

  // 2. Criar membership do criador como 'owner'
  const { error: memberError } = await supabase.from('memberships').insert({
    user_id: user.id,
    organization_id: org.id,
    role: 'owner' as MembershipRole,
    is_active: true,
  })

  if (memberError) {
    return { organization: null, error: memberError.message }
  }

  // 3. Definir como organização ativa do usuário
  await supabase
    .from('profiles')
    .update({ active_organization_id: org.id })
    .eq('id', user.id)

  return { organization: org, error: null }
}

// ─────────────────────────────────────────────────────────
// Listar todas as organizações do usuário autenticado
// ─────────────────────────────────────────────────────────

export async function getUserOrganizations(): Promise<{
  organizations: (Organization & { membership_role: MembershipRole })[]
  error: string | null
}> {
  const { supabase, user } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('memberships')
    .select(`
      role,
      is_active,
      organizations (
        id,
        name,
        cnpj,
        tipo,
        slug,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    return { organizations: [], error: error.message }
  }

  const organizations = (data ?? [])
    .filter((m) => m.organizations !== null)
    .map((m) => ({
      ...(m.organizations as unknown as Organization),
      membership_role: m.role as MembershipRole,
    }))

  return { organizations, error: null }
}

// ─────────────────────────────────────────────────────────
// Trocar organização ativa (multi-org estilo Instagram)
// ─────────────────────────────────────────────────────────

export async function switchActiveOrganization(
  organizationId: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, user } = await getAuthenticatedUser()

  // Verificar se o usuário é membro ativo da organização solicitada
  const { data: membership, error: memberError } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  if (memberError || !membership) {
    return { success: false, error: 'Você não tem acesso a essa organização.' }
  }

  // Atualizar organização ativa
  const { error } = await supabase
    .from('profiles')
    .update({ active_organization_id: organizationId })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, error: null }
}

// ─────────────────────────────────────────────────────────
// Retornar organização ativa do usuário atual
// ─────────────────────────────────────────────────────────

export async function getActiveOrganization(): Promise<{
  organization: Organization | null
  membershipRole: MembershipRole | null
  error: string | null
}> {
  const { supabase, user } = await getAuthenticatedUser()

  // Buscar o active_organization_id do profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.active_organization_id) {
    return { organization: null, membershipRole: null, error: null }
  }

  // Buscar a org e o papel do usuário nela
  const { data: membership, error: memberError } = await supabase
    .from('memberships')
    .select(`
      role,
      organizations (
        id,
        name,
        cnpj,
        tipo,
        slug,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('organization_id', profile.active_organization_id)
    .eq('is_active', true)
    .single()

  if (memberError || !membership) {
    return { organization: null, membershipRole: null, error: memberError?.message ?? null }
  }

  return {
    organization: membership.organizations as unknown as Organization,
    membershipRole: membership.role as MembershipRole,
    error: null,
  }
}
