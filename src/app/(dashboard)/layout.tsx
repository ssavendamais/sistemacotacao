import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, tipo, empresa")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar
        userType={profile.tipo}
        userName={profile.nome}
        userEmpresa={profile.empresa}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
