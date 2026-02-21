"use client";

import { criarCotacao } from "@/actions/cotacoes";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { UNIDADES } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Info, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/* ─── Step definitions ─── */
const steps: StepperStep[] = [
  { label: "Dados básicos", description: "Título e prazo" },
  { label: "Itens", description: "Produtos e serviços" },
  { label: "Revisão", description: "Confirmar e enviar" },
];

const categorias = [
  { value: "alimentos", label: "Alimentos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "limpeza", label: "Limpeza" },
  { value: "escritorio", label: "Escritório" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "outros", label: "Outros" },
];

interface ItemForm {
  id: string;
  nome_produto: string;
  quantidade: number;
  unidade: string;
  observacao: string;
}

export default function NovaCotacaoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Dados básicos
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("outros");
  const [prazo, setPrazo] = useState("");
  const [descricao, setDescricao] = useState("");

  // Step 2 — Itens
  const [itens, setItens] = useState<ItemForm[]>([
    { id: "1", nome_produto: "", quantidade: 1, unidade: "un", observacao: "" },
  ]);

  const addItem = () => {
    setItens([
      ...itens,
      {
        id: String(Date.now()),
        nome_produto: "",
        quantidade: 1,
        unidade: "un",
        observacao: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (itens.length > 1) {
      setItens(itens.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ItemForm, value: string | number) => {
    setItens(
      itens.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const next = () => {
    if (currentStep === 0) {
      if (!titulo.trim()) {
        setError("Título é obrigatório.");
        return;
      }
      setError(null);
    }
    if (currentStep === 1) {
      const validItens = itens.filter((i) => i.nome_produto.trim());
      if (validItens.length === 0) {
        setError("Adicione pelo menos um item com nome.");
        return;
      }
      setError(null);
    }
    setCurrentStep(currentStep + 1);
  };

  const prev = () => setCurrentStep(currentStep - 1);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("data_limite", prazo);
    
    const validItens = itens.filter((item) => item.nome_produto.trim());
    formData.append("itens", JSON.stringify(validItens));

    const result = await criarCotacao(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/empresario/cotacoes"
          className="p-2 rounded-[var(--radius-md)] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nova Cotação</h1>
          <p className="text-sm text-neutral-500">
            Preencha os dados e os itens para receber propostas de fornecedores
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper steps={steps} currentStep={currentStep} />

      {error && (
        <div className="bg-danger-light text-danger p-4 rounded-[var(--radius-lg)] border border-red-200 text-sm flex gap-3 animate-fade-in">
          <Info className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardBody className="space-y-6">
          {/* ─── Step 1: Dados básicos ─── */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fade-in">
              <Input
                label="Título da cotação *"
                placeholder="Ex: Compra mensal de hortifrúti"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                autoFocus
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Categoria"
                  options={categorias}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
                <Input
                  label="Data limite para propostas"
                  type="datetime-local"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                />
              </div>
              <Textarea
                label="Descrição / Observações Gerais"
                placeholder="Descreva requisitos especiais, condições de entrega, etc."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* ─── Step 2: Itens ─── */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  Adicione os itens que deseja cotar.
                </p>
                <Button variant="ghost" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                  Novo Item
                </Button>
              </div>

              <div className="space-y-4">
                {itens.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative p-4 bg-neutral-50 rounded-[var(--radius-lg)] border border-neutral-200 group animate-fade-in"
                  >
                    {itens.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <Input
                          label="Produto / Serviço *"
                          placeholder="Nome do item"
                          value={item.nome_produto}
                          onChange={(e) => updateItem(item.id, "nome_produto", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Input
                          label="Quantidade *"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => updateItem(item.id, "quantidade", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Select
                          label="Unidade"
                          options={UNIDADES.map(u => ({ value: u, label: u }))}
                          value={item.unidade}
                          onChange={(e) => updateItem(item.id, "unidade", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-12">
                        <Input
                          label="Especificação (opcional)"
                          placeholder="Cor, marca, modelo, etc."
                          value={item.observacao}
                          onChange={(e) => updateItem(item.id, "observacao", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="secondary" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4" />
                Adicionar outro item
              </Button>
            </div>
          )}

          {/* ─── Step 3: Revisão ─── */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-primary-50 p-4 rounded-[var(--radius-lg)] border border-primary-100">
                <h3 className="text-sm font-semibold text-primary-900 mb-2">Dados da Cotação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-primary-800">
                  <p><span className="font-medium">Título:</span> {titulo}</p>
                  <p><span className="font-medium">Categoria:</span> {categorias.find(c => c.value === categoria)?.label}</p>
                  <p><span className="font-medium">Prazo:</span> {prazo ? new Date(prazo).toLocaleString('pt-BR') : "Não definido"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Itens ({itens.length})</h3>
                <div className="border border-neutral-200 rounded-[var(--radius-md)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-medium">
                      <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-left">Especificação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {itens.filter(i => i.nome_produto).map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-neutral-800 font-medium">{item.nome_produto}</td>
                          <td className="px-4 py-3 text-center text-neutral-600">{item.quantidade} {item.unidade}</td>
                          <td className="px-4 py-3 text-neutral-500 text-xs italic">{item.observacao || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardBody>

        {/* Step Navigation */}
        <CardFooter>
          {currentStep > 0 && (
            <Button variant="ghost" onClick={prev} disabled={loading}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < steps.length - 1 ? (
            <Button onClick={next}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Publicar Cotação
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

