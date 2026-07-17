import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { ClinicalReportEditor } from "@/components/forms/clinical-report-editor"
import {
  DownloadClinicalPdfButton,
  type ClinicalPdfData,
} from "@/components/clinical-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatData } from "@/lib/format"
import { EvolutionChart } from "@/components/evolution-chart"

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
    .select("*")
    .eq("treatment_id", treatmentId)
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
  }

  const chartData =
    sessions
      ?.filter((s) => s.evolution_scale != null)
      .map((s) => ({
        date: formatData(s.session_date),
        escala: s.evolution_scale as number,
      })) ?? []

  const pdfData: ClinicalPdfData = {
    patientName: patient.full_name,
    age: patient.age_years,
    complaint: report.complaint_focus,
    periodStart: report.treatment_period_start
      ? formatData(report.treatment_period_start)
      : null,
    periodEnd: report.treatment_period_end
      ? formatData(report.treatment_period_end)
      : null,
    sessionsPlanned: report.sessions_planned,
    sessionsDone: report.sessions_done,
    adherence: report.adherence_percent
      ? Number(report.adherence_percent)
      : null,
    scaleStart: report.scale_start,
    scaleEnd: report.scale_end,
    devicesSummary: report.devices_summary,
    chanceSummary: report.chance_summary,
    synthesis: report.synthesis_text,
    maintenance: report.maintenance_guidance,
    disclaimer:
      defaults?.disclaimer_text ||
      "Estimativa populacional; não é garantia de cura.",
    sessionNotes:
      sessions?.map((s) => ({
        date: formatData(s.session_date),
        scale: s.evolution_scale,
        text: s.procedures_done,
      })) ?? [],
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div>
        <Link
          href={`/pacientes/${treatment.patient_id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar à ficha
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Relatório clínico</h1>
        <p className="text-sm text-muted-foreground">
          Para a paciente · sem dados financeiros
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{patient.full_name}</Badge>
          <Badge variant="outline">{treatment.protocol_name}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo clínico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Sessões: {report.sessions_done}/{report.sessions_planned} ·
              Adesão {report.adherence_percent}%
            </p>
            <p>
              Escala: {report.scale_start ?? "—"} → {report.scale_end ?? "—"}
            </p>
            <p className="text-muted-foreground">{report.devices_summary}</p>
            <p className="rounded-lg bg-secondary/50 p-3 text-xs">
              {report.chance_summary}
            </p>
            <EvolutionChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisar antes do PDF</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ClinicalReportEditor
              reportId={report.id}
              treatmentId={treatmentId}
              synthesis={report.synthesis_text}
              maintenance={report.maintenance_guidance}
            />
            <DownloadClinicalPdfButton data={pdfData} />
            <p className="text-xs text-muted-foreground">
              O PDF não inclui valores, parcelas, % da clínica nem taxa de
              cartão.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
