'use server'

import { createOrganization } from '@/actions/organizations'
import { createClient } from '@/lib/supabase/server'
import type { OrganizationTipo } from '@/lib/types/database'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nome = formData.get('nome') as string
  const tipo = formData.get('tipo') as 'empresario' | 'fornecedor'
  const empresa = formData.get('empresa') as string | null
  const cnpj = formData.get('cnpj') as string | null
  const telefone = formData.get('telefone') as string | null

  if (!email || !password || !nome || !tipo) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome,
        tipo,
        empresa,
        telefone,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return { error: 'Conta criada! Por favor, verifique seu e-mail para confirmar o cadastro antes de logar.' }
  }

  // Criar organização automaticamente se houver nome de empresa
  if (empresa?.trim()) {
    const orgTipo: OrganizationTipo = tipo === 'fornecedor' ? 'fornecedor' : 'lojista'
    await createOrganization({
      name: empresa.trim(),
      cnpj: cnpj ?? null,
      tipo: orgTipo,
    })
  }

  const dashboardPath =
    tipo === 'fornecedor' ? '/fornecedor/dashboard' : '/empresario/dashboard'

  redirect(dashboardPath)
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha email e senha.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Fetch profile to determine redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Erro ao recuperar dados do usuário.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tipo')
    .eq('id', user.id)
    .single() as { data: { tipo: string } | null }

  const dashboardPath =
    profile?.tipo === 'fornecedor'
      ? '/fornecedor/dashboard'
      : '/empresario/dashboard'

  redirect(dashboardPath)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
