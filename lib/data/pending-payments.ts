import { addWeeks, format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { todayISO } from "@/lib/format"

export type PendingPaymentAlertItem = {
  installmentId: string
  treatmentId: string
  patientId: string
  patientName: string
  protocolName: string
  sequenceNumber: number
  installmentCount: number
  amount: number
  dueDate: string | null
  urgency: "atrasada" | "hoje" | "semana" | "pendente"
}

/** Vencimento semanal a partir do início do tratamento (parcela 1 = início). */
export function weeklyDueDate(startedAt: string, sequenceNumber: number) {
  const base = parseISO(startedAt)
  return format(addWeeks(base, Math.max(0, sequenceNumber - 1)), "yyyy-MM-dd")
}

function urgencyFor(
  dueDate: string | null,
  status: string,
  today: string,
): PendingPaymentAlertItem["urgency"] {
  if (status === "atrasada") return "atrasada"
  if (!dueDate) return "pendente"
  if (dueDate < today) return "atrasada"
  if (dueDate === today) return "hoje"
  const inSeven = format(addWeeks(parseISO(today), 1), "yyyy-MM-dd")
  if (dueDate <= inSeven) return "semana"
  return "pendente"
}

/**
 * Próxima parcela em aberto por tratamento ativo.
 * Prioriza atrasadas / vencendo hoje / na semana (PIX/dinheiro semanal ou por sessão).
 */
export async function fetchPendingPaymentAlerts(): Promise<
  PendingPaymentAlertItem[]
> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const today = todayISO()

  const [{ data: treatments }, { data: installments }, { data: patients }] =
    await Promise.all([
      supabase
        .from("treatments")
        .select(
          "id, patient_id, protocol_name, installment_count, status, started_at",
        )
        .eq("user_id", user.id)
        .eq("kind", "pacote")
        .eq("status", "ativo"),
      supabase
        .from("installments")
        .select(
          "id, treatment_id, sequence_number, amount, due_date, status",
        )
        .eq("user_id", user.id)
        .neq("status", "paga")
        .order("sequence_number", { ascending: true }),
      supabase.from("patients").select("id, full_name").eq("user_id", user.id),
    ])

  const patientMap = new Map(
    (patients ?? []).map((p) => [p.id, p.full_name as string]),
  )
  const activeTreatments = (treatments ?? []).filter((t) =>
    patientMap.has(t.patient_id),
  )
  const treatmentMap = new Map(activeTreatments.map((t) => [t.id, t]))

  const nextByTreatment = new Map<string, (typeof installments)[number]>()
  for (const inst of installments ?? []) {
    if (!treatmentMap.has(inst.treatment_id)) continue
    if (!nextByTreatment.has(inst.treatment_id)) {
      nextByTreatment.set(inst.treatment_id, inst)
    }
  }

  const weekLimit = format(addWeeks(parseISO(today), 1), "yyyy-MM-dd")
  const items: PendingPaymentAlertItem[] = []

  for (const [treatmentId, inst] of nextByTreatment) {
    const treatment = treatmentMap.get(treatmentId)!
    const dueDate =
      inst.due_date ||
      (treatment.started_at
        ? weeklyDueDate(treatment.started_at, inst.sequence_number)
        : null)
    const urgency = urgencyFor(dueDate, inst.status, today)

    // Só alertar o que já venceu, vence hoje ou nesta semana.
    if (urgency === "pendente") continue
    if (dueDate && dueDate > weekLimit) continue

    items.push({
      installmentId: inst.id,
      treatmentId,
      patientId: treatment.patient_id,
      patientName: patientMap.get(treatment.patient_id) || "Paciente",
      protocolName: treatment.protocol_name,
      sequenceNumber: inst.sequence_number,
      installmentCount: treatment.installment_count,
      amount: Number(inst.amount),
      dueDate,
      urgency,
    })
  }

  const order = { atrasada: 0, hoje: 1, semana: 2, pendente: 3 } as const
  return items.sort((a, b) => {
    const byUrgency = order[a.urgency] - order[b.urgency]
    if (byUrgency !== 0) return byUrgency
    return (a.dueDate || "").localeCompare(b.dueDate || "")
  })
}
