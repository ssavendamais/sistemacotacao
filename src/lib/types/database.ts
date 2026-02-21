export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          tipo: 'empresario' | 'fornecedor'
          telefone: string | null
          empresa: string | null
          cnpj: string | null
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          tipo: 'empresario' | 'fornecedor'
          telefone?: string | null
          empresa?: string | null
          cnpj?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          tipo?: 'empresario' | 'fornecedor'
          telefone?: string | null
          empresa?: string | null
          cnpj?: string | null
          created_at?: string
        }
      }
      cotacoes: {
        Row: {
          id: string
          empresario_id: string
          titulo: string
          descricao: string | null
          status: 'aberta' | 'em_andamento' | 'encerrada'
          data_limite: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresario_id: string
          titulo: string
          descricao?: string | null
          status?: 'aberta' | 'em_andamento' | 'encerrada'
          data_limite?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          empresario_id?: string
          titulo?: string
          descricao?: string | null
          status?: 'aberta' | 'em_andamento' | 'encerrada'
          data_limite?: string | null
          created_at?: string
        }
      }
      cotacao_itens: {
        Row: {
          id: string
          cotacao_id: string
          nome_produto: string
          unidade: string
          quantidade: number
          observacao: string | null
        }
        Insert: {
          id?: string
          cotacao_id: string
          nome_produto: string
          unidade?: string
          quantidade: number
          observacao?: string | null
        }
        Update: {
          id?: string
          cotacao_id?: string
          nome_produto?: string
          unidade?: string
          quantidade?: number
          observacao?: string | null
        }
      }
      propostas: {
        Row: {
          id: string
          cotacao_id: string
          fornecedor_id: string
          status: 'enviada' | 'aceita' | 'recusada'
          valor_total: number | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cotacao_id: string
          fornecedor_id: string
          status?: 'enviada' | 'aceita' | 'recusada'
          valor_total?: number | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cotacao_id?: string
          fornecedor_id?: string
          status?: 'enviada' | 'aceita' | 'recusada'
          valor_total?: number | null
          observacao?: string | null
          created_at?: string
        }
      }
      proposta_itens: {
        Row: {
          id: string
          proposta_id: string
          cotacao_item_id: string
          preco_unitario: number
          quantidade_disponivel: number | null
          observacao: string | null
        }
        Insert: {
          id?: string
          proposta_id: string
          cotacao_item_id: string
          preco_unitario: number
          quantidade_disponivel?: number | null
          observacao?: string | null
        }
        Update: {
          id?: string
          proposta_id?: string
          cotacao_item_id?: string
          preco_unitario?: number
          quantidade_disponivel?: number | null
          observacao?: string | null
        }
      }
    }
    Enums: {
      user_tipo: 'empresario' | 'fornecedor'
      cotacao_status: 'aberta' | 'em_andamento' | 'encerrada'
      proposta_status: 'enviada' | 'aceita' | 'recusada'
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Cotacao = Database['public']['Tables']['cotacoes']['Row']
export type CotacaoItem = Database['public']['Tables']['cotacao_itens']['Row']
export type Proposta = Database['public']['Tables']['propostas']['Row']
export type PropostaItem = Database['public']['Tables']['proposta_itens']['Row']

// Extended types for joins
export type CotacaoComItens = Cotacao & {
  cotacao_itens: CotacaoItem[]
  profiles: Pick<Profile, 'nome' | 'empresa'>
}

export type PropostaComItens = Proposta & {
  proposta_itens: (PropostaItem & {
    cotacao_itens: Pick<CotacaoItem, 'nome_produto' | 'unidade' | 'quantidade'>
  })[]
  profiles: Pick<Profile, 'nome' | 'empresa'>
}

export type CotacaoComPropostas = CotacaoComItens & {
  propostas: (Proposta & {
    profiles: Pick<Profile, 'nome' | 'empresa'>
  })[]
}
