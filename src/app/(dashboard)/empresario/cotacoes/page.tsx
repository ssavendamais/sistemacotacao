import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { COTACAO_STATUS_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Eye, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/* ─── Mocking for interactive demo / client-side components ─── */
// Note: In a real app, we'd use useQuery or scroll logic. 
// For this MVP design task, we are focusing on appearance.

interface CotacaoWithCounts {
  id: string;
  titulo: string;
  descricao: string | null;
  status: "aberta" | "em_andamento" | "encerrada";
  created_at: string;
  cotacao_itens?: { id: string }[];
  propostas?: { id: string }[];
}

export default async function CotacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cotacoes } = await supabase
    .from("cotacoes")
    .select(
      `
      *,
      cotacao_itens (id),
      propostas (id)
    `
    )
    .eq("empresario_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Cotações</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie suas solicitações e compare propostas
          </p>
        </div>
        <Link href="/empresario/cotacoes/nova">
          <Button>
            <Plus className="h-4 w-4" />
            Nova Cotação
          </Button>
        </Link>
      </div>

      {/* List */}
      {!cotacoes || cotacoes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="Você ainda não tem cotações"
          description="Crie sua primeira cotação para receber propostas de fornecedores."
          action={
            <Link href="/empresario/cotacoes/nova">
              <Button>Criar Nova Cotação</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {cotacoes.map((cotacao) => (
            <Link key={cotacao.id} href={`/empresario/cotacoes/${cotacao.id}`}>
              <Card interactive className="group">
                <CardBody className="flex items-center justify-between p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-200 truncate group-hover:text-indigo-400 transition-colors">
                        {cotacao.titulo}
                      </h3>
                      <Badge variant={cotacao.status === 'aberta' ? 'enviada' : cotacao.status === 'em_andamento' ? 'em-analise' : 'expirada'} dot>
                        {COTACAO_STATUS_LABELS[cotacao.status as keyof typeof COTACAO_STATUS_LABELS]}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-medium text-gray-400">
                        {cotacao.cotacao_itens?.length ?? 0} {cotacao.cotacao_itens?.length === 1 ? 'item' : 'itens'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/10 hidden sm:block" />
                      <span className="flex items-center gap-1.5 font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                        {cotacao.propostas?.length ?? 0} propostas
                      </span>
                      <span className="w-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />
                      <span>Criada em {formatDate(cotacao.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center gap-2 text-gray-500 group-hover:text-indigo-400 transition-all">
                    <span className="text-xs font-medium hidden sm:block">Ver detalhes</span>
                    <Eye className="h-5 w-5" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
