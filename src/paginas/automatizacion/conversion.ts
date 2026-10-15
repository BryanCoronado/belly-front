import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { ConexionFlujo, DatosPaso, DefinicionFlujo, TipoPaso } from '@/api'

export type DatosNodo = Record<string, unknown> & {
  tipo: TipoPaso
  datos: DatosPaso
  /** Problemas detectados en la última revisión (se muestran en la tarjeta). */
  problemas?: string[]
}

export type NodoRF = Node<DatosNodo, 'paso'>

const COLOR_FLECHA = '#64748b'

export function estiloArista(): Pick<Edge, 'type' | 'markerEnd' | 'style' | 'interactionWidth'> {
  return {
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_FLECHA, width: 18, height: 18 },
    style: { stroke: COLOR_FLECHA, strokeWidth: 2 },
    interactionWidth: 24,
  }
}

export function aNodosRF(definicion: DefinicionFlujo): NodoRF[] {
  return definicion.nodos.map((paso) => ({
    id: paso.id,
    type: 'paso',
    position: { x: paso.x, y: paso.y },
    deletable: paso.tipo !== 'inicio',
    data: { tipo: paso.tipo, datos: paso.datos ?? {} },
  }))
}

export function aAristasRF(definicion: DefinicionFlujo): Edge[] {
  return definicion.conexiones.map((c) => ({
    id: c.id || `${c.desde}-${c.salida}`,
    source: c.desde,
    sourceHandle: c.salida,
    target: c.hacia,
    ...estiloArista(),
  }))
}

export function aDefinicion(nodos: NodoRF[], aristas: Edge[]): DefinicionFlujo {
  const conexiones: ConexionFlujo[] = aristas.map((a) => ({
    id: a.id,
    desde: a.source,
    salida: a.sourceHandle ?? 'siguiente',
    hacia: a.target,
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
