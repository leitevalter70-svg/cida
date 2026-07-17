"use client"

import { useTransition } from "react"
import { createPatient, updatePatient } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  resolveComplaintOptions,
  type ComplaintOption,
} from "@/lib/clinical/complaints"

export function PatientForm({
  patient,
  complaintOptions,
}: {
  patient?: {
    id: string
    full_name: string
    birth_date: string | null
    age_years: number | null
    sex: string
    phone: string | null
    email: string | null
    complaint_focus: string | null
    notes: string | null
    status: string
  }
  complaintOptions?: ComplaintOption[]
}) {
  const [pending, startTransition] = useTransition()
  const options = resolveComplaintOptions(
    (complaintOptions ?? []).map((o) => o.value),
    patient?.complaint_focus,
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      if (patient) await updatePatient(patient.id, fd)
      else {
        await createPatient(fd)
        form.reset()
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nome</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={patient?.full_name}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="age_years">Idade</Label>
          <Input
            id="age_years"
            name="age_years"
            type="number"
            min={0}
            defaultValue={patient?.age_years ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sex">Sexo</Label>
          <select
            id="sex"
            name="sex"
            defaultValue={patient?.sex || "feminino"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="outro">Outro</option>
            <option value="nao_informado">Não informado</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="complaint_focus">Queixa / foco</Label>
        <select
          id="complaint_focus"
          name="complaint_focus"
          required
          defaultValue={patient?.complaint_focus ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="" disabled>
            Selecione a queixa
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={patient?.phone ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={patient?.status || "ativo"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="ativo">Ativo</option>
            <option value="em_tratamento">Em tratamento</option>
            <option value="alta">Alta</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={patient?.notes ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : patient ? "Atualizar" : "Cadastrar"}
      </Button>
    </form>
  )
}
