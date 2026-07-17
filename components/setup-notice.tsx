import { Card, CardContent } from "@/components/ui/card"
import { setupBanner } from "@/lib/data/queries"

export function SetupNotice() {
  const banner = setupBanner()
  if (!banner) return null
  return (
    <Card className="border-accent bg-accent/40">
      <CardContent className="p-4 text-sm">
        <p className="font-medium text-foreground">{banner.title}</p>
        <p className="mt-1 text-muted-foreground">{banner.body}</p>
      </CardContent>
    </Card>
  )
}
