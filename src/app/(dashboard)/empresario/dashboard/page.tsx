import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, FileText, Plus, Send, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EmpresarioDashboardPage() {
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
  const { count: totalCotacoes } = await supabase
    .from("cotacoes")
    .select("*", { count: "exact", head: true })
    .eq("empresario_id", user.id);

  const { count: cotacoesAbertas } = await supabase
    .from("cotacoes")
    .select("*", { count: "exact", head: true })
    .eq("empresario_id", user.id)
    .eq("status", "aberta");

  const { count: totalPropostas } = await supabase
    .from("propostas")
    .select("*, cotacoes!inner(empresario_id)", { count: "exact", head: true })
    .eq("cotacoes.empresario_id", user.id);

  const stats = [
    {
      label: "Total de Cotações",
      value: totalCotacoes ?? 0,
      icon: FileText,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Cotações Abertas",
      value: cotacoesAbertas ?? 0,
      icon: TrendingUp,
      color: "text-success-700",
      bg: "bg-success-light",
    },
    {
      label: "Propostas Recebidas",
      value: totalPropostas ?? 0,
      icon: Send,
      color: "text-info-700",
      bg: "bg-info-light",
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
            Sua central de orçamentos e inteligência comercial.
          </p>
        </div>
        
        <Link href="/empresario/cotacoes/nova">
          <Button size="lg" className="shadow-lg shadow-primary-500/20 px-6 h-12">
            <Plus className="h-5 w-5" />
            Nova Cotação
          </Button>
        </Link>
      </div>

      {/* Hero Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.label} highlighted={index === 1} className="overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions / Shortcuts */}
        <Card className="border-none bg-neutral-900 text-white min-h-[300px] flex flex-col justify-between p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 scale-150">
            <Zap className="h-64 w-64" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary-300">
              Próximos Passos
            </div>
            <h2 className="text-2xl font-bold max-w-xs leading-tight">Agilize seus pedidos com inteligência</h2>
            <p className="text-neutral-400 text-sm max-w-sm">
              Use nosso comparador automático para encontrar a proposta ideal em segundos, economizando até 15% nos custos.
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-4">
            <Link href="/empresario/cotacoes" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full bg-white text-neutral-900 hover:bg-neutral-100 border-none">
                Ver minhas cotações
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-primary-50 border-primary-100 flex flex-col justify-center p-8">
          <div className="space-y-6">
            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-primary-600">
              <FileText className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900">Gerenciamento Centralizado</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Acompanhe o status de todas as suas solicitações em tempo real. Receba alertas assim que um novo fornecedor enviar uma proposta.
              </p>
            </div>
            <Link href="/empresario/configuracoes" className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Configurar notificações automáticas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

