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
  const [kind, setKind] = useState<"pacote" | "avulso">("pacote")
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setError(null)
    startTransition(async () => {
      try {
        const result = await createTreatment(fd)
        const kind = String(fd.get("kind") || "pacote")
        if (kind === "avulso") {
          router.push(`/pacientes/${result.patientId}`)
        } else {
          router.push(
            `/pacientes/${result.patientId}?lancar=receita&tratamento=${result.id}`,
          )
        }
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível salvar o tratamento.",
        )
      }
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
          value={kind}
          onChange={(e) => setKind(e.target.value as "pacote" | "avulso")}
        >
          <option value="pacote">Pacote fechado (parcelas)</option>
          <option value="avulso">Avulso (por sessão)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {kind === "avulso"
            ? "Cada sessão paga gera uma receita — não cria parcelas nem acumula no pacote."
            : "Valor total dividido em parcelas. Sessões clínicas não geram pagamento automático."}
        </p>
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
          <Label htmlFor="total_amount">
            {kind === "avulso" ? "Valor por sessão (R$)" : "Valor total do pacote (R$)"}
          </Label>
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
            disabled={kind === "avulso"}
          />
          <p className="text-xs text-muted-foreground">
            {kind === "avulso"
              ? "Não se aplica ao pagamento por sessão."
              : "Vencimentos semanais a partir do início (PIX/dinheiro)."}
          </p>
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
        {pending ? "Salvando…" : "Criar e lançar receita"}
      </Button>
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
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
