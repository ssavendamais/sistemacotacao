"use client";

import { deleteProduct, deleteProductsBatch, duplicateProduct } from "@/actions/products";
import { BarcodeScanner } from "@/components/produtos/BarcodeScanner";
import { StockModal, type StockProduct } from "@/components/produtos/StockModal";
import { Button } from "@/components/ui/button";
import {
  ColumnConfigModal,
  loadColumnOrder,
  saveColumnOrder,
  type ColumnDef,
} from "@/components/ui/column-config-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { useDraftList } from "@/lib/hooks/useDraftList";
import { applySorting, useTableSort } from "@/lib/hooks/useTableSort";
import { checkPermission } from "@/lib/roles";
import type { ProductWithQuote, UserRole } from "@/lib/types/database";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import {
  ArrowUp,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  Filter,
  ListCheck,
  ListMinus,
  ListPlus,
  Loader2,
  Package,
  Plus,
  Search,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { BatchAddModal } from "./BatchAddModal";
import { BatchEditModal } from "./BatchEditModal";
import { ImagePreviewModal } from "./ImagePreviewModal";

/* ─── Column definitions ─── */
const PRODUCT_COLUMNS: ColumnDef[] = [
  { id: "select", label: "Selecionar", fixed: true },
  { id: "imagem", label: "Imagem" },
  { id: "nome", label: "Nome" },
  { id: "categoria", label: "Categoria" },
  { id: "preco", label: "Preço" },
  { id: "cotacao", label: "Última Cotação" },
  { id: "acoes", label: "Ações", fixed: true },
];
const PRODUCT_DEFAULT_ORDER = PRODUCT_COLUMNS.map((c) => c.id);
const PRODUCT_COL_STORAGE_KEY = "vendamais_product_columns";
const DEFAULT_UNIT_STORAGE_KEY = "vendamais_default_unit";

function _loadDefaultUnit(): string {
  if (typeof window === "undefined") return "CX";
  try {
    return localStorage.getItem(DEFAULT_UNIT_STORAGE_KEY) || "CX";
  } catch {
    return "CX";
  }
}

/* ─── Styled Checkbox ─── */
function StyledCheckbox({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`
        relative h-[18px] w-[18px] rounded-md border-2 transition-all duration-200 cursor-pointer flex items-center justify-center
        ${
          checked
            ? "bg-indigo-500 border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            : "bg-transparent border-white/20 hover:border-white/40"
        }
      `}
    >
      {checked && (
        <Check className="h-3 w-3 text-white animate-check-pop" strokeWidth={3} />
      )}
    </button>
  );
}

/* ─── Sort label helper ─── */
const SORT_HINT: Record<string, { asc: string; desc: string }> = {
  nome:      { asc: "A → Z",  desc: "Z → A" },
  categoria: { asc: "A → Z",  desc: "Z → A" },
  preco:     { asc: "$ ↑",    desc: "$ ↓" },
  cotacao:   { asc: "$ ↑",    desc: "$ ↓" },
};

/* ─── Skeleton Row ─── */
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

interface ProductsTableProps {
  products: ProductWithQuote[];
  total: number;
  categories: { id: string; name: string; slug: string; color: string }[];
  userRole: UserRole;
  currentPage: number;
  perPage: number;
  filters: {
    search?: string;
    category?: string;
    barcode?: string;
    dateFrom?: string;
    dateTo?: string;
    priceMin?: string;
    priceMax?: string;
  };
}

