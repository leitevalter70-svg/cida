import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

const USER_ID = "4b7e7c1a-65fa-47b4-bec2-3f0b762a39ff"

if (process.env.CONFIRM_DEMO_SEED !== "1") {
  console.error(
    "ABORTADO: seed apaga só pacientes fictícios, mas exige confirmação.\n" +
      "Rode com CONFIRM_DEMO_SEED=1 se realmente quiser popular dados de teste.",
  )
  process.exit(1)
}

function loadEnv() {
  const env = {}
  const raw = readFileSync(resolve(".env.local"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue
    const i = line.indexOf("=")
    env[line.slice(0, i)] = line.slice(i + 1)
  }
  return env
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function split({
  gross,
  clinicPct = 30,
  cardPct = 3.5,
  method,
  baseMode = "without_fee",
  shares = false,
}) {
  const applies = ["debito", "credito"].includes(method)
  const cardFeeAmount = applies ? round2((gross * cardPct) / 100) : 0
  const netAfterCard = round2(gross - cardFeeAmount)
  const clinicBaseAmount = baseMode === "with_fee" ? netAfterCard : gross
  const clinicGrossShare = round2((clinicBaseAmount * clinicPct) / 100)
  const professionalGrossShare = round2(gross - clinicGrossShare)
  let clinicFeeShare = 0
  let professionalFeeShare = 0
  if (cardFeeAmount > 0) {
    if (shares) {
      clinicFeeShare = round2((cardFeeAmount * clinicPct) / 100)
      professionalFeeShare = round2(cardFeeAmount - clinicFeeShare)
    } else {
      professionalFeeShare = cardFeeAmount
    }
  }
  return {
    card_fee_amount: cardFeeAmount,
    clinic_base_amount: round2(clinicBaseAmount),
    clinic_gross_share: clinicGrossShare,
    professional_gross_share: professionalGrossShare,
    clinic_fee_share: clinicFeeShare,
    professional_fee_share: professionalFeeShare,
    clinic_net_amount: round2(clinicGrossShare - clinicFeeShare),
    professional_net_amount: round2(professionalGrossShare - professionalFeeShare),
  }
}

function d(offset) {
  const x = new Date()
  x.setDate(x.getDate() + offset)
  return x.toISOString().slice(0, 10)
}

const patientsSeed = [
  {
    full_name: "Ana Paula Ferreira",
    birth_date: "1985-03-12",
    age_years: 41,
    sex: "feminino",
    phone: "(11) 98811-1001",
    email: "ana.ferreira@email.com",
    complaint_focus: "Incontinência urinária de esforço",
    status: "em_tratamento",
  },
  {
    full_name: "Beatriz Campos Lima",
    birth_date: "1990-07-22",
    age_years: 35,
    sex: "feminino",
    phone: "(11) 98811-1002",
    email: "beatriz.lima@email.com",
    complaint_focus: "Incontinência urinária mista",
    status: "em_tratamento",
  },
  {
    full_name: "Camila Souza Rocha",
    birth_date: "1978-11-05",
    age_years: 47,
    sex: "feminino",
    phone: "(11) 98811-1003",
    email: "camila.rocha@email.com",
    complaint_focus: "Prolapso de órgãos pélvicos",
    status: "em_tratamento",
  },
  {
    full_name: "Daniela Martins Alves",
    birth_date: "1988-01-18",
    age_years: 38,
    sex: "feminino",
    phone: "(11) 98811-1004",
    email: "daniela.alves@email.com",
    complaint_focus: "Incontinência urinária de urgência",
    status: "ativo",
  },
  {
    full_name: "Eduarda Ribeiro Nunes",
    birth_date: "1995-09-30",
    age_years: 30,
    sex: "feminino",
    phone: "(11) 98811-1005",
    email: "eduarda.nunes@email.com",
    complaint_focus: "Dor pélvica crônica",
    status: "em_tratamento",
  },
  {
    full_name: "Fernanda Oliveira Dias",
    birth_date: "1982-04-08",
    age_years: 44,
    sex: "feminino",
    phone: "(11) 98811-1006",
    email: "fernanda.dias@email.com",
    complaint_focus: "Incontinência urinária pós-parto",
    status: "alta",
  },
  {
    full_name: "Gabriela Pinto Mendes",
    birth_date: "1993-12-14",
    age_years: 32,
    sex: "feminino",
    phone: "(11) 98811-1007",
    email: "gabriela.mendes@email.com",
    complaint_focus: "Disfunção do assoalho pélvico",
    status: "em_tratamento",
  },
  {
    full_name: "Helena Costa Barbosa",
    birth_date: "1975-06-25",
    age_years: 50,
    sex: "feminino",
    phone: "(11) 98811-1008",
    email: "helena.barbosa@email.com",
    complaint_focus: "Incontinência urinária de esforço",
    status: "em_tratamento",
  },
  {
    full_name: "Isabela Freitas Gomes",
    birth_date: "1998-02-03",
    age_years: 28,
    sex: "feminino",
    phone: "(11) 98811-1009",
    email: "isabela.gomes@email.com",
    complaint_focus: "Incontinência urinária mista",
    status: "ativo",
  },
  {
    full_name: "Juliana Azevedo Prado",
    birth_date: "1987-08-19",
    age_years: 38,
    sex: "feminino",
    phone: "(11) 98811-1010",
    email: "juliana.prado@email.com",
    complaint_focus: "Reabilitação pós-cirúrgica pélvica",
    status: "alta",
  },
]

const protocols = [
  "Protocolo IU esforço 10 sessões",
  "Protocolo IU mista",
  "Protocolo POP",
  "Protocolo urgência",
  "Protocolo dor pélvica",
  "Protocolo pós-parto",
  "Protocolo assoalho pélvico",
  "Protocolo IU esforço",
  "Avulso avaliação",
  "Protocolo pós-cirúrgico",
]
const kinds = [
  "pacote",
  "pacote",
  "pacote",
  "pacote",
  "pacote",
  "pacote",
  "pacote",
  "pacote",
  "avulso",
  "pacote",
]
const planned = [10, 10, 8, 8, 10, 10, 10, 10, 1, 8]
const totals = [1800, 2000, 1600, 1500, 1900, 1700, 1850, 1800, 220, 1600]
const statuses = [
  "ativo",
  "ativo",
  "ativo",
  "ativo",
  "ativo",
  "concluido",
  "ativo",
  "ativo",
  "ativo",
  "concluido",
]
const methods = [
  "pix",
  "credito",
  "debito",
  "dinheiro",
  "pix",
  "credito",
  "pix",
  "debito",
  "pix",
  "credito",
]
const deviceSlugs = [
  "biofeedback_emg",
  "eletroestimulacao",
  "biofeedback_manometrico",
  "combinado",
  "sem_aparelho",
]

async function main() {
  const env = loadEnv()
  const sb = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data: devices } = await sb
    .from("device_catalog")
    .select("id,slug")
    .eq("user_id", USER_ID)
  const { data: cats } = await sb
    .from("expense_categories")
    .select("id,name")
    .eq("user_id", USER_ID)

  const deviceBySlug = Object.fromEntries((devices || []).map((x) => [x.slug, x.id]))
  const catByName = Object.fromEntries((cats || []).map((x) => [x.name, x.id]))

  const { data: existing } = await sb
    .from("patients")
    .select("id")
    .eq("user_id", USER_ID)
    .ilike("notes", "%ficticia para testes%")

  if (existing?.length) {
    const ids = existing.map((p) => p.id)
    console.log(`Removendo ${ids.length} pacientes ficticios anteriores...`)
    await sb.from("revenues").delete().in("patient_id", ids)
    await sb.from("expenses").delete().in("patient_id", ids)
    await sb.from("sessions").delete().in("patient_id", ids)
    await sb.from("treatments").delete().in("patient_id", ids)
    await sb.from("patients").delete().in("id", ids)
  }

  // Also clear seed expenses without patient
  await sb
    .from("expenses")
    .delete()
    .eq("user_id", USER_ID)
    .ilike("description", "%(seed)%")

  const patients = patientsSeed.map((p) => ({
    ...p,
    user_id: USER_ID,
    notes: "Paciente ficticia para testes",
  }))

  const { data: inserted, error: pErr } = await sb
    .from("patients")
    .insert(patients)
    .select("id,full_name")
  if (pErr) throw pErr
  console.log("Pacientes:", inserted.length)

  const treatments = inserted.map((p, i) => ({
    user_id: USER_ID,
    patient_id: p.id,
    kind: kinds[i],
    protocol_name: protocols[i],
    planned_sessions: planned[i],
    total_amount: totals[i],
    installment_count: kinds[i] === "pacote" ? 4 : 1,
    status: statuses[i],
    started_at: d(-40 + i * 2),
    completed_at: statuses[i] === "concluido" ? d(-5) : null,
  }))

  const { data: tr, error: tErr } = await sb
    .from("treatments")
    .insert(treatments)
    .select(
      "id,patient_id,kind,total_amount,installment_count,planned_sessions,status",
    )
  if (tErr) throw tErr

  const installments = []
  for (const t of tr) {
    const n = t.installment_count
    const amt = round2(Number(t.total_amount) / n)
    for (let s = 1; s <= n; s++) {
      const paid = s <= Math.ceil(n / 2) || t.status === "concluido"
      installments.push({
        user_id: USER_ID,
        treatment_id: t.id,
        sequence_number: s,
        amount:
          s === n
            ? round2(Number(t.total_amount) - amt * (n - 1))
            : amt,
        due_date: d(-30 + s * 7),
        status: paid ? "paga" : s === n ? "atrasada" : "pendente",
        paid_at: paid ? d(-28 + s * 7) : null,
      })
    }
  }

  const { data: inst, error: iErr } = await sb
    .from("installments")
    .insert(installments)
    .select("id,treatment_id,sequence_number,amount,status,paid_at")
  if (iErr) throw iErr

  const sessions = []
  const sessionMeta = []
  for (let i = 0; i < tr.length; i++) {
    const t = tr[i]
    const done =
      t.status === "concluido"
        ? t.planned_sessions
        : Math.min(t.planned_sessions, 3 + (i % 4))
    for (let s = 0; s < done; s++) {
      const scale = Math.min(
        5,
        Math.max(1, 2 + Math.floor((s * 3) / Math.max(1, done - 1)) + (i % 2)),
      )
      const date = d(-35 + i + s * 4)
      sessions.push({
        user_id: USER_ID,
        patient_id: t.patient_id,
        treatment_id: t.id,
        session_date: date,
        daily_complaint: "Queixa do dia — paciente ficticia",
        procedures_done: "Exercicios de assoalho pelvico + biofeedback",
        patient_response: "Boa adesao no encontro",
        evolution_scale: scale,
        access_route:
          i % 3 === 0
            ? "sonda_vaginal"
            : i % 3 === 1
              ? "eletrodo_superficie"
              : "nao_aplicavel",
        device_notes: "Uso de aparelho conforme protocolo",
        next_step: "Manter home training",
      })
      sessionMeta.push({ deviceSlug: deviceSlugs[i % deviceSlugs.length] })
    }
  }

  const { data: sess, error: sErr } = await sb
    .from("sessions")
    .insert(sessions)
    .select("id")
  if (sErr) throw sErr

  const sessionDevices = []
  for (let i = 0; i < sess.length; i++) {
    const deviceId =
      deviceBySlug[sessionMeta[i].deviceSlug] ||
      deviceBySlug.biofeedback_emg ||
      devices?.[0]?.id
    if (deviceId) {
      sessionDevices.push({
        session_id: sess[i].id,
        device_id: deviceId,
        notes: "Seed dashboard",
      })
    }
  }
  if (sessionDevices.length) {
    const { error: sdErr } = await sb
      .from("session_devices")
      .insert(sessionDevices)
    if (sdErr) throw sdErr
  }

  const revenues = []
  for (let i = 0; i < tr.length; i++) {
    const t = tr[i]
    const paid = inst.filter(
      (x) => x.treatment_id === t.id && x.status === "paga",
    )
    for (let j = 0; j < paid.length; j++) {
      const method = methods[(i + j) % methods.length]
      const baseMode = j % 2 === 0 ? "without_fee" : "with_fee"
      const shares = j % 3 === 0
      const calc = split({
        gross: Number(paid[j].amount),
        method,
        baseMode,
        shares,
      })
      revenues.push({
        user_id: USER_ID,
        patient_id: t.patient_id,
        treatment_id: t.id,
        installment_id: paid[j].id,
        revenue_date: paid[j].paid_at || d(-20 + i + j),
        description: `Parcela ${j + 1} — ${inserted[i].full_name}`,
        gross_amount: Number(paid[j].amount),
        payment_method: method,
        clinic_percent: 30,
        card_fee_percent: 3.5,
        clinic_base_mode: baseMode,
        clinic_shares_card_fee: shares,
        ...calc,
      })
    }
  }

  const { error: rErr } = await sb.from("revenues").insert(revenues)
  if (rErr) throw rErr

  const expenses = [
    {
      user_id: USER_ID,
      category_id: catByName["Materiais descartáveis"] || null,
      patient_id: null,
      expense_date: d(-12),
      description: "Luvas e sondas (seed)",
      amount: 180,
    },
    {
      user_id: USER_ID,
      category_id: catByName["Taxas da clínica"] || null,
      patient_id: null,
      expense_date: d(-8),
      description: "Rateio sala clinica julho (seed)",
      amount: 650,
    },
    {
      user_id: USER_ID,
      category_id: catByName["Material de consumo"] || null,
      patient_id: inserted[0].id,
      expense_date: d(-3),
      description: "Kit paciente Ana (seed)",
      amount: 45,
    },
  ]

  const { error: eErr } = await sb.from("expenses").insert(expenses)
  if (eErr) throw eErr

  console.log("OK seed dashboard")
  console.log({
    patients: inserted.length,
    treatments: tr.length,
    installments: inst.length,
    sessions: sess.length,
    revenues: revenues.length,
    expenses: expenses.length,
  })
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
