"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createPatient, updatePatient } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  COMPLAINT_FOCUSES,
  resolveComplaintOptions,
  type ComplaintOption,
} from "@/lib/clinical/complaints"

function isKnownComplaintValue(
  value: string | null | undefined,
  optionValues: string[],
) {
  if (!value?.trim()) return false
  const v = value.trim().toLowerCase()
  return optionValues.some((o) => o.toLowerCase() === v)
}

function initialComplaintSelection(
  saved: string | null | undefined,
  optionValues: string[],
) {
  if (!saved?.trim()) return ""
  if (isKnownComplaintValue(saved, optionValues) && saved.trim().toLowerCase() !== "outro") {
    const match = optionValues.find(
      (o) => o.toLowerCase() === saved.trim().toLowerCase(),
    )
    return match ?? saved
  }
  return "Outro"
}

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
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(
    () =>
      resolveComplaintOptions(
        (complaintOptions ?? []).map((o) => o.value),
      ),
    [complaintOptions],
  )
  const [complaintSelect, setComplaintSelect] = useState(() =>
    initialComplaintSelection(patient?.complaint_focus, [
      ...COMPLAINT_FOCUSES.map((c) => c.value),
      ...(complaintOptions ?? []).map((o) => o.value),
    ]),
  )
  const [complaintOther, setComplaintOther] = useState(() => {
    const saved = patient?.complaint_focus?.trim() ?? ""
    if (!saved) return ""
    if (saved.toLowerCase() === "outro") return ""
    const known = [
      ...COMPLAINT_FOCUSES.map((c) => c.value),
      ...(complaintOptions ?? []).map((o) => o.value),
    ]
    return isKnownComplaintValue(saved, known) ? "" : saved
  })
  const showOtherField = complaintSelect === "Outro"

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    if (complaintSelect === "Outro") {
      const other = complaintOther.trim()
      if (!other) {
        setError("Informe a queixa por escrito na opção Outro.")
        return
      }
      fd.set("complaint_focus", other)
    } else {
      fd.set("complaint_focus", complaintSelect)
    }

    setError(null)
    startTransition(async () => {
      try {
        if (patient) {
          await updatePatient(patient.id, fd)
          router.refresh()
          return
        }

        const result = await createPatient(fd)
        if (!result.ok) {
          const by =
            result.reason === "telefone"
              ? "mesmo telefone"
              : result.reason === "email"
                ? "mesmo e-mail"
                : "mesmo nome"
          setError(
            `Paciente já cadastrado (${by}): ${result.existingName}. Abrindo a ficha existente…`,
          )
          router.push(`/pacientes/${result.existingId}`)
          return
        }

        router.push(`/tratamentos?paciente=${result.id}`)
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível salvar.",
        )
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
          required
          value={complaintSelect}
          onChange={(e) => setComplaintSelect(e.target.value)}
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
        {showOtherField && (
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="complaint_other">Descreva a queixa</Label>
            <Textarea
              id="complaint_other"
              value={complaintOther}
              onChange={(e) => setComplaintOther(e.target.value)}
              required
              placeholder="Ex.: constipação crônica, fístula, cicatriz de episiotomia…"
              rows={2}
            />
          </div>
        )}
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
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full"
          defaultValue={patient?.email ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={patient?.notes ?? ""}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending
          ? "Salvando…"
          : patient
            ? "Atualizar"
            : "Cadastrar e ir ao tratamento"}
      </Button>
    </form>
  )
}
