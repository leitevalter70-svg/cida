"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"

export function PeriodFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter()

  function applyPreset(preset: "month" | "prev" | "today") {
    const now = new Date()
    if (preset === "today") {
      const d = format(now, "yyyy-MM-dd")
      router.push(`/dashboard?from=${d}&to=${d}`)
      return
    }
    if (preset === "prev") {
      const prev = subMonths(now, 1)
      router.push(
        `/dashboard?from=${format(startOfMonth(prev), "yyyy-MM-dd")}&to=${format(endOfMonth(prev), "yyyy-MM-dd")}`,
      )
      return
    }
    router.push(
      `/dashboard?from=${format(startOfMonth(now), "yyyy-MM-dd")}&to=${format(endOfMonth(now), "yyyy-MM-dd")}`,
    )
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    router.push(
      `/dashboard?from=${fd.get("from")}&to=${fd.get("to")}`,
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="from">De</Label>
        <Input id="from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="to">Até</Label>
        <Input id="to" name="to" type="date" defaultValue={to} />
      </div>
      <Button type="submit" size="sm">
        Filtrar
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => applyPreset("today")}>
          Hoje
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => applyPreset("month")}>
          Este mês
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => applyPreset("prev")}>
          Mês anterior
        </Button>
      </div>
    </form>
  )
}
