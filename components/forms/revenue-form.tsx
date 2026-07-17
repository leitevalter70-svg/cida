"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createRevenue } from "@/lib/actions"
import {
  calculateSplit,
  isCardPayment,
  paymentMethodLabel,
} from "@/lib/finance/split"
import type { ClinicBaseMode, PaymentMethod } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatBRL, todayISO } from "@/lib/format"

type Settings = {
  clinic_percent: number
  card_fee_percent: number
  default_clinic_base_mode: ClinicBaseMode
  default_clinic_shares_card_fee: boolean
}

type Treatment = {
  id: string
  patient_id: string
  protocol_name: string
  kind?: string
  total_amount?: number
}
type Installment = {
  id: string
  treatment_id: string
  sequence_number: number
  amount: number
  status: string
}

function suggestFromCadastro(
  treatmentId: string,
  treatments: Treatment[],
  installments: Installment[],
) {
  const pendingForTreatment = installments.filter(
    (i) =>
      i.status !== "paga" &&
      (!treatmentId || i.treatment_id === treatmentId),
  )
  const first = pendingForTreatment[0]
  if (first) {
    return {
      installmentId: first.id,
      gross: Number(first.amount),
    }
  }

  const treatment = treatments.find((t) => t.id === treatmentId)
  if (treatment && Number(treatment.total_amount) > 0) {
    return {
      installmentId: "",
      gross: Number(treatment.total_amount),
    }
  }

  return { installmentId: "", gross: 0 }
}

