"use client"

import type { EmpresarioDashboardData } from "@/actions/dashboard"
import { LayoutConfigModal } from "@/components/dashboard/LayoutConfigModal"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { useDraftList } from "@/lib/hooks/useDraftList"
import { useLayoutConfig } from "@/lib/hooks/useLayoutConfig"
import { ArrowRight, ClipboardList, FileText, Package, Pencil, Plus, Tags } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

interface Props {
  data: EmpresarioDashboardData
}

const iconMap: Record<string, React.ElementType> = {
  Package,
  Tags,
  ClipboardList,
  FileText
};

const colorMap: Record<string, { bg: string, text: string }> = {
  produtos: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  categorias: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'lista-cotacao': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  cotacoes: { bg: 'bg-sky-500/10', text: 'text-sky-400' },
};

export function EmpresarioDashboardContent({ data }: Props) {
  const greeting = getGreeting()
  const { order, orderedModules, mounted } = useLayoutConfig('dashboard')
  const [layoutModalOpen, setLayoutModalOpen] = useState(false)
  const { count: draftCount } = useDraftList()

  const getModuleValue = (id: string) => {
    switch (id) {
      case 'produtos': return data.totalProdutos;
      case 'categorias': return data.totalCategorias;
      case 'lista-cotacao': return draftCount;
      case 'cotacoes': return data.stats.find(s => s.label === 'Total de Cotações')?.value || 0;
      default: return 0;
    }
  }

  const getModuleSubtitle = (id: string) => {
    switch (id) {
      case 'produtos': return "produtos cadastrados";
      case 'categorias': return "categorias cadastradas";
      case 'lista-cotacao': return "itens no rascunho";
      case 'cotacoes': return "cotações realizadas";
      default: return "";
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Hero Section ── */}
      <div className="animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {greeting}, {data.userName}! 👋
          </h1>
          <p className="text-gray-400 font-medium">
            {data.cotacoesAbertas > 0 ? (
              <>
                Você tem{" "}
                <span className="text-indigo-400 font-bold">
                  {data.cotacoesAbertas} cotaç{data.cotacoesAbertas === 1 ? "ão" : "ões"}
                </span>{" "}
                aguardando proposta
              </>
            ) : (
              "Sua central de orçamentos e inteligência comercial."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLayoutModalOpen(true)}
            className="h-12 border-white/10 bg-[#1F2937] text-gray-300 hover:text-white hover:bg-white/5 transition-all shadow-sm"
            title="Editar Layout"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar Layout
          </Button>
          
          <Link href="/empresario/cotacoes/nova">
            <Button
              size="lg"
              className="shadow-lg shadow-indigo-500/20 px-6 h-12 bg-indigo-600 hover:bg-indigo-500 text-white border-none cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Cotação
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Modular Hub ── */}
      {mounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-up-delay-2 mt-8 auto-rows-fr items-stretch">
          {orderedModules.map((mod, i) => {
            const IconComponent = iconMap[mod.icon] || Package;
            const colors = colorMap[mod.id] || colorMap.produtos;
            const value = getModuleValue(mod.id);
            const subtitle = getModuleSubtitle(mod.id);

            return (
              <Link key={mod.id} href={mod.href} className="block h-full">
                <div 
                  className="group flex flex-col justify-between p-8 rounded-2xl border border-white/[0.06] bg-[#1F2937] hover:bg-[#253041] transition-all duration-300 h-full shadow-sm hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 hover:border-white/[0.12] cursor-pointer"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`h-16 w-16 rounded-[var(--radius-md)] flex items-center justify-center border border-white/[0.04] ${colors.bg} ${colors.text} transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-600 group-hover:text-gray-300 transition-colors group-hover:translate-x-1 duration-300" />
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-indigo-100 transition-colors">{mod.label}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-gray-100 tabular-nums tracking-tight">
                        <AnimatedNumber value={value as number} loading={!mounted} />
                      </span>
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{subtitle}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Atividades Recentes ── */}
      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[#1F2937] p-6 lg:p-8">
        <h3 className="text-lg font-bold text-white mb-6">
          Atividades Recentes
        </h3>
        <RecentActivity items={data.recentActivity} />
      </div>

      <LayoutConfigModal 
        open={layoutModalOpen} 
        onClose={() => setLayoutModalOpen(false)} 
        initialOrder={order} 
      />
    </div>
  )
}
