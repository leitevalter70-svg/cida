"use client"

import { useMemo, useState, useTransition } from "react"
import { createRevenue } from "@/lib/actions"
import { calculateSplit, paymentMethodLabel } from "@/lib/finance/split"
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

export function RevenueForm({
  patients,
  treatments,
  installments,
  settings,
  defaultPatientId = "",
  defaultTreatmentId = "",
}: {
  patients: { id: string; full_name: string }[]
  treatments: { id: string; patient_id: string; protocol_name: string }[]
  installments: {
    id: string
    treatment_id: string
    sequence_number: number
    amount: number
    status: string
  }[]
  settings: Settings | null
  defaultPatientId?: string
  defaultTreatmentId?: string
}) {
  const [pending, startTransition] = useTransition()
  const [gross, setGross] = useState(0)
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
  const [patientId, setPatientId] = useState(defaultPatientId)
  const [treatmentId, setTreatmentId] = useState(defaultTreatmentId)

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

  const filteredTreatments = treatments.filter(
    (t) => !patientId || t.patient_id === patientId,
  )
  const filteredInstallments = installments.filter(
    (i) =>
      i.status !== "paga" &&
      (!treatmentId || i.treatment_id === treatmentId),
  )

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set("clinic_shares_card_fee", sharesFee ? "true" : "false")
    startTransition(async () => {
      await createRevenue(fd)
      form.reset()
      setGross(0)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="patient_id">Paciente</Label>
        <select
          id="patient_id"
          name="patient_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          value={patientId}
          onChange={(e) => {
            setPatientId(e.target.value)
            setTreatmentId("")
          }}
        >
          <option value="">Opcional</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="treatment_id">Tratamento</Label>
        <select
          id="treatment_id"
          name="treatment_id"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          value={treatmentId}
          onChange={(e) => setTreatmentId(e.target.value)}
        >
          <option value="">Opcional</option>
          {filteredTreatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.protocol_name}
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
          onChange={(e) => {
            const inst = installments.find((i) => i.id === e.target.value)
            if (inst) setGross(Number(inst.amount))
          }}
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
            name="gross_amount"
            type="number"
            step="0.01"
            min={0}
            required
            value={gross || ""}
            onChange={(e) => setGross(Number(e.target.value) || 0)}
          />
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
          name="payment_method"
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="clinic_percent">% clínica</Label>
          <Input
            id="clinic_percent"
            name="clinic_percent"
            type="number"
            step="0.01"
            value={clinicPercent}
            onChange={(e) => setClinicPercent(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card_fee_percent">% cartão</Label>
          <Input
            id="card_fee_percent"
            name="card_fee_percent"
            type="number"
            step="0.01"
            value={cardPercent}
            onChange={(e) => setCardPercent(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clinic_base_mode">Base do % clínica</Label>
        <select
          id="clinic_base_mode"
          name="clinic_base_mode"
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

      <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
        <p className="font-medium">Preview do rateio</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>Taxa cartão: {formatBRL(split.cardFeeAmount)}</li>
          <li>Base clínica: {formatBRL(split.clinicBaseAmount)}</li>
          <li>Clínica (líquido): {formatBRL(split.clinicNetAmount)}</li>
          <li>Profissional (líquido): {formatBRL(split.professionalNetAmount)}</li>
          <li>
            Taxa absorvida — clínica {formatBRL(split.clinicFeeShare)} /{" "}
            profissional {formatBRL(split.professionalFeeShare)}
          </li>
        </ul>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Lançar receita"}
      </Button>
    </form>
  )
}
