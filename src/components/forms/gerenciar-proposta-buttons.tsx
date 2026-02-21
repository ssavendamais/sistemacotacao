"use client"

import { gerenciarProposta } from "@/actions/propostas"
import { CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"

export function GerenciarPropostaButtons({
  propostaId,
}: {
  propostaId: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleAction(status: "aceita" | "recusada") {
    setLoading(true)
    await gerenciarProposta(propostaId, status)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction("aceita")}
        disabled={loading}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-success-light text-emerald-700 rounded-[var(--radius-md)] text-xs font-medium hover:bg-emerald-100 transition-base disabled:opacity-50"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Aceitar
      </button>
      <button
        onClick={() => handleAction("recusada")}
        disabled={loading}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-danger-light text-red-700 rounded-[var(--radius-md)] text-xs font-medium hover:bg-red-100 transition-base disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" />
        Recusar
      </button>
    </div>
  )
}
