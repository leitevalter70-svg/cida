import { Card, CardContent } from "@/components/ui/card"
import { setupBanner } from "@/lib/data/queries"

export function SetupNotice() {
  const banner = setupBanner()
  if (!banner) return null
  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="p-4 text-sm">
        <p className="font-medium text-destructive">{banner.title}</p>
        <p className="mt-1 text-muted-foreground">{banner.body}</p>
        <p className="mt-2 font-medium text-destructive">
          Enquanto isso, nada é gravado de forma permanente. Não continue
          cadastrando pacientes até reconectar o Supabase.
        </p>
      </CardContent>
    </Card>
  )
}
