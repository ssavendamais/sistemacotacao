'use client'

import { stopImpersonation } from '@/actions/impersonation'
import { LogOut, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function ImpersonationBanner() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStop() {
    startTransition(async () => {
      await stopImpersonation()
      router.push('/empresario/usuarios')
    })
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <p className="text-sm font-medium text-amber-400">
            Modo Impersonação: você está visualizando o sistema como outra organização.
          </p>
        </div>
        <button
          onClick={handleStop}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-full transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair da visualização
        </button>
      </div>
    </div>
  )
}
