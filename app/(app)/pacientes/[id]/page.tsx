import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { PatientForm } from "@/components/forms/patient-form"
import { SessionForm } from "@/components/forms/session-form"
import { PatientRevenuePanel } from "@/components/forms/revenue-form"
import { DeletePatientButton } from "@/components/forms/delete-patient-button"
import { TreatmentPlannedSessionsForm } from "@/components/forms/treatment-planned-sessions-form"
import { EvolutionChart } from "@/components/evolution-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatBRL, formatData } from "@/lib/format"
import type { ClinicBaseMode, PaymentMethod } from "@/lib/types"
import {
  adherencePercent,
  chanceSummary,
} from "@/lib/clinical/chance"
import {
  complaintLabel,
  resolveComplaintOptions,
} from "@/lib/clinical/complaints"
import { resolveCredentials } from "@/lib/professional"
import { cn } from "@/lib/utils"
import { notFound } from "next/navigation"

export default async function PacienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lancar?: string; tratamento?: string }>
}) {
  const { id } = await params
  const { lancar, tratamento: defaultTreatmentId = "" } = await searchParams
  const highlightRevenue = lancar === "receita"

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
    { data: revenues },
    { data: reportDefaults },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, session_devices(device_catalog(name))")
      .eq("patient_id", id)
      .order("session_date", { ascending: true }),
    supabase
      .from("treatments")
      .select("*, installments(id, treatment_id, sequence_number, amount, status)")
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
    supabase
      .from("revenues")
      .select("*")
      .eq("patient_id", id)
      .order("revenue_date", { ascending: false }),
    supabase.from("report_defaults").select("*").maybeSingle(),
  ])

  const installments = (treatments ?? []).flatMap(
    (t) =>
      ((t.installments as {
        id: string
        treatment_id: string
        sequence_number: number
        amount: number
        status: string
      }[]) ?? []),
  )

  const activeTreatment = treatments?.find((t) => t.status === "ativo")
  const sessionsForAdherence =
    sessions?.filter((s) =>
      activeTreatment
        ? s.treatment_id === activeTreatment.id || s.treatment_id == null
        : true,
    ) ?? []
  const done = sessionsForAdherence.length
  const planned = activeTreatment?.planned_sessions ?? 0
  const adherence = adherencePercent(done, planned)
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

  const revenueTotals = (revenues ?? []).reduce(
    (acc, r) => {
      acc.gross += Number(r.gross_amount)
      acc.clinic += Number(r.clinic_net_amount)
      acc.professional += Number(r.professional_net_amount)
      acc.card += Number(r.card_fee_amount)
      return acc
    },
    { gross: 0, clinic: 0, professional: 0, card: 0 },
  )

  const treatmentOptions = (treatments ?? []).map((t) => ({
    id: t.id,
    patient_id: t.patient_id,
    protocol_name: t.protocol_name,
    kind: t.kind as string,
    total_amount: Number(t.total_amount),
  }))

  const credentials = resolveCredentials(reportDefaults)

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
          {(patient.phone || patient.email) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[patient.phone, patient.email].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{patient.status}</Badge>
            {patient.complaint_focus && (
              <Badge variant="outline">
                {complaintLabel(patient.complaint_focus)}
              </Badge>
            )}
          </div>
        </div>
        <DeletePatientButton
          patientId={patient.id}
          patientName={patient.full_name}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Faturamento", revenueTotals.gross],
          ["Clínica", revenueTotals.clinic],
          ["Você", revenueTotals.professional],
          ["Cartão", revenueTotals.card],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label as string}</p>
              <p className="text-lg font-bold">{formatBRL(value as number)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar dados do paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            patient={patient}
            complaintOptions={complaintOptions}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {settings?.clinical_chance_indicator_enabled !== false && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Chances × adesão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-bold">{adherence}%</p>
              <p className="text-muted-foreground">{chance.zoneLabel}</p>
              <p className="text-xs text-muted-foreground">
                {done} de {planned || "—"} sessões previstas
              </p>
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

      <PatientRevenuePanel
        patientId={patient.id}
        patientName={patient.full_name}
        treatments={treatmentOptions}
        installments={installments}
        settings={settings}
        defaultTreatmentId={defaultTreatmentId}
        highlight={highlightRevenue}
        professional={credentials}
        revenues={(revenues ?? []).map((r) => ({
          id: r.id,
          treatment_id: r.treatment_id,
          installment_id: r.installment_id,
          revenue_date: r.revenue_date,
          settled_at: r.settled_at || r.revenue_date,
          description: r.description,
          gross_amount: Number(r.gross_amount),
          payment_method: r.payment_method as PaymentMethod,
          clinic_percent: Number(r.clinic_percent),
          card_fee_percent: Number(r.card_fee_percent),
          clinic_base_mode: r.clinic_base_mode as ClinicBaseMode,
          clinic_shares_card_fee: Boolean(r.clinic_shares_card_fee),
          card_fee_amount: Number(r.card_fee_amount),
          clinic_net_amount: Number(r.clinic_net_amount),
          professional_net_amount: Number(r.professional_net_amount),
        }))}
      />

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
                const treatmentName = treatments?.find(
                  (t) => t.id === s.treatment_id,
                )?.protocol_name
                const accessLabel =
                  {
                    sonda_vaginal: "Sonda vaginal",
                    sonda_anal: "Sonda anal",
                    eletrodo_superficie: "Eletrodo de superfície",
                    outro: "Outro",
                    nao_aplicavel: "Não aplicável",
                  }[s.access_route as string] ?? s.access_route
                const rows: { label: string; value: string }[] = []
                if (treatmentName) {
                  rows.push({ label: "Tratamento", value: treatmentName })
                }
                if (s.daily_complaint) {
                  rows.push({
                    label: "Queixa / foco",
                    value: complaintLabel(s.daily_complaint) || s.daily_complaint,
                  })
                }
                if (s.procedures_done) {
                  rows.push({
                    label: "Condutas",
                    value: s.procedures_done,
                  })
                }
                if (s.access_route && s.access_route !== "nao_aplicavel") {
                  rows.push({ label: "Via / acessório", value: accessLabel })
                }
                if (s.device_notes) {
                  rows.push({
                    label: "Obs. aparelho",
                    value: s.device_notes,
                  })
                }
                if (s.patient_response) {
                  rows.push({
                    label: "Resposta / observação",
                    value: s.patient_response,
                  })
                }
                if (s.next_step) {
                  rows.push({
                    label: "Próximo passo",
                    value: s.next_step,
                  })
                }

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
                    {rows.length > 0 ? (
                      <dl className="mt-2 space-y-1.5 text-sm">
                        {rows.map((row) => (
                          <div key={row.label}>
                            <dt className="text-xs font-medium text-muted-foreground">
                              {row.label}
                            </dt>
                            <dd className="whitespace-pre-wrap text-foreground">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : deviceNames.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sem detalhes clínicos registrados.
                      </p>
                    ) : null}
                    {deviceNames.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Aparelhos
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {deviceNames.map((n) => (
                            <Badge key={n} variant="outline">
                              {n}
                            </Badge>
                          ))}
                        </div>
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
              <Link
                href={`/tratamentos?paciente=${patient.id}`}
                className="text-primary underline"
              >
                Criar em Tratamentos
              </Link>
            </p>
          ) : (
            treatments?.map((t) => {
              const report = reports?.find((r) => r.treatment_id === t.id)
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{t.protocol_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/pacientes/${patient.id}?lancar=receita&tratamento=${t.id}`}
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                        )}
                      >
                        Lançar receita
                      </Link>
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
                  </div>
                  <TreatmentPlannedSessionsForm
                    treatmentId={t.id}
                    plannedSessions={Number(t.planned_sessions)}
                  />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
