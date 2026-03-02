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
          // Fase 1 — Gestão de Usuários
          global_role: 'super_admin' | 'user'
          username: string | null
          active_organization_id: string | null
          role: 'admin' | 'moderador' | 'fornecedor' | null
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
          // Fase 1 — Gestão de Usuários
          global_role?: 'super_admin' | 'user'
          username?: string | null
          active_organization_id?: string | null
          role?: 'admin' | 'moderador' | 'fornecedor' | null
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
          // Fase 1 — Gestão de Usuários
          global_role?: 'super_admin' | 'user'
          username?: string | null
          active_organization_id?: string | null
          role?: 'admin' | 'moderador' | 'fornecedor' | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          tipo: 'lojista' | 'fornecedor'
          slug: string | null
          created_at: string
          is_global: boolean
        }
        Insert: {
          id?: string
          name: string
          cnpj?: string | null
          tipo: 'lojista' | 'fornecedor'
          slug?: string | null
          created_at?: string
          is_global?: boolean
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string | null
          tipo?: 'lojista' | 'fornecedor'
          slug?: string | null
          created_at?: string
          is_global?: boolean
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'member' | 'vendedor'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: 'owner' | 'admin' | 'member' | 'vendedor'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: 'owner' | 'admin' | 'member' | 'vendedor'
          is_active?: boolean
          created_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          token: string
          organization_id: string
          email: string
          role: 'admin' | 'member' | 'vendedor'
          invited_by: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          token?: string
          organization_id: string
          email: string
          role?: 'admin' | 'member' | 'vendedor'
          invited_by?: string | null
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          organization_id?: string
          email?: string
          role?: 'admin' | 'member' | 'vendedor'
          invited_by?: string | null
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: number
          actor_user_id: string
          acting_as_org_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: number
          actor_user_id: string
          acting_as_org_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          actor_user_id?: string
          acting_as_org_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
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
          product_id: string | null
          nome_produto: string
          descricao: string | null
          unidade: string
          quantidade: number
          observacao: string | null
          // Enhanced fields (v2)
          codigo_barras: string | null
          categoria: string | null
          estoque_atual: number | null
          quantidade_sugerida: number | null
          tipo_unidade: 'UN' | 'CX' | 'DZ' | 'FD'
        }
        Insert: {
          id?: string
          cotacao_id: string
          product_id?: string | null
          nome_produto: string
          descricao?: string | null
          unidade?: string
          quantidade: number
          observacao?: string | null
          // Enhanced fields (v2)
          codigo_barras?: string | null
          categoria?: string | null
          estoque_atual?: number | null
          quantidade_sugerida?: number | null
          tipo_unidade?: 'UN' | 'CX' | 'DZ' | 'FD'
        }
        Update: {
          id?: string
          cotacao_id?: string
          product_id?: string | null
          nome_produto?: string
          descricao?: string | null
          unidade?: string
          quantidade?: number
          observacao?: string | null
          // Enhanced fields (v2)
          codigo_barras?: string | null
          categoria?: string | null
          estoque_atual?: number | null
          quantidade_sugerida?: number | null
          tipo_unidade?: 'UN' | 'CX' | 'DZ' | 'FD'
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
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          barcode: string | null
          image_url: string | null
          category: string | null
          created_by: string | null
          created_at: string
          updated_at: string | null
          price_unit_store: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          barcode?: string | null
          image_url?: string | null
          category?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
          price_unit_store?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          barcode?: string | null
          image_url?: string | null
          category?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
          price_unit_store?: number
        }
      }
      product_quotes: {
        Row: {
          id: string
          product_id: string
          company_name: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          company_name: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          company_name?: string
          price?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          organization_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string
          organization_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string
          organization_id?: string | null
          created_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          product_id: string
          category_id: string
        }
        Insert: {
          id?: string
          product_id: string
          category_id: string
        }
        Update: {
          id?: string
          product_id?: string
          category_id?: string
        }
      }
    }
    Enums: {
      user_tipo: 'empresario' | 'fornecedor'
      user_role: 'admin' | 'moderador' | 'fornecedor'
      cotacao_status: 'aberta' | 'em_andamento' | 'encerrada'
      proposta_status: 'enviada' | 'aceita' | 'recusada'
      unit_type: 'UN' | 'CX' | 'DZ' | 'FD'
      // Fase 1 — Gestão de Usuários
      global_role: 'super_admin' | 'user'
      membership_role: 'owner' | 'admin' | 'member' | 'vendedor'
      organization_tipo: 'lojista' | 'fornecedor'
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Cotacao = Database['public']['Tables']['cotacoes']['Row']
export type CotacaoItem = Database['public']['Tables']['cotacao_itens']['Row']
export type Proposta = Database['public']['Tables']['propostas']['Row']
export type PropostaItem = Database['public']['Tables']['proposta_itens']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductQuote = Database['public']['Tables']['product_quotes']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type ProductCategory = Database['public']['Tables']['product_categories']['Row']

export type UnitType = 'UN' | 'CX' | 'DZ'
export type UserRole = 'admin' | 'moderador' | 'fornecedor'
export type GlobalRole = 'super_admin' | 'user'
export type MembershipRole = 'owner' | 'admin' | 'member' | 'vendedor'
export type OrganizationTipo = 'lojista' | 'fornecedor'

// Supplier-safe view of cotacao_itens (removes internal fields)
export type CotacaoItemPublic = Omit<CotacaoItem, 'estoque_atual' | 'quantidade_sugerida'>

// Extended types for joins
export type CotacaoComItens = Cotacao & {
  cotacao_itens: CotacaoItem[]
  profiles: Pick<Profile, 'nome' | 'empresa'>
}

export type PropostaComItens = Proposta & {
  proposta_itens: (PropostaItem & {
    cotacao_itens: Pick<CotacaoItem, 'nome_produto' | 'unidade' | 'quantidade' | 'tipo_unidade'>
  })[]
  profiles: Pick<Profile, 'nome' | 'empresa'>
}

export type CotacaoComPropostas = CotacaoComItens & {
  propostas: (Proposta & {
    profiles: Pick<Profile, 'nome' | 'empresa'>
  })[]
}

// Product with latest quote and categories
export type ProductWithQuote = Product & {
  latest_quote: ProductQuote | null
  categories?: Category[]
}

// Category with product count
export type CategoryWithCount = Category & {
  product_count: number
}
