import { useQuery } from '@tanstack/react-query'
import { Check, UserRoundX } from 'lucide-react'
import { listarAsesoresFlujo, type AsesorFlujo } from '@/api'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Props = {
  /** Ids elegidos. En modo «único» solo se usa el primero. */
  valor: number[]
  alCambiar: (ids: number[]) => void
  unico?: boolean
  /** Texto cuando no hay nadie marcado (en reparto, vacío significa «todos»). */
  textoVacio?: string
}

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

/** Lista de los asesores reales de la empresa para marcar a quién se le pasan los chats. */
export function SelectorAsesores({ valor, alCambiar, unico = false, textoVacio }: Props) {
  const asesores = useQuery({ queryKey: ['flujo-asesores'], queryFn: listarAsesoresFlujo, staleTime: 30_000 })

  if (asesores.isPending) {
    return (
      <div className="space-y-1.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    )
  }

  if (asesores.isError) {
    return <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">No pudimos cargar a tus asesores. Intenta de nuevo.</p>
  }

  const lista = asesores.data ?? []
  if (lista.length === 0) {
    return (
      <div className="flex gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <UserRoundX className="mt-0.5 size-4 shrink-0" />
        <p>
          Aún no tienes asesores. Crea personas en <b>Equipo</b> con un rol que pueda usar el Chat y aparecerán aquí.
        </p>
      </div>
    )
  }

  const alternar = (id: number) => {
    if (unico) {
      alCambiar([id])
      return
    }
    alCambiar(valor.includes(id) ? valor.filter((v) => v !== id) : [...valor, id])
  }

  return (
    <div className="space-y-1.5">
      <ul className="max-h-60 space-y-1 overflow-y-auto pr-0.5">
        {lista.map((asesor) => (
          <Fila key={asesor.id} asesor={asesor} marcado={valor.includes(asesor.id)} unico={unico} alPulsar={() => alternar(asesor.id)} />
        ))}
      </ul>
      {!unico ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{valor.length === 0 ? (textoVacio ?? 'Sin marcar = todos tus asesores') : `${valor.length} de ${lista.length} elegidos`}</span>
          <span className="flex gap-3">
            <button type="button" className="font-medium text-emerald-700 hover:underline" onClick={() => alCambiar(lista.map((a) => a.id))}>
              Marcar todos
            </button>
            {valor.length ? (
              <button type="button" className="font-medium text-emerald-700 hover:underline" onClick={() => alCambiar([])}>
                Limpiar
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function Fila({ asesor, marcado, unico, alPulsar }: { asesor: AsesorFlujo; marcado: boolean; unico: boolean; alPulsar: () => void }) {
  return (
    <li>
      <button
        type="button"
        role={unico ? 'radio' : 'checkbox'}
        aria-checked={marcado}
        onClick={alPulsar}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors',
          marcado ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'bg-white hover:bg-zinc-50',
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-semibold text-white">
          {iniciales(asesor.nombre) || '?'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{asesor.nombre}</span>
          <span className="block text-[11px] text-muted-foreground">
            {asesor.chats_abiertos === 0 ? 'Sin chats abiertos' : `${asesor.chats_abiertos} ${asesor.chats_abiertos === 1 ? 'chat abierto' : 'chats abiertos'}`}
          </span>
        </span>
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center border',
            unico ? 'rounded-full' : 'rounded-md',
            marcado ? 'border-emerald-500 bg-emerald-500 text-white' : 'bg-white',
          )}
        >
          {marcado ? <Check className="size-3.5" /> : null}
        </span>
      </button>
    </li>
  )
}
