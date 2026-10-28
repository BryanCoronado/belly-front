import { CircleHelp, Map as IconoMapa, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { avisoExito } from '@/lib/avisos'
import { iniciarGuia, reiniciarGuias } from './motor'
import { useGuiaActual } from './useGuia'

export function BotonGuia() {
  const guia = useGuiaActual()

  function abrirGuia() {
    if (!guia) return
    // Deja que el menú termine de cerrarse antes de resaltar la pantalla.
    window.setTimeout(() => iniciarGuia(guia), 0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full text-foreground" aria-label="Ayuda" title="Ayuda" data-tour="boton-guia" />
        }
      >
        <CircleHelp className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ayuda</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem disabled={!guia} onClick={abrirGuia}>
          <IconoMapa />
          {guia ? 'Ver la guía de esta pantalla' : 'Esta pantalla aún no tiene guía'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            reiniciarGuias()
            avisoExito('Guías reiniciadas', 'Volverán a aparecer solas en cada pantalla.')
            abrirGuia()
          }}
        >
          <RotateCcw />
          Volver a ver todas las guías
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
