"use client";

import { buscarProdutoPorBarcode, criarCotacao } from "@/actions/cotacoes";
import { BarcodeScanner } from "@/components/produtos/BarcodeScanner";
import { ImagePreviewModal } from "@/components/produtos/ImagePreviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import {
  ColumnConfigModal,
  loadColumnOrder,
  saveColumnOrder,
  type ColumnDef,
} from "@/components/ui/column-config-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showToast } from "@/components/ui/toast";
import { UNIT_TYPE_LABELS, UNIT_TYPES, type UnitType } from "@/lib/constants";
import { useDraftList, type DraftItem } from "@/lib/hooks/useDraftList";
import { applySorting, useTableSort } from "@/lib/hooks/useTableSort";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUp,
  Camera,
  ChevronDown,
  ClipboardList,
  Edit,
  Loader2,
  Package,
  Search,
  Send,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

/* ─── Column definitions ─── */
const DRAFT_COLUMNS: ColumnDef[] = [
  { id: "select", label: "Selecionar", fixed: true },
  { id: "foto", label: "Foto" },
  { id: "produto", label: "Produto" },
  { id: "preco", label: "Preço unit." },
  { id: "estoque", label: "Estoque" },
  { id: "sugerido", label: "Sugerido" },
  { id: "unidade", label: "Unidade" },
  { id: "acoes", label: "Ações", fixed: true },
];
const DRAFT_DEFAULT_ORDER = DRAFT_COLUMNS.map((c) => c.id);
const DRAFT_COL_STORAGE_KEY = "vendamais_draft_columns";
const DEFAULT_UNIT_STORAGE_KEY = "vendamais_default_unit";
const UNIT_OPTIONS = UNIT_TYPES.map((u) => ({ value: u, label: UNIT_TYPE_LABELS[u] }));

function loadDefaultUnit(): string {
  if (typeof window === "undefined") return "CX";
  try {
    return localStorage.getItem(DEFAULT_UNIT_STORAGE_KEY) || "CX";
  } catch {
    return "CX";
  }
}

function saveDefaultUnit(unit: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEFAULT_UNIT_STORAGE_KEY, unit);
}

/* ─── Editable Sugerido Cell ─── */
function EditableSugerido({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setLocalVal(value === 0 ? "" : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    const parsed = parseInt(localVal) || 0;
    onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="1"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 bg-[#1a2332] border border-indigo-500/40 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-center text-gray-200 outline-none ring-2 ring-indigo-500/20 transition-all"
      />
    );
  }

  if (value === 0) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="w-20 text-center py-1.5 px-2.5 rounded-[var(--radius-md)] text-sm font-medium text-amber-400/80 bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer"
        title="Clique para preencher"
      >
        (—)
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="w-20 bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-center text-gray-200 hover:border-indigo-500/30 transition-all cursor-pointer"
      title="Clique para editar"
    >
      {value}
    </button>
  );
}

