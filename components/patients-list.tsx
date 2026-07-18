"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { complaintLabel } from "@/lib/clinical/complaints"

type PatientRow = {
  id: string
  full_name: string
  complaint_focus: string | null
  age_years: number | null
  status: string
  phone: string | null
  email: string | null
}

export function PatientsList({ patients }: { patients: PatientRow[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => {
      const haystack = [
        p.full_name,
        p.phone ?? "",
        p.email ?? "",
        p.complaint_focus ?? "",
        complaintLabel(p.complaint_focus) ?? "",
        p.status,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [patients, query])

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        placeholder="Buscar por nome, telefone, e-mail ou queixa…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar paciente"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {patients.length === 0
            ? "Nenhum paciente cadastrado ainda."
            : "Nenhum paciente encontrado com essa busca."}
        </p>
      ) : (
        filtered.map((p) => (
          <Link
            key={p.id}
            href={`/pacientes/${p.id}`}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{p.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {complaintLabel(p.complaint_focus) || "Sem queixa definida"}
                {p.age_years != null ? ` · ${p.age_years} anos` : ""}
                {p.phone ? ` · ${p.phone}` : ""}
                {p.email ? ` · ${p.email}` : ""}
              </p>
            </div>
            <Badge variant="secondary">{p.status}</Badge>
          </Link>
        ))
      )}
    </div>
  )
}
