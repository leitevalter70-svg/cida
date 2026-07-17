import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { PatientForm } from "@/components/forms/patient-form"
import { SessionForm } from "@/components/forms/session-form"
import { EvolutionChart } from "@/components/evolution-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatData } from "@/lib/format"
import {
  adherencePercent,
  chanceSummary,
} from "@/lib/clinical/chance"
import {
  complaintLabel,
  resolveComplaintOptions,
} from "@/lib/clinical/complaints"
import { cn } from "@/lib/utils"
import { notFound } from "next/navigation"

export default async function PacienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-4">
        <SetupNotice />
        <p className="text-sm text-muted-foreground">
          Conecte o Supabase para ver a ficha do paciente.
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single()

  if (!patient) notFound()

  const [
    { data: sessions },
    { data: treatments },
    { data: devices },
    { data: bands },
    { data: settings },
    { data: reports },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, session_devices(device_catalog(name))")
      .eq("patient_id", id)
      .order("session_date", { ascending: true }),
    supabase
      .from("treatments")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("device_catalog")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("clinical_chance_bands")
      .select("*")
      .eq("is_active", true),
    supabase.from("financial_settings").select("*").maybeSingle(),
    supabase
      .from("clinical_reports")
      .select("id, treatment_id")
      .eq("patient_id", id),
  ])

  const activeTreatment = treatments?.find((t) => t.status === "ativo")
  const done = sessions?.filter((s) =>
    activeTreatment ? s.treatment_id === activeTreatment.id : true,
  ).length ?? 0
  const planned = activeTreatment?.planned_sessions ?? sessions?.length ?? 0
  const adherence = adherencePercent(
    activeTreatment
      ? sessions?.filter((s) => s.treatment_id === activeTreatment.id).length ?? 0
      : done,
    planned || 1,
  )
  const band = bands?.find(
    (b) =>
      patient.complaint_focus &&
      (patient.complaint_focus
        .toLowerCase()
        .includes(b.complaint_type.toLowerCase()) ||
        b.complaint_type.toLowerCase() ===
          patient.complaint_focus.toLowerCase()),
  )
  const chance = chanceSummary(band, adherence)
  const complaintOptions = resolveComplaintOptions(
    (bands ?? []).map((b) => b.complaint_type),
    patient.complaint_focus,
  )

  const chartData =
    sessions
      ?.filter((s) => s.evolution_scale != null)
      .map((s) => ({
        date: formatData(s.session_date),
        escala: s.evolution_scale,
      })) ?? []

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/pacientes"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Pacientes
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{patient.full_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{patient.status}</Badge>
            {patient.complaint_focus && (
              <Badge variant="outline">
                {complaintLabel(patient.complaint_focus)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {settings?.clinical_chance_indicator_enabled !== false && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Chances × adesão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-bold">{adherence}%</p>
              <p className="text-muted-foreground">{chance.zoneLabel}</p>
              <p>
                Literatura cura/melhora:{" "}
                <strong>{chance.literatureRange}</strong>
              </p>
              <p className="text-xs text-muted-foreground">{chance.message}</p>
              <p className="text-xs text-muted-foreground">{chance.disclaimer}</p>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução da escala</CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutionChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionForm
              patientId={patient.id}
              treatments={treatments ?? []}
              devices={devices ?? []}
              complaintOptions={complaintOptions}
              defaultComplaint={patient.complaint_focus}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de sessões</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(sessions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem sessões.</p>
            ) : (
              [...(sessions ?? [])].reverse().map((s) => {
                const deviceNames =
                  (s.session_devices as { device_catalog: { name: string } }[])
                    ?.map((d) => d.device_catalog?.name)
                    .filter(Boolean) ?? []
                return (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {formatData(s.session_date)}
                      </p>
                      {s.evolution_scale != null && (
                        <Badge>Escala {s.evolution_scale}</Badge>
                      )}
                    </div>
                    {s.procedures_done && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.procedures_done}
                      </p>
                    )}
                    {deviceNames.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {deviceNames.map((n) => (
                          <Badge key={n} variant="outline">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tratamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(treatments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum tratamento.{" "}
              <Link href="/tratamentos" className="text-primary underline">
                Criar em Tratamentos
              </Link>
            </p>
          ) : (
            treatments?.map((t) => {
              const report = reports?.find((r) => r.treatment_id === t.id)
              return (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{t.protocol_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.kind} · {t.planned_sessions} sessões · {t.status}
                    </p>
                  </div>
                  {report && (
                    <Link
                      href={`/relatorios/clinico/${t.id}`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                      )}
                    >
                      Relatório clínico
                    </Link>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar dados</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            patient={patient}
            complaintOptions={complaintOptions}
          />
        </CardContent>
      </Card>
    </div>
  )
}
