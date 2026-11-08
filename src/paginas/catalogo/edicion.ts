import { createContext, useContext, type DragEvent } from 'react'
import type { BloqueHtmlVitrina, DatosWidget, LugarBloque, TipoWidget } from '@/api'
import { WIDGETS } from '@/paginas/catalogo/bloques'

export type Arrastre = { widget: TipoWidget } | { bloque: string }

export type EdicionTienda = {
  elegido: string | null
  esperando: boolean
  arrastrando: boolean
  alElegir: (id: string) => void
  alArrastrar: (activo: boolean) => void
  alSoltar: (donde: LugarBloque, antes: string | undefined, arrastre: Arrastre | null) => void
  alCambiarBloque: (id: string, cambio: Partial<BloqueHtmlVitrina>, datos?: Partial<DatosWidget>) => void
  alMoverBloque: (id: string, paso: -1 | 1) => void
  alDuplicarBloque: (id: string) => void
  alBorrarBloque: (id: string) => void
}

const ContextoEdicion = createContext<EdicionTienda | null>(null)

export const ProveedorEdicion = ContextoEdicion.Provider

export function useEdicion(): EdicionTienda | null {
  return useContext(ContextoEdicion)
}

export function leerArrastre(evento: DragEvent): Arrastre | null {
  const valor = evento.dataTransfer.getData('text/plain')
  if (valor.startsWith('widget:')) {
    const tipo = valor.slice(7) as TipoWidget
    return WIDGETS.some((item) => item.tipo === tipo) ? { widget: tipo } : null
  }
  if (valor.startsWith('bloque:')) return { bloque: valor.slice(7) }
  return null
}
