"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { calculateSplit, isCardPayment } from "@/lib/finance/split"
import { adherencePercent } from "@/lib/clinical/chance"
import {
  computeSettledAt,
  DEFAULT_CREFITO,
  DEFAULT_PROFESSIONAL_NAME,
} from "@/lib/professional"
import type {
  ClinicBaseMode,
  PaymentMethod,
  PatientSex,
  PatientStatus,
  TreatmentKind,
} from "@/lib/types"

async function getUserId() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado (.env.local ausente). Nada foi gravado — reconecte antes de continuar.",
    )
  }
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error("Não autenticado")
  return { supabase, userId: user.id }
}

function normalizePatientName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}

function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, "")
}

function escapeIlike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

export type CreatePatientResult =
  | { ok: true; id: string }
  | { ok: false; existingId: string; existingName: string; reason: "nome" | "telefone" }

export async function createPatient(formData: FormData): Promise<CreatePatientResult> {
  const { supabase, userId } = await getUserId()
  const ageRaw = formData.get("age_years") as string
  const fullName = String(formData.get("full_name") || "").trim().replace(/\s+/g, " ")
  const phoneRaw = String(formData.get("phone") || "").trim()
  const phone = phoneRaw || null
  const phoneDigits = phone ? normalizePhoneDigits(phone) : ""

  if (!fullName) {
    throw new Error("Nome é obrigatório")
  }

  const { data: nameCandidates, error: nameError } = await supabase
    .from("patients")
    .select("id, full_name, phone")
    .eq("user_id", userId)
    .ilike("full_name", escapeIlike(fullName))

  if (nameError) throw new Error(nameError.message)

  const nameMatch = (nameCandidates ?? []).find(
    (p) => normalizePatientName(p.full_name) === normalizePatientName(fullName),
  )
  if (nameMatch) {
    return {
      ok: false,
      existingId: nameMatch.id,
      existingName: nameMatch.full_name,
      reason: "nome",
    }
  }

  if (phoneDigits.length >= 8) {
    const { data: phoneCandidates, error: phoneError } = await supabase
      .from("patients")
      .select("id, full_name, phone")
      .eq("user_id", userId)
      .not("phone", "is", null)

    if (phoneError) throw new Error(phoneError.message)

    const phoneMatch = (phoneCandidates ?? []).find(
      (p) =>
        p.phone &&
        normalizePhoneDigits(p.phone) === phoneDigits,
    )
    if (phoneMatch) {
      return {
        ok: false,
        existingId: phoneMatch.id,
        existingName: phoneMatch.full_name,
        reason: "telefone",
      }
    }
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      user_id: userId,
      full_name: fullName,
      birth_date: (formData.get("birth_date") as string) || null,
      age_years: ageRaw ? Number(ageRaw) : null,
      sex: (formData.get("sex") as PatientSex) || "nao_informado",
      phone,
      email: (formData.get("email") as string) || null,
      complaint_focus: (formData.get("complaint_focus") as string) || null,
      notes: (formData.get("notes") as string) || null,
      status: (formData.get("status") as PatientStatus) || "ativo",
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/pacientes")
  revalidatePath("/tratamentos")
  return { ok: true, id: data.id as string }
}

export async function updatePatient(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId()
  const ageRaw = formData.get("age_years") as string
  const { error } = await supabase
    .from("patients")
    .update({
      full_name: String(formData.get("full_name") || "").trim(),
      birth_date: (formData.get("birth_date") as string) || null,
      age_years: ageRaw ? Number(ageRaw) : null,
      sex: (formData.get("sex") as PatientSex) || "nao_informado",
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      complaint_focus: (formData.get("complaint_focus") as string) || null,
      notes: (formData.get("notes") as string) || null,
      status: (formData.get("status") as PatientStatus) || "ativo",
    })
    .eq("id", id)
    .eq("user_id", userId)
  if (error) throw new Error(error.message)
  revalidatePath("/pacientes")
  revalidatePath(`/pacientes/${id}`)
}

export async function updateTreatmentPlannedSessions(
  treatmentId: string,
  formData: FormData,
) {
  const { supabase, userId } = await getUserId()
  const plannedSessions = Math.max(
    1,
    Number(formData.get("planned_sessions") || 1),
  )

  const { data: treatment, error } = await supabase
    .from("treatments")
    .update({ planned_sessions: plannedSessions })
    .eq("id", treatmentId)
    .eq("user_id", userId)
    .select("id, patient_id")
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from("clinical_reports")
    .update({ sessions_planned: plannedSessions })
    .eq("treatment_id", treatmentId)
    .eq("user_id", userId)

  revalidatePath("/tratamentos")
  revalidatePath(`/pacientes/${treatment.patient_id}`)
  revalidatePath(`/relatorios/clinico/${treatmentId}`)
}

export async function deletePatient(id: string) {
  const { supabase, userId } = await getUserId()

  // Busca tratamentos para limpar receitas vinculadas mesmo se patient_id falhar
  const { data: treatments } = await supabase
    .from("treatments")
    .select("id")
    .eq("patient_id", id)
    .eq("user_id", userId)
  const treatmentIds = (treatments ?? []).map((t) => t.id)

  const { error: revByPatientError } = await supabase
    .from("revenues")
    .delete()
    .eq("patient_id", id)
    .eq("user_id", userId)
  if (revByPatientError) throw new Error(revByPatientError.message)

  if (treatmentIds.length > 0) {
    const { error: revByTreatmentError } = await supabase
      .from("revenues")
      .delete()
      .in("treatment_id", treatmentIds)
      .eq("user_id", userId)
    if (revByTreatmentError) throw new Error(revByTreatmentError.message)
  }

  const { error: expError } = await supabase
    .from("expenses")
    .delete()
    .eq("patient_id", id)
    .eq("user_id", userId)
  if (expError) throw new Error(expError.message)

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
  if (error) throw new Error(error.message)

  revalidatePath("/", "layout")
  revalidatePath("/pacientes")
  revalidatePath("/tratamentos")
  revalidatePath("/receitas")
  revalidatePath("/despesas")
  revalidatePath("/dashboard")
}

export async function createSession(formData: FormData) {
  const { supabase, userId } = await getUserId()
  const scaleRaw = formData.get("evolution_scale") as string
  const deviceIds = formData.getAll("device_ids").map(String)

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      patient_id: String(formData.get("patient_id")),
      treatment_id: (formData.get("treatment_id") as string) || null,
      session_date: String(formData.get("session_date")),
      daily_complaint: (formData.get("daily_complaint") as string) || null,
      procedures_done: (formData.get("procedures_done") as string) || null,
      patient_response: (formData.get("patient_response") as string) || null,
      evolution_scale: scaleRaw ? Number(scaleRaw) : null,
      access_route: (formData.get("access_route") as string) || "nao_aplicavel",
      device_notes: (formData.get("device_notes") as string) || null,
      next_step: (formData.get("next_step") as string) || null,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  if (deviceIds.length > 0) {
    const { error: devError } = await supabase.from("session_devices").insert(
      deviceIds.map((device_id) => ({
        session_id: session.id,
        device_id,
      })),
    )
    if (devError) throw new Error(devError.message)
  }

  const patientId = String(formData.get("patient_id"))
  revalidatePath(`/pacientes/${patientId}`)
  revalidatePath("/dashboard")
}

export async function createTreatment(formData: FormData) {
  const { supabase, userId } = await getUserId()
  const kind = (formData.get("kind") as TreatmentKind) || "pacote"
  const totalAmount = Number(formData.get("total_amount") || 0)
  const installmentCount = Math.max(1, Number(formData.get("installment_count") || 1))
  const plannedSessions = Math.max(1, Number(formData.get("planned_sessions") || 1))
  const patientId = String(formData.get("patient_id"))

  const { data: treatment, error } = await supabase
    .from("treatments")
    .insert({
      user_id: userId,
      patient_id: patientId,
      kind,
      protocol_name: String(formData.get("protocol_name") || "").trim(),
      planned_sessions: plannedSessions,
      total_amount: totalAmount,
      installment_count: kind === "pacote" ? installmentCount : 1,
      started_at: String(formData.get("started_at") || new Date().toISOString().slice(0, 10)),
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  if (kind === "pacote") {
    const each = Math.round((totalAmount / installmentCount) * 100) / 100
    const rows = Array.from({ length: installmentCount }, (_, i) => {
      const isLast = i === installmentCount - 1
      const amount = isLast
        ? Math.round((totalAmount - each * (installmentCount - 1)) * 100) / 100
        : each
      return {
        user_id: userId,
        treatment_id: treatment.id,
        sequence_number: i + 1,
        amount,
        status: "pendente" as const,
      }
    })
    const { error: instError } = await supabase.from("installments").insert(rows)
    if (instError) throw new Error(instError.message)
  }

  await supabase
    .from("patients")
    .update({ status: "em_tratamento" })
    .eq("id", patientId)
    .eq("user_id", userId)

  revalidatePath("/tratamentos")
  revalidatePath("/receitas")
  revalidatePath(`/pacientes/${patientId}`)
  return { id: treatment.id as string, patientId }
}

export async function createRevenue(formData: FormData) {
  const { supabase, userId } = await getUserId()
  const payload = await buildRevenuePayload(formData, userId, supabase)

  const { error } = await supabase.from("revenues").insert({
    user_id: userId,
    ...payload,
  })

  if (error) throw new Error(error.message)

  const installmentId = payload.installment_id || ""
  if (installmentId) {
    await supabase
      .from("installments")
      .update({ status: "paga", paid_at: new Date().toISOString().slice(0, 10) })
      .eq("id", installmentId)
      .eq("user_id", userId)
  }

  const patientId = payload.patient_id || ""
  revalidatePath("/receitas")
  revalidatePath("/dashboard")
  revalidatePath("/tratamentos")
  revalidatePath("/prestacao")
  if (patientId) revalidatePath(`/pacientes/${patientId}`)
}

export async function updateRevenue(revenueId: string, formData: FormData) {
  const { supabase, userId } = await getUserId()

  const { data: current, error: currentError } = await supabase
    .from("revenues")
    .select("id, installment_id, patient_id")
    .eq("id", revenueId)
    .eq("user_id", userId)
    .single()

  if (currentError || !current) {
    throw new Error(currentError?.message || "Receita não encontrada")
  }

  const payload = await buildRevenuePayload(formData, userId, supabase)
  const { error } = await supabase
    .from("revenues")
    .update(payload)
    .eq("id", revenueId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)

  const oldInstallmentId = current.installment_id || ""
  const newInstallmentId = payload.installment_id || ""

  if (oldInstallmentId && oldInstallmentId !== newInstallmentId) {
    await supabase
      .from("installments")
      .update({ status: "pendente", paid_at: null })
      .eq("id", oldInstallmentId)
      .eq("user_id", userId)
  }

  if (newInstallmentId) {
    await supabase
      .from("installments")
      .update({ status: "paga", paid_at: new Date().toISOString().slice(0, 10) })
      .eq("id", newInstallmentId)
      .eq("user_id", userId)
  }

  const patientId = payload.patient_id || current.patient_id || ""
  revalidatePath("/receitas")
  revalidatePath("/dashboard")
  revalidatePath("/tratamentos")
  revalidatePath("/prestacao")
  if (patientId) revalidatePath(`/pacientes/${patientId}`)
}

export async function deleteRevenue(revenueId: string) {
  const { supabase, userId } = await getUserId()

  const { data: current, error: currentError } = await supabase
    .from("revenues")
    .select("id, installment_id, patient_id")
    .eq("id", revenueId)
    .eq("user_id", userId)
    .single()

  if (currentError || !current) {
    throw new Error(currentError?.message || "Receita não encontrada")
  }

  const { error } = await supabase
    .from("revenues")
    .delete()
    .eq("id", revenueId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)

  if (current.installment_id) {
    await supabase
      .from("installments")
      .update({ status: "pendente", paid_at: null })
      .eq("id", current.installment_id)
      .eq("user_id", userId)
  }

  revalidatePath("/receitas")
  revalidatePath("/dashboard")
  revalidatePath("/tratamentos")
  revalidatePath("/prestacao")
  if (current.patient_id) revalidatePath(`/pacientes/${current.patient_id}`)
}

async function buildRevenuePayload(
  formData: FormData,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data: settings } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  const grossAmount = Number(formData.get("gross_amount") || 0)
  const paymentMethod = (formData.get("payment_method") as PaymentMethod) || "pix"
  const usesCard = isCardPayment(paymentMethod)
  const clinicPercent = Number(
    formData.get("clinic_percent") ?? settings?.clinic_percent ?? 30,
  )
  const cardFeePercent = usesCard
    ? Number(
        formData.get("card_fee_percent") ?? settings?.card_fee_percent ?? 3.5,
      )
    : 0
  const clinicBaseMode = usesCard
    ? ((formData.get("clinic_base_mode") as ClinicBaseMode) ||
        settings?.default_clinic_base_mode ||
        "without_fee")
    : "without_fee"
  const clinicSharesCardFee = usesCard
    ? formData.get("clinic_shares_card_fee") === "true" ||
      formData.get("clinic_shares_card_fee") === "on"
    : false

  const split = calculateSplit({
    grossAmount,
    clinicPercent,
    cardFeePercent,
    paymentMethod,
    clinicBaseMode,
    clinicSharesCardFee,
  })

  const revenueDate = String(formData.get("revenue_date"))
  const creditDays = Number(
    formData.get("card_credit_settlement_days") ??
      settings?.card_credit_settlement_days ??
      30,
  )
  const settledFromForm = formData.get("settled_at")
  const settledAt =
    settledFromForm && String(settledFromForm).trim()
      ? String(settledFromForm)
      : computeSettledAt(revenueDate, paymentMethod, creditDays)

  return {
    patient_id: (formData.get("patient_id") as string) || null,
    treatment_id: (formData.get("treatment_id") as string) || null,
    installment_id: (formData.get("installment_id") as string) || null,
    session_id: (formData.get("session_id") as string) || null,
    revenue_date: revenueDate,
    settled_at: settledAt,
    description: (formData.get("description") as string) || null,
    gross_amount: grossAmount,
    payment_method: paymentMethod,
    clinic_percent: clinicPercent,
    card_fee_percent: cardFeePercent,
    clinic_base_mode: clinicBaseMode,
    clinic_shares_card_fee: clinicSharesCardFee,
    card_fee_amount: split.cardFeeAmount,
    clinic_base_amount: split.clinicBaseAmount,
    clinic_gross_share: split.clinicGrossShare,
    professional_gross_share: split.professionalGrossShare,
    clinic_fee_share: split.clinicFeeShare,
    professional_fee_share: split.professionalFeeShare,
    clinic_net_amount: split.clinicNetAmount,
    professional_net_amount: split.professionalNetAmount,
  }
}

export async function createExpense(formData: FormData) {
  const { supabase, userId } = await getUserId()
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    category_id: (formData.get("category_id") as string) || null,
    patient_id: (formData.get("patient_id") as string) || null,
    expense_date: String(formData.get("expense_date")),
    description: String(formData.get("description") || "").trim(),
    amount: Number(formData.get("amount") || 0),
  })
  if (error) throw new Error(error.message)
  revalidatePath("/despesas")
  revalidatePath("/prestacao")
  revalidatePath("/dashboard")
}

