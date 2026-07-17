import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export { isSupabaseConfigured }

export async function getAuthUser() {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getAuthUser()
  if (!user) {
    throw new Error("Não autenticado")
  }
  return user
}