export function DraftListClient() {
  const router = useRouter();
  const draftList = useDraftList();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // busca unificada nome+barcode
  // Preview de imagem
  const [previewImage, setPreviewImage] = useState<{ url: string; nome: string } | null>(null);
  // Preview de item (modal com nome, foto, preço)
  const [previewItem, setPreviewItem] = useState<DraftItem | null>(null);

  // Seleção em lote
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchRemoveConfirm, setShowBatchRemoveConfirm] = useState(false);
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  // Campos do modal de edição em lote
  const [batchQtd, setBatchQtd] = useState("");
  const [batchUnit, setBatchUnit] = useState<string>("");
  const [batchEstoque, setBatchEstoque] = useState("");

  // Send modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [sending, setSending] = useState(false);

  // Column config
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    loadColumnOrder(DRAFT_COL_STORAGE_KEY, DRAFT_DEFAULT_ORDER)
  );
  const [defaultUnit, setDefaultUnit] = useState<string>(() => loadDefaultUnit());

  const allDraftSelected =
    draftList.items.length > 0 &&
    draftList.items.every((i) => draftSelectedIds.has(i.productId));

  const toggleDraftAll = () => {
    if (allDraftSelected) {
      setDraftSelectedIds(new Set());
    } else {
      setDraftSelectedIds(new Set(draftList.items.map((i) => i.productId)));
    }
  };

  const toggleDraftOne = (productId: string) => {
    setDraftSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleBatchRemoveFromDraft = () => {
    const n = draftSelectedIds.size;
    draftSelectedIds.forEach((id) => draftList.removeItem(id));
    setDraftSelectedIds(new Set());
    setShowBatchRemoveConfirm(false);
    showToast(`${n} item(ns) removido(s) da lista.`, "info");
  };

  const handleBatchEdit = () => {
    draftSelectedIds.forEach((id) => {
      const updates: Partial<Omit<DraftItem, "productId">> = {};
      if (batchQtd !== "") updates.quantidadeSugerida = parseInt(batchQtd) || 1;
      if (batchUnit !== "") updates.tipoUnidade = batchUnit as DraftItem["tipoUnidade"];
      if (batchEstoque !== "") updates.estoque = parseInt(batchEstoque) || 0;
      if (Object.keys(updates).length > 0) draftList.updateItem(id, updates);
    });
    setShowBatchEditModal(false);
    setBatchQtd(""); setBatchUnit(""); setBatchEstoque("");
    showToast(`${draftSelectedIds.size} item(ns) atualizado(s).`, "success");
    setDraftSelectedIds(new Set());
  };

  /* ─── Barcode search ─── */
  async function handleBarcodeSearch(code: string) {
    if (!code.trim()) return;
    setBarcodeLoading(true);
    try {
      const product = await buscarProdutoPorBarcode(code.trim());
      if (product) {
        if (draftList.hasItem(product.id)) {
          showToast("Produto já está na lista.", "info");
        } else {
          draftList.addItem({
            productId: product.id,
            nome: product.name,
            foto: product.image_url ?? null,
            codigoBarras: product.barcode ?? null,
            categoria: product.category ?? null,
            precoAtual: product.price_unit_store > 0 ? product.price_unit_store : null,
            estoque: 0,
            quantidadeSugerida: 0,
            tipoUnidade: defaultUnit as DraftItem["tipoUnidade"],
          });
          showToast(`"${product.name}" adicionado!`, "success");
        }
        setBarcodeInput("");
      } else {
        showToast("Produto não encontrado. Deseja cadastrá-lo?", "warning");
      }
    } catch {
      showToast("Erro ao buscar produto.", "error");
    } finally {
      setBarcodeLoading(false);
    }
  }

  function handleBarcodeDetected(code: string) {
    setShowScanner(false);
    handleBarcodeSearch(code);
  }

  /* ─── Inline edit helpers ─── */
  function updateField(
    productId: string,
    field: keyof DraftItem,
    value: string | number
  ) {
    draftList.updateItem(productId, { [field]: value });
  }

  /* ─── Total estimado ─── */
  const total = draftList.items.reduce((acc, item) => {
    if (item.precoAtual) return acc + item.precoAtual * item.quantidadeSugerida;
    return acc;
  }, 0);

  /* ─── Busca unificada: filtra items da lista por nome ou cód. barras ─── */
  const looksLikeBarcode = (str: string) =>
    /^\d{6,}$/.test(str.trim());

  /* ─── Sorting ─── */
  const { sortCriteria, toggleSort, getSortDirection, getSortIndex, hasSorts, clearSort } = useTableSort();

  const getDraftSortField = useCallback(
    (item: DraftItem, column: string): string | number | null | undefined => {
      switch (column) {
        case "produto": return item.nome;
        case "preco": return item.precoAtual;
        case "estoque": return item.estoque;
        case "sugerido": return item.quantidadeSugerida;
        case "unidade": return item.tipoUnidade;
        default: return null;
      }
    },
    []
  );

  /* ─── Filtered + Sorted items (memoized for performance) ─── */
  const filteredItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = searchQuery
      ? draftList.items.filter(
          (item) =>
            item.nome.toLowerCase().includes(lowerQuery) ||
            (item.codigoBarras ?? "").toLowerCase().includes(lowerQuery)
        )
      : draftList.items;

    return applySorting(filtered, sortCriteria, getDraftSortField);
  }, [draftList.items, searchQuery, sortCriteria, getDraftSortField]);

  async function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = searchQuery.trim();
    if (!q) return;
    if (looksLikeBarcode(q)) {
      // Tenta adicionar produto pelo barcode
      setBarcodeInput(q);
      await handleBarcodeSearch(q);
      setSearchQuery("");
    }
    // se for nome, apenas filtra (já reativo)
  }

  /* ─── Column config ─── */
  const handleSaveColumnOrder = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    saveColumnOrder(DRAFT_COL_STORAGE_KEY, newOrder);
  }, []);

  const handleDefaultUnitChange = useCallback((unit: string) => {
    setDefaultUnit(unit);
    saveDefaultUnit(unit);
  }, []);

  /* ─── Render cell by column ID ─── */
  const renderHeaderCell = (colId: string) => {
    switch (colId) {
      case "select":
        return (
          <TableHead key={colId} className="w-[40px]">
            <button
              type="button"
              role="checkbox"
              aria-checked={allDraftSelected}
              onClick={toggleDraftAll}
              className={`relative h-[18px] w-[18px] rounded-md border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                allDraftSelected
                  ? "bg-indigo-500 border-indigo-500"
                  : "bg-transparent border-white/20 hover:border-white/40"
              }`}
            >
              {allDraftSelected && <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </button>
          </TableHead>
        );
      case "foto":
        return <TableHead key={colId} className="w-[60px]">Foto</TableHead>;
      case "produto":
      case "preco":
      case "estoque":
      case "sugerido":
      case "unidade": {
        const label = { produto: "Produto", preco: "Preço unit.", estoque: "Estoque", sugerido: "Sugerido", unidade: "Unidade" }[colId];
        const width = { produto: undefined, preco: "w-[120px]", estoque: "w-[100px]", sugerido: "w-[100px]", unidade: "w-[120px]" }[colId];
        const dir = getSortDirection(colId);
        const idx = getSortIndex(colId);
        const hintMap: Record<string, { asc: string; desc: string }> = {
          produto:  { asc: "A → Z",  desc: "Z → A" },
          preco:    { asc: "$ ↑",    desc: "$ ↓" },
          estoque:  { asc: "# ↑",    desc: "# ↓" },
          sugerido: { asc: "# ↑",    desc: "# ↓" },
          unidade:  { asc: "A → Z",  desc: "Z → A" },
        };
        const hint = hintMap[colId];
        return (
          <TableHead key={colId} className={width}>
            <button
              type="button"
              onClick={() => toggleSort(colId)}
              className="flex items-center gap-1.5 text-inherit hover:text-indigo-400 transition-colors cursor-pointer select-none w-full group/sort"
            >
              {label}
              {dir && hint && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 whitespace-nowrap">
                  {dir === "asc" ? hint.asc : hint.desc}
                </span>
              )}
              {!dir && (
                <ArrowUp className="h-3 w-3 text-gray-600 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
              )}
              {dir && sortCriteria.length > 1 && (
                <span className="text-[9px] text-indigo-400/60 font-bold">{idx}</span>
              )}
            </button>
          </TableHead>
        );
      }
      case "acoes":
        return <TableHead key={colId} className="w-[60px]">Ações</TableHead>;
      default:
        return null;
    }
  };

  const renderBodyCell = (colId: string, item: DraftItem) => {
    switch (colId) {
      case "select":
        return (
          <TableCell key={colId} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              role="checkbox"
              aria-checked={draftSelectedIds.has(item.productId)}
              onClick={() => toggleDraftOne(item.productId)}
              className={`relative h-[18px] w-[18px] rounded-md border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                draftSelectedIds.has(item.productId)
                  ? "bg-indigo-500 border-indigo-500"
                  : "bg-transparent border-white/20 hover:border-white/40"
              }`}
            >
              {draftSelectedIds.has(item.productId) && (
                <span className="text-white text-[9px] font-bold leading-none">✓</span>
              )}
            </button>
          </TableCell>
        );
      case "foto":
        return (
          <TableCell key={colId}>
            {item.foto ? (
              <button
                type="button"
                onClick={() => setPreviewImage({ url: item.foto!, nome: item.nome })}
                className="relative h-[44px] w-[44px] rounded-[var(--radius-md)] overflow-hidden bg-white/[0.06] cursor-zoom-in hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                title="Ver imagem ampliada"
              >
                <Image
                  src={item.foto}
                  alt={item.nome}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </button>
            ) : (
              <div className="h-[44px] w-[44px] rounded-[var(--radius-md)] bg-white/[0.04] flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </TableCell>
        );
      case "produto":
        return (
          <TableCell
            key={colId}
            className="cursor-pointer"
            onClick={() => setPreviewItem(item)}
            title="Clique para ver detalhes"
          >
            <span className="font-semibold text-gray-100 line-clamp-1">
              {item.nome}
            </span>
            {item.codigoBarras && (
              <span className="text-xs text-gray-500 mt-0.5 block font-mono">
                {item.codigoBarras}
              </span>
            )}
          </TableCell>
        );
      case "preco":
        return (
          <TableCell key={colId}>
            {item.precoAtual ? (
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(item.precoAtual)}
              </span>
            ) : (
              <span className="text-xs text-gray-600 italic">—</span>
            )}
          </TableCell>
        );
      case "estoque":
        return (
          <TableCell key={colId}>
            <input
              type="number"
              min="0"
              step="1"
              value={item.estoque}
              onChange={(e) =>
                updateField(
                  item.productId,
                  "estoque",
                  parseInt(e.target.value) || 0
                )
              }
              className="w-20 bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-center text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
          </TableCell>
        );
      case "sugerido":
        return (
          <TableCell key={colId}>
            <EditableSugerido
              value={item.quantidadeSugerida}
              onChange={(v) =>
                updateField(item.productId, "quantidadeSugerida", v)
              }
            />
          </TableCell>
        );
      case "unidade":
        return (
          <TableCell key={colId}>
            <div className="relative">
              <select
                value={item.tipoUnidade}
                onChange={(e) =>
                  updateField(
                    item.productId,
                    "tipoUnidade",
                    e.target.value as UnitType
                  )
                }
                className="w-full h-8 bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] text-white text-sm pl-2.5 pr-7 appearance-none outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {UNIT_TYPES.map((u) => (
                  <option
                    key={u}
                    value={u}
                    className="bg-[#0f1720]"
                  >
                    {u} — {UNIT_TYPE_LABELS[u]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
            </div>
          </TableCell>
        );
      case "acoes":
        return (
          <TableCell key={colId}>
            <button
              onClick={() => {
                draftList.removeItem(item.productId);
                showToast("Item removido.", "info");
              }}
              className="p-1.5 rounded-[var(--radius-md)] text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </TableCell>
        );
      default:
        return null;
    }
  };

  /* ─── Enviar cotação ─── */
  async function handleSend() {
    if (!titulo.trim()) {
      showToast("Título é obrigatório.", "warning");
      return;
    }
    if (draftList.items.length === 0) {
      showToast("A lista está vazia.", "warning");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descricao", descricao);
      formData.append("data_limite", prazo);

      const itens = draftList.items.map((item) => ({
        nome_produto: item.nome,
        codigo_barras: item.codigoBarras || undefined,
        categoria: item.categoria || undefined,
        estoque_atual: item.estoque || undefined,
        quantidade_sugerida: item.quantidadeSugerida,
        tipo_unidade: item.tipoUnidade,
        quantidade: item.quantidadeSugerida,
        product_id: item.productId,
      }));

      formData.append("itens", JSON.stringify(itens));

      const result = await criarCotacao(formData);
      if (result?.error) {
        showToast(result.error, "error");
        setSending(false);
      } else {
        draftList.clearAll();
        showToast("Cotação criada com sucesso!", "success");
        // criarCotacao already redirects, but just in case
      }
    } catch {
      showToast("Erro ao criar cotação.", "error");
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-indigo-400" />
            Lista de Cotação
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Monte sua lista e envie aos fornecedores para receber propostas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowColumnConfig(true)}
            title="Configurar colunas"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          {draftList.count > 0 && (
            <span className="text-xs text-gray-500 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.06]">
              {draftList.count} {draftList.count === 1 ? "item" : "itens"}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar — barcode search + scanner */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              id="barcode-search-input"
              type="text"
              placeholder="Buscar por nome ou cód. barras (Enter para adicionar)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2.5 border border-white/[0.08] rounded-[var(--radius-md)] bg-[#1a2332] text-gray-100 text-sm placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
            {barcodeLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
            )}
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleBarcodeSearch(barcodeInput)}
            disabled={!barcodeInput.trim() || barcodeLoading}
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowScanner(true)}
          >
            <Camera className="h-4 w-4" />
            Escanear
          </Button>
          {draftList.count > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowClearConfirm(true)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Scanner */}
      {showScanner && (
        <div className="animate-fade-in">
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Toolbar de seleção em lote */}
      {draftSelectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-[var(--radius-md)] animate-fade-in">
          <span className="text-sm text-indigo-300 font-medium">
            {draftSelectedIds.size} item(ns) selecionado(s)
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBatchEditModal(true)}
            >
              <Edit className="h-3.5 w-3.5" />
              Editar selecionados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBatchRemoveConfirm(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover selecionados
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {columnOrder.map((colId) => renderHeaderCell(colId))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftList.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnOrder.length}>
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-white/[0.04] flex items-center justify-center">
                      <Package className="h-8 w-8 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-neutral-300">
                        Lista vazia
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Adicione produtos a partir da{" "}
                        <button
                          onClick={() => router.push("/empresario/produtos")}
                          className="text-indigo-400 hover:underline cursor-pointer"
                        >
                          gestão de produtos
                        </button>{" "}
                        ou busque por código de barras.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.productId} className="group" selected={draftSelectedIds.has(item.productId)}>
                  {columnOrder.map((colId) => renderBodyCell(colId, item))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {draftList.count > 0 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {total > 0 ? (
                <>
                  Total estimado:{" "}
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(total)}
                  </span>
                </>
              ) : (
                <span className="text-gray-600 italic">
                  Adicione preços para ver o total estimado
                </span>
              )}
            </div>
            <Button
              size="lg"
              onClick={() => setShowSendModal(true)}
            >
              <Send className="h-4 w-4" />
              Enviar Cotação
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Info box */}
      {draftList.count > 0 && (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-[var(--radius-lg)] animate-fade-in">
          <Send className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-400/80 leading-relaxed">
            Ao enviar, os fornecedores receberão apenas:{" "}
            <strong>Nome, Foto, Código de barras</strong> e campo para
            preencher <strong>Preço por unidade</strong>. Dados de{" "}
            <em>estoque</em> e <em>quantidade sugerida</em> não serão
            compartilhados.
          </p>
        </div>
      )}

      {/* Send Modal */}
      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        className="max-w-lg"
      >
        <ModalHeader onClose={() => setShowSendModal(false)}>
          Enviar Cotação
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="text-sm text-gray-400">
            Defina um título e prazo para publicar a cotação com{" "}
            {draftList.count} {draftList.count === 1 ? "item" : "itens"}.
          </p>
          <Input
            label="Título da cotação *"
            placeholder="Ex: Compra mensal de insumos"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
          />
          <Input
            label="Data limite para propostas"
            type="datetime-local"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
          <Input
            label="Descrição / Observações (opcional)"
            placeholder="Condições de entrega, etc."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowSendModal(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} loading={sending}>
            Publicar Cotação
            <ArrowRight className="h-4 w-4" />
          </Button>
        </ModalFooter>
      </Modal>

      {/* Clear Confirm */}
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          draftList.clearAll();
          setShowClearConfirm(false);
          showToast("Lista limpa.", "info");
        }}
        title="Limpar lista"
        description="Tem certeza que deseja remover todos os itens da lista?"
        confirmLabel="Limpar tudo"
        variant="danger"
      />

      {/* Confirm: remover selecionados em lote */}
      <ConfirmDialog
        open={showBatchRemoveConfirm}
        onClose={() => setShowBatchRemoveConfirm(false)}
        onConfirm={handleBatchRemoveFromDraft}
        title="Remover itens selecionados"
        description={`Tem certeza que deseja remover ${draftSelectedIds.size} item(ns) da lista de cotação?`}
        confirmLabel="Remover"
        variant="danger"
      />

      {/* Modal: editar em lote */}
      <Modal
        open={showBatchEditModal}
        onClose={() => setShowBatchEditModal(false)}
        className="max-w-sm"
      >
        <ModalHeader onClose={() => setShowBatchEditModal(false)}>
          Editar {draftSelectedIds.size} item(ns)
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="text-xs text-gray-400">
            Preencha apenas os campos que deseja alterar. Campos vazios serão ignorados.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Qtd. sugerida</label>
            <input
              type="number" min="1" step="1"
              placeholder="Ex: 10"
              value={batchQtd}
              onChange={(e) => setBatchQtd(e.target.value)}
              className="w-full bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] px-3 py-2 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Estoque atual</label>
            <input
              type="number" min="0" step="1"
              placeholder="Ex: 5"
              value={batchEstoque}
              onChange={(e) => setBatchEstoque(e.target.value)}
              className="w-full bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] px-3 py-2 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Tipo de unidade</label>
            <select
              value={batchUnit}
              onChange={(e) => setBatchUnit(e.target.value)}
              className="w-full bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] px-3 py-2 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            >
              <option value="">(manter atual)</option>
              {UNIT_TYPES.map((u) => (
                <option key={u} value={u} className="bg-[#0f1720]">
                  {u} — {UNIT_TYPE_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowBatchEditModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleBatchEdit}
            disabled={batchQtd === "" && batchUnit === "" && batchEstoque === ""}
          >
            Aplicar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal: preview de item */}
      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        className="max-w-sm"
      >
        <ModalHeader onClose={() => setPreviewItem(null)}>
          {previewItem?.nome}
        </ModalHeader>
        <ModalBody className="space-y-4">
          {previewItem?.foto && (
            <div className="relative h-48 w-full rounded-[var(--radius-md)] overflow-hidden bg-white/[0.04]">
              <Image
                src={previewItem.foto}
                alt={previewItem.nome}
                fill
                className="object-contain"
                sizes="400px"
              />
            </div>
          )}
          <div className="space-y-2">
            {previewItem?.codigoBarras && (
              <p className="text-xs text-gray-500 font-mono">{previewItem.codigoBarras}</p>
            )}
            {previewItem?.categoria && (
              <p className="text-xs text-gray-400">
                Categoria: <span className="text-gray-200">{previewItem.categoria}</span>
              </p>
            )}
            <p className="text-sm font-medium text-gray-300">
              Preço por unidade:{" "}
              {previewItem?.precoAtual ? (
                <span className="text-emerald-400 font-bold">{formatCurrency(previewItem.precoAtual)}</span>
              ) : (
                <span className="text-gray-600 italic">Não informado</span>
              )}
            </p>
          </div>
        </ModalBody>
      </Modal>

      {/* Modal de preview de imagem */}
      {previewImage && (
        <ImagePreviewModal
          open={true}
          imageUrl={previewImage.url}
          productName={previewImage.nome}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Column Config Modal */}
      <ColumnConfigModal
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={DRAFT_COLUMNS}
        columnOrder={columnOrder}
        onSave={handleSaveColumnOrder}
        defaultUnit={defaultUnit}
        onDefaultUnitChange={handleDefaultUnitChange}
        unitOptions={UNIT_OPTIONS}
      />
    </div>
  );
}
