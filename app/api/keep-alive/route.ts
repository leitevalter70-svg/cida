import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Keep-alive for Supabase Free: daily read-only ping so the project
 * is not paused after ~7 days of inactivity.
 *
 * - Only SELECT (limit 1) — never writes or deletes data
 * - Uses anon key without a user session (RLS returns empty rows)
 * - Protected by CRON_SECRET (Vercel Cron sends Authorization: Bearer …)
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured" },
      { status: 503 },
    )
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Read-only: hits Postgres via PostgREST. RLS blocks row data without a user.
  const { error } = await supabase.from("profiles").select("id").limit(1)

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    message: "keep-alive ping",
    at: new Date().toISOString(),
  })
}
