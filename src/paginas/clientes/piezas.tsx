import { useEffect, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import type { AjustesCrm, EtiquetaCliente, FiltrosClientes } from '@/api'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CLASE_SELECT, COLORES } from './crm'

export function Punto({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-full', className)} style={{ backgroundColor: color }} aria-hidden />
}

export function Chip({ nombre, color, alQuitar }: { nombre: string; color: string; alQuitar?: () => void }) {
  return (
    <span className="inline-flex max-w-40 items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 text-xs font-medium text-foreground/80">
      <Punto color={color} />
      <span className="truncate">{nombre}</span>
      {alQuitar ? (
        <button type="button" onClick={alQuitar} className="-mr-0.5 text-muted-foreground hover:text-foreground" aria-label={`Quitar ${nombre}`}>
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  )
}

export function SelectorColor({ valor, alCambiar }: { valor: string; alCambiar: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color">
      {COLORES.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={valor === color}
          aria-label={color}
          onClick={() => alCambiar(color)}
          className={cn('flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background', valor === color && 'ring-2 ring-foreground/40')}
          style={{ backgroundColor: color }}
        >
          {valor === color ? <Check className="size-3.5 text-white" /> : null}
        </button>
      ))}
    </div>
  )
}

export function SelectorEtiquetas({
  etiquetas,
  elegidas,
  alCambiar,
}: {
  etiquetas: EtiquetaCliente[]
  elegidas: number[]
  alCambiar: (ids: number[]) => void
}) {
  if (etiquetas.length === 0) {
    return <p className="text-xs text-muted-foreground">Aún no hay etiquetas. Un administrador las crea en Ajustes.</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {etiquetas.map((etiqueta) => {
        const activa = elegidas.includes(etiqueta.id)
        return (
          <button
            key={etiqueta.id}
            type="button"
            aria-pressed={activa}
            onClick={() => alCambiar(activa ? elegidas.filter((id) => id !== etiqueta.id) : [...elegidas, etiqueta.id])}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              activa ? 'border-foreground/30 bg-foreground/5 text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Punto color={etiqueta.color} />
            {etiqueta.nombre}
            {activa ? <Check className="size-3" /> : null}
          </button>
        )
      })}
    </div>
  )
}

/** Barra de filtros que comparten la lista de clientes, el embudo y los envíos masivos. */
export function BarraFiltros({
  filtros,
  alCambiar,
  ajustes,
  sinEtapa = false,
  sinBusqueda = false,
}: {
  filtros: FiltrosClientes
  alCambiar: (filtros: FiltrosClientes) => void
  ajustes: AjustesCrm | undefined
  sinEtapa?: boolean
  sinBusqueda?: boolean
}) {
  const [texto, setTexto] = useState(filtros.q ?? '')

  useEffect(() => {
    if ((filtros.q ?? '') === texto) return
    const espera = window.setTimeout(() => alCambiar({ ...filtros, q: texto }), 350)
    return () => window.clearTimeout(espera)
  }, [texto, filtros, alCambiar])

  const numero = (valor: string) => (valor === '' ? null : Number(valor))

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', sinBusqueda ? 'lg:grid-cols-4' : 'lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]')}>
      {sinBusqueda ? null : (
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, teléfono o correo" className="h-10 pl-9" />
        </label>
      )}
      {sinEtapa ? null : (
        <select
          aria-label="Etapa"
          className={CLASE_SELECT}
          value={filtros.id_etapa ?? ''}
          onChange={(e) => alCambiar({ ...filtros, id_etapa: numero(e.target.value) })}
        >
          <option value="">Todas las etapas</option>
          {ajustes?.etapas.map((etapa) => (
            <option key={etapa.id} value={etapa.id}>
              {etapa.nombre}
            </option>
          ))}
        </select>
      )}
      <select
        aria-label="Tipo de cliente"
        className={CLASE_SELECT}
        value={filtros.id_tipo ?? ''}
        onChange={(e) => alCambiar({ ...filtros, id_tipo: numero(e.target.value) })}
      >
        <option value="">Todos los tipos</option>
        {ajustes?.tipos.map((tipo) => (
          <option key={tipo.id} value={tipo.id}>
            {tipo.nombre}
          </option>
        ))}
        <option value="0">Sin tipo</option>
      </select>
      <select
        aria-label="Etiqueta"
        className={CLASE_SELECT}
        value={filtros.id_etiqueta ?? ''}
        onChange={(e) => alCambiar({ ...filtros, id_etiqueta: numero(e.target.value) })}
      >
        <option value="">Todas las etiquetas</option>
        {ajustes?.etiquetas.map((etiqueta) => (
          <option key={etiqueta.id} value={etiqueta.id}>
            {etiqueta.nombre}
          </option>
        ))}
      </select>
      <select
        aria-label="Último mensaje"
        className={CLASE_SELECT}
        value={filtros.ventana ?? ''}
        onChange={(e) => alCambiar({ ...filtros, ventana: e.target.value as FiltrosClientes['ventana'] })}
      >
        <option value="">Cualquier fecha</option>
        <option value="abierta">Escribió en las últimas 24 h</option>
        <option value="cerrada">Hace más de 24 h</option>
      </select>
    </div>
  )
}