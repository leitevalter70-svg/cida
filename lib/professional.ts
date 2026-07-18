import { addDays, parseISO } from "date-fns"
import type { PaymentMethod } from "@/lib/types"

export const DEFAULT_PROFESSIONAL_NAME = "Maria Apárecida S. Leite"
export const DEFAULT_CREFITO = "82810F"

export type ProfessionalCredentials = {
  professionalName: string
  crefito: string
}

export function resolveCredentials(input?: {
  professional_name?: string | null
  crefito?: string | null
} | null): ProfessionalCredentials {
  return {
    professionalName:
      input?.professional_name?.trim() || DEFAULT_PROFESSIONAL_NAME,
    crefito: input?.crefito?.trim() || DEFAULT_CREFITO,
  }
}

export function formatCrefitoLine(crefito: string) {
  const value = crefito.trim()
  if (!value) return `CREFITO Nº ${DEFAULT_CREFITO}`
  if (/^CREFITO/i.test(value)) return value
  return `CREFITO Nº ${value}`
}

export function formatProfessionalBlock(creds: ProfessionalCredentials) {
  return `${creds.professionalName}\n${formatCrefitoLine(creds.crefito)}`
}

/** Data em que o valor deve entrar na prestação (recebimento financeiro). */
export function computeSettledAt(
  revenueDate: string,
  paymentMethod: PaymentMethod,
  creditSettlementDays = 30,
): string {
  if (paymentMethod !== "credito") return revenueDate
  try {
    return addDays(parseISO(revenueDate), creditSettlementDays)
      .toISOString()
      .slice(0, 10)
  } catch {
    return revenueDate
  }
}
