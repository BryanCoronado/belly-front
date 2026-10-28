import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'

/** Cambia entre modo claro y oscuro. */
export function BotonTema({ className }: { className?: string }) {
  const { oscuro, alternar } = useTema()
  const accion = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={alternar}
      aria-label={accion}
      title={accion}
      className={cn('h-8 gap-1.5 border-border bg-background px-2.5 text-foreground dark:border-border dark:bg-background dark:text-foreground', className)}
    >
      {oscuro ? <Sun /> : <Moon />}
      {oscuro ? 'Día' : 'Noche'}
    </Button>
  )
}
