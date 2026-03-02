import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Building2, Eye, Inbox, Package, Send } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CotacoesDisponiveisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch quotations available for bidding
  const { data: cotacoes } = await supabase
    .from("cotacoes")
    .select(
      `
      *,
      profiles:empresario_id (nome, empresa),
      cotacao_itens (id)
    `
    )
    .in("status", ["aberta", "em_andamento"])
    .order("created_at", { ascending: false });

  // Get IDs of quotations where this supplier already sent a proposal
  const { data: minhasPropostas } = await supabase
    .from("propostas")
    .select("cotacao_id")
    .eq("fornecedor_id", user.id);

  const proposedCotacaoIds = new Set(
    minhasPropostas?.map((p) => p.cotacao_id) ?? []
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Oportunidades</h1>
          <p className="text-sm text-gray-400 mt-1">
            Encontre novas cotações e envie suas melhores propostas
          </p>
        </div>
      </div>

      {/* Filters (Mocked functionality for now) */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary" className="cursor-pointer">Todas ({cotacoes?.length || 0})</Badge>
        <Badge variant="default" className="cursor-pointer">Novas ({cotacoes?.filter(c => !proposedCotacaoIds.has(c.id)).length || 0})</Badge>
        <Badge variant="default" className="cursor-pointer">Já orçadas ({minhasPropostas?.length || 0})</Badge>
      </div>

      {/* List */}
      {!cotacoes || cotacoes.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-7 w-7" />}
          title="Nenhuma cotação disponível"
          description="Fique atento! Novas oportunidades podem surgir a qualquer momento."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cotacoes.map((cotacao) => {
            const alreadyProposed = proposedCotacaoIds.has(cotacao.id);

            return (
              <Link key={cotacao.id} href={`/fornecedor/cotacoes/${cotacao.id}`}>
                <Card interactive className="group overflow-hidden">
                  <CardBody className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Left highlight for state */}
                      <div className={`w-1 md:w-2 ${alreadyProposed ? 'bg-white/10' : 'bg-indigo-500'}`} />
                      
                      <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                              {cotacao.titulo}
                            </h3>
                            {alreadyProposed ? (
                              <Badge variant="default" dot>
                                Já orçada
                              </Badge>
                            ) : (
                              <Badge variant="success" dot>
                                Nova Oportunidade
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                              <Building2 className="h-3.5 w-3.5 text-gray-500" />
                              {(cotacao as any).profiles?.empresa || (cotacao as any).profiles?.nome}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-500">
                              <Package className="h-3.5 w-3.5" />
                              {cotacao.cotacao_itens?.length ?? 0} itens
                            </span>
                            <span className="text-white/10">|</span>
                            <span className="text-gray-500">
                              Publicada em {formatDate(cotacao.created_at)}
                            </span>
                          </div>
                          
                          {cotacao.descricao && (
                            <p className="text-sm text-gray-400 line-clamp-1 italic bg-white/[0.03] p-2 rounded">
                              &ldquo;{cotacao.descricao}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Button variant={alreadyProposed ? "secondary" : "primary"} className="w-full md:w-auto">
                            {alreadyProposed ? (
                              <>
                                <Eye className="h-4 w-4" />
                                Ver Proposta
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Enviar Cotar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
