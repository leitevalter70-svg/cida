"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatBRL, formatData } from "@/lib/format"
import { adherencePercent, chanceSummary } from "@/lib/clinical/chance"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  from: string
  to: string
  data: {
    revenues: any[]
    expenses: any[]
    sessions: any[]
    patients: any[]
    treatments: any[]
    installments: any[]
    settings: any
    bands: any[]
  }
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function DashboardClient({ from, to, data }: Props) {
  const [view, setView] = useState<"unificada" | "financeiro" | "clinico">(
    "unificada",
  )

  const financial = useMemo(() => {
    const gross = data.revenues.reduce((s, r) => s + Number(r.gross_amount), 0)
    const clinic = data.revenues.reduce(
      (s, r) => s + Number(r.clinic_net_amount),
      0,
    )
    const professional = data.revenues.reduce(
      (s, r) => s + Number(r.professional_net_amount),
      0,
    )
    const cardFee = data.revenues.reduce(
      (s, r) => s + Number(r.card_fee_amount),
      0,
    )
    const cardClinic = data.revenues.reduce(
      (s, r) => s + Number(r.clinic_fee_share),
      0,
    )
    const cardProf = data.revenues.reduce(
      (s, r) => s + Number(r.professional_fee_share),
      0,
    )
    const expenses = data.expenses.reduce((s, e) => s + Number(e.amount), 0)

    const byDay = new Map<string, number>()
    data.revenues.forEach((r) => {
      byDay.set(
        r.revenue_date,
        (byDay.get(r.revenue_date) || 0) + Number(r.gross_amount),
      )
    })
    const daily = Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date: formatData(date), value }))

    const byMethod = new Map<string, number>()
    data.revenues.forEach((r) => {
      byMethod.set(
        r.payment_method,
        (byMethod.get(r.payment_method) || 0) + Number(r.gross_amount),
      )
    })
    const methods = Array.from(byMethod.entries()).map(([name, value]) => ({
      name,
      value,
    }))

    const byPatientMap = new Map<string, { name: string; value: number }>()
    data.revenues.forEach((r) => {
      const pid = r.patient_id || "sem"
      const name =
        data.patients.find((p) => p.id === r.patient_id)?.full_name ||
        "Sem paciente"
      const cur = byPatientMap.get(pid) || { name, value: 0 }
      cur.value += Number(r.gross_amount)
      byPatientMap.set(pid, cur)
    })
    const byPatient = Array.from(byPatientMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    const openInstallments = data.installments.reduce(
      (s, i) => s + Number(i.amount),
      0,
    )

    return {
      gross,
      clinic,
      professional,
      cardFee,
      cardClinic,
      cardProf,
      expenses,
      daily,
      methods,
      byPatient,
      splitPie: [
        { name: "Clínica", value: clinic },
        { name: "Profissional", value: professional },
      ],
      revVsExp: [
        { name: "Receitas", value: gross },
        { name: "Despesas", value: expenses },
      ],
      openInstallments,
      openCount: data.installments.length,
    }
  }, [data])

  const clinical = useMemo(() => {
    const inTreatment = data.patients.filter(
      (p) => p.status === "em_tratamento",
    ).length
    const alta = data.patients.filter((p) => p.status === "alta").length
    const sessionsDone = data.sessions.length

    const scaleByDate = new Map<string, number[]>()
    data.sessions.forEach((s) => {
      if (s.evolution_scale == null) return
      const arr = scaleByDate.get(s.session_date) || []
      arr.push(s.evolution_scale)
      scaleByDate.set(s.session_date, arr)
    })
    const evolution = Array.from(scaleByDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, vals]) => ({
        date: formatData(date),
        media: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))

    const deviceCounts = new Map<string, number>()
    data.sessions.forEach((s) => {
      const devices = s.session_devices || []
      if (!devices.length) {
        deviceCounts.set(
          "Sem aparelho",
          (deviceCounts.get("Sem aparelho") || 0) + 1,
        )
        return
      }
      devices.forEach((d: any) => {
        const name = d.device_catalog?.name || "Outro"
        deviceCounts.set(name, (deviceCounts.get(name) || 0) + 1)
      })
    })
    const devices = Array.from(deviceCounts.entries()).map(([name, value]) => ({
      name,
      value,
    }))

    const activeTreatments = data.treatments.filter((t) => t.status === "ativo")
    const adherenceRows = activeTreatments.map((t) => {
      const done = data.sessions.filter((s) => s.treatment_id === t.id).length
      const patient = data.patients.find((p) => p.id === t.patient_id)
      const pct = adherencePercent(done, t.planned_sessions)
      const band = data.bands.find(
        (b) =>
          patient?.complaint_focus &&
          (patient.complaint_focus
            .toLowerCase()
            .includes(String(b.complaint_type).toLowerCase()) ||
            String(b.complaint_type).toLowerCase() ===
              String(patient.complaint_focus).toLowerCase()),
      )
      return {
        treatmentId: t.id,
        patientName: patient?.full_name || "Paciente",
        patientId: t.patient_id,
        done,
        planned: t.planned_sessions,
        pct,
        chance: chanceSummary(band, pct),
        spark:
          data.sessions
            .filter((s) => s.patient_id === t.patient_id && s.evolution_scale)
            .slice(-6)
            .map((s) => s.evolution_scale) || [],
      }
    })

    return {
      inTreatment,
      alta,
      sessionsDone,
      evolution,
      devices,
      adherenceRows,
      statusBars: [
        { name: "Em tratamento", value: inTreatment },
        { name: "Altas", value: alta },
      ],
    }
  }, [data])

  const emptyFinance = data.revenues.length === 0
  const emptyClinical = data.sessions.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Visão do período</h2>
          <p className="text-sm text-muted-foreground">
            {formatData(from)} — {formatData(to)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl bg-secondary/60 p-1">
          {(
            [
              ["unificada", "Unificada"],
              ["financeiro", "Financeiro"],
              ["clinico", "Clínico"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={view === id ? "default" : "ghost"}
              className={view === id ? "shadow-sm" : undefined}
              onClick={() => setView(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {(view === "unificada" || view === "financeiro") && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Faturamento bruto",
                value: formatBRL(financial.gross),
              },
              { label: "Parte clínica", value: formatBRL(financial.clinic) },
              {
                label: "Parte profissional",
                value: formatBRL(financial.professional),
              },
              {
                label: "Taxa cartão",
                value: formatBRL(financial.cardFee),
              },
            ].map((c) => (
              <Card
                key={c.label}
                className="border-border/80 bg-gradient-to-br from-card to-secondary/30 shadow-none"
              >
                <CardContent className="border-l-[3px] border-l-primary p-5">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {c.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {emptyFinance ? (
            <EmptyChart message="Ainda sem lançamentos neste período." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Faturamento diário">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={financial.daily}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatBRL(Number(v))} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Clínica × profissional">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={financial.splitPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {financial.splitPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatBRL(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Receitas vs despesas">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={financial.revVsExp}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatBRL(Number(v))} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {financial.revVsExp.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Formas de pagamento">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={financial.methods}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatBRL(Number(v))} />
                    <Bar
                      dataKey="value"
                      fill="var(--chart-3)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Faturamento por paciente">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={financial.byPatient} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(v) => formatBRL(Number(v))} />
                    <Bar
                      dataKey="value"
                      fill="var(--chart-2)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Parcelas em aberto
                </p>
                <p className="text-xl font-bold">
                  {financial.openCount} · {formatBRL(financial.openInstallments)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Taxa cartão no período: clínica {formatBRL(financial.cardClinic)}{" "}
                  · profissional {formatBRL(financial.cardProf)}
                </p>
              </div>
              <Link
                href="/tratamentos"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Ver tratamentos
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {(view === "unificada" || view === "clinico") && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: "Sessões no período",
                value: String(clinical.sessionsDone),
              },
              {
                label: "Em tratamento",
                value: String(clinical.inTreatment),
              },
              { label: "Altas", value: String(clinical.alta) },
            ].map((c) => (
              <Card
                key={c.label}
                className="border-border/80 bg-gradient-to-br from-card to-secondary/30 shadow-none"
              >
                <CardContent className="border-l-[3px] border-l-primary p-5">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {c.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {emptyClinical ? (
            <EmptyChart message="Ainda sem sessões clínicas neste período." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Evolução média (escala 1–5)">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={clinical.evolution}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="media"
                      stroke="var(--chart-2)"
                      fill="var(--chart-2)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Uso de aparelhos">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={clinical.devices}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={85}
                    >
                      {clinical.devices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Pacientes × status">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={clinical.statusBars}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {data.settings?.clinical_chance_indicator_enabled !== false && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Indicador clínico de chances × adesão
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {clinical.adherenceRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum tratamento ativo para calcular adesão.
                  </p>
                ) : (
                  clinical.adherenceRows.map((row) => (
                    <div
                      key={row.treatmentId}
                      className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/pacientes/${row.patientId}`}
                          className="font-medium hover:underline"
                        >
                          {row.patientName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Adesão {row.pct}% ({row.done}/{row.planned}) ·{" "}
                          {row.chance.zoneLabel}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Literatura cura/melhora: {row.chance.literatureRange}{" "}
                          · {row.chance.disclaimer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{row.pct}%</Badge>
                        <Link
                          href="/tratamentos"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          Tratamento
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="animate-in fade-in border-border/80 shadow-none duration-500">
      <CardHeader>
        <CardTitle className="text-base tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <Card className="border-border/80 border-dashed shadow-none">
      <CardContent className="flex h-40 items-center justify-center p-5 text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}
