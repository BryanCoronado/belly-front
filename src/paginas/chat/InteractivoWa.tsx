import { useState } from 'react'
import { List, Reply } from 'lucide-react'
import type { InteractivoChat } from '@/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Props = {
  interactivo: InteractivoChat
  /** Si es falso se ven igual que en WhatsApp pero no se pueden tocar (historial del chat). */
  habilitado?: boolean
  alElegir?: (indice: number) => void
  className?: string
}

const BOTON =
  'flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-center text-[14px] font-medium text-[#00a5f4] shadow-sm transition-colors dark:text-[#53bdeb]'

/** Botones de respuesta rápida o lista de opciones, tal como los ve el cliente en WhatsApp. */
export function InteractivoWa({ interactivo, habilitado = false, alElegir, className }: Props) {
  const [abierta, setAbierta] = useState(false)
  const activos = habilitado && alElegir !== undefined

  if (interactivo.tipo === 'botones') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {interactivo.opciones.map((opcion, i) => (
          <button
            key={`${opcion.titulo}-${i}`}
            type="button"
            disabled={!activos}
            onClick={() => alElegir?.(i)}
            className={cn(BOTON, activos ? 'hover:bg-zinc-50' : 'cursor-default')}
          >
            <Reply className="size-4 -scale-x-100" />
            <span className="truncate">{opcion.titulo}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <button type="button" onClick={() => setAbierta(true)} className={cn(BOTON, 'hover:bg-zinc-50')}>
        <List className="size-4" />
        <span className="truncate">{interactivo.boton || 'Ver opciones'}</span>
      </button>

      <Dialog open={abierta} onOpenChange={setAbierta}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>{interactivo.boton || 'Opciones'}</DialogTitle>
          </DialogHeader>
          <ul className="max-h-[60vh] divide-y overflow-y-auto">
            {interactivo.opciones.map((opcion, i) => (
              <li key={`${opcion.titulo}-${i}`}>
                <button
                  type="button"
                  disabled={!activos}
                  onClick={() => {
                    setAbierta(false)
                    alElegir?.(i)
                  }}
                  className={cn('flex w-full items-center gap-3 px-4 py-3 text-left', activos ? 'hover:bg-muted' : 'cursor-default')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{opcion.titulo}</span>
                    {opcion.descripcion ? <span className="block text-xs text-muted-foreground">{opcion.descripcion}</span> : null}
                  </span>
                  <span className="size-5 shrink-0 rounded-full border-2 border-zinc-300" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
