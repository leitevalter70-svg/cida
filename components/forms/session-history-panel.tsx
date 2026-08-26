"use client"

import { useState } from "react"
import Link from "next/link"
import { SessionForm, type SessionFormValues } from "@/components/forms/session-form"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { formatData } from "@/lib/format"
import { complaintLabel, type ComplaintOption } from "@/lib/clinical/complaints"
import { cn } from "@/lib/utils"

type TreatmentRef = {
  id: string
  protocol_name: string
  status: string
  kind?: string
}

type SessionRow = {
  id: string
  session_date: string
  treatment_id: string | null
  daily_complaint: string | null
  procedures_done: string | null
  patient_response: string | null
  evolution_scale: number | null
  access_route: string | null
  device_notes: string | null
  next_step: string | null
  device_ids: string[]
  device_names: string[]
  paid: boolean
}

const ACCESS_LABELS: Record<string, string> = {
  sonda_vaginal: "Sonda vaginal",
  sonda_anal: "Sonda anal",
  eletrodo_superficie: "Eletrodo de superfície",
  outro: "Outro",
  nao_aplicavel: "Não aplicável",
}

export function SessionHistoryPanel({
  patientId,
  sessions,
  treatments,
  devices,
  complaintOptions,
  defaultComplaint,
}: {
  patientId: string
  sessions: SessionRow[]
  treatments: TreatmentRef[]
  devices: { id: string; name: string }[]
  complaintOptions?: ComplaintOption[]
  defaultComplaint?: string | null
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem sessões.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => {
        const treatment = treatments.find((t) => t.id === s.treatment_id)
        const treatmentName = treatment?.protocol_name
        const accessLabel =
          ACCESS_LABELS[s.access_route as string] ?? s.access_route
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
          rows.push({ label: "Condutas", value: s.procedures_done })
        }
        if (s.access_route && s.access_route !== "nao_aplicavel") {
          rows.push({ label: "Via / acessório", value: accessLabel ?? "" })
        }
        if (s.device_notes) {
          rows.push({ label: "Obs. aparelho", value: s.device_notes })
        }
        if (s.patient_response) {
          rows.push({
            label: "Resposta / observação",
            value: s.patient_response,
          })
        }
        if (s.next_step) {
          rows.push({ label: "Próximo passo", value: s.next_step })
        }

        const editing = editingId === s.id
        const formSession: SessionFormValues = {
          id: s.id,
          session_date: s.session_date,
          treatment_id: s.treatment_id,
          daily_complaint: s.daily_complaint,
          procedures_done: s.procedures_done,
          patient_response: s.patient_response,
          evolution_scale: s.evolution_scale,
          access_route: s.access_route,
          device_notes: s.device_notes,
          next_step: s.next_step,
          device_ids: s.device_ids,
          paid: s.paid,
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
              <div className="flex flex-wrap items-center gap-1">
                {s.paid ? (
                  <Badge variant="secondary">Paga</Badge>
                ) : treatment?.kind === "avulso" ? (
                  <Badge variant="outline">A cobrar</Badge>
                ) : null}
                {s.evolution_scale != null && (
                  <Badge>Escala {s.evolution_scale}</Badge>
                )}
              </div>
            </div>

            {editing ? (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-sm font-medium">Editar sessão</p>
                <SessionForm
                  key={s.id}
                  patientId={patientId}
                  treatments={treatments}
                  devices={devices}
                  complaintOptions={complaintOptions}
                  defaultComplaint={defaultComplaint}
                  session={formSession}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              </div>
            ) : (
              <>
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
                ) : s.device_names.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sem detalhes clínicos registrados.
                  </p>
                ) : null}
                {s.device_names.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Aparelhos
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {s.device_names.map((n) => (
                        <Badge key={n} variant="outline">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(s.id)}
                  >
                    Editar
                  </Button>
                  {!s.paid && treatment?.kind === "avulso" && (
                    <Link
                      href={`/pacientes/${patientId}?lancar=receita&tratamento=${treatment.id}&sessao=${s.id}`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                      )}
                    >
                      Registrar pagamento da sessão
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
