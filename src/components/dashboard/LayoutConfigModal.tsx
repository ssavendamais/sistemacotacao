"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { defaultModules, LayoutScope, saveStoredLayout } from "@/lib/hooks/useLayoutConfig";
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
import { GripVertical } from "lucide-react";
import { useEffect, useState } from "react";

function SortableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border transition-colors ${
        isDragging
          ? "border-indigo-500/50 bg-indigo-500/10 opacity-90"
          : "border-white/[0.08] bg-[#1a2332] hover:border-indigo-500/30 hover:bg-indigo-500/5"
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1">
        <GripVertical className="h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      <span className="text-sm font-medium text-gray-200">{label}</span>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialOrder: string[];
}

export function LayoutConfigModal({ open, onClose, initialOrder }: Props) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [scope, setScope] = useState<LayoutScope>("both"); // Default to both

  useEffect(() => {
    if (open) {
      setOrder(initialOrder);
    }
  }, [open, initialOrder]);

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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    saveStoredLayout(scope, order);
    onClose();
  };

  const handleReset = () => {
    setOrder(defaultModules.map((m) => m.id));
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <ModalHeader onClose={onClose}>Editar Layout do Painel</ModalHeader>
      <ModalBody className="space-y-4">
        <p className="text-xs text-gray-400 mb-2">
          Arraste e solte para reordenar os módulos. Esta ordem será sincronizada de acordo com o escopo selecionado abaixo.
        </p>

        {/* Scope Selector */}
        <div className="flex bg-[#0f1420] p-1 rounded-lg border border-white/[0.06] mb-4">
          <button
            onClick={() => setScope("dashboard")}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
              scope === "dashboard"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setScope("sidebar")}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
              scope === "sidebar"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Sidebar
          </button>
          <button
            onClick={() => setScope("both")}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
              scope === "both"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Ambos
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {order.map((id) => {
                const module = defaultModules.find((m) => m.id === id);
                if (!module) return null;
                return <SortableItem key={id} id={id} label={module.label} />;
              })}
            </div>
          </SortableContext>
        </DndContext>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Restaura original
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Layout</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
