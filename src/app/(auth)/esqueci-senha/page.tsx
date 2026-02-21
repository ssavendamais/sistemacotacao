"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useState } from "react"

export default function EsqueciSenhaPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-[var(--radius-xl)] shadow-lg border border-neutral-100 p-8">
      <h2 className="text-xl font-semibold text-neutral-800 mb-2">
        Recuperar senha
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Informe seu email para receber o link de redefinição.
      </p>

      {success ? (
        <div className="bg-success-light text-emerald-700 text-sm rounded-[var(--radius-md)] p-4 border border-emerald-200">
          <p className="font-medium">Email enviado!</p>
          <p className="mt-1">Verifique sua caixa de entrada para redefinir a senha.</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-danger-light text-danger text-sm rounded-[var(--radius-md)] p-3 mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" loading={loading} className="w-full">
              Enviar link
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 font-medium transition-base"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
