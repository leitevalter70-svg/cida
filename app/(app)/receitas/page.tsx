import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { RevenueForm } from "@/components/forms/revenue-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL, formatData } from "@/lib/format"
import { paymentMethodLabel } from "@/lib/finance/split"
import type { PaymentMethod } from "@/lib/types"

export default async function ReceitasPage() {
  let patients: any[] = []
  let treatments: any[] = []
  let installments: any[] = []
  let revenues: any[] = []
  let settings: any = null

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [p, t, i, r, s] = await Promise.all([
      supabase.from("patients").select("id, full_name").order("full_name"),
      supabase
        .from("treatments")
        .select("id, patient_id, protocol_name")
        .eq("status", "ativo"),
      supabase
        .from("installments")
        .select("id, treatment_id, sequence_number, amount, status")
        .neq("status", "paga"),
      supabase
        .from("revenues")
        .select("*, patients(full_name)")
        .order("revenue_date", { ascending: false })
        .limit(50),
      supabase.from("financial_settings").select("*").maybeSingle(),
    ])
    patients = p.data ?? []
    treatments = t.data ?? []
    installments = i.data ?? []
    revenues = r.data ?? []
    settings = s.data
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

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div>
        <h1 className="text-2xl font-bold">Receitas</h1>
        <p className="text-sm text-muted-foreground">
          Lançamentos com rateio clínica / cartão / profissional
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Bruto", totals.gross],
          ["Clínica", totals.clinic],
          ["Profissional", totals.professional],
          ["Cartão", totals.card],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label as string}</p>
              <p className="text-lg font-bold">{formatBRL(value as number)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nova receita</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueForm
              patients={patients}
              treatments={treatments}
              installments={installments}
              settings={settings}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Últimos lançamentos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {revenues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem receitas.</p>
            ) : (
              revenues.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {r.patients?.full_name || r.description || "Receita"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatData(r.revenue_date)} ·{" "}
                        {paymentMethodLabel(r.payment_method as PaymentMethod)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatBRL(Number(r.gross_amount))}</p>
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
    </div>
  )
}
