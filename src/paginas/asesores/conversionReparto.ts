import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { ConexionReparto, DefinicionReparto, TipoNodoReparto } from '@/api'

export type DatosNodoReparto = Record<string, unknown> & {
  tipo: TipoNodoReparto
  datos: Record<string, unknown>
  problemas?: string[]
}

export type NodoRepartoRF = Node<DatosNodoReparto, 'paso'>

const COLOR_FLECHA = '#64748b'
export const COLOR_CAMINO = '#10b981'

export function estiloFlecha(resaltada = false): Pick<Edge, 'type' | 'markerEnd' | 'style' | 'interactionWidth' | 'animated'> {
  const color = resaltada ? COLOR_CAMINO : COLOR_FLECHA
  return {
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
    style: { stroke: color, strokeWidth: resaltada ? 3 : 2 },
    interactionWidth: 24,
    animated: resaltada,
  }
}

export function aNodos(definicion: DefinicionReparto): NodoRepartoRF[] {
  return definicion.nodos.map((n) => ({
    id: n.id,
    type: 'paso',
    position: { x: n.x, y: n.y },
    deletable: n.tipo !== 'inicio',
    data: { tipo: n.tipo, datos: n.datos ?? {} },
  }))
}

export function aFlechas(definicion: DefinicionReparto): Edge[] {
  return definicion.conexiones.map((c) => ({
    id: c.id || `${c.desde}-${c.salida}`,
    source: c.desde,
    sourceHandle: c.salida,
    target: c.hacia,
    ...estiloFlecha(),
  }))
}

export function aDefinicion(nodos: NodoRepartoRF[], flechas: Edge[]): DefinicionReparto {
  const conexiones: ConexionReparto[] = flechas.map((f) => ({
    id: f.id,
    desde: f.source,
    salida: f.sourceHandle ?? 'siguiente',
    hacia: f.target,
  }))
  return {
    nodos: nodos.map((n) => ({
      id: n.id,
      tipo: n.data.tipo,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      datos: n.data.datos,
    })),
    conexiones,
  }
}
