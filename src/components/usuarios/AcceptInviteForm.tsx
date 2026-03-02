'use client'

import { acceptInvitation } from '@/actions/invitations'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface AcceptInviteFormProps {
  token: string
  email: string
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    username: '',
    password: '',
    passwordConfirm: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 6) {
      return setError('A senha deve ter no mínimo 6 caracteres.')
    }
    if (form.password !== form.passwordConfirm) {
      return setError('As senhas não coincidem.')
    }

    startTransition(async () => {
      const res = await acceptInvitation({
        token,
        nome: form.nome,
        username: form.username,
        password: form.password,
      })

      if (res.error) {
        setError(res.error)
      } else {
        // Redireciona para login limpo — o usuário precisará fazer login com as novas credenciais
        router.push('/login?msg=conta-criada')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
        <input
          type="email"
          disabled
          value={email}
          className="w-full text-sm bg-white/[0.02] border border-white/[0.05] text-gray-500 rounded-lg px-3.5 py-2.5 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Seu nome completo *</label>
        <input
          type="text"
          name="nome"
          required
          value={form.nome}
          onChange={handleChange}
          placeholder="Ex: João Silva"
          className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-200 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-shadow"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome de usuário (único) *</label>
        <input
          type="text"
          name="username"
          required
          pattern="[a-zA-Z0-9_]+"
          title="Apenas letras, números e underline"
          value={form.username}
          onChange={handleChange}
          placeholder="Ex: joaosilva"
          className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-200 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-shadow"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Senha *</label>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 6 chars"
            className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-200 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-shadow"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirme a senha *</label>
          <input
            type="password"
            name="passwordConfirm"
            required
            value={form.passwordConfirm}
            onChange={handleChange}
            placeholder="Repita a senha"
            className="w-full text-sm bg-white/[0.05] border border-white/[0.1] text-gray-200 placeholder-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-shadow"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-lg text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          <>
            Concluir cadastro
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}
