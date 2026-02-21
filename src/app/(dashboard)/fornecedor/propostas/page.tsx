import { Badge } from "@/components/ui/badge"
import {
    PROPOSTA_STATUS_LABELS,
} from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"

export default async function MinhasPropostasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: propostas } = await supabase
    .from("propostas")
    .select(
      `
      *,
      cotacoes:cotacao_id (
        titulo,
        status,
        profiles:empresario_id (nome, empresa)
      )
    `
    )
    .eq("fornecedor_id", user.id)
    .order("created_at", { ascending: false })

  const statusColors: Record<string, "default" | "success" | "warning"> = {
    enviada: "warning",
    aceita: "success",
    recusada: "default",
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Minhas Propostas
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Acompanhe o status das suas propostas
        </p>
      </div>

      {!propostas || propostas.length === 0 ? (
        <div className="bg-white rounded-[var(--radius-lg)] border border-neutral-100 p-12 text-center shadow-xs">
          <p className="text-neutral-500">
            Você ainda não enviou nenhuma proposta.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {propostas.map((proposta) => (
            <div
              key={proposta.id}
              className="bg-white rounded-[var(--radius-lg)] border border-neutral-100 p-5 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">
                      {(proposta as any).cotacoes?.titulo}
                    </h3>
                    <Badge variant={statusColors[proposta.status]}>
                      {
                        PROPOSTA_STATUS_LABELS[
                          proposta.status as keyof typeof PROPOSTA_STATUS_LABELS
                        ]
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span>
                      {(proposta as any).cotacoes?.profiles?.empresa ||
                        (proposta as any).cotacoes?.profiles?.nome}
                    </span>
                    <span>Enviada em {formatDate(proposta.created_at)}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-neutral-900">
                    {proposta.valor_total
                      ? formatCurrency(proposta.valor_total)
                      : "—"}
                  </p>
                  <p className="text-xs text-neutral-400">Valor total</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
