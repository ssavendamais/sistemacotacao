"use client";

import { enviarProposta } from "@/actions/propostas";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { CotacaoItem } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Calculator, CheckCircle2, Send } from "lucide-react";
import { useState } from "react";

interface PropostaItem {
  cotacao_item_id: string;
  preco_unitario: number;
  quantidade_disponivel: number;
  observacao: string;
}

export function EnviarPropostaForm({
  cotacaoId,
  cotacaoItens,
}: {
  cotacaoId: string;
  cotacaoItens: CotacaoItem[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [itens, setItens] = useState<PropostaItem[]>(
    cotacaoItens.map((item) => ({
      cotacao_item_id: item.id,
      preco_unitario: 0,
      quantidade_disponivel: item.quantidade,
      observacao: "",
    }))
  );

  function updateItem(
    index: number,
    field: keyof PropostaItem,
    value: string | number
  ) {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };
    setItens(updated);
  }

  const total = itens.reduce(
    (sum, item) => sum + item.preco_unitario * item.quantidade_disponivel,
    0
  );

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
    formData.set("itens", JSON.stringify(validItens));

    try {
      const result = await enviarProposta(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (e) {
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
          </div>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Enviar outra versão
          </Button>
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
            {cotacaoItens.map((cotacaoItem, index) => (
              <div
                key={cotacaoItem.id}
                className="p-6 hover:bg-neutral-50/30 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-5 space-y-1">
                    <p className="text-sm font-bold text-neutral-800">
                      {cotacaoItem.nome_produto}
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      Pedido: <span className="font-semibold text-neutral-700">{cotacaoItem.quantidade} {cotacaoItem.unidade}</span>
                    </p>
                    {cotacaoItem.observacao && (
                      <p className="text-[10px] text-neutral-400 italic bg-neutral-100/50 p-1.5 rounded inline-block mt-2">
                        Obs: {cotacaoItem.observacao}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <Input
                      label="Preço Unitário (R$)*"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={itens[index]?.preco_unitario || ""}
                      onChange={(e) =>
                        updateItem(index, "preco_unitario", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Qtd Disponível"
                      type="number"
                      min="0"
                      step="0.01"
                      value={itens[index]?.quantidade_disponivel || ""}
                      onChange={(e) =>
                        updateItem(index, "quantidade_disponivel", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col items-end pt-6">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Subtotal</p>
                    <p className="text-sm font-bold text-neutral-800">
                      {formatCurrency((itens[index]?.preco_unitario || 0) * (itens[index]?.quantidade_disponivel || 0))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Valor Total da Proposta</p>
          <p className="text-3xl font-black text-white">
            {formatCurrency(total)}
          </p>
        </div>
        
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
      </CardFooter>
    </Card>
  );
}

