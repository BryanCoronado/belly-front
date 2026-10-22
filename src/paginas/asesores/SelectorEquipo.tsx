import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Asesor = { id: number; nombre: string; activo: boolean }

type SelectorEquipoProps = {
  asesores: Asesor[]
  valor: number[]
  /** Con prioridad, el orden de la lista importa y se puede cambiar. */
  conOrden: boolean
  alCambiar: (ids: number[]) => void
}

export function SelectorEquipo({ asesores, valor, conOrden, alCambiar }: SelectorEquipoProps) {
  const nombres = new Map(asesores.map((asesor) => [asesor.id, asesor]))

  function alternar(id: number) {
    alCambiar(valor.includes(id) ? valor.filter((actual) => actual !== id) : [...valor, id])
  }

  function mover(indice: number, salto: number) {
    const destino = indice + salto
    if (destino < 0 || destino >= valor.length) return
    const copia = [...valor]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    alCambiar(copia)
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {asesores.map((asesor) => (
          <label key={asesor.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={valor.includes(asesor.id)} onChange={() => alternar(asesor.id)} />
            <span className="min-w-0 flex-1 truncate">{asesor.nombre}</span>
            {asesor.activo ? null : <span className="text-xs text-muted-foreground">Inactivo</span>}
          </label>
        ))}
      </div>

      {conOrden && valor.length > 1 ? (
        <ol className="space-y-1.5 rounded-lg bg-muted/60 p-2">
          {valor.map((id, indice) => (
            <li key={id} className="flex items-center gap-2 rounded-md bg-background px-3 py-1.5 text-sm">
              <span className="w-5 text-xs font-semibold text-muted-foreground tabular-nums">{indice + 1}</span>
              <span className="min-w-0 flex-1 truncate">{nombres.get(id)?.nombre ?? 'Asesor'}</span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir" disabled={indice === 0} onClick={() => mover(indice, -1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Bajar" disabled={indice === valor.length - 1} onClick={() => mover(indice, 1)}>
                <ArrowDown />
              </Button>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
