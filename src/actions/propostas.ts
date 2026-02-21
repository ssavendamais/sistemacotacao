'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getMinhasPropostas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('propostas')
    .select(`
      *,
      cotacoes:cotacao_id (
        titulo,
        status,
        profiles:empresario_id (nome, empresa)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getProposta(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('propostas')
    .select(`
      *,
      profiles:fornecedor_id (nome, empresa),
      cotacoes:cotacao_id (titulo, status),
      proposta_itens (
        *,
        cotacao_itens:cotacao_item_id (nome_produto, unidade, quantidade)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function enviarProposta(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cotacaoId = formData.get('cotacao_id') as string
  const observacao = formData.get('observacao') as string

  if (!cotacaoId) {
    return { error: 'Cotação inválida.' }
  }

  // Parse itens from FormData
  const itensJson = formData.get('itens') as string
  let itens: {
    cotacao_item_id: string
    preco_unitario: number
    quantidade_disponivel?: number
    observacao?: string
  }[] = []

  try {
    itens = JSON.parse(itensJson || '[]')
  } catch {
    return { error: 'Formato de itens inválido.' }
  }

  if (itens.length === 0) {
    return { error: 'Preencha o preço de pelo menos um item.' }
  }

  // Calculate total
  const valorTotal = itens.reduce(
    (sum, item) => sum + item.preco_unitario * (item.quantidade_disponivel || 0),
    0
  )

  // Insert proposta
  const { data: proposta, error: propostaError } = await supabase
    .from('propostas')
    .insert({
      cotacao_id: cotacaoId,
      fornecedor_id: user.id,
      observacao: observacao || null,
      valor_total: valorTotal,
    })
    .select('id')
    .single()

  if (propostaError) {
    if (propostaError.code === '23505') {
      return { error: 'Você já enviou uma proposta para esta cotação.' }
    }
    return { error: propostaError.message }
  }

  // Insert proposta itens
  const { error: itensError } = await supabase.from('proposta_itens').insert(
    itens.map((item) => ({
      proposta_id: proposta.id,
      cotacao_item_id: item.cotacao_item_id,
      preco_unitario: item.preco_unitario,
      quantidade_disponivel: item.quantidade_disponivel || null,
      observacao: item.observacao || null,
    }))
  )

  if (itensError) return { error: itensError.message }

  revalidatePath('/fornecedor/propostas')
  revalidatePath(`/fornecedor/cotacoes/${cotacaoId}`)
}

export async function gerenciarProposta(
  propostaId: string,
  status: 'aceita' | 'recusada'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('propostas')
    .update({ status })
    .eq('id', propostaId)

  if (error) return { error: error.message }

  // Get the cotacao_id for revalidation
  const { data: proposta } = await supabase
    .from('propostas')
    .select('cotacao_id')
    .eq('id', propostaId)
    .single()

  if (proposta) {
    revalidatePath(`/empresario/cotacoes/${proposta.cotacao_id}`)
  }
  revalidatePath('/empresario/cotacoes')
}
