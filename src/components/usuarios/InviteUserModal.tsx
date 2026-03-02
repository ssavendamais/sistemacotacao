'use client'

import { createInvitation } from '@/actions/invitations'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UserPlus, X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

export function InviteUserModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string | null } | null>(null)

  const [form, setForm] = useState({
    email: '',
    nome: '',
    role: 'member' as 'admin' | 'member' | 'vendedor',
    organizationId: '',
  })
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (open) {
      createClient()
        .from('organizations')
        .select('id, name')
        .order('name')
        .then(({ data }) => setOrgs(data || []))
    }
  }, [open])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.organizationId) {
      setResult({ success: false, error: 'Selecione uma organização' })
      return
    }
    startTransition(async () => {
      const res = await createInvitation({
        organizationId: form.organizationId,
        email: form.email,
        role: form.role as 'admin' | 'member' | 'vendedor'
      })
      
      if (res.error) {
        setResult({ success: false, error: res.error })
      } else if (res.token) {
        setResult({ success: true, error: null })
        setForm({ email: '', nome: '', role: 'member', organizationId: '' })
        setTimeout(() => { setOpen(false); setResult(null) }, 1800)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
      >
        <UserPlus className="h-4 w-4" />
        Convidar usuário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#111827] border border-white/[0.08] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Convidar novo usuário</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="usuario@empresa.com"
                  className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-200 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome completo *</label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="João Silva"
                  className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-200 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Organização *</label>
                  <select
                    name="organizationId"
                    value={form.organizationId}
                    onChange={handleChange}
                    required
                    className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#1F2937]">Selecione uma empresa</option>
                    {orgs.map(org => (
                      <option key={org.id} value={org.id} className="bg-[#1F2937]">{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Papel Organizacional *</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="admin" className="bg-[#1F2937]">Admin da Empresa</option>
                    <option value="member" className="bg-[#1F2937]">Membro</option>
                    <option value="vendedor" className="bg-[#1F2937]">Vendedor (Apenas Fornecedor)</option>
                  </select>
                </div>
              </div>

              {result?.error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {result.error}
                </p>
              )}
              {result?.success && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  ✓ Convite enviado com sucesso!
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {isPending ? 'Enviando...' : 'Enviar convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
