export type ClinicalPdfSession = {
  date: string
  scale: number | null
  complaint: string | null
  procedures: string | null
  devices: string[]
  accessRoute: string | null
  deviceNotes: string | null
  patientResponse: string | null
  nextStep: string | null
}

export type ClinicalPdfData = {
  patientName: string
  age: number | null
  sex: string | null
  phone: string | null
  email: string | null
  patientNotes: string | null
  patientStatus: string | null
  protocolName: string | null
  complaint: string | null
  periodStart: string | null
  periodEnd: string | null
  sessionsPlanned: number | null
  sessionsDone: number | null
  adherence: number | null
  scaleStart: number | null
  scaleEnd: number | null
  devicesSummary: string | null
  chanceSummary: string | null
  synthesis: string | null
  maintenance: string | null
  disclaimer: string
  professionalName: string
  crefitoLine: string
  sessions: ClinicalPdfSession[]
  /** Total de sessões do pacote quando `sessions` traz só as últimas. */
  sessionsTotal?: number
  /** Número da primeira sessão listada dentro do pacote (começa em 1). */
  sessionsFirstNumber?: number
}

/** Ex.: "12 sessões" ou "últimas 5 de 12 sessões". */
export function sessionsCountLabel(data: ClinicalPdfData): string {
  const shown = data.sessions.length
  const total = data.sessionsTotal ?? shown
  if (total > shown) return `últimas ${shown} de ${total} sessões`
  return `${shown} ${shown === 1 ? "sessão" : "sessões"}`
}

/** Limita às últimas `limit` sessões, mantendo a numeração do pacote. */
export function limitClinicalSessions(
  data: ClinicalPdfData,
  limit: number | null,
): ClinicalPdfData {
  const total = data.sessions.length
  if (!limit || limit >= total) return data
  return {
    ...data,
    sessions: data.sessions.slice(-limit),
    sessionsTotal: total,
    sessionsFirstNumber: total - limit + 1,
  }
}

/** Compact one-line summary for a session (web preview). */
export function formatSessionLine(
  index: number,
  s: ClinicalPdfSession,
): string {
  const parts: string[] = [`${index + 1}. ${s.date}`]
  if (s.scale != null) parts.push(`Esc. ${s.scale}`)
  if (s.complaint) parts.push(s.complaint)
  if (s.procedures) parts.push(s.procedures.replace(/\s+/g, " ").trim())
  if (s.devices.length > 0) parts.push(s.devices.join(", "))
  if (s.accessRoute) parts.push(s.accessRoute)
  if (s.patientResponse)
    parts.push(s.patientResponse.replace(/\s+/g, " ").trim())
  return parts.join(" · ")
}

export function clinicalReportFileBaseName(patientName: string) {
  return `relatorio-clinico-${patientName.replace(/\s+/g, "-").toLowerCase()}`
}
