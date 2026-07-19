"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createSession } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { todayISO } from "@/lib/format"
import {
  resolveComplaintOptions,
  type ComplaintOption,
} from "@/lib/clinical/complaints"

export function SessionForm({
  patientId,
  treatments,
  devices,
  complaintOptions,
  defaultComplaint,
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
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const active = treatments.filter((t) => t.status === "ativo")
  const defaultTreatmentId = active[0]?.id ?? ""
  const options = resolveComplaintOptions(
    (complaintOptions ?? []).map((o) => o.value),
    defaultComplaint,
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setError(null)
    startTransition(async () => {
      try {
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
            : "Não foi possível salvar a sessão.",
        )
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="patient_id" value={patientId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="session_date">Data</Label>
          <Input
            id="session_date"
            name="session_date"
            type="date"
            required
            defaultValue={todayISO()}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evolution_scale">Escala (1–5)</Label>
          <Input
            id="evolution_scale"
            name="evolution_scale"
            type="number"
            min={1}
            max={5}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="treatment_id">Tratamento (opcional)</Label>
        <select
          id="treatment_id"
          name="treatment_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          defaultValue={defaultTreatmentId}
        >
          <option value="">Sem vínculo</option>
          {active.map((t) => (
            <option key={t.id} value={t.id}>
              {t.protocol_name}
              {t.kind === "avulso" ? " · por sessão" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="daily_complaint">Queixa / foco do dia</Label>
        <select
          id="daily_complaint"
          name="daily_complaint"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          defaultValue={defaultComplaint ?? ""}
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
        <Label htmlFor="procedures_done">Condutas realizadas</Label>
        <Textarea id="procedures_done" name="procedures_done" />
      </div>
      <div className="space-y-1.5">
        <Label>Aparelhos / modalidades</Label>
        <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
          {devices.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="device_ids" value={d.id} />
              {d.name}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="access_route">Via / acessório</Label>
          <select
            id="access_route"
            name="access_route"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            defaultValue="nao_aplicavel"
          >
            <option value="nao_aplicavel">Não aplicável</option>
            <option value="sonda_vaginal">Sonda vaginal</option>
            <option value="sonda_anal">Sonda anal</option>
            <option value="eletrodo_superficie">Eletrodo de superfície</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="device_notes">Obs. aparelho</Label>
          <Input id="device_notes" name="device_notes" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="patient_response">Resposta / observação</Label>
        <Textarea id="patient_response" name="patient_response" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="next_step">Próximo passo</Label>
        <Input id="next_step" name="next_step" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Registrar sessão"}
      </Button>
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
