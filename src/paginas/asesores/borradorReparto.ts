import type { DefinicionReparto } from '@/api'
import { leerSesion } from '@/sesion'

function clave(): string {
  const id = leerSesion()?.usuario?.id_empresa
  return `belly-reparto-borrador-${id ?? 'local'}`
}

/** Misma forma de pasos y flechas; solo cambian posiciones o datos editados sin guardar. */
function mismaEstructura(a: DefinicionReparto, b: DefinicionReparto): boolean {
  if (a.nodos.length !== b.nodos.length || a.conexiones.length !== b.conexiones.length) return false
  const idsA = new Set(a.nodos.map((n) => n.id))
  if (!b.nodos.every((n) => idsA.has(n.id))) return false
  const flechasA = a.conexiones.map((c) => `${c.desde}:${c.salida}:${c.hacia}`).sort().join('|')
  const flechasB = b.conexiones.map((c) => `${c.desde}:${c.salida}:${c.hacia}`).sort().join('|')
  return flechasA === flechasB
}

export function leerBorradorReparto(): DefinicionReparto | null {
  try {
    const crudo = localStorage.getItem(clave())
    if (!crudo) return null
    const paquete = JSON.parse(crudo) as { definicion?: DefinicionReparto }
    return paquete.definicion ?? null
  } catch {
    return null
  }
}

export function guardarBorradorReparto(definicion: DefinicionReparto): void {
  try {
    localStorage.setItem(clave(), JSON.stringify({ guardadoEn: Date.now(), definicion }))
  } catch {
    /* espacio lleno u otro límite del navegador */
  }
}

export function quitarBorradorReparto(): void {
  localStorage.removeItem(clave())
}

/** Recupera posiciones y datos del borrador si el lienzo guardado tiene los mismos pasos. */
export function fusionarReparto(guardado: DefinicionReparto, borrador: DefinicionReparto | null): DefinicionReparto {
  if (!borrador || !mismaEstructura(guardado, borrador)) return guardado
  const pos = new Map(borrador.nodos.map((n) => [n.id, { x: n.x, y: n.y }]))
  const datos = new Map(borrador.nodos.map((n) => [n.id, n.datos]))
  return {
    nodos: guardado.nodos.map((n) => ({
      ...n,
      x: pos.get(n.id)?.x ?? n.x,
      y: pos.get(n.id)?.y ?? n.y,
      datos: datos.get(n.id) ?? n.datos,
    })),
    conexiones: borrador.conexiones.length ? borrador.conexiones : guardado.conexiones,
  }
}

export function marcarRepartoGuardadoEnServidor(): void {
  try {
    localStorage.setItem(`${clave()}-servidor`, String(Date.now()))
  } catch {
    /* noop */
  }
}

export function repartoGuardadoEnServidor(): boolean {
  return localStorage.getItem(`${clave()}-servidor`) !== null
}
