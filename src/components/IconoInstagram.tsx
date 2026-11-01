import { siInstagram } from 'simple-icons'
import { cn } from '@/lib/utils'

export function IconoInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0', className)} aria-hidden>
      <path fill={`#${siInstagram.hex}`} d={siInstagram.path} />
    </svg>
  )
}
