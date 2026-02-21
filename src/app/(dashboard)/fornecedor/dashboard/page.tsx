import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Briefcase, Search, Send, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FornecedorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();

  // Stats
  const { count: cotacoesDisponiveis } = await supabase
    .from("cotacoes")
    .select("*", { count: "exact", head: true })
    .eq("status", "aberta");

  const { count: minhasPropostas } = await supabase
    .from("propostas")
    .select("*", { count: "exact", head: true })
    .eq("fornecedor_id", user.id);

  const { count: propostasAceitas } = await supabase
    .from("propostas")
    .select("*", { count: "exact", head: true })
    .eq("fornecedor_id", user.id)
    .eq("status", "aceita");

  const stats = [
    {
      label: "Cotações Disponíveis",
      value: cotacoesDisponiveis ?? 0,
      icon: Search,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Propostas Enviadas",
      value: minhasPropostas ?? 0,
      icon: Send,
      color: "text-info-700",
      bg: "bg-info-light",
    },
    {
      label: "Propostas Aceitas",
      value: propostasAceitas ?? 0,
      icon: TrendingUp,
      color: "text-success-700",
      bg: "bg-success-light",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            Olá, {profile?.nome?.split(" ")[0]}! 👋
          </h1>
          <p className="text-neutral-500 font-medium">
            Encontre novas oportunidades e gerencie seus orçamentos.
          </p>
        </div>
      </div>

      {/* Hero Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.label} highlighted={index === 0} className="overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <CardBody className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-[var(--radius-lg)] flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-neutral-900 leading-none mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-neutral-900 text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-125">
             <Briefcase className="h-48 w-48" />
          </div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-bold">Novas Oportunidades</h2>
            <p className="text-neutral-400 text-sm max-w-md">
              Existem {cotacoesDisponiveis || 0} cotações abertas aguardando propostas. Não perca tempo e envie sua melhor oferta agora mesmo.
            </p>
            <div className="pt-4">
              <Link href="/fornecedor/cotacoes">
                <Button variant="primary" className="bg-white text-neutral-900 hover:bg-neutral-100 border-none px-8">
                  Ver Oportunidades
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="bg-primary-50 border-primary-100 p-8 flex flex-col justify-between">
           <div className="space-y-4">
             <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500">
                <TrendingUp className="h-6 w-6" />
             </div>
             <h3 className="text-lg font-bold text-neutral-900">Desempenho</h3>
             <p className="text-sm text-neutral-600">
               Acompanhe a taxa de aceitação de suas propostas para otimizar seus preços.
             </p>
           </div>
           <Link href="/fornecedor/propostas" className="pt-6 text-sm font-bold text-primary-600 flex items-center gap-2">
             Minhas Propostas
             <ArrowRight className="h-4 w-4" />
           </Link>
        </Card>
      </div>
    </div>
  );
}

