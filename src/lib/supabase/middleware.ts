import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/empresario') ||
    request.nextUrl.pathname.startsWith('/fornecedor')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  const isAuthPage = ['/login', '/cadastro', '/esqueci-senha'].some((p) =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (isAuthPage && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tipo')
      .eq('id', user.id)
      .single()

    const dashboardPath =
      profile?.tipo === 'fornecedor'
        ? '/fornecedor/dashboard'
        : '/empresario/dashboard'

    const url = request.nextUrl.clone()
    url.pathname = dashboardPath
    return NextResponse.redirect(url)
  }

  // Fase 1 + 1.5 — Injetar org_id no header, com suporte a impersonação segura
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_organization_id, global_role')
      .eq('id', user.id)
      .single()

    // Impersonação: super_admin com cookie acting_as_org_id sobrescreve x-org-id
    // sem alterar o banco — apenas o contexto da request atual
    const actingAsOrgId = request.cookies.get('acting_as_org_id')?.value
    const isSuperAdmin = profile?.global_role === 'super_admin'

    if (isSuperAdmin && actingAsOrgId) {
      // Modo impersonação ativo: usa a org do cookie
      supabaseResponse.headers.set('x-org-id', actingAsOrgId)
      supabaseResponse.headers.set('x-impersonating', 'true')
    } else if (profile?.active_organization_id) {
      // Modo normal: usa a org ativa do banco
      supabaseResponse.headers.set('x-org-id', profile.active_organization_id)
    }

    // Sempre informa se é super_admin para os layouts
    if (isSuperAdmin) {
      supabaseResponse.headers.set('x-is-super-admin', 'true')
    }
  }

  return supabaseResponse
}


