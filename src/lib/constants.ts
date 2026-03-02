export const COTACAO_STATUS_LABELS = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  encerrada: 'Encerrada',
} as const

export const PROPOSTA_STATUS_LABELS = {
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
} as const

export const USER_TIPO_LABELS = {
  empresario: 'Empresário',
  fornecedor: 'Fornecedor',
} as const

// Unidade comercial para itens de cotação
export const UNIT_TYPES = ['UN', 'CX', 'DZ', 'FD'] as const
export type UnitType = typeof UNIT_TYPES[number]

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  UN: 'Unidade',
  CX: 'Caixa',
  DZ: 'Dúzia',
  FD: 'Fardo',
}

export const UNIT_TYPE_ICONS: Record<UnitType, string> = {
  UN: '📦',
  CX: '🗃️',
  DZ: '🔢',
  FD: '📫',
}

export const CATEGORIAS = [
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'construcao', label: 'Construção' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'vestuario', label: 'Vestuário' },
  { value: 'outros', label: 'Outros' },
] as const

// Legacy list — kept for backward compatibility
export const UNIDADES = [
  'un',
  'kg',
  'g',
  'L',
  'mL',
  'cx',
  'pct',
  'fardo',
  'dúzia',
] as const
