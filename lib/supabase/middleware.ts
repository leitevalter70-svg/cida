import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const AUTH_TIMEOUT_MS = 2500

async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("supabase_auth_timeout")),
          ms,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Allow local UI work before Supabase is connected
  if (!url || !key) {
    return supabaseResponse
  }

  const pathname = request.nextUrl.pathname
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/cadastro")
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple") ||
    pathname === "/favicon.ico"

  if (isPublicAsset) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  let user: { id: string } | null = null
  try {
    const result = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS)
    user = result.data.user
  } catch {
    // Projeto pausado / rede lenta: não derruba a Vercel com 504.
    // Em rotas de auth deixa a página carregar; nas demais manda ao login.
    if (isAuthRoute) return supabaseResponse
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", pathname)
    redirectUrl.searchParams.set("aviso", "supabase")
    return NextResponse.redirect(redirectUrl)
  }

  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
