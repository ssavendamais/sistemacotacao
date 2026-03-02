"use client";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface ColumnDef {
  id: string;
  label: string;
  /** Se true, a coluna fica fixa e não pode ser movida */
  fixed?: boolean;
}

interface UnitOption {
  value: string;
  label: string;
}

interface ColumnConfigModalProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  columnOrder: string[];
  onSave: (newOrder: string[]) => void;
  /** Unidade padrão atual (opcional) */
  defaultUnit?: string;
  /** Callback para alterar a unidade padrão (opcional) */
  onDefaultUnitChange?: (unit: string) => void;
  /** Opções de unidade disponíveis (opcional) */
  unitOptions?: UnitOption[];
}

function ColumnSortableItem({ id, col }: { id: string; col: ColumnDef }) {
  const isFixed = !!col.fixed;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isFixed,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border transition-all ${
        isFixed
          ? "border-white/[0.04] bg-white/[0.02] opacity-60 cursor-not-allowed"
          : isDragging
          ? "border-indigo-500/50 bg-indigo-500/10 opacity-90"
          : "border-white/[0.08] bg-[#1a2332] hover:border-indigo-500/30 hover:bg-indigo-500/5"
      }`}
    >
      <div
        {...(!isFixed ? attributes : {})}
        {...(!isFixed ? listeners : {})}
        className={isFixed ? "p-1 -ml-1 flex focus:outline-none" : "cursor-grab active:cursor-grabbing p-1 -ml-1 flex focus:outline-none"}
      >
        {isFixed ? (
          <Lock className="h-4 w-4 text-gray-600 shrink-0" />
        ) : (
          <GripVertical className="h-4 w-4 text-gray-400 pointer-events-none shrink-0" />
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          isFixed ? "text-gray-500" : "text-gray-200"
        }`}
      >
        {col.label}
      </span>
    </div>
  );
}

export function ColumnConfigModal({
  open,
  onClose,
  columns,
  columnOrder,
  onSave,
  defaultUnit,
  onDefaultUnitChange,
  unitOptions,
}: ColumnConfigModalProps) {
  const [order, setOrder] = useState<string[]>(columnOrder);
  const [localUnit, setLocalUnit] = useState(defaultUnit ?? "");

  useEffect(() => {
    if (open) {
      setOrder(columnOrder);
      setLocalUnit(defaultUnit ?? "");
    }
  }, [open, columnOrder, defaultUnit]);

  const getColumn = useCallback(
    (id: string) => columns.find((c) => c.id === id),
    [columns]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        
        // Prevent moving fixed columns or moving non-fixed columns into fixed column spots
        const activeCol = getColumn(active.id as string);
        const overCol = getColumn(over.id as string);
        
        if (activeCol?.fixed || overCol?.fixed) {
           return items; 
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onSave(order);
    if (onDefaultUnitChange && localUnit) {
      onDefaultUnitChange(localUnit);
    }
    onClose();
  };

  const handleReset = () => {
    const defaultOrder = columns.map((c) => c.id);
    setOrder(defaultOrder);
    if (unitOptions && unitOptions.length > 0) {
      setLocalUnit("CX"); // reset to CX
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <ModalHeader onClose={onClose}>Configurar Colunas</ModalHeader>
      <ModalBody className="space-y-4">
        <p className="text-xs text-gray-400 mb-3">
          Arraste para reordenar as colunas da tabela. Colunas com 🔒 são fixas.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {order.map((colId) => {
                const col = getColumn(colId);
                if (!col) return null;
                return <ColumnSortableItem key={colId} id={colId} col={col} />;
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Unidade padrão (só renderiza se as props forem fornecidas) */}
        {unitOptions && unitOptions.length > 0 && onDefaultUnitChange && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2 mt-4">
            <label className="text-xs font-medium text-gray-300">
              Unidade padrão para novos itens
            </label>
            <div className="relative">
              <select
                value={localUnit}
                onChange={(e) => setLocalUnit(e.target.value)}
                className="w-full h-9 bg-[#1a2332] border border-white/[0.08] rounded-[var(--radius-md)] text-white text-sm pl-3 pr-8 appearance-none outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0f1720]">
                    {opt.value} — {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-500">
              Novos itens adicionados à lista usarão esta unidade como padrão.
            </p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Restaurar padrão
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

/* ─── Helpers de persistência ──────────────────────────────────────────────── */

export function loadColumnOrder(
  storageKey: string,
  defaultOrder: string[]
): string[] {
  if (typeof window === "undefined") return defaultOrder;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultOrder;
    const saved: string[] = JSON.parse(raw);
    // garante que todas as colunas default estão presentes
    const validSet = new Set(defaultOrder);
    const filtered = saved.filter((id) => validSet.has(id));
    // adiciona novas colunas que possam ter sido adicionadas
    const missing = defaultOrder.filter((id) => !filtered.includes(id));
    return [...filtered, ...missing];
  } catch {
    return defaultOrder;
  }
}

export function saveColumnOrder(storageKey: string, order: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(order));
}
