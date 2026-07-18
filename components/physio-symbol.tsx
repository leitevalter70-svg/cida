import { cn } from "@/lib/utils"

type PhysioSymbolProps = {
  className?: string
  /** When true, uses currentColor for the whole mark (good on primary buttons). */
  solid?: boolean
}

/**
 * Marca inspirada no símbolo clássico da fisioterapia:
 * figura humana com braços abertos + eixo vertical (bastão).
 */
export function PhysioSymbol({ className, solid = false }: PhysioSymbolProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-5", className)}
      aria-hidden
    >
      {/* bastão / eixo */}
      <path
        d="M24 8v32"
        stroke="currentColor"
        strokeWidth={solid ? 3.2 : 2.6}
        strokeLinecap="round"
      />
      {/* cabeça */}
      <circle
        cx="24"
        cy="12.5"
        r="3.4"
        fill="currentColor"
        className={solid ? undefined : "opacity-95"}
      />
      {/* tronco */}
      <path
        d="M24 16.2c-3.2 1.4-5.4 4.6-5.4 8.4v2.8c0 1.2.9 2.2 2.1 2.4l3.3.6 3.3-.6c1.2-.2 2.1-1.2 2.1-2.4v-2.8c0-3.8-2.2-7-5.4-8.4Z"
        fill="currentColor"
        className={solid ? undefined : "opacity-90"}
      />
      {/* braços abertos (gesto clássico) */}
      <path
        d="M18.8 20.2c-3.6 1.2-6.4 3.8-7.6 7.2M29.2 20.2c3.6 1.2 6.4 3.8 7.6 7.2"
        stroke="currentColor"
        strokeWidth={solid ? 2.8 : 2.4}
        strokeLinecap="round"
      />
      {/* base / equilíbrio */}
      <path
        d="M18 40.5h12"
        stroke="currentColor"
        strokeWidth={solid ? 2.8 : 2.4}
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Paths do símbolo para uso no @react-pdf/renderer (viewBox 0 0 48 48). */
export const PHYSIO_SYMBOL_PATHS = {
  staff: "M24 8v32",
  head: { cx: 24, cy: 12.5, r: 3.4 },
  torso:
    "M24 16.2c-3.2 1.4-5.4 4.6-5.4 8.4v2.8c0 1.2.9 2.2 2.1 2.4l3.3.6 3.3-.6c1.2-.2 2.1-1.2 2.1-2.4v-2.8c0-3.8-2.2-7-5.4-8.4Z",
  armsLeft: "M18.8 20.2c-3.6 1.2-6.4 3.8-7.6 7.2",
  armsRight: "M29.2 20.2c3.6 1.2 6.4 3.8 7.6 7.2",
  base: "M18 40.5h12",
} as const
