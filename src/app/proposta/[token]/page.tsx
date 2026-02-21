"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import {
    CheckCircle2,
    Clock,
    FileText,
    Send,
    Upload,
    Zap,
} from "lucide-react";
import { useState } from "react";

/* ─── Mock Data (cotação pública) ─── */
const cotacao = {
  titulo: "Equipamentos de TI — Notebooks e Monitores",
  comprador: "Empresa XYZ Ltda",
  prazo: "28/02/2026",
  observacoes:
    "Entrega na filial centro. Equipamentos devem ter garantia mínima de 12 meses.",
  itens: [
    { id: "i1", nome: "Notebook 15\" i7 16GB", quantidade: 10, unidade: "Un" },
    { id: "i2", nome: "Monitor 27\" 4K", quantidade: 10, unidade: "Un" },
    { id: "i3", nome: "Teclado sem fio", quantidade: 15, unidade: "Un" },
    { id: "i4", nome: "Mouse ergonômico", quantidade: 15, unidade: "Un" },
  ],
};

interface PrecoForm {
  [itemId: string]: { preco: string; prazo: string; observacao: string };
}

export default function PropostaPublicaPage() {
  const [precos, setPrecos] = useState<PrecoForm>(() => {
    const initial: PrecoForm = {};
    cotacao.itens.forEach((item) => {
      initial[item.id] = { preco: "", prazo: "", observacao: "" };
    });
    return initial;
  });
  const [condicoes, setCondicoes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updatePreco = (
    itemId: string,
    field: "preco" | "prazo" | "observacao",
    value: string
  ) => {
    setPrecos((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  // Calculate total
  const total = cotacao.itens.reduce((sum, item) => {
    const preco = parseFloat(precos[item.id]?.preco || "0");
    return sum + preco * item.quantidade;
  }, 0);

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center animate-scale-in">
          <CardBody className="py-12 space-y-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-50 text-success mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              Proposta Enviada!
            </h2>
            <p className="text-sm text-neutral-500 max-w-xs mx-auto">
              Sua proposta para &ldquo;{cotacao.titulo}&rdquo; foi enviada com sucesso.
              O comprador será notificado.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-[var(--radius-md)] bg-primary-500 text-white shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">
            Venda Mais
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Cotação Info */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-[var(--radius-md)] bg-primary-50 text-primary-500 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">
                  {cotacao.titulo}
                </h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Solicitado por <span className="font-medium text-neutral-700">{cotacao.comprador}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Prazo: {cotacao.prazo}
              </span>
              <Badge variant="enviada" dot>
                Aberta
              </Badge>
            </div>
            {cotacao.observacoes && (
              <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-[var(--radius-md)]">
                {cotacao.observacoes}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Pricing Form */}
        <Card>
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-900">
              Sua Proposta
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Informe o preço unitário e prazo de entrega para cada item
            </p>
          </div>

          <div className="divide-y divide-neutral-100">
            {cotacao.itens.map((item) => (
              <div key={item.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {item.nome}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {item.quantidade} {item.unidade}
                    </p>
                  </div>
                  {precos[item.id]?.preco && (
                    <span className="text-sm font-semibold text-neutral-700">
                      Subtotal:{" "}
                      {formatCurrency(
                        parseFloat(precos[item.id].preco) * item.quantidade
                      )}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Preço unitário (R$)"
                    type="number"
                    placeholder="0,00"
                    value={precos[item.id]?.preco}
                    onChange={(e) =>
                      updatePreco(item.id, "preco", e.target.value)
                    }
                  />
                  <Input
                    label="Prazo de entrega"
                    placeholder="Ex: 15 dias"
                    value={precos[item.id]?.prazo}
                    onChange={(e) =>
                      updatePreco(item.id, "prazo", e.target.value)
                    }
                  />
                  <Input
                    label="Observação"
                    placeholder="Opcional"
                    value={precos[item.id]?.observacao}
                    onChange={(e) =>
                      updatePreco(item.id, "observacao", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Conditions */}
        <Card>
          <CardBody className="space-y-3">
            <Textarea
              label="Condições gerais"
              placeholder="Condições de pagamento, frete, garantia..."
              helper="Opcional. Informe condições adicionais da sua proposta."
              value={condicoes}
              onChange={(e) => setCondicoes(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* Attachments */}
        <Card>
          <CardBody>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Anexos (opcional)
            </label>
            <div className="border-2 border-dashed border-neutral-200 rounded-[var(--radius-lg)] p-8 text-center hover:border-primary-300 hover:bg-primary-50/20 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">
                Arraste arquivos ou{" "}
                <span className="text-primary-500 font-medium">
                  clique para selecionar
                </span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Máx. 5 arquivos, 10MB cada
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Total + Submit */}
        <div className="bg-white border border-neutral-200 rounded-[var(--radius-lg)] p-5 shadow-sm sticky bottom-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 uppercase">
                Total da proposta
              </p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(total)}
              </p>
            </div>
            <Button size="lg" onClick={() => setShowConfirm(true)}>
              <Send className="h-4 w-4" />
              Enviar Proposta
            </Button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)}>
        <ModalHeader onClose={() => setShowConfirm(false)}>
          Confirmar envio
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-neutral-600">
            Tem certeza que deseja enviar esta proposta no valor de{" "}
            <span className="font-bold text-neutral-900">
              {formatCurrency(total)}
            </span>
            ? Após o envio, a proposta não poderá ser editada.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowConfirm(false)}>
            Cancelar
          </Button>
          <Button onClick={() => { setShowConfirm(false); setSubmitted(true); }}>
            Confirmar Envio
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
