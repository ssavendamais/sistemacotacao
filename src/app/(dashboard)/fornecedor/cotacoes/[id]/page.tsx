import { getCotacaoParaFornecedor } from "@/actions/cotacoes";
import { EnviarPropostaForm } from "@/components/forms/enviar-proposta-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { COTACAO_STATUS_LABELS, UNIT_TYPE_LABELS, type UnitType } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import {
    AlertCircle,
    ArrowLeft,
    Barcode,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    Package,
    Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function FornecedorCotacaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use supplier-safe query (omits estoque_atual, quantidade_sugerida)
  const cotacao = await getCotacaoParaFornecedor(id).catch(() => null);
  if (!cotacao) notFound();

  // Check if already proposed + get previous prices for reference
  const { data: existingProposta } = await supabase
    .from("propostas")
    .select(`
      id, status,
      proposta_itens (cotacao_item_id, preco_unitario)
    `)
    .eq("cotacao_id", id)
    .eq("fornecedor_id", user.id)
    .maybeSingle();

  // Build previous prices map for reference display
  const previousPrices: Record<string, number> = {};
  if (existingProposta?.proposta_itens) {
    for (const pi of existingProposta.proposta_itens as any[]) {
      previousPrices[pi.cotacao_item_id] = pi.preco_unitario;
    }
  }

  const unitBadgeStyle: Record<string, string> = {
    UN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CX: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    DZ: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/fornecedor/cotacoes"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para oportunidades
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{cotacao.titulo}</h1>
              <Badge variant="success" dot>
                {COTACAO_STATUS_LABELS[cotacao.status as keyof typeof COTACAO_STATUS_LABELS]}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa:{" "}
              <span className="font-semibold text-neutral-700">
                {(cotacao as any).profiles?.empresa || (cotacao as any).profiles?.nome}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full text-xs font-bold text-neutral-600">
            <Clock className="h-4 w-4 text-neutral-400" />
            PRAZO: {cotacao.data_limite ? formatDate(cotacao.data_limite) : "A definir"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quotation Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-neutral-50/50 border-none">
            <CardHeader>
              <CardTitle className="text-base">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-neutral-400 font-bold uppercase">
                  Descrição / Observações
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed italic">
                  &ldquo;{cotacao.descricao || "Sem observações adicionais."}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="text-center">
                  <p className="text-lg font-bold text-neutral-900">
                    {(cotacao as any).cotacao_itens?.length || 0}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase">Itens</p>
                </div>
                <div className="h-8 w-px bg-neutral-200" />
                <div className="text-center">
                  <p className="text-sm font-bold text-neutral-900">{formatDate(cotacao.created_at)}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase">Publicada</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Items list for supplier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-neutral-400" />
                Itens a Cotar
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-neutral-100">
                {(cotacao as any).cotacao_itens?.map((item: any) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-800 truncate">
                          {item.nome_produto}
                        </p>
                        {item.descricao && (
                          <p className="text-[10px] text-neutral-400 mt-0.5 italic">{item.descricao}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                          unitBadgeStyle[item.tipo_unidade] || "bg-neutral-100 text-neutral-500 border-neutral-200"
                        }`}
                      >
                        {item.tipo_unidade}
                        <span className="font-normal opacity-70">
                          — {UNIT_TYPE_LABELS[item.tipo_unidade as UnitType] || item.tipo_unidade}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-400">
                      {item.codigo_barras && (
                        <span className="flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          <span className="font-mono">{item.codigo_barras}</span>
                        </span>
                      )}
                      {item.categoria && (
                        <span className="flex items-center gap-1 capitalize">
                          <Tag className="h-3 w-3" />
                          {item.categoria}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="bg-primary-50 p-4 rounded-[var(--radius-lg)] border border-primary-100 flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-700 leading-relaxed">
              Informe o preço <strong>por unidade comercial</strong> de cada item (por UN, CX ou DZ
              conforme indicado). O total será calculado automaticamente.
            </p>
          </div>
        </div>

        {/* Right Column: Proposal Form */}
        <div className="lg:col-span-2">
          {existingProposta ? (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-primary-100 bg-primary-50/10">
                <CardBody className="p-8 flex flex-col items-center text-center gap-6">
                  <div className="h-20 w-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-neutral-900">Proposta Já Enviada</h2>
                    <p className="text-sm text-neutral-500 max-w-sm">
                      Você já enviou um orçamento para esta cotação. Agora basta aguardar o retorno do
                      empresário.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                    <Badge variant="enviada" className="px-6 py-2 text-sm">
                      Status: {existingProposta.status}
                    </Badge>
                  </div>

                  <Link href="/fornecedor/propostas" className="inline-block">
                    <Button variant="ghost" className="text-primary-600">
                      <FileText className="h-4 w-4" />
                      Ver todos meus orçamentos
                    </Button>
                  </Link>
                </CardBody>
              </Card>

              <div className="p-6 bg-neutral-50 rounded-[var(--radius-lg)] border border-neutral-100 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-neutral-400 mt-0.5" />
                <p className="text-xs text-neutral-500 leading-relaxed italic">
                  Nota: Se precisar alterar valores, entre em contato com o empresário diretamente.
                </p>
              </div>
            </div>
          ) : (
            <EnviarPropostaForm
              cotacaoId={cotacao.id}
              cotacaoItens={(cotacao as any).cotacao_itens ?? []}
              previousPrices={previousPrices}
            />
          )}
        </div>
      </div>
    </div>
  );
}
