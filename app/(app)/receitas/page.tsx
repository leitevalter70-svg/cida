import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL, formatData } from "@/lib/format"
import { paymentMethodLabel } from "@/lib/finance/split"
import type { PaymentMethod } from "@/lib/types"

export default async function ReceitasPage() {
  let revenues: any[] = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("revenues")
      .select("*, patients!inner(full_name)")
      .order("revenue_date", { ascending: false })
    revenues = data ?? []
  }

  const totals = revenues.reduce(
    (acc, r) => {
      acc.gross += Number(r.gross_amount)
      acc.clinic += Number(r.clinic_net_amount)
      acc.professional += Number(r.professional_net_amount)
      acc.card += Number(r.card_fee_amount)
      return acc
    },
    { gross: 0, clinic: 0, professional: 0, card: 0 },
  )

  const byPatientMap = new Map<
    string,
    {
      id: string
      name: string
      gross: number
      clinic: number
      professional: number
      card: number
      count: number
    }
  >()

  for (const r of revenues) {
    const pid = r.patient_id || "sem-paciente"
    const name = r.patients?.full_name || "Sem paciente vinculado"
    const current = byPatientMap.get(pid) ?? {
      id: pid,
      name,
      gross: 0,
      clinic: 0,
      professional: 0,
      card: 0,
      count: 0,
    }
    current.gross += Number(r.gross_amount)
    current.clinic += Number(r.clinic_net_amount)
    current.professional += Number(r.professional_net_amount)
    current.card += Number(r.card_fee_amount)
    current.count += 1
    byPatientMap.set(pid, current)
  }

  const byPatient = Array.from(byPatientMap.values()).sort(
    (a, b) => b.gross - a.gross,
  )

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div>
        <h1 className="text-2xl font-bold">Receitas</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada financeira. O lançamento fica na ficha do paciente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Bruto total", totals.gross],
          ["Clínica", totals.clinic],
          ["Profissional", totals.professional],
          ["Taxa cartão", totals.card],
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
          <CardTitle className="text-base">Faturamento por paciente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {byPatient.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem receitas lançadas. Cadastre na ficha do paciente após o
              tratamento.
            </p>
          ) : (
            byPatient.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-3"
              >
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
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {revenues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem receitas.</p>
          ) : (
            revenues.slice(0, 50).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {r.patient_id ? (
                        <Link
                          href={`/pacientes/${r.patient_id}`}
                          className="text-primary hover:underline"
                        >
                          {r.patients?.full_name || "Paciente"}
                        </Link>
                      ) : (
                        r.description || "Receita"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatData(r.revenue_date)} ·{" "}
                      {paymentMethodLabel(r.payment_method as PaymentMethod)}
                      {r.description ? ` · ${r.description}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatBRL(Number(r.gross_amount))}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline">
                    Clínica {formatBRL(Number(r.clinic_net_amount))}
                  </Badge>
                  <Badge variant="outline">
                    Você {formatBRL(Number(r.professional_net_amount))}
                  </Badge>
                  {Number(r.card_fee_amount) > 0 && (
                    <Badge variant="secondary">
                      Cartão {formatBRL(Number(r.card_fee_amount))}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
