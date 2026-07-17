import { AppSidebar } from "@/components/app-sidebar"

export const dynamic = "force-dynamic"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
