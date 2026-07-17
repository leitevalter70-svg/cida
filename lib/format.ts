import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

export function formatData(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return iso
  }
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
