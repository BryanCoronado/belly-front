import type { ResumenEnvio } from '@/api'
import { cn } from '@/lib/utils'

export function Estado({ texto, clase }: { texto: string; clase: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-md px-2 text-xs font-medium whitespace-nowrap', clase)}>{texto}</span>
}

/** Barra apilada: enviados, fallidos y omitidos sobre el total. */
export function Avance({ envio, className }: { envio: ResumenEnvio; className?: string }) {
  const total = Math.max(1, envio.total)
  const tramo = (valor: number) => `${(valor / total) * 100}%`
  return (
    <div className={cn('flex h-1.5 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuemin={0} aria-valuemax={envio.total} aria-valuenow={envio.total - envio.resumen.pendiente}>
      <span className="bg-emerald-500" style={{ width: tramo(envio.resumen.enviado) }} />
      <span className="bg-rose-500" style={{ width: tramo(envio.resumen.fallido) }} />
      <span className="bg-amber-400" style={{ width: tramo(envio.resumen.omitido) }} />
    </div>
  )
}
