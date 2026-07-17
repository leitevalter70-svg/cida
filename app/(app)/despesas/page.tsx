import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { ExpenseForm } from "@/components/forms/expense-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatBRL, formatData } from "@/lib/format"

export default async function DespesasPage() {
  let categories: any[] = []
  let patients: any[] = []
  let expenses: any[] = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [c, p, e] = await Promise.all([
      supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase.from("patients").select("id, full_name").order("full_name"),
      supabase
        .from("expenses")
        .select("*, expense_categories(name), patients(full_name)")
        .order("expense_date", { ascending: false })
        .limit(50),
    ])
    categories = c.data ?? []
    patients = p.data ?? []
    expenses = e.data ?? []
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Prestação de contas à clínica
          </p>
        </div>
        <p className="text-sm font-medium">Total listado: {formatBRL(total)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nova despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm categories={categories} patients={patients} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Lançamentos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem despesas.</p>
            ) : (
              expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatData(e.expense_date)}
                      {e.expense_categories?.name
                        ? ` · ${e.expense_categories.name}`
                        : ""}
                      {e.patients?.full_name
                        ? ` · ${e.patients.full_name}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{formatBRL(Number(e.amount))}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
