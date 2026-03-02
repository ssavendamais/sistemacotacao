'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Types ──

export interface DashboardStat {
  label: string
  value: number
  href: string
  icon: string // lucide icon name
  color: string
  bgColor: string
}

export interface ActivityItem {
  id: string
  type: 'cotacao_criada' | 'proposta_recebida' | 'cotacao_encerrada' | 'proposta_enviada' | 'proposta_aceita'
  title: string
  description: string
  created_at: string
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface EmpresarioDashboardData {
  userName: string
  stats: DashboardStat[]
  chartData: ChartDataPoint[]
  recentActivity: ActivityItem[]
  cotacoesAbertas: number
  totalProdutos: number
  totalCategorias: number
}

export interface FornecedorDashboardData {
  userName: string
  stats: DashboardStat[]
  chartData: ChartDataPoint[]
  recentActivity: ActivityItem[]
  cotacoesDisponiveis: number
}

// ── Helpers ──

function getLast7DaysLabels(): string[] {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(days[d.getDay()])
  }
  return labels
}

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ── Empresário Dashboard ──

export async function getDashboardEmpresario(): Promise<EmpresarioDashboardData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single()

  // Stats
  const [totalCotacoesRes, cotacoesAbertasRes, totalPropostasRes, totalProdutosRes, totalCategoriasRes] = await Promise.all([
    supabase
      .from('cotacoes')
      .select('*', { count: 'exact', head: true })
      .eq('empresario_id', user.id),
    supabase
      .from('cotacoes')
      .select('*', { count: 'exact', head: true })
      .eq('empresario_id', user.id)
      .eq('status', 'aberta'),
    supabase
      .from('propostas')
      .select('*, cotacoes!inner(empresario_id)', { count: 'exact', head: true })
      .eq('cotacoes.empresario_id', user.id),
    supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('empresario_id', user.id),
    supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true })
      .eq('empresario_id', user.id),
  ])

  const totalCotacoes = totalCotacoesRes.count ?? 0
  const cotacoesAbertas = cotacoesAbertasRes.count ?? 0
  const totalPropostas = totalPropostasRes.count ?? 0
  const totalProdutos = totalProdutosRes.count ?? 0
  const totalCategorias = totalCategoriasRes.count ?? 0

  // Chart - cotações per day (last 7 days)
  const sevenDaysAgo = getDateNDaysAgo(7)
  const { data: recentCotacoes } = await supabase
    .from('cotacoes')
    .select('created_at')
    .eq('empresario_id', user.id)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })

  const dayLabels = getLast7DaysLabels()
  const chartData: ChartDataPoint[] = dayLabels.map((label, index) => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - (6 - index))
    const dateStr = targetDate.toISOString().split('T')[0]
    const count = (recentCotacoes || []).filter(
      (c) => c.created_at?.startsWith(dateStr)
    ).length
    return { label, value: count }
  })

  // Recent activity
  const activity: ActivityItem[] = []

  const { data: recentCotacoesActivity } = await supabase
    .from('cotacoes')
    .select('id, titulo, created_at, status')
    .eq('empresario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  for (const c of recentCotacoesActivity || []) {
    if (c.status === 'encerrada') {
      activity.push({
        id: `cotacao-enc-${c.id}`,
        type: 'cotacao_encerrada',
        title: 'Cotação finalizada',
        description: c.titulo,
        created_at: c.created_at,
      })
    } else {
      activity.push({
        id: `cotacao-${c.id}`,
        type: 'cotacao_criada',
        title: 'Nova cotação criada',
        description: c.titulo,
        created_at: c.created_at,
      })
    }
  }

  const { data: recentPropostas } = await supabase
    .from('propostas')
    .select('id, created_at, cotacoes!inner(titulo, empresario_id), profiles:fornecedor_id(nome)')
    .eq('cotacoes.empresario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  for (const p of (recentPropostas as unknown as Array<{
    id: string
    created_at: string
    cotacoes: { titulo: string }
    profiles: { nome: string }
  }>) || []) {
    activity.push({
      id: `proposta-${p.id}`,
      type: 'proposta_recebida',
      title: 'Proposta recebida',
      description: `${p.profiles?.nome || 'Fornecedor'} enviou proposta para "${p.cotacoes?.titulo}"`,
      created_at: p.created_at,
    })
  }

  // Sort by date and take last 5
  activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return {
    userName: profile?.nome?.split(' ')[0] || 'Usuário',
    stats: [
      {
        label: 'Total de Cotações',
        value: totalCotacoes,
        href: '/empresario/cotacoes',
        icon: 'FileText',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
      },
      {
        label: 'Cotações Abertas',
        value: cotacoesAbertas,
        href: '/empresario/cotacoes?status=aberta',
        icon: 'TrendingUp',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
      {
        label: 'Propostas Recebidas',
        value: totalPropostas,
        href: '/empresario/cotacoes',
        icon: 'Send',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
      },
    ],
    chartData,
    recentActivity: activity.slice(0, 5),
    cotacoesAbertas,
    totalProdutos,
    totalCategorias,
  }
}

