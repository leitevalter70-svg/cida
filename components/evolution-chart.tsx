"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

export function EvolutionChart({
  data,
}: {
  data: { date: string; escala: number }[]
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem escalas registradas ainda.
      </p>
    )
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[1, 5]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="escala"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
