"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  HeartPulse,
  Wallet,
  Receipt,
  Package,
  Settings,
  LogOut,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { PhysioSymbol } from "@/components/physio-symbol"

const itens = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: HeartPulse },
  { href: "/tratamentos", label: "Tratamentos", icon: Package },
  { href: "/receitas", label: "Receitas", icon: Wallet },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/prestacao", label: "Prestação", icon: ClipboardList },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    if (!isSupabaseConfigured()) {
      router.push("/login")
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="flex shrink-0 flex-col border-border bg-sidebar md:h-dvh md:w-64 md:border-r md:bg-gradient-to-b md:from-sidebar md:to-secondary/40">
      <div className="flex items-center gap-3 border-b border-border/80 px-5 py-5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
          <PhysioSymbol className="size-6" solid />
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-foreground uppercase">
            Fisioterapia
          </p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:gap-1 md:overflow-visible">
        {itens.map((item) => {
          const Icon = item.icon
          const ativo =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                ativo
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto hidden space-y-3 border-t border-border/80 px-5 py-4 md:block">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Saúde da mulher · assoalho pélvico
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
