import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'

/** Cambia entre modo claro y oscuro. */
export function BotonTema({ className }: { className?: string }) {
  const { oscuro, alternar } = useTema()
  const accion = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  return (
    <Button variant="ghost" size="icon" onClick={alternar} aria-label={accion} title={accion} className={cn('text-muted-foreground', className)}>
      {oscuro ? <Sun /> : <Moon />}
    </Button>
  )
}
