"use client"

import { signIn } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[var(--radius-xl)] shadow-lg border border-neutral-100 p-8">
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">
        Entrar na plataforma
      </h2>

      {error && (
        <div className="bg-danger-light text-danger text-sm rounded-[var(--radius-md)] p-3 mb-4 border border-red-200">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
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
            className="w-full px-3 py-2.5 border border-neutral-200 rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-base"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link
          href="/esqueci-senha"
          className="text-sm text-primary-600 hover:text-primary-700 transition-base"
        >
          Esqueci minha senha
        </Link>
        <p className="text-sm text-neutral-500">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="text-primary-600 hover:text-primary-700 font-medium transition-base"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