export function ProductsTable({
  products,
  total,
  categories,
  userRole,
  currentPage,
  perPage,
  filters,
}: ProductsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const draftList = useDraftList();
  const [isNavigating, startTransition] = useTransition();

  // Stock modal state
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalProducts, setStockModalProducts] = useState<StockProduct[]>([]);

  // Duplicate warning modal state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateProductIds, setDuplicateProductIds] = useState<string[]>([]);

  // Column config
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    loadColumnOrder(PRODUCT_COL_STORAGE_KEY, PRODUCT_DEFAULT_ORDER)
  );

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Default unit (read from localStorage, synced with DraftListClient)
  const [defaultUnit] = useState<string>(() => _loadDefaultUnit());

  // Filter state
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [categoryFilter, setCategoryFilter] = useState(filters.category ?? "");
  const [barcodeFilter, setBarcodeFilter] = useState(filters.barcode ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [priceMin, setPriceMin] = useState(filters.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(filters.priceMax ?? "");

  const canCreate = checkPermission(userRole, "create");
  const canUpdate = checkPermission(userRole, "update");
  const canDelete = checkPermission(userRole, "delete");
  const canBatchEdit = checkPermission(userRole, "batch_edit");

  const totalPages = Math.ceil(total / perPage);

  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ─── Barcode helpers ─── */
  const looksLikeBarcode = (str: string) => /^\d{6,}$/.test(str.trim());

  /* ─── Sorting ─── */
  const { sortCriteria, toggleSort, getSortDirection, getSortIndex } = useTableSort();

  const getProductSortField = useCallback(
    (product: ProductWithQuote, column: string): string | number | null | undefined => {
      switch (column) {
        case "nome": return product.name;
        case "categoria": return product.category;
        case "preco": return product.price_unit_store;
        case "cotacao": return product.latest_quote?.price ?? null;
        default: return null;
      }
    },
    []
  );

  /* ─── Client-side instant filtering + sorting (memoized) ─── */
  const displayProducts = useMemo(() => {
    const lowerSearch = searchInput.toLowerCase().trim();
    const filtered = lowerSearch
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerSearch) ||
            (p.barcode ?? "").toLowerCase().includes(lowerSearch)
        )
      : products;

    return applySorting(filtered, sortCriteria, getProductSortField);
  }, [products, searchInput, sortCriteria, getProductSortField]);

  /* ─── Debounced server-side search (triggers after 500ms of typing) ─── */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only trigger server-side search if the user changed the search input
    // and it differs from the current server-side filter
    if (searchInput === (filters.search ?? "")) { setIsDebouncing(false); return; }
    setIsDebouncing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setIsDebouncing(false);
      const q = searchInput.trim();
      if (!q) {
        // Clear search
        if (filters.search) {
          const params = new URLSearchParams();
          if (categoryFilter) params.set("category", categoryFilter);
          if (barcodeFilter) params.set("barcode", barcodeFilter);
          if (dateFrom) params.set("dateFrom", dateFrom);
          if (dateTo) params.set("dateTo", dateTo);
          if (priceMin) params.set("priceMin", priceMin);
          if (priceMax) params.set("priceMax", priceMax);
          params.set("page", "1");
          startTransition(() => router.push(`/empresario/produtos?${params.toString()}`));
        }
        return;
      }
      if (looksLikeBarcode(q)) {
        const params = new URLSearchParams();
        params.set("barcode", q);
        params.set("page", "1");
        startTransition(() => router.push(`/empresario/produtos?${params.toString()}`));
      } else {
        const params = new URLSearchParams();
        params.set("search", q);
        if (categoryFilter) params.set("category", categoryFilter);
        if (barcodeFilter) params.set("barcode", barcodeFilter);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (priceMin) params.set("priceMin", priceMin);
        if (priceMax) params.set("priceMax", priceMax);
        params.set("page", "1");
        router.push(`/empresario/produtos?${params.toString()}`);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (categoryFilter) params.set("category", categoryFilter);
    if (barcodeFilter) params.set("barcode", barcodeFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    params.set("page", "1");
    router.push(`/empresario/produtos?${params.toString()}`);
  }, [searchInput, categoryFilter, barcodeFilter, dateFrom, dateTo, priceMin, priceMax, router]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = searchInput.trim();
    if (looksLikeBarcode(q)) {
      // Busca por barcode diretamente
      setBarcodeFilter(q);
      const params = new URLSearchParams();
      params.set("barcode", q);
      params.set("page", "1");
      router.push(`/empresario/produtos?${params.toString()}`);
    } else {
      applyFilters();
    }
  }, [searchInput, applyFilters, router]);

  const handleBarcodeDetected = (code: string) => {
    setShowScanner(false);
    setSearchInput(code);
    setBarcodeFilter(code);
    const params = new URLSearchParams();
    params.set("barcode", code);
    params.set("page", "1");
    router.push(`/empresario/produtos?${params.toString()}`);
    showToast(`Código detectado: ${code}`, "success");
  };

  const clearFilters = () => {
    setSearchInput("");
    setCategoryFilter("");
    setBarcodeFilter("");
    setDateFrom("");
    setDateTo("");
    setPriceMin("");
    setPriceMax("");
    router.push("/empresario/produtos");
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.barcode) params.set("barcode", filters.barcode);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.priceMin) params.set("priceMin", filters.priceMin);
    if (filters.priceMax) params.set("priceMax", filters.priceMax);
    params.set("page", page.toString());
    router.push(`/empresario/produtos?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const result = await deleteProduct(deleteId);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        // Remove from draft list if present
        if (draftList.hasItem(deleteId)) {
          draftList.removeItem(deleteId);
        }
        showToast("Produto excluído com sucesso!", "success");
        router.refresh();
      }
    } catch {
      showToast("Erro ao excluir produto.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchDeleteLoading(true);
    try {
      const result = await deleteProductsBatch(Array.from(selectedIds));
      if (result.error) {
        showToast(result.error, "error");
      } else {
        // Remove from draft list if present
        selectedIds.forEach((id) => {
          if (draftList.hasItem(id)) draftList.removeItem(id);
        });
        showToast(`${selectedIds.size} ${selectedIds.size === 1 ? 'produto excluído' : 'produtos excluídos'} com sucesso!`, "success");
        setSelectedIds(new Set());
        router.refresh();
      }
    } catch {
      showToast("Erro ao excluir produtos em lote.", "error");
    } finally {
      setBatchDeleteLoading(false);
      setShowBatchDeleteConfirm(false);
    }
  };

  /* ─── Add to draft with stock modal ─── */
  const handleBatchAddToDraft = () => {
    const toAdd = products.filter((p) => selectedIds.has(p.id));
    const newItems: StockProduct[] = [];
    const alreadyInList: string[] = [];

    toAdd.forEach((p) => {
      if (draftList.hasItem(p.id)) {
        alreadyInList.push(p.id);
      } else {
        newItems.push({
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          barcode: p.barcode,
        });
      }
    });

    if (newItems.length > 0) {
      // Open stock modal for new items
      setStockModalProducts(newItems);
      setShowStockModal(true);
    } else if (alreadyInList.length > 0) {
      // All items already in the list — show removal option
      setDuplicateProductIds(alreadyInList);
      setShowDuplicateWarning(true);
    }

    setSelectedIds(new Set());
  };

  const handleStockConfirm = (stockMap: Record<string, number>) => {
    stockMap && Object.entries(stockMap).forEach(([productId, estoque]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      draftList.addItem({
        productId: product.id,
        nome: product.name,
        foto: product.image_url ?? null,
        codigoBarras: product.barcode ?? null,
        categoria: product.category ?? null,
        precoAtual: product.price_unit_store > 0 ? product.price_unit_store : null,
        estoque,
        quantidadeSugerida: 0,
        tipoUnidade: defaultUnit as "UN" | "CX" | "DZ" | "FD",
      });
    });
    setShowStockModal(false);
    setStockModalProducts([]);
    showToast(`${Object.keys(stockMap).length} produto(s) adicionado(s) à lista de cotação.`, "success");
  };

  const handleSingleAddToDraft = (product: ProductWithQuote) => {
    if (draftList.hasItem(product.id)) {
      draftList.removeItem(product.id);
      showToast("Removido da lista de cotação.", "info");
    } else {
      setStockModalProducts([{
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        barcode: product.barcode,
      }]);
      setShowStockModal(true);
    }
  };

  /* ─── Remove from draft in batch ─── */
  const handleBatchRemoveFromDraft = () => {
    const toRemove = products.filter((p) => selectedIds.has(p.id) && draftList.hasItem(p.id));
    if (toRemove.length === 0) {
      showToast("Nenhum dos selecionados está na lista de cotação.", "info");
      return;
    }
    toRemove.forEach((p) => draftList.removeItem(p.id));
    showToast(`${toRemove.length} produto(s) removido(s) da lista de cotação.`, "success");
    setSelectedIds(new Set());
  };

  /* ─── Handle duplicate removal ─── */
  const handleRemoveDuplicates = () => {
    duplicateProductIds.forEach((id) => draftList.removeItem(id));
    showToast(`${duplicateProductIds.length} produto(s) removido(s) da lista.`, "success");
    setDuplicateProductIds([]);
    setShowDuplicateWarning(false);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const result = await duplicateProduct(id);
      if (result.error) {
        showToast(result.error, "error");
      } else if (result.productId) {
        showToast("Produto duplicado com sucesso!", "success");
        router.push(`/empresario/produtos/editar/${result.productId}`);
      }
    } catch {
      showToast("Erro ao duplicar produto.", "error");
    } finally {
      setDuplicatingId(null);
    }
  };

  /* ─── Column config ─── */
  const handleSaveColumnOrder = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    saveColumnOrder(PRODUCT_COL_STORAGE_KEY, newOrder);
  }, []);

  const hasActiveFilters = !!(
    filters.search ||
    filters.category ||
    filters.barcode ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.priceMin ||
    filters.priceMax
  );

  // Check how many selected items are in draft list
  const selectedInDraft = products.filter((p) => selectedIds.has(p.id) && draftList.hasItem(p.id)).length;

  /* ─── Get delete description with draft warning ─── */
  const getDeleteDescription = () => {
    if (!deleteId) return "";
    if (draftList.hasItem(deleteId)) {
      return "⚠️ Este produto está na sua Lista de Cotação. Excluí-lo também o removerá de lá. Tem certeza que deseja excluir? Esta ação não pode ser desfeita.";
    }
    return "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.";
  };

  /* ─── Dynamic column rendering ─── */
  const renderHeaderCell = (colId: string) => {
    switch (colId) {
      case "select":
        return (canUpdate || canDelete) ? (
          <TableHead key={colId} className="w-12">
            <StyledCheckbox
              checked={allSelected}
              onChange={toggleAll}
              id="select-all-products"
            />
          </TableHead>
        ) : null;
      case "imagem":
        return <TableHead key={colId} className="w-20">Imagem</TableHead>;
      case "nome":
      case "categoria":
      case "preco":
      case "cotacao": {
        const label = { nome: "Nome", categoria: "Categoria", preco: "Preço", cotacao: "Última Cotação" }[colId];
        const width = { nome: undefined, categoria: "w-32", preco: "w-44", cotacao: "w-44" }[colId];
        const dir = getSortDirection(colId);
        const idx = getSortIndex(colId);
        const hint = SORT_HINT[colId];
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
        return <TableHead key={colId} className="w-28">Ações</TableHead>;
      default:
        return null;
    }
  };

  const renderBodyCell = (colId: string, product: ProductWithQuote) => {
    switch (colId) {
      case "select":
        return (canUpdate || canDelete) ? (
          <TableCell key={colId} onClick={(e) => e.stopPropagation()}>
            <StyledCheckbox
              checked={selectedIds.has(product.id)}
              onChange={() => toggleOne(product.id)}
            />
          </TableCell>
        ) : null;
      case "imagem":
        return (
          <TableCell key={colId} onClick={(e) => e.stopPropagation()}>
            {product.image_url ? (
              <button
                onClick={() =>
                  setPreviewImage({
                    url: product.image_url!,
                    name: product.name,
                  })
                }
                className="relative h-[60px] w-[60px] rounded-[var(--radius-md)] overflow-hidden bg-white/[0.06] hover:ring-2 hover:ring-primary-400 transition-all cursor-pointer group/img"
              >
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover/img:scale-110"
                  sizes="60px"
                />
              </button>
            ) : (
              <div className="h-[60px] w-[60px] rounded-[var(--radius-md)] bg-white/[0.04] border border-dashed border-white/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-600" />
              </div>
            )}
          </TableCell>
        );
      case "nome":
        return (
          <TableCell
            key={colId}
            onClick={() =>
              router.push(`/empresario/produtos/editar/${product.id}`)
            }
          >
            <span className="font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-2 max-w-[220px] block">
              {product.name}
            </span>
            {product.barcode && (
              <span className="text-xs text-gray-500 mt-0.5 block font-mono">
                {product.barcode}
              </span>
            )}
          </TableCell>
        );
      case "categoria":
        return (
          <TableCell key={colId}>
            <div className="flex flex-wrap gap-1">
              {(product.categories && product.categories.length > 0) ? (
                product.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  >
                    {cat.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-600 italic text-xs">—</span>
              )}
            </div>
          </TableCell>
        );
      case "preco":
        return (
          <TableCell key={colId}>
            {product.price_unit_store > 0 ? (
              <span className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                {formatCurrency(product.price_unit_store)}
              </span>
            ) : (
              <span className="text-gray-600 text-xs italic">—</span>
            )}
          </TableCell>
        );
      case "cotacao":
        return (
          <TableCell key={colId}>
            {product.latest_quote ? (
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                  {formatCurrency(product.latest_quote.price)}
                </p>
                <p className="text-xs text-gray-400 truncate max-w-[150px]">
                  {product.latest_quote.company_name}
                </p>
                <p className="text-[11px] text-gray-600">
                  {formatRelativeDate(product.latest_quote.created_at)}
                </p>
              </div>
            ) : (
              <span className="text-gray-600 text-xs italic">Sem cotação</span>
            )}
          </TableCell>
        );
      case "acoes":
        return (
          <TableCell key={colId} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <Link
                href={`/empresario/produtos/editar/${product.id}`}
              >
                <button
                  className="p-1.5 rounded-[var(--radius-md)] text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                  title={canUpdate ? "Editar" : "Visualizar"}
                >
                  {canUpdate ? (
                    <Edit className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </Link>
              {canCreate && (
                <button
                  onClick={() => handleDuplicate(product.id)}
                  disabled={duplicatingId === product.id}
                  className="p-1.5 rounded-[var(--radius-md)] text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  title="Duplicar"
                >
                  {duplicatingId === product.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteId(product.id)}
                  className="p-1.5 rounded-[var(--radius-md)] text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleSingleAddToDraft(product)}
                className={`p-1.5 rounded-[var(--radius-md)] transition-colors cursor-pointer ${
                  draftList.hasItem(product.id)
                    ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    : "text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                }`}
                title={draftList.hasItem(product.id) ? "Remover da lista" : "Adicionar à lista"}
              >
                {draftList.hasItem(product.id) ? (
                  <ListCheck className="h-4 w-4" />
                ) : (
                  <ListPlus className="h-4 w-4" />
                )}
              </button>
            </div>
          </TableCell>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou cód. barras..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-white/10 rounded-[var(--radius-md)] bg-[#1a2332] text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all"
            />
            {(isDebouncing || isNavigating) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
            )}
          </div>

          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowScanner(true)}
            title="Escanear código de barras"
          >
            <Camera className="h-4 w-4" />
          </Button>

          <Button
            variant={showFilters ? "primary" : "secondary"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros"
          >
            <Filter className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowColumnConfig(true)}
            title="Configurar colunas"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-indigo-400"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size >= 1 && canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Excluir {selectedIds.size}
            </Button>
          )}
          {selectedIds.size >= 1 && selectedInDraft > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchRemoveFromDraft}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            >
              <ListMinus className="h-4 w-4" />
              - Lista ({selectedInDraft})
            </Button>
          )}
          {selectedIds.size >= 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchAddToDraft}
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              <ListPlus className="h-4 w-4" />
              + Lista ({selectedIds.size})
            </Button>
          )}
          {selectedIds.size >= 2 && canBatchEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBatchEdit(true)}
            >
              <Edit className="h-4 w-4" />
              Editar {selectedIds.size} selecionado(s)
            </Button>
          )}
          {canCreate && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBatchAdd(true)}
              >
                <Plus className="h-4 w-4" />
                Adicionar em lote
              </Button>
              <Link href="/empresario/produtos/novo">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Novo Produto
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Scanner */}
      {showScanner && (
        <div className="animate-fade-in">
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[#1F2937] border border-white/[0.06] rounded-[var(--radius-lg)] p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-white/10 rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[#1a2332] text-gray-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Data início
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-white/10 rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[#1a2332] text-gray-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Data fim
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-white/10 rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[#1a2332] text-gray-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Preço mín. (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full border border-white/10 rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[#1a2332] text-gray-100 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Preço máx. (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full border border-white/10 rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[#1a2332] text-gray-100 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
            <Button size="sm" onClick={applyFilters}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1F2937] border border-white/[0.06] rounded-[var(--radius-lg)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columnOrder.map((colId) => renderHeaderCell(colId))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isNavigating ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={`skel-${i}`} cols={columnOrder.length} />
                ))
              ) : displayProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnOrder.length} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-neutral-700 flex items-center justify-center">
                        <Package className="h-8 w-8 text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-neutral-300">
                          Nenhum produto encontrado
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          {hasActiveFilters || searchInput
                            ? "Tente alterar os filtros aplicados."
                            : "Comece adicionando seu primeiro produto."}
                        </p>
                      </div>
                      {canCreate && !hasActiveFilters && !searchInput && (
                        <Link href="/empresario/produtos/novo">
                          <Button size="sm" className="mt-2">
                            <Plus className="h-4 w-4" />
                            Novo Produto
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    selected={selectedIds.has(product.id)}
                    className="group cursor-pointer"
                  >
                    {columnOrder.map((colId) => renderBodyCell(colId, product))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-sm text-gray-400">
              Mostrando{" "}
              <span className="font-medium text-gray-200">
                {(currentPage - 1) * perPage + 1}
              </span>{" "}
              a{" "}
              <span className="font-medium text-gray-200">
                {Math.min(currentPage * perPage, total)}
              </span>{" "}
              de{" "}
              <span className="font-medium text-gray-200">
                {total}
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="min-w-[36px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir produto"
        description={getDeleteDescription()}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
      />

      <BatchEditModal
        open={showBatchEdit}
        onClose={() => setShowBatchEdit(false)}
        selectedIds={[...selectedIds]}
        categories={categories}
        onSuccess={() => {
          setSelectedIds(new Set());
          router.refresh();
        }}
      />

      <BatchAddModal
        open={showBatchAdd}
        onClose={() => setShowBatchAdd(false)}
        categories={categories}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {previewImage && (
        <ImagePreviewModal
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          productName={previewImage.name}
        />
      )}

      {/* Delete batch confirmation */}
      <ConfirmDialog
        open={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        title="Excluir produtos selecionados"
        description={`Tem certeza que deseja excluir permanentemente ${selectedIds.size} ${selectedIds.size === 1 ? 'produto selecionado' : 'produtos selecionados'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir tudo"
        cancelLabel="Cancelar"
        onConfirm={handleBatchDelete}
        loading={batchDeleteLoading}
        variant="danger"
      />

      {/* Stock Modal */}
      <StockModal
        open={showStockModal}
        onClose={() => { setShowStockModal(false); setStockModalProducts([]); }}
        products={stockModalProducts}
        onConfirm={handleStockConfirm}
      />

      {/* Duplicate Warning Modal */}
      <Modal
        open={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        className="max-w-sm"
      >
        <ModalHeader onClose={() => setShowDuplicateWarning(false)}>
          Itens já na lista
        </ModalHeader>
        <ModalBody className="space-y-3">
          <p className="text-sm text-gray-300">
            Todos os {duplicateProductIds.length} item(ns) selecionado(s) já estão na lista de cotação.
          </p>
          <p className="text-sm text-gray-400">
            Deseja removê-los da lista?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowDuplicateWarning(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleRemoveDuplicates}
          >
            <ListMinus className="h-4 w-4" />
            Remover da lista
          </Button>
        </ModalFooter>
      </Modal>

      {/* Column Config Modal */}
      <ColumnConfigModal
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={PRODUCT_COLUMNS}
        columnOrder={columnOrder}
        onSave={handleSaveColumnOrder}
      />
    </div>
  );
}