// ── Fornecedor Dashboard ──

export async function getDashboardFornecedor(): Promise<FornecedorDashboardData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single()

  // Stats
  const [cotacoesDisponiveisRes, minhasPropostasRes, propostasAceitasRes] = await Promise.all([
    supabase
      .from('cotacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aberta'),
    supabase
      .from('propostas')
      .select('*', { count: 'exact', head: true })
      .eq('fornecedor_id', user.id),
    supabase
      .from('propostas')
      .select('*', { count: 'exact', head: true })
      .eq('fornecedor_id', user.id)
      .eq('status', 'aceita'),
  ])

  const cotacoesDisponiveis = cotacoesDisponiveisRes.count ?? 0
  const minhasPropostas = minhasPropostasRes.count ?? 0
  const propostasAceitas = propostasAceitasRes.count ?? 0

  // Chart - propostas per day (last 7 days)
  const sevenDaysAgo = getDateNDaysAgo(7)
  const { data: recentPropostasChart } = await supabase
    .from('propostas')
    .select('created_at')
    .eq('fornecedor_id', user.id)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })

  const dayLabels = getLast7DaysLabels()
  const chartData: ChartDataPoint[] = dayLabels.map((label, index) => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - (6 - index))
    const dateStr = targetDate.toISOString().split('T')[0]
    const count = (recentPropostasChart || []).filter(
      (p) => p.created_at?.startsWith(dateStr)
    ).length
    return { label, value: count }
  })

  // Recent activity
  const activity: ActivityItem[] = []

  const { data: recentPropostas } = await supabase
    .from('propostas')
    .select('id, created_at, status, cotacoes:cotacao_id(titulo)')
    .eq('fornecedor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  for (const p of (recentPropostas as unknown as Array<{
    id: string
    created_at: string
    status: string
    cotacoes: { titulo: string }
  }>) || []) {
    if (p.status === 'aceita') {
      activity.push({
        id: `proposta-aceita-${p.id}`,
        type: 'proposta_aceita',
        title: 'Proposta aceita!',
        description: p.cotacoes?.titulo || 'Cotação',
        created_at: p.created_at,
      })
    } else {
      activity.push({
        id: `proposta-enviada-${p.id}`,
        type: 'proposta_enviada',
        title: 'Proposta enviada',
        description: p.cotacoes?.titulo || 'Cotação',
        created_at: p.created_at,
      })
    }
  }

  activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return {
    userName: profile?.nome?.split(' ')[0] || 'Usuário',
    stats: [
      {
        label: 'Cotações Disponíveis',
        value: cotacoesDisponiveis,
        href: '/fornecedor/cotacoes',
        icon: 'Search',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
      },
      {
        label: 'Propostas Enviadas',
        value: minhasPropostas,
        href: '/fornecedor/propostas',
        icon: 'Send',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
      },
      {
        label: 'Propostas Aceitas',
        value: propostasAceitas,
        href: '/fornecedor/propostas?status=aceita',
        icon: 'TrendingUp',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
    ],
    chartData,
    recentActivity: activity.slice(0, 5),
    cotacoesDisponiveis,
  }
}
