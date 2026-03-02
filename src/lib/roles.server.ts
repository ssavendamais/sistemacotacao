'use server'

import { createClient } from '@/lib/supabase/server'
import type { GlobalRole, MembershipRole, UserRole } from '@/lib/types/database'
import { redirect } from 'next/navigation'

// Papel legado baseado no campo 'role' de profiles (mantido para compatibilidade)
export async function getUserRole(): Promise<UserRole> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (profile?.role as UserRole) ?? 'fornecedor'
}

// Papel global do usuário na plataforma (super_admin | user)
export async function getGlobalRole(): Promise<GlobalRole> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('global_role')
    .eq('id', user.id)
    .single()

  return (profile?.global_role as GlobalRole) ?? 'user'
}

// Papel do usuário dentro de uma organização específica (ou da ativa se não informado)
export async function getUserMembershipRole(
  organizationId?: string
): Promise<MembershipRole | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Se não informado, usar a organização ativa
  let orgId = organizationId
  if (!orgId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_organization_id')
      .eq('id', user.id)
      .single()

    orgId = profile?.active_organization_id ?? undefined
  }

  if (!orgId) return null

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .single()

  return membership?.role as MembershipRole ?? null
}
