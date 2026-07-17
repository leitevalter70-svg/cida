"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateTreatmentPlannedSessions } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TreatmentPlannedSessionsForm({
  treatmentId,
  plannedSessions,
}: {
  treatmentId: string
  plannedSessions: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateTreatmentPlannedSessions(treatmentId, fd)
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-2 flex flex-wrap items-end gap-2"
    >
      <div className="space-y-1">
        <Label htmlFor={`planned_sessions_${treatmentId}`}>
          Sessões do tratamento
        </Label>
        <Input
          id={`planned_sessions_${treatmentId}`}
          name="planned_sessions"
          type="number"
          min={1}
          required
          defaultValue={plannedSessions}
          className="w-28"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      <p className="basis-full text-xs text-muted-foreground">
        Base para cálculo de adesão e escala no relatório clínico.
      </p>
    </form>
  )
}
