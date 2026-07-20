import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { ClinicalReportEditor } from "@/components/forms/clinical-report-editor"
import {
  DownloadClinicalPdfButton,
  DownloadClinicalWordButton,
} from "@/components/clinical-pdf"
import {
  formatSessionLine,
  type ClinicalPdfData,
} from "@/lib/clinical/report-export"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhysioSymbol } from "@/components/physio-symbol"
import { formatData } from "@/lib/format"
import { EvolutionChart } from "@/components/evolution-chart"
import { complaintLabel } from "@/lib/clinical/complaints"
import { adherencePercent } from "@/lib/clinical/chance"
import {
  formatCrefitoLine,
  resolveCredentials,
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

export default async function RelatorioClinicoPage({
  params,
}: {
  params: Promise<{ treatmentId: string }>
}) {
  const { treatmentId } = await params

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-4">
        <SetupNotice />
      </div>
    )
  }

  const supabase = await createClient()

  const { data: treatment } = await supabase
    .from("treatments")
    .select("*, patients(*)")
    .eq("id", treatmentId)
    .single()

  if (!treatment) notFound()

  let { data: report } = await supabase
    .from("clinical_reports")
    .select("*")
    .eq("treatment_id", treatmentId)
    .maybeSingle()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, session_devices(device_catalog(name))")
    .eq("patient_id", treatment.patient_id)
    .or(`treatment_id.eq.${treatmentId},treatment_id.is.null`)
    .order("session_date", { ascending: true })

  const { data: defaults } = await supabase
    .from("report_defaults")
    .select("*")
    .maybeSingle()

  if (!report) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Relatório ainda não gerado. Conclua o tratamento em{" "}
          <Link href="/tratamentos" className="text-primary underline">
            Tratamentos
          </Link>{" "}
          com “Alta + relatório clínico”.
        </p>
      </div>
    )
  }

  const patient = treatment.patients as {
    full_name: string
    age_years: number | null
    sex: string | null
    phone: string | null
    email: string | null
    notes: string | null
    status: string | null
    complaint_focus: string | null
  }

  const chartData =
    sessions
      ?.filter((s) => s.evolution_scale != null)
      .map((s) => ({
        date: formatData(s.session_date),
        escala: Number(s.evolution_scale),
      })) ?? []

  const complaint =
    complaintLabel(report.complaint_focus) || report.complaint_focus

  const firstSessionDate = sessions?.[0]?.session_date ?? null
  const lastSessionDate =
    sessions && sessions.length > 0
      ? sessions[sessions.length - 1].session_date
      : null
  const periodStartRaw = firstSessionDate || report.treatment_period_start
  const periodEndRaw = lastSessionDate || report.treatment_period_end

  const sessionsDone = sessions?.length ?? 0
  const sessionsPlanned = Number(
    report.sessions_planned ?? treatment.planned_sessions ?? 0,
  )
  const adherence = adherencePercent(sessionsDone, sessionsPlanned)

  const scales =
    sessions
      ?.map((s) =>
        s.evolution_scale != null ? Number(s.evolution_scale) : null,
      )
      .filter((s): s is number => s != null) ?? []
  const scaleStart = scales[0] ?? null
  const scaleEnd = scales.length ? scales[scales.length - 1] : null

  const deviceCounts = new Map<string, number>()
  sessions?.forEach((s) => {
    const devices = s.session_devices as
      | { device_catalog: { name: string } | null }[]
      | null
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
    ) ||
    `Adesão neste tratamento: ${adherence}%.`

  const credentials = resolveCredentials(defaults)

  const pdfSessions =
    sessions?.map((s) => {
      const deviceNames =
        (s.session_devices as { device_catalog: { name: string } }[])
          ?.map((d) => d.device_catalog?.name)
          .filter(Boolean) ?? []
      const access =
        s.access_route && s.access_route !== "nao_aplicavel"
          ? ACCESS_LABELS[s.access_route] || s.access_route
          : null
      return {
        date: formatData(s.session_date),
        scale:
          s.evolution_scale != null ? Number(s.evolution_scale) : null,
        complaint:
          complaintLabel(s.daily_complaint) ||
          (s.daily_complaint as string | null),
        procedures: s.procedures_done as string | null,
        devices: deviceNames as string[],
        accessRoute: access,
        deviceNotes: s.device_notes as string | null,
        patientResponse: s.patient_response as string | null,
        nextStep: s.next_step as string | null,
      }
    }) ?? []

  const pdfData: ClinicalPdfData = {
    patientName: patient.full_name,
    age: patient.age_years,
    sex: patient.sex ? SEX_LABELS[patient.sex] || patient.sex : null,
    phone: patient.phone,
    email: patient.email,
    patientNotes: patient.notes,
    patientStatus: patient.status
      ? STATUS_LABELS[patient.status] || patient.status
      : null,
    protocolName: treatment.protocol_name,
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
      defaults?.disclaimer_text ||
      "Estimativa populacional; não é garantia de cura.",
    professionalName: credentials.professionalName,
    crefitoLine: formatCrefitoLine(credentials.crefito),
    sessions: pdfSessions,
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div>
        <Link
          href={`/pacientes/${treatment.patient_id}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Voltar à ficha
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <PhysioSymbol className="size-7" solid />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              Fisioterapia
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Relatório clínico
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{patient.full_name}</Badge>
              <Badge variant="outline">{treatment.protocol_name}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Dados da paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p>
              <span className="text-muted-foreground">Nome:</span>{" "}
              {patient.full_name}
            </p>
            {patient.age_years != null && (
              <p>
                <span className="text-muted-foreground">Idade:</span>{" "}
                {patient.age_years} anos
              </p>
            )}
            {patient.sex && (
              <p>
                <span className="text-muted-foreground">Sexo:</span>{" "}
                {SEX_LABELS[patient.sex] || patient.sex}
              </p>
            )}
            {patient.phone && (
              <p>
                <span className="text-muted-foreground">Telefone:</span>{" "}
                {patient.phone}
              </p>
            )}
            {patient.email && (
              <p>
                <span className="text-muted-foreground">E-mail:</span>{" "}
                {patient.email}
              </p>
            )}
            {patient.status && (
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {STATUS_LABELS[patient.status] || patient.status}
              </p>
            )}
            {complaint && (
              <p>
                <span className="text-muted-foreground">Queixa / foco:</span>{" "}
                {complaint}
              </p>
            )}
            {patient.notes && (
              <p>
                <span className="text-muted-foreground">Observações:</span>{" "}
                {patient.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Resumo do tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Período:{" "}
              {periodStartRaw ? formatData(periodStartRaw) : "—"} a{" "}
              {periodEndRaw ? formatData(periodEndRaw) : "—"}
            </p>
            <p>
              Sessões: {sessionsDone}/{sessionsPlanned} · Adesão {adherence}%
            </p>
            <p>
              Escala: {scaleStart ?? "—"} → {scaleEnd ?? "—"}
            </p>
            <p className="text-muted-foreground">{devicesSummary}</p>
            <p className="rounded-lg bg-secondary/50 p-3 text-xs">
              {chanceSummaryText}
            </p>
            <EvolutionChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico das sessões</CardTitle>
        </CardHeader>
        <CardContent>
          {pdfSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão encontrada para esta paciente.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {pdfSessions.map((s, i) => (
                <li
                  key={`${s.date}-${i}`}
                  className="py-1.5 leading-snug text-muted-foreground"
                >
                  <span className="text-foreground">
                    {formatSessionLine(i, s)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revisar antes de exportar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ClinicalReportEditor
            reportId={report.id}
            treatmentId={treatmentId}
            synthesis={report.synthesis_text}
            maintenance={report.maintenance_guidance}
          />
          <div className="flex flex-wrap gap-2">
            <DownloadClinicalPdfButton data={pdfData} />
            <DownloadClinicalWordButton data={pdfData} />
          </div>
          <p className="text-xs text-muted-foreground">
            PDF e Word incluem identificação da profissional (
            {credentials.professionalName} ·{" "}
            {formatCrefitoLine(credentials.crefito)}). Não incluem valores,
            parcelas, % da clínica nem taxa de cartão.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
