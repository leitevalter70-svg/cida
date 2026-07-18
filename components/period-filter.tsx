"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"

export type PrestacaoPor = "pagamento" | "recebimento"

export function PeriodFilter({
  from,
  to,
  basePath = "/dashboard",
  por,
}: {
  from: string
  to: string
  basePath?: string
  /** Preserva o modo da prestação nos links de período */
  por?: PrestacaoPor
}) {
  const router = useRouter()

  function href(nextFrom: string, nextTo: string) {
    const qs = new URLSearchParams({ from: nextFrom, to: nextTo })
    if (por) qs.set("por", por)
    return `${basePath}?${qs.toString()}`
  }

  function applyPreset(preset: "month" | "prev" | "today") {
    const now = new Date()
    if (preset === "today") {
      const d = format(now, "yyyy-MM-dd")
      router.push(href(d, d))
      return
    }
    if (preset === "prev") {
      const prev = subMonths(now, 1)
      router.push(
        href(
          format(startOfMonth(prev), "yyyy-MM-dd"),
          format(endOfMonth(prev), "yyyy-MM-dd"),
        ),
      )
      return
    }
    router.push(
      href(
        format(startOfMonth(now), "yyyy-MM-dd"),
        format(endOfMonth(now), "yyyy-MM-dd"),
      ),
    )
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    router.push(href(String(fd.get("from")), String(fd.get("to"))))
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => applyPreset("today")}
        >
          Hoje
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => applyPreset("month")}
        >
          Este mês
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => applyPreset("prev")}
        >
          Mês anterior
        </Button>
      </div>
    </form>
  )
}

export function PrestacaoModeToggle({
  from,
  to,
  por,
}: {
  from: string
  to: string
  por: PrestacaoPor
}) {
  const modes: { id: PrestacaoPor; label: string; hint: string }[] = [
    {
      id: "pagamento",
      label: "Por pagamento",
      hint: "Faturamento do período (data em que a paciente pagou)",
    },
    {
      id: "recebimento",
      label: "Por recebimento",
      hint: "Quando o valor cai na conta (crédito ≈ +30 dias)",
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <Link
            key={m.id}
            href={`/prestacao?from=${from}&to=${to}&por=${m.id}`}
            className={cn(
              "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
              por === m.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary",
            )}
          >
            {m.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {modes.find((m) => m.id === por)?.hint}
      </p>
    </div>
  )
}
