import { createContext, useContext } from 'react'
import type { Catalogo } from './tiposReparto'

export const CLAVE_REPARTO = ['reparto']

export type Resaltado = { nodos: Set<string>; pasos: Set<string> }

export type ValorContextoReparto = { catalogo: Catalogo; resaltado: Resaltado | null }

export const ContextoReparto = createContext<ValorContextoReparto>({
  catalogo: { grupos: [], asesores: [], personas: [], agentes: [] },
  resaltado: null,
})

export function useReparto(): ValorContextoReparto {
  return useContext(ContextoReparto)
}
