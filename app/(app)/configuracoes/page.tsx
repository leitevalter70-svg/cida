import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import {
  FinancialSettingsForm,
  ReportDefaultsForm,
  DeviceCatalogForm,
} from "@/components/forms/settings-forms"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatData } from "@/lib/format"
import { complaintLabel } from "@/lib/clinical/complaints"

export default async function ConfiguracoesPage() {
  let settings: any = null
  let defaults: any = null
  let devices: any[] = []
  let bands: any[] = []
  let history: any[] = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [s, d, dev, b, h] = await Promise.all([
      supabase.from("financial_settings").select("*").maybeSingle(),
      supabase.from("report_defaults").select("*").maybeSingle(),
      supabase
        .from("device_catalog")
        .select("*")
        .order("sort_order"),
      supabase
        .from("clinical_chance_bands")
        .select("*")
        .eq("is_active", true)
        .order("complaint_type"),
      supabase
        .from("financial_settings_history")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(20),
    ])
    settings = s.data
    defaults = d.data
    devices = dev.data ?? []
    bands = b.data ?? []
    history = h.data ?? []
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Percentuais, credenciais (nome/CREFITO), catálogo de aparelhos e
          textos do relatório clínico
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialSettingsForm settings={settings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relatório do paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportDefaultsForm defaults={defaults} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo de aparelhos</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceCatalogForm devices={devices} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Faixas de chance (literatura)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {bands.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Faixas criadas automaticamente no cadastro (IUE, Mista,
                Urgência).
              </p>
            ) : (
              bands.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {complaintLabel(b.complaint_type)}
                  </p>
                  <p className="text-muted-foreground">
                    Cura/melhora: {b.cure_or_improve_min_percent}–
                    {b.cure_or_improve_max_percent}% · Controle:{" "}
                    {b.control_min_percent}–{b.control_max_percent}%
                  </p>
                  {b.source_text && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.source_text}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Histórico de percentuais
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap justify-between gap-2 text-sm"
                >
                  <span>
                    {h.field_name}: {h.old_value} → {h.new_value}
                  </span>
                  <span className="text-muted-foreground">
                    {formatData(h.changed_at.slice(0, 10))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
