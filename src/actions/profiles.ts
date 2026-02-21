'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function atualizarPerfil(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nome = formData.get('nome') as string
  const telefone = formData.get('telefone') as string
  const empresa = formData.get('empresa') as string
  const cnpj = formData.get('cnpj') as string

  if (!nome?.trim()) {
    return { error: 'Nome é obrigatório.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nome,
      telefone: telefone || null,
      empresa: empresa || null,
      cnpj: cnpj || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/empresario/dashboard')
  revalidatePath('/fornecedor/dashboard')

  return { success: true }
}
