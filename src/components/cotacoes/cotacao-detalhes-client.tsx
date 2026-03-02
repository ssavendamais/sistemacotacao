"use client";

import { GerenciarPropostaButtons } from "@/components/forms/gerenciar-proposta-buttons";
import { StatusCotacaoButtons } from "@/components/forms/status-cotacao-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { COTACAO_STATUS_LABELS, PROPOSTA_STATUS_LABELS, UNIT_TYPE_LABELS, type UnitType } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertCircle, ArrowLeft, Barcode, CheckCircle2, Clock, Package, Tag, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function CotacaoDetalhesClient({
  cotacao,
}: {
  cotacao: any;
}) {
  const [activeTab, setActiveTab] = useState<"propostas" | "detalhes">("propostas");

  if (!cotacao) return null;

  // Sorting proposals by total value (ascending = cheaper first)
  const sortedPropostas = [...(cotacao.propostas || [])].sort((a, b) =>
    (a.valor_total || 0) - (b.valor_total || 0)
  );

  // Finding cheapest supplier per item
  const cheapestPerItem: Record<string, string> = {};
  cotacao.cotacao_itens?.forEach((item: any) => {
    let minPrice = Infinity;
    let minPropostaId = "";

    cotacao.propostas?.forEach((p: any) => {
      const pi = p.proposta_itens?.find((pi: any) => pi.cotacao_item_id === item.id);
      if (pi && pi.preco_unitario < minPrice) {
        minPrice = pi.preco_unitario;
        minPropostaId = p.id;
      }
    });
    cheapestPerItem[item.id] = minPropostaId;
  });

  const unitBadgeStyle: Record<string, string> = {
    UN: "bg-blue-50 text-blue-600",
    CX: "bg-violet-50 text-violet-600",
    DZ: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col gap-4">
        <Link
          href="/empresario/cotacoes"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para minhas cotações
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{cotacao.titulo}</h1>
              <Badge
                variant={
                  cotacao.status === "aberta"
                    ? "enviada"
                    : cotacao.status === "em_andamento"
                    ? "em-analise"
                    : "expirada"
                }
                dot
              >
                {COTACAO_STATUS_LABELS[cotacao.status as keyof typeof COTACAO_STATUS_LABELS]}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">
              Criada em {formatDate(cotacao.created_at)} • {cotacao.propostas?.length || 0} propostas
              recebidas
            </p>
          </div>

          <StatusCotacaoButtons cotacaoId={cotacao.id} currentStatus={cotacao.status} />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("propostas")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "propostas"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          Comparar Propostas
        </button>
        <button
          onClick={() => setActiveTab("detalhes")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "detalhes"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          Detalhes da Cotação
        </button>
      </div>

      {/* ═══ TAB: Propostas ═══ */}
      {activeTab === "propostas" && (
        <div className="space-y-6 animate-fade-in">
          {/* Ranking Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sortedPropostas.slice(0, 3).map((p, index) => (
              <Card key={p.id} highlighted={index === 0} className="relative overflow-hidden">
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-[var(--radius-md)] flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Melhor Preço
                  </div>
                )}
                <CardBody className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-primary-100 text-primary-600"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {index + 1}º
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-800 truncate">
                        {p.profiles?.empresa || p.profiles?.nome}
                      </h4>
                      <Badge
                        variant={
                          p.status === "aceita"
                            ? "success"
                            : p.status === "recusada"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {PROPOSTA_STATUS_LABELS[p.status as keyof typeof PROPOSTA_STATUS_LABELS]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {p.valor_total ? formatCurrency(p.valor_total) : "—"}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                      Valor Total Ofertado
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-neutral-400" />
                Comparativo Item por Item
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase sticky left-0 bg-neutral-50 z-10 min-w-[200px]">
                      Item
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[80px]">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[70px]">
                      Qtd
                    </th>
                    {cotacao.propostas?.map((p: any) => (
                      <th
                        key={p.id}
                        className="px-4 py-3 text-center text-xs font-bold uppercase min-w-[160px] text-neutral-800 border-l border-neutral-100"
                      >
                        {p.profiles?.empresa || p.profiles?.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cotacao.cotacao_itens?.map((item: any) => {
                    const unitType = (item.tipo_unidade || "UN") as UnitType;
                    const qtd = item.quantidade_sugerida || item.quantidade;
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-4 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div>
                            <p className="font-semibold text-neutral-800">{item.nome_produto}</p>
                            {item.descricao && (
                              <p className="text-[10px] text-neutral-400 italic mt-0.5">{item.descricao}</p>
                            )}
                            <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] text-neutral-400">
                              {item.codigo_barras && (
                                <span className="flex items-center gap-0.5 font-mono">
                                  <Barcode className="h-3 w-3" />
                                  {item.codigo_barras}
                                </span>
                              )}
                              {item.categoria && (
                                <span className="flex items-center gap-0.5 capitalize">
                                  <Tag className="h-3 w-3" />
                                  {item.categoria}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              unitBadgeStyle[unitType] || "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {unitType}
                          </span>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {UNIT_TYPE_LABELS[unitType] || unitType}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center text-neutral-600 font-medium text-sm">
                          {qtd}
                        </td>
                        {cotacao.propostas?.map((p: any) => {
                          const pi = p.proposta_itens?.find(
                            (pi: any) => pi.cotacao_item_id === item.id
                          );
                          const isCheapest = cheapestPerItem[item.id] === p.id;

                          return (
                            <td
                              key={p.id}
                              className={`px-4 py-4 text-center border-l border-neutral-50 ${
                                isCheapest ? "bg-green-50/40" : ""
                              }`}
                            >
                              {pi ? (
                                <div className="space-y-1">
                                  <p
                                    className={`text-sm font-bold ${
                                      isCheapest ? "text-green-700" : "text-neutral-700"
                                    }`}
                                  >
                                    {formatCurrency(pi.preco_unitario)}/{unitType}
                                  </p>
                                  <p className="text-[10px] text-neutral-400">
                                    Sub: {formatCurrency(pi.preco_unitario * qtd)}
                                  </p>
                                  {isCheapest && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-700 uppercase">
                                      Melhor Preço
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-neutral-300 text-xs">Não ofertado</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-neutral-900 text-white font-bold">
                    <td colSpan={3} className="px-4 py-4 text-right text-xs uppercase tracking-widest">
                      Valor Total
                    </td>
                    {cotacao.propostas?.map((p: any) => (
                      <td key={p.id} className="px-4 py-4 text-center text-base border-l border-neutral-800/30">
                        {p.valor_total ? formatCurrency(p.valor_total) : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Proposal Cards (Actions) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-900 mt-8 mb-4">Gerenciar Propostas</h3>
            {cotacao.propostas?.map((proposta: any) => (
              <Card
                key={proposta.id}
                className={proposta.status === "aceita" ? "border-green-300 bg-green-50/10" : ""}
              >
                <CardBody className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[var(--radius-md)] bg-neutral-100 flex items-center justify-center text-neutral-500">
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-neutral-800">
                            {proposta.profiles?.empresa || proposta.profiles?.nome}
                          </h4>
                          <Badge
                            variant={
                              proposta.status === "aceita"
                                ? "success"
                                : proposta.status === "recusada"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {PROPOSTA_STATUS_LABELS[proposta.status as keyof typeof PROPOSTA_STATUS_LABELS]}
                          </Badge>
                        </div>
                      </div>

                      {proposta.observacao && (
                        <div className="flex gap-2 text-sm text-neutral-500 bg-neutral-50 p-3 rounded-[var(--radius-md)]">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>&ldquo;{proposta.observacao}&rdquo;</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end gap-3 w-full sm:w-auto">
                      <div>
                        <p className="text-2xl font-black text-neutral-900">
                          {proposta.valor_total ? formatCurrency(proposta.valor_total) : "—"}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          Valor Final
                        </p>
                      </div>

                      {proposta.status === "enviada" && (
                        <GerenciarPropostaButtons propostaId={proposta.id} />
                      )}

                      {proposta.status === "aceita" && (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Proposta Aceita
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: Detalhes ═══ */}
      {activeTab === "detalhes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Pedido</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-neutral-400 font-bold uppercase">Título</label>
                  <p className="text-sm font-medium text-neutral-800 mt-1">{cotacao.titulo}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 font-bold uppercase">Publicado em</label>
                  <p className="text-sm font-medium text-neutral-800 mt-1">
                    {formatDate(cotacao.created_at)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-neutral-400 font-bold uppercase">
                    Observações da Cotação
                  </label>
                  <p className="text-sm text-neutral-600 mt-2 bg-neutral-50 p-3 rounded-[var(--radius-md)] whitespace-pre-wrap leading-relaxed">
                    {cotacao.descricao || "Nenhuma observação informada."}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Items table */}
            <Card>
              <CardHeader>
                <CardTitle>Itens Solicitados</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-neutral-500 uppercase">
                        Estoque
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-neutral-500 uppercase">
                        Qtd
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-neutral-500 uppercase">
                        Unidade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {cotacao.cotacao_itens?.map((item: any) => {
                      const unitType = (item.tipo_unidade || "UN") as UnitType;
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-neutral-800">{item.nome_produto}</p>
                            {item.descricao && (
                              <p className="text-[10px] text-neutral-400 italic mt-0.5">{item.descricao}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                            {item.codigo_barras || "—"}
                          </td>
                          <td className="px-6 py-4 text-neutral-500 capitalize text-xs">
                            {item.categoria || "—"}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-neutral-500 text-xs">
                            {item.estoque_atual !== null && item.estoque_atual !== undefined
                              ? item.estoque_atual
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-neutral-600">
                            {item.quantidade_sugerida || item.quantidade}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                unitBadgeStyle[unitType] || "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {unitType}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary-900 border-none text-white">
              <CardBody className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-primary-200">Prazo de Envio</p>
                    <p className="text-lg font-bold">
                      {cotacao.data_limite ? formatDate(cotacao.data_limite) : "A definir"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-primary-200 leading-relaxed italic">
                    Fornecedores podem enviar propostas até o encerramento da cotação ou atingir a data
                    limite.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
