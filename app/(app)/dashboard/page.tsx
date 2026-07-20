import { startOfMonth, endOfMonth, format } from "date-fns"
import { SetupNotice } from "@/components/setup-notice"
import { DashboardClient } from "@/components/dashboard-client"
import { fetchDashboardData } from "@/lib/data/queries"
import { PeriodFilter } from "@/components/period-filter"
import { PhysioSymbol } from "@/components/physio-symbol"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const from = params.from || format(startOfMonth(now), "yyyy-MM-dd")
  const to = params.to || format(endOfMonth(now), "yyyy-MM-dd")
  const data = await fetchDashboardData(from, to)

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />

      <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-primary/10 via-card to-secondary/50 px-5 py-6 sm:px-7">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-primary/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 right-16 size-28 rounded-full bg-accent/40"
          aria-hidden
        />
        <div className="relative flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <PhysioSymbol className="size-8" solid />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Fisioterapia
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visão financeira e clínica · saúde da mulher
            </p>
          </div>
        </div>
      </header>

      <PeriodFilter from={from} to={to} />
      <DashboardClient from={from} to={to} data={data} />
    </div>
  )
}
