import { AppSidebar } from "@/components/app-sidebar"
import { SetupNotice } from "@/components/setup-notice"
import { PendingPaymentsAlert } from "@/components/pending-payments-alert"
import {
  fetchPendingPaymentAlerts,
  type PendingPaymentAlertItem,
} from "@/lib/data/pending-payments"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-4 px-5 py-10">
        <h1 className="text-2xl font-bold text-destructive">
          App bloqueado — banco desconectado
        </h1>
        <SetupNotice />
        <p className="text-sm text-muted-foreground">
          Cadastros e lançamentos ficam desativados até o{" "}
          <code className="rounded bg-secondary px-1">.env.local</code> estar
          presente. Rode{" "}
          <code className="rounded bg-secondary px-1">npm run env:check</code>{" "}
          na pasta do projeto — se existir backup, ele restaura sozinho.
        </p>
      </div>
    )
  }

  // Não deixe que falhas de autenticação/consulta do Supabase quebrem páginas
  // importantes (ex.: relatório clínico). Se falhar, apenas ocultamos o alerta.
  let pendingPayments: PendingPaymentAlertItem[] = []
  try {
    pendingPayments = await fetchPendingPaymentAlerts()
  } catch (err) {
    console.error("fetchPendingPaymentAlerts failed:", err)
    pendingPayments = []
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden bg-gradient-to-br from-background via-background to-secondary/30 px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <PendingPaymentsAlert items={pendingPayments} />
          {children}
        </div>
      </main>
    </div>
  )
}
