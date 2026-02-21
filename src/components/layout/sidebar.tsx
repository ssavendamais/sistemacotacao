"use client"

import { signOut } from "@/actions/auth"
import { cn } from "@/lib/utils"
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Send,
    X,
    Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface SidebarProps {
  userType: "empresario" | "fornecedor"
  userName: string
  userEmpresa?: string | null
}

const empresarioLinks = [
  { label: "Dashboard", href: "/empresario/dashboard", icon: LayoutDashboard },
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

export function Sidebar({ userType, userName, userEmpresa }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = userType === "empresario" ? empresarioLinks : fornecedorLinks

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-neutral-100 shrink-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-[var(--radius-md)] bg-primary-500 text-white shrink-0">
          <Zap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-lg font-bold text-neutral-900 tracking-tight">
              Venda Mais
            </span>
            <p className="text-[10px] text-neutral-400 -mt-0.5">
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User info + actions */}
      <div className="px-3 py-3 border-t border-neutral-100 shrink-0 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-neutral-800 truncate">
              {userName}
            </p>
            {userEmpresa && (
              <p className="text-xs text-neutral-400 truncate">{userEmpresa}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-3 flex-1 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Recolher</span>
              </>
            )}
          </button>

          <form action={signOut}>
            <button
              type="submit"
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer",
                collapsed && "justify-center px-0"
              )}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-[var(--radius-md)] shadow-md border border-neutral-100"
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-[260px] bg-white border-r border-neutral-200 flex flex-col z-40 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
