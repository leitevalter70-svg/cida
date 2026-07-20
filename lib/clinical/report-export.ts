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
}

/** Compact one-line summary for a session (UI + PDF + Word). */
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
