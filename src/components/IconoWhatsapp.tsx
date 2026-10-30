import { siWhatsapp } from 'simple-icons'
import { cn } from '@/lib/utils'

/** Marca oficial de WhatsApp (simple-icons). El verde va en el SVG para que no herede el gris del menú. */
export function IconoWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0', className)} aria-hidden>
      <path fill={`#${siWhatsapp.hex}`} d={siWhatsapp.path} />
    </svg>
  )
}
