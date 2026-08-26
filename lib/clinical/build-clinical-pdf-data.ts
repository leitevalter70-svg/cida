import { adherencePercent } from "@/lib/clinical/chance"
import {
  complaintLabel,
  isGenericOutroComplaint,
  resolveDisplayComplaint,
} from "@/lib/clinical/complaints"
import type { ClinicalPdfData } from "@/lib/clinical/report-export"
import {
  describePatientComplaint,
  mergeAnamnese,
} from "@/lib/clinical/urogineco"
import { formatData } from "@/lib/format"
import {
  formatCrefitoLine,
  resolveCredentials,
  type ProfessionalCredentials,
} from "@/lib/professional"

const SEX_LABELS: Record<string, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  outro: "Outro",
  nao_informado: "Não informado",
}

const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo",
  em_tratamento: "Em tratamento",
  alta: "Alta",
  inativo: "Inativo",
}

const ACCESS_LABELS: Record<string, string> = {
  sonda_vaginal: "Sonda vaginal",
  sonda_anal: "Sonda anal",
  eletrodo_superficie: "Eletrodo de superfície",
  outro: "Outro",
  nao_aplicavel: "Não aplicável",
}

export type ClinicalPdfPatient = {
  full_name: string
  age_years: number | null
  sex: string | null
  phone: string | null
  email: string | null
  notes: string | null
  status: string | null
  complaint_focus: string | null
}

export type ClinicalPdfReportRow = {
  synthesis_text: string | null
  maintenance_guidance: string | null
  complaint_focus: string | null
  treatment_period_start: string | null
  treatment_period_end: string | null
  sessions_planned: number | null
  chance_summary: string | null
  devices_summary: string | null
}

export type ClinicalPdfSessionRow = {
  session_date: string
  evolution_scale: number | null
  daily_complaint: string | null
  procedures_done: string | null
  access_route: string | null
  device_notes: string | null
  patient_response: string | null
  next_step: string | null
  session_devices?:
    | { device_catalog: { name: string } | null }[]
    | null
}

/**
 * Monta o payload de PDF/Word do relatório clínico —
 * mesma lógica usada em /relatorios/clinico/[treatmentId].
 */
export function buildClinicalPdfData(input: {
  patient: ClinicalPdfPatient
  protocolName: string
  plannedSessions: number
  report: ClinicalPdfReportRow
  sessions: ClinicalPdfSessionRow[]
  anamnese: unknown | null
  reportDefaults: {
    professional_name?: string | null
    crefito?: string | null
    disclaimer_text?: string | null
  } | null
  credentials?: ProfessionalCredentials
}): ClinicalPdfData {
  const {
    patient,
    protocolName,
    plannedSessions,
    report,
    sessions,
    anamnese,
    reportDefaults,
  } = input

  const credentials =
    input.credentials ?? resolveCredentials(reportDefaults)

  const anamneseComplaint = anamnese
    ? describePatientComplaint(
        {
          full_name: patient.full_name,
          age_years: patient.age_years,
          sex: patient.sex,
          complaint_focus: patient.complaint_focus,
          notes: patient.notes,
        },
        mergeAnamnese(anamnese),
      )
    : null

  const sessionComplaintFallbacks = sessions
    .map((s) => s.daily_complaint)
    .filter(
      (c): c is string => !!c?.trim() && !isGenericOutroComplaint(c),
    )

  const complaint = resolveDisplayComplaint(
    report.complaint_focus,
    patient.complaint_focus,
    anamneseComplaint &&
      anamneseComplaint !== "queixa a esclarecer na evolução clínica"
      ? anamneseComplaint
      : null,
    patient.notes,
    ...sessionComplaintFallbacks,
    protocolName,
  )

  const firstSessionDate = sessions[0]?.session_date ?? null
  const lastSessionDate =
    sessions.length > 0 ? sessions[sessions.length - 1].session_date : null
  const periodStartRaw = firstSessionDate || report.treatment_period_start
  const periodEndRaw = lastSessionDate || report.treatment_period_end

  const sessionsDone = sessions.length
  const sessionsPlanned = Number(
    report.sessions_planned ?? plannedSessions ?? 0,
  )
  const adherence = adherencePercent(sessionsDone, sessionsPlanned)

  const scales = sessions
    .map((s) =>
      s.evolution_scale != null ? Number(s.evolution_scale) : null,
    )
    .filter((s): s is number => s != null)
  const scaleStart = scales[0] ?? null
  const scaleEnd = scales.length ? scales[scales.length - 1] : null

  const deviceCounts = new Map<string, number>()
  sessions.forEach((s) => {
    const devices = s.session_devices ?? null
    devices?.forEach((d) => {
      const name = d.device_catalog?.name
      if (name) deviceCounts.set(name, (deviceCounts.get(name) || 0) + 1)
    })
  })
  const devicesSummary =
    deviceCounts.size === 0
      ? report.devices_summary || "Sem aparelhos eletrônicos registrados"
      : Array.from(deviceCounts.entries())
          .map(
            ([name, count]) =>
              `${name} em ${count} de ${sessionsDone} sessões`,
          )
          .join("; ")

  const chanceSummaryText =
    report.chance_summary?.replace(
      /Adesão neste (tratamento|percurso): [\d.,]+%/,
      `Adesão neste tratamento: ${adherence}%`,
    ) || `Adesão neste tratamento: ${adherence}%.`

  const pdfSessions = sessions.map((s) => {
    const deviceNames =
      s.session_devices
        ?.map((d) => d.device_catalog?.name)
        .filter((n): n is string => Boolean(n)) ?? []
    const access =
      s.access_route && s.access_route !== "nao_aplicavel"
        ? ACCESS_LABELS[s.access_route] || s.access_route
        : null
    return {
      date: formatData(s.session_date),
      scale: s.evolution_scale != null ? Number(s.evolution_scale) : null,
      complaint: (() => {
        const raw =
          complaintLabel(s.daily_complaint) || s.daily_complaint
        if (!raw || isGenericOutroComplaint(raw)) return null
        return raw
      })(),
      procedures: s.procedures_done,
      devices: deviceNames,
      accessRoute: access,
      deviceNotes: s.device_notes,
      patientResponse: s.patient_response,
      nextStep: s.next_step,
    }
  })

  return {
    patientName: patient.full_name,
    age: patient.age_years,
    sex: patient.sex ? SEX_LABELS[patient.sex] || patient.sex : null,
    phone: patient.phone,
    email: patient.email,
    patientNotes: patient.notes,
    patientStatus: patient.status
      ? STATUS_LABELS[patient.status] || patient.status
      : null,
    protocolName,
    complaint,
    periodStart: periodStartRaw ? formatData(periodStartRaw) : null,
    periodEnd: periodEndRaw ? formatData(periodEndRaw) : null,
    sessionsPlanned,
    sessionsDone,
    adherence,
    scaleStart,
    scaleEnd,
    devicesSummary,
    chanceSummary: chanceSummaryText,
    synthesis: report.synthesis_text,
    maintenance: report.maintenance_guidance,
    disclaimer:
      reportDefaults?.disclaimer_text ||
      "Estimativa populacional; não é garantia de cura.",
    professionalName: credentials.professionalName,
    crefitoLine: formatCrefitoLine(credentials.crefito),
    sessions: pdfSessions,
  }
}
