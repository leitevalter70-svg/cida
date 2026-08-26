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
import { buildClinicalPdfData } from "@/lib/clinical/build-clinical-pdf-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhysioSymbol } from "@/components/physio-symbol"
import { formatData } from "@/lib/format"
import { EvolutionChart } from "@/components/evolution-chart"
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

  const { data: report } = await supabase
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

  const { data: assessment } = await supabase
    .from("urogineco_assessments")
    .select("anamnese")
    .eq("patient_id", treatment.patient_id)
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

  const credentials = resolveCredentials(defaults)

  const pdfData = buildClinicalPdfData({
    patient,
    protocolName: treatment.protocol_name as string,
    plannedSessions: Number(treatment.planned_sessions ?? 0),
    report: {
      synthesis_text: report.synthesis_text,
      maintenance_guidance: report.maintenance_guidance,
      complaint_focus: report.complaint_focus,
      treatment_period_start: report.treatment_period_start,
      treatment_period_end: report.treatment_period_end,
      sessions_planned: report.sessions_planned,
      chance_summary: report.chance_summary,
      devices_summary: report.devices_summary,
    },
    sessions: (sessions ?? []).map((s) => ({
      session_date: s.session_date as string,
      evolution_scale:
        s.evolution_scale == null ? null : Number(s.evolution_scale),
      daily_complaint: (s.daily_complaint as string | null) ?? null,
      procedures_done: (s.procedures_done as string | null) ?? null,
      access_route: (s.access_route as string | null) ?? null,
      device_notes: (s.device_notes as string | null) ?? null,
      patient_response: (s.patient_response as string | null) ?? null,
      next_step: (s.next_step as string | null) ?? null,
      session_devices: s.session_devices as
        | { device_catalog: { name: string } | null }[]
        | null,
    })),
    anamnese: assessment?.anamnese ?? null,
    reportDefaults: defaults,
    credentials,
  })

  const pdfSessions = pdfData.sessions
  const adherence = pdfData.adherence
  const sessionsDone = pdfData.sessionsDone
  const sessionsPlanned = pdfData.sessionsPlanned
  const scaleStart = pdfData.scaleStart
  const scaleEnd = pdfData.scaleEnd
  const devicesSummary = pdfData.devicesSummary
  const chanceSummaryText = pdfData.chanceSummary
  const complaint = pdfData.complaint

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
            {(pdfData.periodStart || pdfData.periodEnd) && (
              <p>
                <span className="text-muted-foreground">Período:</span>{" "}
                {pdfData.periodStart || "—"} → {pdfData.periodEnd || "—"}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Sessões:</span>{" "}
              {sessionsDone} de {sessionsPlanned || "—"}
              {adherence != null ? ` · adesão ${adherence}%` : ""}
            </p>
            {(scaleStart != null || scaleEnd != null) && (
              <p>
                <span className="text-muted-foreground">Escala:</span>{" "}
                {scaleStart ?? "—"} → {scaleEnd ?? "—"}
              </p>
            )}
            {devicesSummary && (
              <p>
                <span className="text-muted-foreground">Aparelhos:</span>{" "}
                {devicesSummary}
              </p>
            )}
            {chanceSummaryText && (
              <p className="text-muted-foreground">{chanceSummaryText}</p>
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
            <CardTitle className="text-base">Evolução da escala</CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutionChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">
            Sessões registradas{" "}
            {pdfSessions.length > 0 && (
              <span className="font-normal text-muted-foreground">
                ({pdfSessions.length}{" "}
                {pdfSessions.length === 1 ? "sessão" : "sessões"})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pdfSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão encontrada para esta paciente.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pdfSessions.map((s, i) => {
                const resources = [...s.devices, s.accessRoute, s.deviceNotes]
                  .filter(Boolean)
                  .join(" · ")
                return (
                  <li
                    key={`${s.date}-${i}`}
                    className="rounded-lg border border-border/80 border-l-[3px] border-l-primary bg-secondary/40 px-3 py-3 text-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-foreground">
                          {s.date}
                        </span>
                      </div>
                      {s.scale != null && (
                        <Badge variant="default" className="text-xs">
                          Escala {s.scale}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      {s.complaint && (
                        <p>
                          <span className="font-medium text-primary">
                            Queixa:{" "}
                          </span>
                          {s.complaint}
                        </p>
                      )}
                      {s.procedures && (
                        <p>
                          <span className="font-medium text-primary">
                            Procedimentos:{" "}
                          </span>
                          {s.procedures.replace(/\s+/g, " ").trim()}
                        </p>
                      )}
                      {resources && (
                        <p>
                          <span className="font-medium text-primary">
                            Recursos:{" "}
                          </span>
                          {resources}
                        </p>
                      )}
                      {s.patientResponse && (
                        <p>
                          <span className="font-medium text-primary">
                            Resposta:{" "}
                          </span>
                          {s.patientResponse.replace(/\s+/g, " ").trim()}
                        </p>
                      )}
                      {s.nextStep && (
                        <p>
                          <span className="font-medium text-primary">
                            Próximo passo:{" "}
                          </span>
                          {s.nextStep.replace(/\s+/g, " ").trim()}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
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