export function RevenueForm({
  patientId,
  patientName,
  treatments,
  installments,
  settings,
  defaultTreatmentId = "",
  redirectTo,
}: {
  patientId: string
  patientName?: string
  treatments: Treatment[]
  installments: Installment[]
  settings: Settings | null
  defaultTreatmentId?: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const initialTreatmentId =
    defaultTreatmentId ||
    treatments.find((t) => t.patient_id === patientId)?.id ||
    ""
  const initial = suggestFromCadastro(
    initialTreatmentId,
    treatments,
    installments,
  )

  const [gross, setGross] = useState(initial.gross)
  const [installmentId, setInstallmentId] = useState(initial.installmentId)
  const [method, setMethod] = useState<PaymentMethod>("pix")
  const [clinicPercent, setClinicPercent] = useState(
    Number(settings?.clinic_percent ?? 30),
  )
  const [cardPercent, setCardPercent] = useState(
    Number(settings?.card_fee_percent ?? 3.5),
  )
  const [baseMode, setBaseMode] = useState<ClinicBaseMode>(
    settings?.default_clinic_base_mode ?? "without_fee",
  )
  const [sharesFee, setSharesFee] = useState(
    settings?.default_clinic_shares_card_fee ?? false,
  )
  const [treatmentId, setTreatmentId] = useState(initialTreatmentId)

  const cardApplies = isCardPayment(method)

  const split = useMemo(
    () =>
      calculateSplit({
        grossAmount: gross,
        clinicPercent,
        cardFeePercent: cardPercent,
        paymentMethod: method,
        clinicBaseMode: baseMode,
        clinicSharesCardFee: sharesFee,
      }),
    [gross, clinicPercent, cardPercent, method, baseMode, sharesFee],
  )

  const patientTreatments = treatments.filter((t) => t.patient_id === patientId)
  const filteredInstallments = installments.filter(
    (i) =>
      i.status !== "paga" &&
      (!treatmentId || i.treatment_id === treatmentId),
  )

  function applyCadastroSuggestion(nextTreatmentId: string) {
    const suggested = suggestFromCadastro(
      nextTreatmentId,
      treatments,
      installments,
    )
    setInstallmentId(suggested.installmentId)
    setGross(suggested.gross)
  }

  function onTreatmentChange(nextId: string) {
    setTreatmentId(nextId)
    applyCadastroSuggestion(nextId)
  }

  function onInstallmentChange(nextId: string) {
    setInstallmentId(nextId)
    if (!nextId) {
      const treatment = treatments.find((t) => t.id === treatmentId)
      setGross(Number(treatment?.total_amount) || 0)
      return
    }
    const inst = installments.find((i) => i.id === nextId)
    if (inst) setGross(Number(inst.amount))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const usesCard = isCardPayment(method)
    fd.set("patient_id", patientId)
    fd.set("treatment_id", treatmentId)
    fd.set("installment_id", installmentId)
    fd.set("clinic_shares_card_fee", usesCard && sharesFee ? "true" : "false")
    fd.set("clinic_percent", String(clinicPercent))
    fd.set("card_fee_percent", String(usesCard ? cardPercent : 0))
    fd.set("payment_method", method)
    fd.set("clinic_base_mode", usesCard ? baseMode : "without_fee")
    fd.set("gross_amount", String(gross))
    startTransition(async () => {
      await createRevenue(fd)
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
      form.reset()
      const next = suggestFromCadastro(
        defaultTreatmentId,
        treatments,
        installments.filter((i) => i.id !== installmentId),
      )
      setGross(next.gross)
      setInstallmentId(next.installmentId)
      setMethod("pix")
      setTreatmentId(defaultTreatmentId || initialTreatmentId)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="patient_id" value={patientId} />
      {patientName && (
        <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
          Paciente: <span className="font-medium">{patientName}</span>
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="treatment_id">Tratamento</Label>
        <select
          id="treatment_id"
          name="treatment_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          value={treatmentId}
          onChange={(e) => onTreatmentChange(e.target.value)}
        >
          <option value="">Opcional</option>
          {patientTreatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.protocol_name}
              {Number(t.total_amount) > 0
                ? ` · ${formatBRL(Number(t.total_amount))}`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="installment_id">Parcela</Label>
        <select
          id="installment_id"
          name="installment_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          value={installmentId}
          onChange={(e) => onInstallmentChange(e.target.value)}
        >
          <option value="">Avulso / sem parcela</option>
          {filteredInstallments.map((i) => (
            <option key={i.id} value={i.id}>
              {i.sequence_number}ª · {formatBRL(Number(i.amount))}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="revenue_date">Data</Label>
          <Input
            id="revenue_date"
            name="revenue_date"
            type="date"
            required
            defaultValue={todayISO()}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gross_amount">Valor bruto (R$)</Label>
          <Input
            id="gross_amount"
            type="number"
            step="0.01"
            min={0}
            required
            value={gross || ""}
            onChange={(e) => setGross(Number(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Vem do tratamento/parcela — você pode alterar só neste lançamento.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payment_method">Forma de pagamento</Label>
        <select
          id="payment_method"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        >
          {(
            ["pix", "dinheiro", "debito", "credito", "outro"] as PaymentMethod[]
          ).map((m) => (
            <option key={m} value={m}>
              {paymentMethodLabel(m)}
            </option>
          ))}
        </select>
        {!cardApplies && (
          <p className="text-xs text-muted-foreground">
            Sem taxa de cartão em PIX, Dinheiro ou Outro.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="clinic_percent">% clínica</Label>
          <Input
            id="clinic_percent"
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={clinicPercent}
            onChange={(e) => setClinicPercent(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card_fee_percent">% cartão</Label>
          <Input
            id="card_fee_percent"
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={cardPercent}
            onChange={(e) => setCardPercent(Number(e.target.value))}
          />
        </div>
      </div>

      {cardApplies && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="clinic_base_mode">Base do % clínica</Label>
            <select
              id="clinic_base_mode"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              value={baseMode}
              onChange={(e) => setBaseMode(e.target.value as ClinicBaseMode)}
            >
              <option value="without_fee">Sem taxa do cartão na base</option>
              <option value="with_fee">Com taxa do cartão na base</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sharesFee}
              onChange={(e) => setSharesFee(e.target.checked)}
            />
            Clínica rateia a taxa do cartão
          </label>
        </>
      )}

      <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
        <p className="font-medium">Preview do rateio</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {cardApplies && (
            <li>
              Taxa cartão: {formatBRL(split.cardFeeAmount)}
              {gross > 0 ? ` (${cardPercent}% de ${formatBRL(gross)})` : ""}
            </li>
          )}
          <li>Base clínica: {formatBRL(split.clinicBaseAmount)}</li>
          <li>Clínica (líquido): {formatBRL(split.clinicNetAmount)}</li>
          <li>
            Profissional (líquido): {formatBRL(split.professionalNetAmount)}
          </li>
          {cardApplies && (
            <li>
              Taxa absorvida — clínica {formatBRL(split.clinicFeeShare)} /{" "}
              profissional {formatBRL(split.professionalFeeShare)}
            </li>
          )}
        </ul>
      </div>

      <Button type="submit" disabled={pending || gross <= 0}>
        {pending ? "Salvando…" : "Lançar receita"}
      </Button>
    </form>
  )
}
