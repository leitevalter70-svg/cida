import Link from "next/link"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import {
  PeriodFilter,
  PrestacaoModeToggle,
  type PrestacaoPor,
} from "@/components/period-filter"
import {
  PrestacaoExcelButton,
  type PrestacaoExportRow,
} from "@/components/prestacao-export"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatBRL, formatData } from "@/lib/format"
import { paymentMethodLabel } from "@/lib/finance/split"
import {
  formatCrefitoLine,
  resolveCredentials,
} from "@/lib/professional"
import type { PaymentMethod } from "@/lib/types"

function inRange(iso: string | null | undefined, from: string, to: string) {
  if (!iso) return false
  return iso >= from && iso <= to
}

export default async function PrestacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; por?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const from = params.from || format(startOfMonth(now), "yyyy-MM-dd")
  const to = params.to || format(endOfMonth(now), "yyyy-MM-dd")
  const por: PrestacaoPor =
    params.por === "recebimento" ? "recebimento" : "pagamento"

  let allRevenues: any[] = []
  let expenses: any[] = []
  let credentials = resolveCredentials(null)
  let queryError: string | null = null

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const select = "*, patients(full_name)"
    const [byPay, bySettle, exp, defaults] = await Promise.all([
      supabase
        .from("revenues")
        .select(select)
        .gte("revenue_date", from)
        .lte("revenue_date", to)
        .order("revenue_date", { ascending: true }),
      supabase
        .from("revenues")
        .select(select)
        .gte("settled_at", from)
        .lte("settled_at", to)
        .order("settled_at", { ascending: true }),
      supabase
        .from("expenses")
        .select("*, expense_categories(name), patients(full_name)")
        .gte("expense_date", from)
        .lte("expense_date", to)
        .order("expense_date", { ascending: true }),
      supabase.from("report_defaults").select("*").maybeSingle(),
    ])
    if (byPay.error || bySettle.error) {
      queryError = byPay.error?.message || bySettle.error?.message || null
    }
    const merged = new Map<string, any>()
    for (const r of [...(byPay.data ?? []), ...(bySettle.data ?? [])]) {
      merged.set(r.id, r)
    }
    allRevenues = Array.from(merged.values()).sort((a, b) =>
      String(a.revenue_date).localeCompare(String(b.revenue_date)),
    )
    expenses = exp.data ?? []
    credentials = resolveCredentials(defaults.data)
  }

  const revenues = allRevenues.filter((r) =>
    por === "recebimento"
      ? inRange(r.settled_at || r.revenue_date, from, to)
      : inRange(r.revenue_date, from, to),
  )

  const pendingSettlement = allRevenues.filter(
    (r) =>
      inRange(r.revenue_date, from, to) &&
      !inRange(r.settled_at || r.revenue_date, from, to),
  )

  const byPatient = new Map<
    string,
    {
      id: string
      name: string
      gross: number
      clinic: number
      professional: number
      card: number
      count: number
      items: typeof revenues
    }
  >()

  for (const r of revenues) {
    const pid = r.patient_id || "sem-paciente"
    const name = r.patients?.full_name || "Sem paciente vinculado"
    const current = byPatient.get(pid) ?? {
      id: pid,
      name,
      gross: 0,
      clinic: 0,
      professional: 0,
      card: 0,
      count: 0,
      items: [],
    }
    current.gross += Number(r.gross_amount)
    current.clinic += Number(r.clinic_net_amount)
    current.professional += Number(r.professional_net_amount)
    current.card += Number(r.card_fee_amount)
    current.count += 1
    current.items.push(r)
    byPatient.set(pid, current)
  }

  const patients = Array.from(byPatient.values()).sort(
    (a, b) => b.gross - a.gross,
  )

  const revenueTotals = revenues.reduce(
    (acc, r) => {
      acc.bruto += Number(r.gross_amount)
      acc.taxa += Number(r.card_fee_amount)
      acc.clinica += Number(r.clinic_net_amount)
      acc.profissional += Number(r.professional_net_amount)
      return acc
    },
    { bruto: 0, taxa: 0, clinica: 0, profissional: 0 },
  )
  const despesasTotal = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const saldoClinica = revenueTotals.clinica - despesasTotal

  const pendingTotal = pendingSettlement.reduce(
    (s, r) => s + Number(r.gross_amount),
    0,
  )

  const exportRows: PrestacaoExportRow[] = [
    ...revenues.map((r) => ({
      tipo: "Receita" as const,
      dataPagamento: formatData(r.revenue_date),
      dataRecebimento: formatData(r.settled_at || r.revenue_date),
      paciente: r.patients?.full_name || "—",
      descricao: r.description || "Receita",
      formaPagamento: paymentMethodLabel(r.payment_method as PaymentMethod),
      bruto: Number(r.gross_amount),
      taxaCartao: Number(r.card_fee_amount),
      clinica: Number(r.clinic_net_amount),
      profissional: Number(r.professional_net_amount),
      despesa: 0,
    })),
    ...expenses.map((e) => ({
      tipo: "Despesa" as const,
      dataPagamento: formatData(e.expense_date),
      dataRecebimento: formatData(e.expense_date),
      paciente: e.patients?.full_name || "—",
      descricao: e.description,
      formaPagamento: e.expense_categories?.name || "Despesa",
      bruto: 0,
      taxaCartao: 0,
      clinica: 0,
      profissional: 0,
      despesa: Number(e.amount),
    })),
  ]

  const periodLabel =
    por === "recebimento"
      ? "Período de recebimento financeiro"
      : "Período de pagamento (faturamento)"

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prestação de contas</h1>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
          <p className="mt-1 text-sm font-medium">
            {credentials.professionalName} ·{" "}
            {formatCrefitoLine(credentials.crefito)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrestacaoExcelButton
            from={from}
            to={to}
            professionalName={credentials.professionalName}
            crefito={credentials.crefito}
            periodLabel={periodLabel}
            rows={exportRows}
            totals={{
              bruto: revenueTotals.bruto,
              taxa: revenueTotals.taxa,
              clinica: revenueTotals.clinica,
              profissional: revenueTotals.profissional,
              despesas: despesasTotal,
              saldoClinica,
            }}
          />
          <Link
            href="/despesas"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm hover:bg-secondary"
          >
            Registrar despesa
          </Link>
        </div>
      </div>

      <PrestacaoModeToggle from={from} to={to} por={por} />
      <PeriodFilter from={from} to={to} basePath="/prestacao" por={por} />

      {queryError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Erro ao carregar receitas: {queryError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          [
            por === "recebimento" ? "Bruto recebido" : "Bruto faturado",
            revenueTotals.bruto,
          ],
          ["Taxa cartão", revenueTotals.taxa],
          ["Clínica", revenueTotals.clinica],
          ["Profissional", revenueTotals.profissional],
          ["Despesas", despesasTotal],
          ["Saldo clínica", saldoClinica],
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
          <CardTitle className="text-base">
            Faturamento por paciente ({patients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma receita neste período com o filtro atual.
            </p>
          ) : (
            patients.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    {p.id === "sem-paciente" ? (
                      <p className="font-medium">{p.name}</p>
                    ) : (
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {p.count} lançamento{p.count === 1 ? "" : "s"} · Clínica{" "}
                      {formatBRL(p.clinic)} · Você {formatBRL(p.professional)}
                      {p.card > 0 ? ` · Cartão ${formatBRL(p.card)}` : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold">{formatBRL(p.gross)}</p>
                </div>
                <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
                  {p.items.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <p className="text-muted-foreground">
                        Pagamento {formatData(r.revenue_date)} · Recebimento{" "}
                        {formatData(r.settled_at || r.revenue_date)} ·{" "}
                        {paymentMethodLabel(
                          r.payment_method as PaymentMethod,
                        )}
                        {r.description ? ` · ${r.description}` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline">
                          Clínica {formatBRL(Number(r.clinic_net_amount))}
                        </Badge>
                        <span className="font-medium">
                          {formatBRL(Number(r.gross_amount))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {por === "pagamento" && pendingSettlement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Crédito ainda a receber ({formatBRL(pendingTotal)})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Pago neste período, mas o recebimento financeiro cai depois
              (aparece em “Por recebimento” na data de liquidação).
            </p>
            {pendingSettlement.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <p>
                  <span className="font-medium">
                    {r.patients?.full_name || "Paciente"}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · recebe em {formatData(r.settled_at || r.revenue_date)}
                  </span>
                </p>
                <p className="font-medium">
                  {formatBRL(Number(r.gross_amount))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas do período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem despesas.</p>
          ) : (
            expenses.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-3"
              >
                <div>
                  <p className="font-medium">{e.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatData(e.expense_date)}
                    {e.expense_categories?.name
                      ? ` · ${e.expense_categories.name}`
                      : ""}
                    {e.patients?.full_name
                      ? ` · ${e.patients.full_name}`
                      : ""}
                  </p>
                </div>
                <p className="font-semibold">{formatBRL(Number(e.amount))}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
