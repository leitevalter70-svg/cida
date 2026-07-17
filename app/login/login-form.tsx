"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Activity } from "lucide-react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase ainda não está configurado. Preencha as variáveis no .env.local e conecte o projeto.",
      )
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signError) {
        setError(signError.message)
        return
      }
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background px-4">
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Activity className="size-6" />
          </div>
          <CardTitle className="text-2xl">Cida</CardTitle>
          <CardDescription>
            Controle financeiro e clínico para fisioterapia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Entrando…" : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Ainda não tem conta?{" "}
              <Link href="/cadastro" className="font-medium text-primary">
                Criar cadastro
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