export async function updateFinancialSettings(formData: FormData) {
  const { supabase, userId } = await getUserId()

  const { data: current } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  const clinicPercent = Number(formData.get("clinic_percent"))
  const cardFeePercent = Number(formData.get("card_fee_percent"))
  const defaultClinicBaseMode = formData.get(
    "default_clinic_base_mode",
  ) as ClinicBaseMode
  const defaultClinicSharesCardFee =
    formData.get("default_clinic_shares_card_fee") === "true" ||
    formData.get("default_clinic_shares_card_fee") === "on"
  const clinicalChanceIndicatorEnabled =
    formData.get("clinical_chance_indicator_enabled") === "true" ||
    formData.get("clinical_chance_indicator_enabled") === "on"
  const cardCreditSettlementDays = Number(
    formData.get("card_credit_settlement_days") ?? 30,
  )

  if (current) {
    const historyRows: {
      user_id: string
      field_name: string
      old_value: string
      new_value: string
    }[] = []

    if (Number(current.clinic_percent) !== clinicPercent) {
      historyRows.push({
        user_id: userId,
        field_name: "clinic_percent",
        old_value: String(current.clinic_percent),
        new_value: String(clinicPercent),
      })
    }
    if (Number(current.card_fee_percent) !== cardFeePercent) {
      historyRows.push({
        user_id: userId,
        field_name: "card_fee_percent",
        old_value: String(current.card_fee_percent),
        new_value: String(cardFeePercent),
      })
    }
    if (
      Number(current.card_credit_settlement_days ?? 30) !==
      cardCreditSettlementDays
    ) {
      historyRows.push({
        user_id: userId,
        field_name: "card_credit_settlement_days",
        old_value: String(current.card_credit_settlement_days ?? 30),
        new_value: String(cardCreditSettlementDays),
      })
    }
    if (historyRows.length) {
      await supabase.from("financial_settings_history").insert(historyRows)
    }
  }

  const { error } = await supabase.from("financial_settings").upsert(
    {
      user_id: userId,
      clinic_percent: clinicPercent,
      card_fee_percent: cardFeePercent,
      default_clinic_base_mode: defaultClinicBaseMode,
      default_clinic_shares_card_fee: defaultClinicSharesCardFee,
      clinical_chance_indicator_enabled: clinicalChanceIndicatorEnabled,
      card_credit_settlement_days: cardCreditSettlementDays,
    },
    { onConflict: "user_id" },
  )

  if (error) throw new Error(error.message)
  revalidatePath("/configuracoes")
  revalidatePath("/prestacao")
  revalidatePath("/receitas")
}

