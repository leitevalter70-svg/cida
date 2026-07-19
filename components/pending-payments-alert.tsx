"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatBRL, formatData } from "@/lib/format"
import type { PendingPaymentAlertItem } from "@/lib/data/pending-payments"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "cida-pagamento-alerta-dismissed"

function urgencyLabel(urgency: PendingPaymentAlertItem["urgency"]) {
  switch (urgency) {
    case "atrasada":
      return "Atrasada"
    case "hoje":
      return "Vence hoje"
    case "semana":
      return "Esta semana"
    default:
      return "Em aberto"
  }
}

function urgencyBadgeClass(urgency: PendingPaymentAlertItem["urgency"]) {
  switch (urgency) {
    case "atrasada":
      return "border-destructive/40 bg-destructive/15 text-destructive"
    case "hoje":
      return "border-primary/40 bg-primary/15 text-primary"
    case "semana":
      return "border-accent-foreground/20 bg-accent text-accent-foreground"
    default:
      return ""
  }
}

export function PendingPaymentsAlert({
  items,
}: {
  items: PendingPaymentAlertItem[]
}) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (items.length === 0) {
      setHidden(true)
      return
    }
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      const today = new Date().toISOString().slice(0, 10)
      setHidden(dismissed === today)
    } catch {
      setHidden(false)
    }
  }, [items.length])

  if (items.length === 0 || hidden) return null

  function dismiss() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        new Date().toISOString().slice(0, 10),
      )
    } catch {
      /* ignore */
    }
    setHidden(true)
  }

  const overdue = items.filter((i) => i.urgency === "atrasada").length

  return (
    <section
      role="alert"
      aria-live="polite"
      className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-accent/40 shadow-sm"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
              Cobrança · PIX / dinheiro
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight">
              Pagamentos a cobrar
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} paciente{items.length === 1 ? "" : "s"} com parcela
              pendente
              {overdue > 0
                ? ` · ${overdue} atrasada${overdue === 1 ? "" : "s"}`
                : ""}
              . Cobrança semanal ou por sessão.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground",
            )}
          >
            Lembrar amanhã
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.installmentId}
              className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{item.patientName}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[0.7rem]",
                      urgencyBadgeClass(item.urgency),
                    )}
                  >
                    {urgencyLabel(item.urgency)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.protocolName} · parcela {item.sequenceNumber}/
                  {item.installmentCount} · {formatBRL(item.amount)}
                  {item.dueDate ? ` · venc. ${formatData(item.dueDate)}` : ""}
                </p>
              </div>
              <Link
                href={`/pacientes/${item.patientId}?lancar=receita&tratamento=${item.treatmentId}`}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "shrink-0 self-start sm:self-center",
                )}
              >
                Lançar pagamento
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
