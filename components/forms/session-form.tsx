"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createSession, updateSession } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { todayISO } from "@/lib/format"
import {
  resolveComplaintOptions,
  type ComplaintOption,
} from "@/lib/clinical/complaints"

export type SessionFormValues = {
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
  paid?: boolean
}

export function SessionForm({
  patientId,
  treatments,
  devices,
  complaintOptions,
  defaultComplaint,
  session,
  onCancel,
  onSaved,
}: {
  patientId: string
  treatments: {
    id: string
    protocol_name: string
    status: string
    kind?: string
  }[]
  devices: { id: string; name: string }[]
  complaintOptions?: ComplaintOption[]
  defaultComplaint?: string | null
  session?: SessionFormValues
  onCancel?: () => void
  onSaved?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = Boolean(session)
  const active = treatments.filter((t) => t.status === "ativo")
  const treatmentChoices = (() => {
    if (!session?.treatment_id) return active
    const linked = treatments.find((t) => t.id === session.treatment_id)
    if (!linked) return active
    if (active.some((t) => t.id === linked.id)) return active
    return [linked, ...active]
  })()
  const defaultTreatmentId =
    session?.treatment_id ?? active[0]?.id ?? ""
  const options = resolveComplaintOptions(
    (complaintOptions ?? []).map((o) => o.value),
    session?.daily_complaint ?? defaultComplaint,
  )
  const treatmentLocked = Boolean(session?.paid)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setError(null)
    startTransition(async () => {
      try {
        if (isEdit && session) {
          await updateSession(fd)
          onSaved?.()
          router.refresh()
          return
        }
        const result = await createSession(fd)
        form.reset()
        router.refresh()
        if (result.offerSessionPayment && result.treatmentId) {
          router.push(
            `/pacientes/${result.patientId}?lancar=receita&tratamento=${result.treatmentId}&sessao=${result.id}`,
          )
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isEdit
              ? "Não foi possível atualizar a sessão."
              : "Não foi possível salvar a sessão.",
        )
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="patient_id" value={patientId} />
      {session && (
        <input type="hidden" name="session_id" value={session.id} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`session_date_${session?.id ?? "new"}`}>Data</Label>
          <Input
            id={`session_date_${session?.id ?? "new"}`}
            name="session_date"
            type="date"
            required
            defaultValue={session?.session_date ?? todayISO()}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`evolution_scale_${session?.id ?? "new"}`}>
            Escala (1–5)
          </Label>
          <Input
            id={`evolution_scale_${session?.id ?? "new"}`}
            name="evolution_scale"
            type="number"
            min={1}
            max={5}
            defaultValue={session?.evolution_scale ?? undefined}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`treatment_id_${session?.id ?? "new"}`}>
          Tratamento (opcional)
        </Label>
        {treatmentLocked ? (
          <>
            <input
              type="hidden"
              name="treatment_id"
              value={session?.treatment_id ?? ""}
            />
            <select
              id={`treatment_id_${session?.id ?? "new"}`}
              className="h-8 w-full rounded-lg border border-input bg-muted px-2 text-sm"
              disabled
              value={session?.treatment_id ?? ""}
            >
              <option value="">Sem vínculo</option>
              {treatmentChoices.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.protocol_name}
                  {t.kind === "avulso" ? " · por sessão" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Tratamento bloqueado porque esta sessão já tem pagamento
              registrado.
            </p>
          </>
        ) : (
          <select
            id={`treatment_id_${session?.id ?? "new"}`}
            name="treatment_id"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            defaultValue={defaultTreatmentId}
          >
            <option value="">Sem vínculo</option>
            {treatmentChoices.map((t) => (
              <option key={t.id} value={t.id}>
                {t.protocol_name}
                {t.kind === "avulso" ? " · por sessão" : ""}
                {t.status !== "ativo" ? ` · ${t.status}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`daily_complaint_${session?.id ?? "new"}`}>
          Queixa / foco do dia
        </Label>
        <select
          id={`daily_complaint_${session?.id ?? "new"}`}
          name="daily_complaint"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          defaultValue={
            session?.daily_complaint ?? defaultComplaint ?? ""
          }
        >
          <option value="">Mesma do cadastro / não informar</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`procedures_done_${session?.id ?? "new"}`}>
          Condutas realizadas
        </Label>
        <Textarea
          id={`procedures_done_${session?.id ?? "new"}`}
          name="procedures_done"
          defaultValue={session?.procedures_done ?? undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Aparelhos / modalidades</Label>
        <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
          {devices.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="device_ids"
                value={d.id}
                defaultChecked={session?.device_ids?.includes(d.id)}
              />
              {d.name}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`access_route_${session?.id ?? "new"}`}>
            Via / acessório
          </Label>
          <select
            id={`access_route_${session?.id ?? "new"}`}
            name="access_route"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            defaultValue={session?.access_route ?? "nao_aplicavel"}
          >
            <option value="nao_aplicavel">Não aplicável</option>
            <option value="sonda_vaginal">Sonda vaginal</option>
            <option value="sonda_anal">Sonda anal</option>
            <option value="eletrodo_superficie">Eletrodo de superfície</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`device_notes_${session?.id ?? "new"}`}>
            Obs. aparelho
          </Label>
          <Input
            id={`device_notes_${session?.id ?? "new"}`}
            name="device_notes"
            defaultValue={session?.device_notes ?? undefined}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`patient_response_${session?.id ?? "new"}`}>
          Resposta / observação
        </Label>
        <Textarea
          id={`patient_response_${session?.id ?? "new"}`}
          name="patient_response"
          defaultValue={session?.patient_response ?? undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`next_step_${session?.id ?? "new"}`}>
          Próximo passo
        </Label>
        <Input
          id={`next_step_${session?.id ?? "new"}`}
          name="next_step"
          defaultValue={session?.next_step ?? undefined}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? "Salvando…"
              : "Salvando…"
            : isEdit
              ? "Salvar alterações"
              : "Registrar sessão"}
        </Button>
        {isEdit && onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
      </div>
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
