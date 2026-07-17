import { startOfMonth, endOfMonth, format } from "date-fns"
import { SetupNotice } from "@/components/setup-notice"
import { DashboardClient } from "@/components/dashboard-client"
import { fetchDashboardData } from "@/lib/data/queries"
import { PeriodFilter } from "@/components/period-filter"

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
      <PeriodFilter from={from} to={to} />
      <DashboardClient from={from} to={to} data={data} />
    </div>
  )
}
