import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Ondas animadas mientras grabas (similar a WhatsApp Web). */
export function OndaGrabacion({ activo }: { activo: boolean }) {
  const [fase, setFase] = useState(0)

  useEffect(() => {
    if (!activo) return
    const id = window.setInterval(() => setFase((n) => n + 1), 120)
    return () => window.clearInterval(id)
  }, [activo])

  const barras = Array.from({ length: 32 }, (_, i) => {
    const onda = Math.sin((i + fase) * 0.55) * 0.35 + Math.cos((i - fase) * 0.31) * 0.25
    return 0.35 + Math.abs(onda)
  })

  return (
    <div className="flex min-w-0 flex-1 items-end justify-center gap-[2px] px-2" aria-hidden>
      {barras.map((h, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full bg-[var(--wa-texto)]/70 dark:bg-white/60')}
          style={{ height: `${Math.round(h * 28)}px` }}
        />
      ))}
    </div>
  )
}