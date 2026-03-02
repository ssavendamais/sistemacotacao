"use client"

import { signOut } from "@/actions/auth"
import { useTheme } from "@/components/theme-provider"
import { useDraftList } from "@/lib/hooks/useDraftList"
import { useLayoutConfig } from "@/lib/hooks/useLayoutConfig"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Send,
  ShieldCheck,
  Sun,
  Tags,
  X,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface SidebarProps {
  userType: "empresario" | "fornecedor"
  userName: string
  userEmpresa?: string | null
  globalRole?: string | null
}

const empresarioLinks = [
  { label: "Dashboard", href: "/empresario/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/empresario/produtos", icon: Package },
  { label: "Categorias", href: "/empresario/categorias", icon: Tags },
  { label: "Lista de Cotação", href: "/empresario/lista-cotacao", icon: ClipboardList, hasBadge: true },
  { label: "Minhas Cotações", href: "/empresario/cotacoes", icon: FileText },
]

const fornecedorLinks = [
  { label: "Dashboard", href: "/fornecedor/dashboard", icon: LayoutDashboard },
  {
    label: "Cotações Disponíveis",
    href: "/fornecedor/cotacoes",
    icon: FileText,
  },
  { label: "Minhas Propostas", href: "/fornecedor/propostas", icon: Send },
]

export function Sidebar({ userType, userName, userEmpresa, globalRole }: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count: draftCount } = useDraftList()
  // Detecta aumento ou diminuição para animar badge
  const prevDraftCount = useRef(draftCount)
  const [badgeKey, setBadgeKey] = useState(0)
  const [badgeAnimation, setBadgeAnimation] = useState("")

  // Layout module config
  const { orderedModules, mounted } = useLayoutConfig('sidebar')

  useEffect(() => {
    if (draftCount > prevDraftCount.current) {
      setBadgeAnimation("animate-badge-slide-up")
      setBadgeKey((k) => k + 1)
    } else if (draftCount < prevDraftCount.current) {
      setBadgeAnimation("animate-badge-slide-down")
      setBadgeKey((k) => k + 1)
    }
    prevDraftCount.current = draftCount
  }, [draftCount])

  const isSuperAdmin = globalRole === 'super_admin'
  let links = fornecedorLinks;

  if (userType === 'empresario') {
    // Dynamically order the modular links
    const middleLinks = mounted 
      ? orderedModules.map(mod => {
          return empresarioLinks.find(l => l.href === mod.href) || { label: mod.label, href: mod.href, icon: LayoutDashboard }
        })
      : empresarioLinks.slice(1);

    links = [
      empresarioLinks[0], // Dashboard
      ...middleLinks,
      ...(isSuperAdmin ? [{ label: "Usuários", href: "/empresario/usuarios", icon: ShieldCheck }] : []),
    ] as any;
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-[var(--radius-md)] bg-primary-500 text-white shrink-0">
          <Zap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-lg font-bold text-white tracking-tight">
              Venda Mais
            </span>
            <p className="text-[10px] text-gray-500 -mt-0.5">
              {userType === "empresario"
                ? "Painel do Empresário"
                : "Painel do Fornecedor"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.href === "/empresario/lista-cotacao" ? "sidebar-draft-icon" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.href === "/empresario/lista-cotacao" && draftCount > 0 && (
                <span
                  key={`badge-${badgeKey}`}
                  className={`ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold px-1.5 ${badgeAnimation}`}
                >
                  {draftCount}
                </span>
              )}
              {collapsed && item.href === "/empresario/lista-cotacao" && draftCount > 0 && (
                <span
                  key={`badge-col-${badgeKey}`}
                  className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[9px] font-bold px-1 ${badgeAnimation}`}
                >
                  {draftCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Spacer to push footer to bottom */}
      <div className="flex-1" />

      {/* User info + actions */}
      <div className="px-3 py-4 border-t border-white/[0.06] shrink-0 space-y-3">
        {!collapsed && (
          <div className="px-3 py-2.5 rounded-[var(--radius-md)] bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {userName}
                </p>
                {userEmpresa && (
                  <p className="text-xs text-gray-500 truncate">{userEmpresa}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-0.5 w-full">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors cursor-pointer",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (
              <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
            )}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors cursor-pointer",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span>Recolher</span>
              </>
            )}
          </button>

          <div className="h-px bg-white/[0.06] my-1" />

          <form action={signOut} className="w-full">
            <button
              type="submit"
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-[var(--radius-md)] text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer",
                collapsed ? "justify-center px-0" : "justify-start"
              )}
              title="Sair"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </button>
          </form>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1F2937] rounded-[var(--radius-md)] shadow-md border border-white/[0.06]"
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-gray-300" />
        ) : (
          <Menu className="h-5 w-5 text-gray-300" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-[#111827] border-r border-white/[0.06] transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-[260px] bg-[#111827] border-r border-white/[0.06] flex flex-col z-40 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
