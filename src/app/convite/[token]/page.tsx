import { getInvitationByToken } from '@/actions/invitations'
import { AcceptInviteForm } from '@/components/usuarios/AcceptInviteForm'
import { createClient } from '@/lib/supabase/server'
import { AlertCircle, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ConvitePage({ params }: PageProps) {
  const { token } = await params

  // 1. Se já logado, não pode aceitar convite (deve deslogar primeiro)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/empresario/dashboard')
  }

  // 2. Validar token no server
  const { invitation, error } = await getInvitationByToken(token)

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4 py-12">
        <div className="w-full max-w-md bg-[#111827] border border-white/[0.08] rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Convite Inválido</h2>
          <p className="text-sm text-gray-400 mb-8">{error}</p>
          <Link
            href="/login"
            className="inline-flex justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
          >
            Voltar para o Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4 py-12">
      <div className="w-full max-w-md bg-[#111827] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-6">
          <UserCheck className="h-8 w-8 text-indigo-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">
          Você foi convidado!
        </h2>
        <p className="text-sm text-gray-400 text-center mb-8">
          A organização <strong className="text-white">{invitation.organizations?.name || 'sua empresa'}</strong> convidou você para participar da Venda Mais como {' '}
          <span className="capitalize font-medium text-indigo-400">{invitation.role}</span>.
        </p>

        <AcceptInviteForm token={token} email={invitation.email} />
      </div>
    </div>
  )
}
