"use client"

import { useTransition } from "react"
import { createExpense } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { todayISO } from "@/lib/format"

export function ExpenseForm({
  categories,
  patients,
}: {
  categories: { id: string; name: string }[]
  patients: { id: string; full_name: string }[]
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      await createExpense(fd)
      form.reset()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="expense_date">Data</Label>
        <Input
          id="expense_date"
          name="expense_date"
          type="date"
          required
          defaultValue={todayISO()}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min={0}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="patient_id">Paciente (opcional)</Label>
        <select
          id="patient_id"
          name="patient_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">—</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Registrar despesa"}
      </Button>
    </form>
  )
}
