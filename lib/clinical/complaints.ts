/** Queixas / focos padronizados (saúde da mulher / assoalho pélvico). */
export const COMPLAINT_FOCUSES = [
  {
    value: "IUE",
    label: "IUE — Incontinência urinária de esforço",
  },
  {
    value: "Mista",
    label: "Mista — Incontinência urinária mista",
  },
  {
    value: "Urgência",
    label: "Urgência / bexiga hiperativa",
  },
  {
    value: "Prolapso",
    label: "Prolapso de órgãos pélvicos",
  },
  {
    value: "Dor pélvica",
    label: "Dor pélvica crônica",
  },
  {
    value: "Pré/pós-parto",
    label: "Pré / pós-parto",
  },
  {
    value: "Dispareunia",
    label: "Dispareunia",
  },
  {
    value: "Outro",
    label: "Outro",
  },
] as const

export type ComplaintFocusValue = (typeof COMPLAINT_FOCUSES)[number]["value"]

export type ComplaintOption = { value: string; label: string }

/** Opções padrão + tipos vindos das faixas clínicas configuradas. */
export function resolveComplaintOptions(
  bandTypes: string[] = [],
  currentValue?: string | null,
): ComplaintOption[] {
  const byValue = new Map<string, ComplaintOption>()

  for (const item of COMPLAINT_FOCUSES) {
    byValue.set(item.value, { value: item.value, label: item.label })
  }

  for (const type of bandTypes) {
    const trimmed = type.trim()
    if (!trimmed || byValue.has(trimmed)) continue
    byValue.set(trimmed, { value: trimmed, label: trimmed })
  }

  if (currentValue?.trim() && !byValue.has(currentValue.trim())) {
    const v = currentValue.trim()
    byValue.set(v, { value: v, label: v })
  }

  return Array.from(byValue.values())
}

export function complaintLabel(value: string | null | undefined) {
  if (!value) return null
  const found = COMPLAINT_FOCUSES.find(
    (c) => c.value.toLowerCase() === value.toLowerCase(),
  )
  return found?.label ?? value
}
