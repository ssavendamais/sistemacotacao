import { useCallback, useEffect, useState } from 'react';

export type LayoutScope = 'dashboard' | 'sidebar' | 'both';

export interface LayoutModule {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export const defaultModules: LayoutModule[] = [
  { id: 'produtos', label: 'Produtos', icon: 'Package', href: '/empresario/produtos' },
  { id: 'categorias', label: 'Categorias', icon: 'Tags', href: '/empresario/categorias' },
  { id: 'lista-cotacao', label: 'Lista de Cotação', icon: 'ClipboardList', href: '/empresario/lista-cotacao' },
  { id: 'cotacoes', label: 'Minhas Cotações', icon: 'FileText', href: '/empresario/cotacoes' },
];

const STORAGE_KEY_DASHBOARD = 'vendamais:layout:dashboard';
const STORAGE_KEY_SIDEBAR = 'vendamais:layout:sidebar';

export function getStoredLayout(scope: 'dashboard' | 'sidebar'): string[] {
  if (typeof window === 'undefined') return defaultModules.map(m => m.id);
  const key = scope === 'dashboard' ? STORAGE_KEY_DASHBOARD : STORAGE_KEY_SIDEBAR;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultModules.map(m => m.id);
    const saved: string[] = JSON.parse(raw);
    
    // Validate saved layout against existing modules
    const validIds = new Set(defaultModules.map(m => m.id));
    const filtered = saved.filter(id => validIds.has(id));
    const missing = defaultModules.filter(m => !filtered.includes(m.id)).map(m => m.id);
    
    return [...filtered, ...missing];
  } catch {
    return defaultModules.map(m => m.id);
  }
}

export function saveStoredLayout(scope: LayoutScope, order: string[]) {
  if (typeof window === 'undefined') return;
  
  if (scope === 'dashboard' || scope === 'both') {
    localStorage.setItem(STORAGE_KEY_DASHBOARD, JSON.stringify(order));
  }
  
  if (scope === 'sidebar' || scope === 'both') {
    localStorage.setItem(STORAGE_KEY_SIDEBAR, JSON.stringify(order));
  }
  
  // Dispatch a custom event to notify other components to re-render
  window.dispatchEvent(new Event('layout-changed'));
}

export function useLayoutConfig(scope: 'dashboard' | 'sidebar') {
  const [order, setOrder] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadOrder = useCallback(() => {
    setOrder(getStoredLayout(scope));
  }, [scope]);

  useEffect(() => {
    loadOrder();
    setMounted(true);
    
    const handleLayoutChanged = () => {
      loadOrder();
    };

    window.addEventListener('layout-changed', handleLayoutChanged);
    return () => {
      window.removeEventListener('layout-changed', handleLayoutChanged);
    };
  }, [loadOrder]);

  const orderedModules = order.map(id => defaultModules.find(m => m.id === id)).filter(Boolean) as LayoutModule[];

  return {
    order,
    orderedModules,
    mounted
  };
}
