'use server'

import { createClient } from '@/lib/supabase/server'
import type { GlobalRole, UserRole } from '@/lib/types/database'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─────────────────────────────────────────────────────────
// Guard: apenas super_admin pode chamar estas actions
// ─────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('global_role')
    .eq('id', user.id)
    .single()

  if (profile?.global_role !== 'super_admin') {
    throw new Error('Acesso negado. Apenas super administradores podem executar esta ação.')
  }

  return { supabase, user }
}

// ─────────────────────────────────────────────────────────
// Listar todos os usuários da plataforma
// ─────────────────────────────────────────────────────────

export type AdminUserView = {
  id: string
  nome: string
  email: string
  tipo: 'empresario' | 'fornecedor'
  role: UserRole | null
  global_role: GlobalRole
  username: string | null
  empresa: string | null
  created_at: string
}

export type AdminUserViewExtended = AdminUserView & {
  active_organization_id?: string | null
}

export async function listAllUsers(): Promise<{
  users: AdminUserView[]
  error: string | null
}> {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, tipo, role, global_role, username, empresa, active_organization_id, created_at')
    .order('created_at', { ascending: false })

  if (error) return { users: [], error: error.message }

  return { users: (data as AdminUserView[]) ?? [], error: null }
}

// ─────────────────────────────────────────────────────────
// Atualizar papel de um usuário (role + global_role)
// ─────────────────────────────────────────────────────────

export async function updateUserRole(
  targetUserId: string,
  role: UserRole | null,
  globalRole: GlobalRole
): Promise<{ success: boolean; error: string | null }> {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role, global_role: globalRole })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/empresario/usuarios')
  return { success: true, error: null }
}

// ─────────────────────────────────────────────────────────
// Convidar / criar novo usuário via Supabase Auth Admin
// ─────────────────────────────────────────────────────────

export async function inviteUser(data: {
  email: string
  nome: string
  tipo: 'empresario' | 'fornecedor'
  role: UserRole
  empresaId?: string
}): Promise<{ success: boolean; error: string | null }> {
  await requireSuperAdmin()

  // Supabase Admin Client (usa Service Role Key — nunca exposta ao cliente)
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Criar o usuário via Auth Admin (envia email de convite automaticamente)
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(
    data.email,
    {
      data: {
        nome: data.nome,
        tipo: data.tipo,
      },
    }
  )

  if (authError) return { success: false, error: authError.message }
  if (!authUser.user) return { success: false, error: 'Usuário não foi criado.' }

  // Atualizar o profile com role e empresa
  await adminSupabase
    .from('profiles')
    .update({
      role: data.role,
      empresa: data.empresaId ?? null,
    })
    .eq('id', authUser.user.id)

  revalidatePath('/empresario/usuarios')
  return { success: true, error: null }
}

// ─────────────────────────────────────────────────────────
// Desativar usuário (soft disable via metadata)
// ─────────────────────────────────────────────────────────

export async function deactivateUser(
  targetUserId: string
): Promise<{ success: boolean; error: string | null }> {
  await requireSuperAdmin()

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
    ban_duration: '876600h', // ~100 anos = efetivamente desativado
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/empresario/usuarios')
  return { success: true, error: null }
}

// ─────────────────────────────────────────────────────────
// Reativar usuário
// ─────────────────────────────────────────────────────────

export async function reactivateUser(
  targetUserId: string
): Promise<{ success: boolean; error: string | null }> {
  await requireSuperAdmin()

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
    ban_duration: 'none',
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/empresario/usuarios')
  return { success: true, error: null }
}
