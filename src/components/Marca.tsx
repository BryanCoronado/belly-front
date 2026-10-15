import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LogoMarca({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm',
        className,
      )}
    >
      <MessageCircle className="size-5" />
    </div>
  )
}
