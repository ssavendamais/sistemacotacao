"use client"

import { signUp } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export default function CadastroPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<"empresario" | "fornecedor">("empresario")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[var(--radius-xl)] shadow-lg border border-neutral-100 p-8">
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">
        Criar conta
      </h2>

      {error && (
        <div className="bg-danger-light text-danger text-sm rounded-[var(--radius-md)] p-3 mb-4 border border-red-200">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {/* Tipo de usuário */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Eu sou
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("empresario")}
              className={`py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-base border ${
                tipo === "empresario"
                  ? "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              🏪 Empresário
            </button>
            <button
              type="button"
              onClick={() => setTipo("fornecedor")}
              className={`py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-base border ${
                tipo === "fornecedor"
                  ? "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              🚚 Fornecedor
            </button>
          </div>
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-neutral-700 mb-1">
            Nome completo
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="w-full px-3 py-2.5 border border-neutral-200 rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-base"
          />
        </div>

        <div>
          <label htmlFor="empresa" className="block text-sm font-medium text-neutral-700 mb-1">
            Nome da empresa
          </label>
          <input
            id="empresa"
            name="empresa"
            type="text"
            className="w-full px-3 py-2.5 border border-neutral-200 rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-base"
          />
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-neutral-700 mb-1">
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            className="w-full px-3 py-2.5 border border-neutral-200 rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-base"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2.5 border border-neutral-200 rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-base"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full px-3 py-2.5 border border-neutral-200 rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-base"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 font-medium transition-base"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
