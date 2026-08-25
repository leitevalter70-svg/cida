import { formatData, formatBRL } from "@/lib/format"

export type PackageBalanceTreatment = {
  id: string
  total_amount?: number
}

export type PackageBalanceInstallment = {
  id: string
  treatment_id: string
  amount: number
  status: string
}

export type PackageBalanceRevenue = {
  treatment_id: string | null
  gross_amount: number
  revenue_date: string
}

export type PackageBalance = {
  amount: number
  count: number
  alreadyPaid: boolean
  paidAmount: number
  paidLabel: string | null
}

/**
 * Saldo em aberto do pacote para o formulário de receita.
 * - amount > 0: pode lançar (parcelas pendentes ou à vista)
 * - alreadyPaid: não lançar de novo; usar Corrigir
 */
export function packageBalanceFor(
  treatmentId: string,
  treatments: PackageBalanceTreatment[],
  installments: PackageBalanceInstallment[],
  revenues: PackageBalanceRevenue[],
): PackageBalance {
  const treatment = treatments.find((t) => t.id === treatmentId)
  const total = Number(treatment?.total_amount) || 0
  const forTreatment = installments.filter(
    (i) => !treatmentId || i.treatment_id === treatmentId,
  )
  const pending = forTreatment.filter((i) => i.status !== "paga")
  const treatmentRevenues = revenues.filter(
    (r) => r.treatment_id && r.treatment_id === treatmentId,
  )
  const paidAmount = treatmentRevenues.reduce(
    (s, r) => s + Number(r.gross_amount),
    0,
  )
  const latestPaid = treatmentRevenues[0]
  const paidLabel = latestPaid
    ? `${formatData(latestPaid.revenue_date)} · ${formatBRL(Number(latestPaid.gross_amount))}`
    : null

  if (pending.length > 0) {
    return {
      amount: pending.reduce((s, i) => s + Number(i.amount), 0),
      count: pending.length,
      alreadyPaid: false,
      paidAmount,
      paidLabel,
    }
  }

  const installmentsAllPaid =
    forTreatment.length > 0 && pending.length === 0
  const revenuesCoverPackage = total > 0 && paidAmount >= total - 0.009

  if (installmentsAllPaid || revenuesCoverPackage) {
    return {
      amount: 0,
      count: 0,
      alreadyPaid: true,
      paidAmount,
      paidLabel,
    }
  }

  if (forTreatment.length === 0 && paidAmount <= 0 && total > 0) {
    return {
      amount: total,
      count: 0,
      alreadyPaid: false,
      paidAmount: 0,
      paidLabel: null,
    }
  }

  return {
    amount: 0,
    count: 0,
    alreadyPaid: paidAmount > 0,
    paidAmount,
    paidLabel,
  }
}
