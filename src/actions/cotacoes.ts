'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getCotacoes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cotacoes')
    .select(`
      *,
      profiles:empresario_id (nome, empresa),
      cotacao_itens (*),
      propostas (id)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getCotacao(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cotacoes')
    .select(`
      *,
      profiles:empresario_id (nome, empresa),
      cotacao_itens (*),
      propostas (
        *,
        profiles:fornecedor_id (nome, empresa),
        proposta_itens (
          *,
          cotacao_itens:cotacao_item_id (nome_produto, unidade, quantidade)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function criarCotacao(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const dataLimite = formData.get('data_limite') as string

  if (!titulo?.trim()) {
    return { error: 'Título é obrigatório.' }
  }

  // Parse itens from FormData
  const itensJson = formData.get('itens') as string
  let itens: { nome_produto: string; unidade: string; quantidade: number; observacao?: string }[] = []

  try {
    itens = JSON.parse(itensJson || '[]')
  } catch {
    return { error: 'Formato de itens inválido.' }
  }

  if (itens.length === 0) {
    return { error: 'Adicione pelo menos um item à cotação.' }
  }

  // Insert cotação
  const { data: cotacao, error: cotacaoError } = await supabase
    .from('cotacoes')
    .insert({
      empresario_id: user.id,
      titulo,
      descricao: descricao || null,
      data_limite: dataLimite || null,
    })
    .select('id')
    .single()

  if (cotacaoError) return { error: cotacaoError.message }

  // Insert itens
  const { error: itensError } = await supabase.from('cotacao_itens').insert(
    itens.map((item) => ({
      cotacao_id: cotacao.id,
      nome_produto: item.nome_produto,
      unidade: item.unidade || 'un',
      quantidade: item.quantidade,
      observacao: item.observacao || null,
    }))
  )

  if (itensError) return { error: itensError.message }

  revalidatePath('/empresario/cotacoes')
  redirect('/empresario/cotacoes')
}

export async function atualizarStatusCotacao(id: string, status: 'aberta' | 'em_andamento' | 'encerrada') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('cotacoes')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/empresario/cotacoes/${id}`)
  revalidatePath('/empresario/cotacoes')
}

export async function deletarCotacao(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('cotacoes').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/empresario/cotacoes')
  redirect('/empresario/cotacoes')
}
