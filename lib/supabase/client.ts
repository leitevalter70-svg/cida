import { createBrowserClient } from "@supabase/ssr"

import { isSupabaseConfigured } from "@/lib/supabase/config"

export { isSupabaseConfigured }

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local",
    )
  }

  return createBrowserClient(url, key)
}
