"use client"

import { useState, useTransition } from "react"
import { createTreatment, completeTreatment } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { todayISO } from "@/lib/format"

export function TreatmentForm({
  patients,
  defaultPatientId = "",
}: {
  patients: { id: string; full_name: string }[]
  defaultPatientId?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [patientId, setPatientId] = useState(defaultPatientId)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const result = await createTreatment(fd)
      router.push(
        `/receitas?paciente=${result.patientId}&tratamento=${result.id}`,
      )
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="patient_id">Paciente</Label>
        <select
          id="patient_id"
          name="patient_id"
          required
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Selecione</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kind">Modelo</Label>
        <select
          id="kind"
          name="kind"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          defaultValue="pacote"
        >
          <option value="pacote">Pacote fechado</option>
          <option value="avulso">Avulso</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="protocol_name">Protocolo / nome</Label>
        <Input
          id="protocol_name"
          name="protocol_name"
          required
          placeholder="Ex.: Protocolo IUE 10 sessões"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="planned_sessions">Sessões previstas</Label>
          <Input
            id="planned_sessions"
            name="planned_sessions"
            type="number"
            min={1}
            defaultValue={10}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="total_amount">Valor total (R$)</Label>
          <Input
            id="total_amount"
            name="total_amount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={0}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="installment_count">Parcelas (pacote)</Label>
          <Input
            id="installment_count"
            name="installment_count"
            type="number"
            min={1}
            defaultValue={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="started_at">Início</Label>
          <Input
            id="started_at"
            name="started_at"
            type="date"
            defaultValue={todayISO()}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Criar e ir à receita"}
      </Button>
    </form>
  )
}

export function CompleteTreatmentButton({
  treatmentId,
}: {
  treatmentId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const reportId = await completeTreatment(treatmentId)
          router.push(`/relatorios/clinico/${treatmentId}`)
          router.refresh()
          void reportId
        })
      }
    >
      {pending ? "Gerando…" : "Alta + relatório clínico"}
    </Button>
  )
}
