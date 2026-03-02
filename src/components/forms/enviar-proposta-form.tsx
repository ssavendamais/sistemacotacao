"use client";

import { enviarProposta } from "@/actions/propostas";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { UNIT_TYPE_LABELS, type UnitType } from "@/lib/constants";
import type { CotacaoItem } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Calculator, CheckCircle2, Info, Send } from "lucide-react";
import { useState } from "react";

interface PropostaItem {
  cotacao_item_id: string;
  preco_unitario: number;
  quantidade_disponivel: number;
  observacao: string;
}

interface EnviarPropostaFormProps {
  cotacaoId: string;
  cotacaoItens: CotacaoItem[];
  /** Map of cotacao_item_id → previous price (from supplier's last proposal) */
  previousPrices?: Record<string, number>;
}

export function EnviarPropostaForm({
  cotacaoId,
  cotacaoItens,
  previousPrices = {},
}: EnviarPropostaFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [itens, setItens] = useState<PropostaItem[]>(
    cotacaoItens.map((item) => ({
      cotacao_item_id: item.id,
      preco_unitario: previousPrices[item.id] ?? 0,
      quantidade_disponivel: item.quantidade,
      observacao: "",
    }))
  );

  function updatePrice(index: number, value: string) {
    const updated = [...itens];
    updated[index] = { ...updated[index], preco_unitario: parseFloat(value) || 0 };
    setItens(updated);
  }

  // Total: price × quantity per item
  const total = itens.reduce(
    (sum, item, idx) =>
      sum + item.preco_unitario * (cotacaoItens[idx]?.quantidade || 1),
    0
  );

  const allFilled = itens.every((item) => item.preco_unitario > 0);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const validItens = itens.filter((item) => item.preco_unitario > 0);
    if (validItens.length === 0) {
      setError("Preencha o preço de pelo menos um item para enviar a proposta.");
      setLoading(false);
      return;
    }

    formData.set("cotacao_id", cotacaoId);
    formData.set(
      "itens",
      JSON.stringify(
        validItens.map((item, idx) => ({
          ...item,
          quantidade_disponivel: cotacaoItens[idx]?.quantidade || 1,
        }))
      )
    );

    try {
      const result = await enviarProposta(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch {
      setError("Ocorreu um erro ao enviar sua proposta.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-green-100 bg-green-50/20 text-center py-10">
        <CardBody className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-green-900">Proposta Enviada!</h3>
            <p className="text-sm text-green-700 max-w-sm">
              Sua proposta foi entregue com sucesso. O empresário será notificado e poderá entrar em contato em breve.
            </p>
            <div className="mt-4 inline-block px-6 py-3 bg-green-100 rounded-[var(--radius-lg)]">
              <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Valor Total Enviado</p>
              <p className="text-2xl font-black text-green-800">{formatCurrency(total)}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-500" />
          Sua Proposta Comercial
        </CardTitle>
        <p className="text-xs text-neutral-400 mt-1">
          Informe o preço por unidade comercial para cada item. Todos os campos são obrigatórios.
        </p>
      </CardHeader>

      <CardBody className="p-0">
        <form id="proposta-form" action={handleSubmit}>
          {error && (
            <div className="mx-6 mt-6 p-4 bg-danger-light text-danger rounded-[var(--radius-lg)] border border-red-200 text-sm flex gap-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="divide-y divide-neutral-100">
            {cotacaoItens.map((cotacaoItem, index) => {
              const unitType = (cotacaoItem.tipo_unidade || "UN") as UnitType;
              const unitLabel = UNIT_TYPE_LABELS[unitType] || unitType;
              const currentPrice = itens[index]?.preco_unitario || 0;
              const previousPrice = previousPrices[cotacaoItem.id];
              const subtotal = currentPrice * cotacaoItem.quantidade;

              const unitBadgeStyle: Record<string, string> = {
                UN: "bg-blue-50 text-blue-600 border-blue-100",
                CX: "bg-violet-50 text-violet-600 border-violet-100",
                DZ: "bg-amber-50 text-amber-600 border-amber-100",
              };

              return (
                <div
                  key={cotacaoItem.id}
                  className="p-6 hover:bg-neutral-50/30 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Product info */}
                    <div className="md:col-span-6 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-800">{cotacaoItem.nome_produto}</p>
                          {cotacaoItem.descricao && (
                            <p className="text-xs text-neutral-400 italic mt-0.5">{cotacaoItem.descricao}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${
                            unitBadgeStyle[unitType] || "bg-neutral-100 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {unitType}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-[10px] text-neutral-400">
                        {cotacaoItem.codigo_barras && (
                          <span className="font-mono"># {cotacaoItem.codigo_barras}</span>
                        )}
                        {cotacaoItem.categoria && (
                          <span className="capitalize">📂 {cotacaoItem.categoria}</span>
                        )}
                        <span className="font-medium text-neutral-600">
                          Qtd: {cotacaoItem.quantidade} {unitType}
                        </span>
                      </div>

                      {previousPrice !== undefined && previousPrice > 0 && (
                        <p className="text-[10px] text-neutral-400 bg-neutral-100 px-2 py-1 rounded inline-block">
                          <Info className="h-3 w-3 inline mr-1" />
                          Seu preço anterior: {formatCurrency(previousPrice)}/{unitType}
                        </p>
                      )}
                    </div>

                    {/* Price input */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                        Preço por {unitLabel} (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
                          R$
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0,00"
                          value={currentPrice || ""}
                          onChange={(e) => updatePrice(index, e.target.value)}
                          className={`w-full h-11 bg-white border rounded-[var(--radius-md)] pl-9 pr-3 text-sm font-semibold outline-none transition-colors ${
                            currentPrice > 0
                              ? "border-green-300 text-green-800 focus:border-green-400"
                              : "border-neutral-200 text-neutral-800 focus:border-primary-400"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="md:col-span-2 flex flex-col items-end pt-1">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Subtotal</p>
                      <p className={`text-sm font-bold ${currentPrice > 0 ? "text-neutral-800" : "text-neutral-300"}`}>
                        {currentPrice > 0 ? formatCurrency(subtotal) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-neutral-50/30">
            <Textarea
              label="Observações Adicionais"
              id="observacao"
              name="observacao"
              placeholder="Ex: Frete incluso, entrega em até 48h, validade do orçamento..."
              rows={3}
            />
          </div>
        </form>
      </CardBody>

      <CardFooter className="bg-neutral-900 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
            Valor Total da Proposta
          </p>
          <p className="text-3xl font-black text-white">{formatCurrency(total)}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {!allFilled && (
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Preencha todos os preços para enviar
            </p>
          )}
          <Button
            type="submit"
            form="proposta-form"
            loading={loading}
            size="lg"
            className="w-full sm:w-auto px-10 h-14 bg-primary-500 hover:bg-primary-600 border-none shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
          >
            Enviar Proposta Agora
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
