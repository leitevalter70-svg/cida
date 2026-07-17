import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import {
  TreatmentForm,
  CompleteTreatmentButton,
} from "@/components/forms/treatment-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/format"

export default async function TratamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string }>
}) {
  const { paciente: defaultPatientId = "" } = await searchParams
  let patients: any[] = []
  let treatments: any[] = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("patients").select("id, full_name").order("full_name"),
      supabase
        .from("treatments")
        .select(
          "*, patients(full_name), installments(id, sequence_number, amount, status)",
        )
        .order("created_at", { ascending: false }),
    ])
    patients = p ?? []
    treatments = t ?? []
  }

  const selectedPatient = patients.find((p) => p.id === defaultPatientId)

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div>
        <h1 className="text-2xl font-bold">Tratamentos</h1>
        <p className="text-sm text-muted-foreground">
          {selectedPatient
            ? `Paciente selecionado: ${selectedPatient.full_name}`
            : "Pacotes, avulsos e parcelas"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Novo tratamento</CardTitle>
          </CardHeader>
          <CardContent>
            <TreatmentForm
              key={defaultPatientId || "novo"}
              patients={patients}
              defaultPatientId={defaultPatientId}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-3">
          {treatments.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Nenhum tratamento cadastrado.
              </CardContent>
            </Card>
          ) : (
            treatments.map((t) => {
              const installments = (t.installments || []) as {
                id: string
                sequence_number: number
                amount: number
                status: string
              }[]
              const paid = installments.filter((i) => i.status === "paga").length
              const open = installments
                .filter((i) => i.status !== "paga")
                .reduce((s, i) => s + Number(i.amount), 0)

              return (
                <Card key={t.id}>
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{t.protocol_name}</p>
                        <Link
                          href={`/pacientes/${t.patient_id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {t.patients?.full_name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.kind} · {t.planned_sessions} sessões ·{" "}
                          {formatBRL(Number(t.total_amount))}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{t.status}</Badge>
                        {t.status === "ativo" && (
                          <CompleteTreatmentButton treatmentId={t.id} />
                        )}
                        {t.status === "concluido" && (
                          <Link
                            href={`/relatorios/clinico/${t.id}`}
                            className="text-sm text-primary underline"
                          >
                            Ver relatório
                          </Link>
                        )}
                      </div>
                    </div>
                    {t.kind === "pacote" && installments.length > 0 && (
                      <div className="rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                        <p>
                          Parcelas {paid}/{installments.length} pagas
                          {open > 0 ? ` · ${formatBRL(open)} em aberto` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {installments
                            .sort(
                              (a, b) => a.sequence_number - b.sequence_number,
                            )
                            .map((i) => (
                              <Badge
                                key={i.id}
                                variant={
                                  i.status === "paga" ? "default" : "outline"
                                }
                              >
                                {i.sequence_number}ª · {formatBRL(Number(i.amount))} ·{" "}
                                {i.status}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
