import { siTelegram } from 'simple-icons'
import { cn } from '@/lib/utils'

export function IconoTelegram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0', className)} aria-hidden>
      <path fill={`#${siTelegram.hex}`} d={siTelegram.path} />
    </svg>
  )
}
