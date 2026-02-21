"use client"

import { atualizarStatusCotacao } from "@/actions/cotacoes"
import { useState } from "react"

export function StatusCotacaoButtons({
  cotacaoId,
  currentStatus,
}: {
  cotacaoId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleStatus(
    status: "aberta" | "em_andamento" | "encerrada"
  ) {
    setLoading(true)
    await atualizarStatusCotacao(cotacaoId, status)
    setLoading(false)
  }

  if (currentStatus === "encerrada") return null

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "aberta" && (
        <button
          onClick={() => handleStatus("em_andamento")}
          disabled={loading}
          className="px-3 py-1.5 bg-warning-light text-amber-700 rounded-[var(--radius-md)] text-xs font-medium hover:bg-amber-100 transition-base disabled:opacity-50"
        >
          Iniciar análise
        </button>
      )}
      <button
        onClick={() => handleStatus("encerrada")}
        disabled={loading}
        className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-[var(--radius-md)] text-xs font-medium hover:bg-neutral-200 transition-base disabled:opacity-50"
      >
        Encerrar cotação
      </button>
    </div>
  )
}
