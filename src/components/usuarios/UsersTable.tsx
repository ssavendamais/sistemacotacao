'use client'

import { deactivateUser, reactivateUser, updateUserRole, type AdminUserViewExtended } from '@/actions/admin-users'
import { startImpersonation } from '@/actions/impersonation'
import { type GlobalRole, type UserRole } from '@/lib/types/database'
import { ChevronDown, LogIn, ShieldCheck, UserCheck, UserCog, UserX } from 'lucide-react'
import { useState, useTransition } from 'react'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'moderador', label: 'Moderador' },
  { value: 'fornecedor', label: 'Fornecedor' },
]

const GLOBAL_ROLE_OPTIONS: { value: GlobalRole; label: string; color: string }[] = [
  { value: 'super_admin', label: 'Super Admin', color: 'text-amber-400' },
  { value: 'user', label: 'Usuário', color: 'text-gray-400' },
]

function RoleBadge({ role, globalRole }: { role: UserRole | null; globalRole: GlobalRole }) {
  if (globalRole === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <ShieldCheck className="h-3 w-3" />
        Super Admin
      </span>
    )
  }
  const map: Record<string, { label: string; cls: string }> = {
    admin: { label: 'Admin', cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    moderador: { label: 'Moderador', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    fornecedor: { label: 'Fornecedor', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  }
  const config = role ? map[role] : null
  return config ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.cls}`}>
      {config.label}
    </span>
  ) : (
    <span className="text-gray-600 text-xs">—</span>
  )
}

function UserRow({ user }: { user: AdminUserViewExtended }) {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<UserRole | null>(user.role)
  const [globalRole, setGlobalRole] = useState<GlobalRole>(user.global_role)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setRole(e.target.value as UserRole)
  }

  function handleGlobalRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setGlobalRole(e.target.value as GlobalRole)
  }

  function handleSaveRole() {
    startTransition(async () => {
      const res = await updateUserRole(user.id, role, globalRole)
      setStatus(res.success ? 'success' : 'error')
      setStatusMsg(res.error ?? 'Papel atualizado!')
      setTimeout(() => setStatus('idle'), 2500)
    })
  }

  function handleDeactivate() {
    if (!confirm(`Desativar ${user.nome}? O usuário não conseguirá mais fazer login.`)) return
    startTransition(async () => {
      const res = await deactivateUser(user.id)
      setStatus(res.success ? 'success' : 'error')
      setStatusMsg(res.error ?? 'Usuário desativado.')
      setTimeout(() => setStatus('idle'), 2500)
    })
  }

  function handleReactivate() {
    startTransition(async () => {
      const res = await reactivateUser(user.id)
      setStatus(res.success ? 'success' : 'error')
      setStatusMsg(res.error ?? 'Usuário reativado.')
      setTimeout(() => setStatus('idle'), 2500)
    })
  }

  function handleImpersonate() {
    if (!user.active_organization_id) {
      alert('Usuário não possui uma organização ativa vinculada.')
      return
    }
    startTransition(async () => {
      const res = await startImpersonation(user.active_organization_id!)
      if (res.error) {
        setStatus('error')
        setStatusMsg(res.error)
        setTimeout(() => setStatus('idle'), 2500)
      } else {
        window.location.href = '/'
      }
    })
  }

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      {/* Identidade */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 uppercase">
            {user.nome?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user.nome}</p>
            {user.username && (
              <p className="text-xs text-gray-500">@{user.username}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-gray-400 max-w-[200px] truncate">{user.email}</td>
      <td className="px-5 py-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
          user.tipo === 'empresario'
            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
        }`}>
          {user.tipo === 'empresario' ? 'Empresário' : 'Fornecedor'}
        </span>
      </td>

      {/* Role atual */}
      <td className="px-5 py-4">
        <RoleBadge role={user.role} globalRole={user.global_role} />
      </td>

      {/* Selects de edição */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <div className="relative">
            <select
              value={role ?? ''}
              onChange={handleRoleChange}
              disabled={isPending}
              className="w-full appearance-none text-xs bg-white/[0.05] border border-white/[0.1] text-gray-300 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>Papel no app</option>
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#1F2937]">{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={globalRole}
              onChange={handleGlobalRoleChange}
              disabled={isPending}
              className="w-full appearance-none text-xs bg-white/[0.05] border border-white/[0.1] text-gray-300 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer disabled:opacity-50"
            >
              {GLOBAL_ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#1F2937]">{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </td>

      {/* Ações */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveRole}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-colors disabled:opacity-40 cursor-pointer"
            title="Salvar papel"
          >
            <UserCog className="h-3.5 w-3.5" />
            Salvar
          </button>
          <button
            onClick={handleDeactivate}
            disabled={isPending}
            className="flex items-center gap-1 p-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-40 cursor-pointer"
            title="Desativar usuário"
          >
            <UserX className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleReactivate}
            disabled={isPending}
            className="flex items-center gap-1 p-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-colors disabled:opacity-40 cursor-pointer"
            title="Reativar usuário"
          >
            <UserCheck className="h-3.5 w-3.5" />
          </button>
          {user.active_organization_id && user.global_role !== 'super_admin' && (
            <button
              onClick={handleImpersonate}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/20 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap ml-2"
              title="Acessar painel como esta organização"
            >
              <LogIn className="h-3.5 w-3.5" />
              Acessar
            </button>
          )}
        </div>
        {status !== 'idle' && (
          <p className={`text-[10px] mt-1.5 ${status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {statusMsg}
          </p>
        )}
      </td>

      {/* Empresa */}
      <td className="px-5 py-4 text-xs text-gray-500 max-w-[140px] truncate">
        {user.empresa || '—'}
      </td>

      {/* Data */}
      <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">
        {new Date(user.created_at).toLocaleDateString('pt-BR')}
      </td>
    </tr>
  )
}

interface UsersTableProps {
  users: AdminUserViewExtended[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.username ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-[#111827] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Search bar */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <input
          type="text"
          placeholder="Buscar por nome, email ou @username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm text-sm bg-white/[0.05] border border-white/[0.08] text-gray-300 placeholder-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Usuário', 'Email', 'Tipo', 'Papel atual', 'Editar papel', 'Ações', 'Empresa', 'Cadastro'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-600">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map(user => <UserRow key={user.id} user={user} />)
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'usuário' : 'usuários'}
        </div>
      )}
    </div>
  )
}
