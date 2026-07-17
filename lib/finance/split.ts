import type { ClinicBaseMode, PaymentMethod } from "@/lib/types"

export type SplitInput = {
  grossAmount: number
  clinicPercent: number
  cardFeePercent: number
  paymentMethod: PaymentMethod
  clinicBaseMode: ClinicBaseMode
  clinicSharesCardFee: boolean
}

export type SplitResult = {
  cardFeeAmount: number
  clinicBaseAmount: number
  clinicGrossShare: number
  professionalGrossShare: number
  clinicFeeShare: number
  professionalFeeShare: number
  clinicNetAmount: number
  professionalNetAmount: number
  netAfterCard: number
}

const CARD_METHODS: PaymentMethod[] = ["debito", "credito"]

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Financial split per PRD §6.1.
 * Base mode and fee-sharing are independent; snapshot on each revenue.
 */
export function calculateSplit(input: SplitInput): SplitResult {
  const gross = Math.max(0, Number(input.grossAmount) || 0)
  const clinicPct =
    Math.min(100, Math.max(0, Number(input.clinicPercent) || 0)) / 100
  const cardPct =
    Math.min(100, Math.max(0, Number(input.cardFeePercent) || 0)) / 100

  const appliesCardFee = CARD_METHODS.includes(input.paymentMethod)
  const cardFeeAmount = appliesCardFee ? round2(gross * cardPct) : 0
  const netAfterCard = round2(gross - cardFeeAmount)

  const clinicBaseAmount =
    input.clinicBaseMode === "with_fee" ? netAfterCard : gross

  const clinicGrossShare = round2(clinicBaseAmount * clinicPct)
  const professionalGrossShare = round2(netAfterCard - clinicGrossShare)

  let clinicFeeShare = 0
  let professionalFeeShare = cardFeeAmount

  if (input.clinicSharesCardFee && cardFeeAmount > 0) {
    clinicFeeShare = round2(cardFeeAmount * clinicPct)
    professionalFeeShare = round2(cardFeeAmount - clinicFeeShare)
  } else {
    clinicFeeShare = 0
    professionalFeeShare = cardFeeAmount
  }

  const clinicNetAmount = round2(clinicGrossShare - clinicFeeShare)
  const professionalNetAmount = round2(
    professionalGrossShare - professionalFeeShare,
  )

  return {
    cardFeeAmount,
    clinicBaseAmount: round2(clinicBaseAmount),
    clinicGrossShare,
    professionalGrossShare,
    clinicFeeShare,
    professionalFeeShare,
    clinicNetAmount,
    professionalNetAmount,
    netAfterCard,
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    debito: "Débito",
    credito: "Crédito",
    outro: "Outro",
  }
  return labels[method]
}

export function clinicBaseModeLabel(mode: ClinicBaseMode): string {
  return mode === "with_fee"
    ? "% clínica sobre valor com taxa"
    : "% clínica sobre valor sem taxa"
}
