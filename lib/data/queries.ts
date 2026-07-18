import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export function setupBanner() {
  if (isSupabaseConfigured()) return null
  return {
    title: "Supabase desconectado — dados NÃO estão sendo salvos",
    body: "Falta o arquivo .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. Sem isso o app não grava no banco e as informações se perdem ao reiniciar.",
  }
}

export async function fetchDashboardData(from: string, to: string) {
  if (!isSupabaseConfigured()) {
    return {
      revenues: [],
      expenses: [],
      sessions: [],
      patients: [],
      treatments: [],
      installments: [],
      devices: [],
      settings: null,
      bands: [],
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      revenues: [],
      expenses: [],
      sessions: [],
      patients: [],
      treatments: [],
      installments: [],
      devices: [],
      settings: null,
      bands: [],
    }
  }

  const [
    revenues,
    expenses,
    sessions,
    patients,
    treatments,
    installments,
    devices,
    settings,
    bands,
  ] = await Promise.all([
    supabase
      .from("revenues")
      .select("*")
      .eq("user_id", user.id)
      .not("patient_id", "is", null)
      .gte("revenue_date", from)
      .lte("revenue_date", to)
      .order("revenue_date", { ascending: true }),
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("expense_date", from)
      .lte("expense_date", to),
    supabase
      .from("sessions")
      .select("*, session_devices(device_id, device_catalog(name, slug))")
      .eq("user_id", user.id)
      .gte("session_date", from)
      .lte("session_date", to),
    supabase.from("patients").select("*").eq("user_id", user.id),
    supabase.from("treatments").select("*").eq("user_id", user.id),
    supabase
      .from("installments")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "paga"),
    supabase
      .from("device_catalog")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("financial_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("clinical_chance_bands")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ])

  const patientIds = new Set((patients.data ?? []).map((p) => p.id))
  const liveTreatments = (treatments.data ?? []).filter((t) =>
    patientIds.has(t.patient_id),
  )
  const liveTreatmentIds = new Set(liveTreatments.map((t) => t.id))

  return {
    revenues: (revenues.data ?? []).filter((r) => patientIds.has(r.patient_id)),
    expenses: (expenses.data ?? []).filter(
      (e) => !e.patient_id || patientIds.has(e.patient_id),
    ),
    sessions: (sessions.data ?? []).filter((s) => patientIds.has(s.patient_id)),
    patients: patients.data ?? [],
    treatments: liveTreatments,
    installments: (installments.data ?? []).filter((i) =>
      liveTreatmentIds.has(i.treatment_id),
    ),
    devices: devices.data ?? [],
    settings: settings.data,
    bands: bands.data ?? [],
  }
}
