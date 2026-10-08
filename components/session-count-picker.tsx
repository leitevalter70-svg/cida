"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PRESETS = ["5", "10", "todas"]

export function SessionCountPicker({ total }: { total: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get("sessoes") ?? "todas"
  const isPreset = PRESETS.includes(current)
  const [customMode, setCustomMode] = useState(!isPreset)
  const [custom, setCustom] = useState(isPreset ? "" : current)

  function apply(value: string) {
    const next = new URLSearchParams(params)
    next.set("sessoes", value)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  function applyCustom() {
    const n = parseInt(custom, 10)
    if (Number.isFinite(n) && n > 0) apply(String(n))
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="sessoes-relatorio">Sessões no relatório</Label>
        <select
          id="sessoes-relatorio"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={customMode ? "custom" : current}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setCustomMode(true)
              setCustom(custom || String(Math.min(3, total)))
              return
            }
            setCustomMode(false)
            apply(e.target.value)
          }}
        >
          <option value="5">Últimas 5</option>
          <option value="10">Últimas 10</option>
          <option value="todas">Todas ({total})</option>
          <option value="custom">Personalizado…</option>
        </select>
      </div>
      {customMode && (
        <div className="flex items-end gap-2">
          <Input
            type="number"
            min={1}
            max={total}
            className="h-8 w-24"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom()
            }}
          />
          <span className="pb-1.5 text-xs text-muted-foreground">
            últimas sessões
          </span>
        </div>
      )}
    </div>
  )
}
