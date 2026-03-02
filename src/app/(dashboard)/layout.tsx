import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner"
import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const headersList = await headers()
  const isImpersonating = headersList.get("x-impersonating") === "true"

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, tipo, empresa, global_role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-[#0B1220] transition-colors flex-col overflow-hidden">
      {isImpersonating && <ImpersonationBanner />}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
        userType={profile.tipo}
        userName={profile.nome}
        userEmpresa={profile.empresa}
        globalRole={profile.global_role}
      />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
