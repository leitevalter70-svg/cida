"use client"

import { useTransition } from "react"
import { updateClinicalReport } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ClinicalReportEditor({
  reportId,
  treatmentId,
  synthesis,
  maintenance,
}: {
  reportId: string
  treatmentId: string
  synthesis: string | null
  maintenance: string | null
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("treatment_id", treatmentId)
    startTransition(async () => {
      await updateClinicalReport(reportId, fd)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="synthesis_text">Síntese (editável)</Label>
        <Textarea
          id="synthesis_text"
          name="synthesis_text"
          rows={4}
          defaultValue={synthesis ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="maintenance_guidance">Orientação de manutenção</Label>
        <Textarea
          id="maintenance_guidance"
          name="maintenance_guidance"
          rows={4}
          defaultValue={maintenance ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Salvando…" : "Salvar rascunho"}
      </Button>
    </form>
  )
}
