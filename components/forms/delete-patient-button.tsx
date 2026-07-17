"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deletePatient } from "@/lib/actions"
import { Button } from "@/components/ui/button"

export function DeletePatientButton({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        const ok = window.confirm(
          `Excluir permanentemente o paciente "${patientName}"?\n\nSerão removidos também tratamentos, sessões, relatórios, receitas e despesas ligados a ele. Esses valores saem do dashboard.`,
        )
        if (!ok) return
        startTransition(async () => {
          await deletePatient(patientId)
          router.push("/dashboard")
          router.refresh()
        })
      }}
    >
      {pending ? "Excluindo…" : "Excluir paciente"}
    </Button>
  )
}
