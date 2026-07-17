import type { ClinicalChanceBand } from "@/lib/types"

export type AdherenceZone = "alta" | "media" | "baixa"

export function adherencePercent(done: number, planned: number) {
  if (!planned || planned <= 0) return 0
  return Math.min(100, Math.round((done / planned) * 1000) / 10)
}

export function adherenceZone(pct: number): AdherenceZone {
  if (pct >= 80) return "alta"
  if (pct >= 50) return "media"
  return "baixa"
}

export function adherenceZoneLabel(zone: AdherenceZone) {
  const labels = {
    alta: "Alta adesão — zona de melhor chance",
    media: "Adesão moderada — mantenha a consistência",
    baixa: "Baixa adesão — a literatura pressupõe treino consistente",
  }
  return labels[zone]
}

export function chanceSummary(
  band: ClinicalChanceBand | null | undefined,
  adherence: number,
) {
  const zone = adherenceZone(adherence)
  const min = band?.cure_or_improve_min_percent ?? 55
  const max = band?.cure_or_improve_max_percent ?? 74
  const controlMin = band?.control_min_percent ?? 3
  const controlMax = band?.control_max_percent ?? 11

  return {
    zone,
    zoneLabel: adherenceZoneLabel(zone),
    literatureRange: `${min}–${max}%`,
    controlRange: `${controlMin}–${controlMax}%`,
    message: `Com treinamento do assoalho pélvico bem feito, cerca de ${Math.round(min / 10)} a ${Math.round(max / 10)} em cada 10 pacientes relatam cura ou melhora (${min}–${max}%). Sem tratamento, a chance fica em torno de ${controlMin}–${controlMax}%. Neste percurso, a adesão foi de ${adherence}%.`,
    disclaimer:
      "Estimativa populacional da literatura — não é garantia de cura individual.",
    source: band?.source_text ?? "Literatura PFMT / Cochrane (faixas configuráveis)",
  }
}