export async function updateReportDefaults(formData: FormData) {
  const { supabase, userId } = await getUserId()
  const { error } = await supabase.from("report_defaults").upsert(
    {
      user_id: userId,
      disclaimer_text: String(formData.get("disclaimer_text") || ""),
      maintenance_guidance_text: String(
        formData.get("maintenance_guidance_text") || "",
      ),
      professional_name:
        String(formData.get("professional_name") || "").trim() ||
        DEFAULT_PROFESSIONAL_NAME,
      crefito:
        String(formData.get("crefito") || "").trim() || DEFAULT_CREFITO,
    },
    { onConflict: "user_id" },
  )
  if (error) throw new Error(error.message)
  revalidatePath("/configuracoes")
  revalidatePath("/prestacao")
  revalidatePath("/receitas")
}

export async function upsertDevice(formData: FormData) {
  const { supabase, userId } = await getUserId()
  const id = formData.get("id") as string | null
  const name = String(formData.get("name") || "").trim()
  const slug =
    (formData.get("slug") as string) ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")

  if (id) {
    const { error } = await supabase
      .from("device_catalog")
      .update({
        name,
        description: (formData.get("description") as string) || null,
        is_active: formData.get("is_active") !== "false",
      })
      .eq("id", id)
      .eq("user_id", userId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from("device_catalog").insert({
      user_id: userId,
      name,
      slug,
      description: (formData.get("description") as string) || null,
      sort_order: 99,
    })
    if (error) throw new Error(error.message)
  }
  revalidatePath("/configuracoes")
}

export async function completeTreatment(treatmentId: string) {
  const { supabase, userId } = await getUserId()

  const { data: treatment, error: tError } = await supabase
    .from("treatments")
    .select("*, patients(*)")
    .eq("id", treatmentId)
    .eq("user_id", userId)
    .single()

  if (tError || !treatment) throw new Error(tError?.message || "Tratamento não encontrado")

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, session_devices(device_id, device_catalog(name))")
    .eq("patient_id", treatment.patient_id)
    .eq("user_id", userId)
    .or(`treatment_id.eq.${treatmentId},treatment_id.is.null`)
    .order("session_date", { ascending: true })

  const { data: defaults } = await supabase
    .from("report_defaults")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  const { data: bands } = await supabase
    .from("clinical_chance_bands")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)

  const patient = treatment.patients as {
    id: string
    full_name: string
    complaint_focus: string | null
    age_years: number | null
  }

  const done = sessions?.length ?? 0
  const planned = treatment.planned_sessions
  const adherence = adherencePercent(done, planned)

  const scales =
    sessions
      ?.map((s) =>
        s.evolution_scale != null ? Number(s.evolution_scale) : null,
      )
      .filter((s): s is number => s != null) ?? []
  const scaleStart = scales[0] ?? null
  const scaleEnd = scales.length ? scales[scales.length - 1] : null

  const deviceNames = new Map<string, number>()
  sessions?.forEach((s) => {
    const devices = s.session_devices as
      | { device_catalog: { name: string } | null }[]
      | null
    devices?.forEach((d) => {
      const name = d.device_catalog?.name
      if (name) deviceNames.set(name, (deviceNames.get(name) || 0) + 1)
    })
  })

  const devicesSummary =
    deviceNames.size === 0
      ? "Sem aparelhos eletrônicos registrados"
      : Array.from(deviceNames.entries())
          .map(([name, count]) => `${name} em ${count} de ${done} sessões`)
          .join("; ")

  const complaint = patient.complaint_focus || "IUE"
  const band =
    bands?.find(
      (b) =>
        b.complaint_type.toLowerCase() === complaint.toLowerCase() ||
        complaint.toLowerCase().includes(b.complaint_type.toLowerCase()),
    ) || bands?.[0]

  const min = band?.cure_or_improve_min_percent ?? 55
  const max = band?.cure_or_improve_max_percent ?? 74
  const chanceSummary = `Com adesão correta, a literatura aponta cerca de ${min}–${max}% de cura ou melhora. Adesão neste tratamento: ${adherence}%.`

  await supabase
    .from("treatments")
    .update({
      status: "concluido",
      completed_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", treatmentId)
    .eq("user_id", userId)

  await supabase
    .from("patients")
    .update({ status: "alta" })
    .eq("id", patient.id)
    .eq("user_id", userId)

  const firstSessionDate = sessions?.[0]?.session_date ?? null
  const lastSessionDate =
    sessions && sessions.length > 0
      ? sessions[sessions.length - 1].session_date
      : null

  const { data: report, error: rError } = await supabase
    .from("clinical_reports")
    .upsert(
      {
        user_id: userId,
        patient_id: patient.id,
        treatment_id: treatmentId,
        synthesis_text: null,
        maintenance_guidance:
          defaults?.maintenance_guidance_text ??
          "Continue os exercícios em casa conforme orientação.",
        adherence_percent: adherence,
        sessions_planned: planned,
        sessions_done: done,
        scale_start: scaleStart,
        scale_end: scaleEnd,
        devices_summary: devicesSummary,
        chance_summary: chanceSummary,
        complaint_focus: complaint,
        treatment_period_start: firstSessionDate,
        treatment_period_end: lastSessionDate,
      },
      { onConflict: "treatment_id" },
    )
    .select("id")
    .single()

  if (rError) throw new Error(rError.message)

  revalidatePath("/tratamentos")
  revalidatePath(`/pacientes/${patient.id}`)
  return report.id as string
}

export async function updateClinicalReport(reportId: string, formData: FormData) {
  const { supabase, userId } = await getUserId()
  const { error } = await supabase
    .from("clinical_reports")
    .update({
      synthesis_text: (formData.get("synthesis_text") as string) || null,
      maintenance_guidance:
        (formData.get("maintenance_guidance") as string) || null,
    })
    .eq("id", reportId)
    .eq("user_id", userId)
  if (error) throw new Error(error.message)
  revalidatePath(`/relatorios/clinico/${formData.get("treatment_id")}`)
}
