"use client"

import { useTransition } from "react"
import {
  updateFinancialSettings,
  updateReportDefaults,
  upsertDevice,
} from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function FinancialSettingsForm({
  settings,
}: {
  settings: {
    clinic_percent: number
    card_fee_percent: number
    default_clinic_base_mode: string
    default_clinic_shares_card_fee: boolean
    clinical_chance_indicator_enabled: boolean
    card_credit_settlement_days?: number
  } | null
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set(
      "default_clinic_shares_card_fee",
      (e.currentTarget.elements.namedItem(
        "default_clinic_shares_card_fee",
      ) as HTMLInputElement).checked
        ? "true"
        : "false",
    )
    fd.set(
      "clinical_chance_indicator_enabled",
      (e.currentTarget.elements.namedItem(
        "clinical_chance_indicator_enabled",
      ) as HTMLInputElement).checked
        ? "true"
        : "false",
    )
    startTransition(async () => {
      await updateFinancialSettings(fd)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="clinic_percent">% clínica</Label>
          <Input
            id="clinic_percent"
            name="clinic_percent"
            type="number"
            step="0.01"
            defaultValue={settings?.clinic_percent ?? 30}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card_fee_percent">% cartão</Label>
          <Input
            id="card_fee_percent"
            name="card_fee_percent"
            type="number"
            step="0.01"
            defaultValue={settings?.card_fee_percent ?? 3.5}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="card_credit_settlement_days">
          Dias para receber crédito
        </Label>
        <Input
          id="card_credit_settlement_days"
          name="card_credit_settlement_days"
          type="number"
          min={0}
          max={120}
          defaultValue={settings?.card_credit_settlement_days ?? 30}
          required
        />
        <p className="text-xs text-muted-foreground">
          Usado na data de recebimento da prestação de contas (padrão 30 dias).
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="default_clinic_base_mode">
          Base padrão do % clínica
        </Label>
        <select
          id="default_clinic_base_mode"
          name="default_clinic_base_mode"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          defaultValue={settings?.default_clinic_base_mode ?? "without_fee"}
        >
          <option value="without_fee">Sem taxa do cartão na base</option>
          <option value="with_fee">Com taxa do cartão na base</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="default_clinic_shares_card_fee"
          defaultChecked={settings?.default_clinic_shares_card_fee ?? false}
        />
        Clínica rateia taxa do cartão (padrão)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="clinical_chance_indicator_enabled"
          defaultChecked={
            settings?.clinical_chance_indicator_enabled ?? true
          }
        />
        Exibir indicador clínico de chances no dashboard
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar configurações financeiras"}
      </Button>
    </form>
  )
}

export function ReportDefaultsForm({
  defaults,
}: {
  defaults: {
    disclaimer_text: string
    maintenance_guidance_text: string
    professional_name?: string
    crefito?: string
  } | null
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateReportDefaults(fd)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="professional_name">Nome da profissional</Label>
        <Input
          id="professional_name"
          name="professional_name"
          defaultValue={
            defaults?.professional_name ?? "Maria Apárecida S. Leite"
          }
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="crefito">CREFITO</Label>
        <Input
          id="crefito"
          name="crefito"
          defaultValue={defaults?.crefito ?? "82810F"}
          required
        />
        <p className="text-xs text-muted-foreground">
          Aparece no relatório clínico, recibo e prestação de contas.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="disclaimer_text">Disclaimer do relatório</Label>
        <Textarea
          id="disclaimer_text"
          name="disclaimer_text"
          rows={3}
          defaultValue={defaults?.disclaimer_text ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="maintenance_guidance_text">
          Orientação de manutenção (padrão)
        </Label>
        <Textarea
          id="maintenance_guidance_text"
          name="maintenance_guidance_text"
          rows={3}
          defaultValue={defaults?.maintenance_guidance_text ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar textos do relatório"}
      </Button>
    </form>
  )
}

export function DeviceCatalogForm({
  devices,
}: {
  devices: {
    id: string
    name: string
    description: string | null
    is_active: boolean
  }[]
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      await upsertDevice(fd)
      form.reset()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {devices.map((d) => (
          <Badge key={d.id} variant={d.is_active ? "secondary" : "outline"}>
            {d.name}
          </Badge>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Novo aparelho / modalidade</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar ao catálogo"}
        </Button>
      </form>
    </div>
  )
}
