"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createRevenue,
  updateRevenue,
  deleteRevenue,
} from "@/lib/actions"
import {
  calculateSplit,
  isCardPayment,
  paymentMethodLabel,
} from "@/lib/finance/split"
import type { ClinicBaseMode, PaymentMethod } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatBRL, formatData, todayISO } from "@/lib/format"

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

export type RevenueRecord = {
  id: string
  treatment_id: string | null
  installment_id: string | null
  revenue_date: string
  description: string | null
  gross_amount: number
  payment_method: PaymentMethod
  clinic_percent: number
  card_fee_percent: number
  clinic_base_mode: ClinicBaseMode
  clinic_shares_card_fee: boolean
  card_fee_amount: number
  clinic_net_amount: number
  professional_net_amount: number
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

export function PatientRevenuePanel({
  patientId,
  patientName,
  treatments,
  installments,
  settings,
  revenues,
  defaultTreatmentId = "",
  highlight = false,
}: {
  patientId: string
  patientName: string
  treatments: Treatment[]
  installments: Installment[]
  settings: Settings | null
  revenues: RevenueRecord[]
  defaultTreatmentId?: string
  highlight?: boolean
}) {
  const [editing, setEditing] = useState<RevenueRecord | null>(null)

  return (
    <div
      id="lancar-receita"
      className={
        highlight
          ? "grid grid-cols-1 gap-6 rounded-xl ring-2 ring-primary/40 ring-offset-2 lg:grid-cols-2"
          : "grid grid-cols-1 gap-6 lg:grid-cols-2"
      }
    >
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-4 pt-4">
          <h3 className="text-base font-semibold">
            {editing
              ? "Corrigir receita"
              : highlight
                ? "Lançar receita deste paciente"
                : "Nova receita"}
          </h3>
          {editing && (
            <p className="mt-1 text-xs text-muted-foreground">
              Altere só o necessário — não cria outro lançamento.
            </p>
          )}
        </div>
        <div className="p-4">
          <RevenueForm
            key={editing?.id ?? `new-${defaultTreatmentId}`}
            patientId={patientId}
            patientName={patientName}
            treatments={treatments}
            installments={installments}
            settings={settings}
            defaultTreatmentId={defaultTreatmentId}
            revenue={editing}
            onCancelEdit={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-4 pt-4">
          <h3 className="text-base font-semibold">Receitas deste paciente</h3>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {revenues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma receita lançada ainda.
            </p>
          ) : (
            revenues.map((r) => (
              <RevenueListItem
                key={r.id}
                revenue={r}
                isEditing={editing?.id === r.id}
                onEdit={() => setEditing(r)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function RevenueListItem({
  revenue,
  isEditing,
  onEdit,
}: {
  revenue: RevenueRecord
  isEditing: boolean
  onEdit: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{revenue.description || "Receita"}</p>
          <p className="text-xs text-muted-foreground">
            {formatData(revenue.revenue_date)} ·{" "}
            {paymentMethodLabel(revenue.payment_method)}
          </p>
        </div>
        <p className="font-semibold">
          {formatBRL(Number(revenue.gross_amount))}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline">
          Clínica {formatBRL(Number(revenue.clinic_net_amount))}
        </Badge>
        <Badge variant="outline">
          Você {formatBRL(Number(revenue.professional_net_amount))}
        </Badge>
        {Number(revenue.card_fee_amount) > 0 && (
          <Badge variant="secondary">
            Cartão {formatBRL(Number(revenue.card_fee_amount))}
          </Badge>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={isEditing ? "default" : "outline"}
          onClick={onEdit}
        >
          {isEditing ? "Editando…" : "Corrigir"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "Excluir este lançamento? A parcela vinculada volta a pendente, se houver.",
              )
            ) {
              return
            }
            startTransition(async () => {
              await deleteRevenue(revenue.id)
              router.refresh()
            })
          }}
        >
          {pending ? "Excluindo…" : "Excluir"}
        </Button>
      </div>
    </div>
  )
}

function RevenueForm({
  patientId,
  patientName,
  treatments,
  installments,
  settings,
  defaultTreatmentId = "",
  revenue,
  onCancelEdit,
  onSaved,
}: {
  patientId: string
  patientName?: string
  treatments: Treatment[]
  installments: Installment[]
  settings: Settings | null
  defaultTreatmentId?: string
  revenue?: RevenueRecord | null
  onCancelEdit?: () => void
  onSaved?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const isEdit = Boolean(revenue)

  const initialTreatmentId =
    revenue?.treatment_id ||
    defaultTreatmentId ||
    treatments.find((t) => t.patient_id === patientId)?.id ||
    ""
  const initial = revenue
    ? {
        installmentId: revenue.installment_id || "",
        gross: Number(revenue.gross_amount),
      }
    : suggestFromCadastro(initialTreatmentId, treatments, installments)

  const [gross, setGross] = useState(initial.gross)
  const [installmentId, setInstallmentId] = useState(initial.installmentId)
  const [method, setMethod] = useState<PaymentMethod>(
    revenue?.payment_method ?? "pix",
  )
  const [clinicPercent, setClinicPercent] = useState(
    Number(revenue?.clinic_percent ?? settings?.clinic_percent ?? 30),
  )
  const [cardPercent, setCardPercent] = useState(
    Number(
      revenue?.card_fee_percent && Number(revenue.card_fee_percent) > 0
        ? revenue.card_fee_percent
        : (settings?.card_fee_percent ?? 3.5),
    ),
  )
  const [baseMode, setBaseMode] = useState<ClinicBaseMode>(
    revenue?.clinic_base_mode ??
      settings?.default_clinic_base_mode ??
      "without_fee",
  )
  const [sharesFee, setSharesFee] = useState(
    revenue?.clinic_shares_card_fee ??
      settings?.default_clinic_shares_card_fee ??
      false,
  )
  const [treatmentId, setTreatmentId] = useState(initialTreatmentId)
  const [revenueDate, setRevenueDate] = useState(
    revenue?.revenue_date ?? todayISO(),
  )
  const [description, setDescription] = useState(revenue?.description ?? "")

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
      (!treatmentId || i.treatment_id === treatmentId) &&
      (i.status !== "paga" || i.id === revenue?.installment_id),
  )

  function applyCadastroSuggestion(nextTreatmentId: string) {
    if (isEdit) return
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
    fd.set("revenue_date", revenueDate)
    fd.set("description", description)
    setSaveError(null)
    startTransition(async () => {
      try {
        if (revenue) {
          await updateRevenue(revenue.id, fd)
          onSaved?.()
        } else {
          await createRevenue(fd)
        }
        router.refresh()
        if (!revenue) {
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
          setRevenueDate(todayISO())
          setDescription("")
        }
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Não foi possível salvar a receita.",
        )
      }
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
              {i.status === "paga" ? " (atual)" : ""}
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
            value={revenueDate}
            onChange={(e) => setRevenueDate(e.target.value)}
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
          {!isEdit && (
            <p className="text-xs text-muted-foreground">
              Vem do tratamento/parcela — você pode alterar só neste lançamento.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
          {cardApplies && gross > 0 && (
            <li className="text-xs">
              Conferência: clínica + você + cartão ={" "}
              {formatBRL(
                split.clinicNetAmount +
                  split.professionalNetAmount +
                  split.cardFeeAmount,
              )}
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || gross <= 0}>
          {pending
            ? "Salvando…"
            : isEdit
              ? "Salvar correção"
              : "Lançar receita"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancelEdit}
          >
            Cancelar
          </Button>
        )}
      </div>
      {saveError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {saveError}
        </p>
      )}
    </form>
  )
}

/** Mantido para usos pontuais fora da ficha do paciente. */
export { RevenueForm as StandaloneRevenueForm }
