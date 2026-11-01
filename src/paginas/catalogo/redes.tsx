import { siFacebook, siInstagram, siTiktok, siWhatsapp } from 'simple-icons'
import { cn } from '@/lib/utils'
import type { Red } from '@/paginas/catalogo/tienda'

const ICONOS = { facebook: siFacebook, instagram: siInstagram, tiktok: siTiktok, whatsapp: siWhatsapp }

export function IconoRed({ red, className }: { red: Red; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0', className)} aria-hidden>
      <path fill="currentColor" d={ICONOS[red].path} />
    </svg>
  )
}
