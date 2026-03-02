"use client"

import type { FornecedorDashboardData } from "@/actions/dashboard"
import { DashboardCard } from "@/components/dashboard/DashboardCard"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, TrendingUp } from "lucide-react"
import Link from "next/link"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

interface Props {
  data: FornecedorDashboardData
}

export function FornecedorDashboardContent({ data }: Props) {
  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      {/* ── Hero Section ── */}
      <div className="animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {greeting}, {data.userName}! 👋
          </h1>
          <p className="text-gray-400 font-medium">
            {data.cotacoesDisponiveis > 0 ? (
              <>
                Existem{" "}
                <span className="text-indigo-400 font-bold">
                  {data.cotacoesDisponiveis} cotaç{data.cotacoesDisponiveis === 1 ? "ão" : "ões"}
                </span>{" "}
                aguardando sua proposta
              </>
            ) : (
              "Encontre novas oportunidades e gerencie seus orçamentos."
            )}
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.stats.map((stat, index) => (
          <DashboardCard key={stat.label} {...stat} delay={index} />
        ))}
      </div>

      {/* ── Chart + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 animate-slide-up-delay-3 rounded-2xl border border-white/[0.06] bg-[#1F2937] p-6">
          <MiniChart
            data={data.chartData}
            label="Propostas — Últimos 7 dias"
            color="#6366F1"
          />
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 animate-slide-up-delay-4 rounded-2xl border border-white/[0.06] bg-[#1F2937] p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Atividades Recentes
          </h3>
          <RecentActivity items={data.recentActivity} />
        </div>
      </div>

      {/* ── Opportunities + Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-delay-4">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-white/[0.06] p-8 min-h-[260px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-[0.06] scale-125">
            <Briefcase className="h-48 w-48 text-indigo-400" />
          </div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Novas Oportunidades
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              Existem {data.cotacoesDisponiveis || 0} cotações abertas
              aguardando propostas. Não perca tempo e envie sua melhor oferta
              agora mesmo.
            </p>
          </div>
          <div className="relative z-10 pt-6">
            <Link href="/fornecedor/cotacoes">
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/15 text-white border-white/10 cursor-pointer transition-all duration-300 px-8"
              >
                Ver Oportunidades
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.04] p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 bg-[#1F2937] rounded-xl shadow-sm flex items-center justify-center text-indigo-400 border border-white/[0.06]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Desempenho</h3>
            <p className="text-sm text-gray-400">
              Acompanhe a taxa de aceitação de suas propostas para otimizar seus
              preços.
            </p>
          </div>
          <Link
            href="/fornecedor/propostas"
            className="pt-6 text-sm font-bold text-indigo-400 flex items-center gap-2 hover:gap-3 transition-all"
          >
            Minhas Propostas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
