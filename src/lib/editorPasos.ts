/** Piezas comunes de los editores de Reparto de chats y de Flujos automáticos. */

/** Lunes = 1 … domingo = 7, igual que el servidor. */
export const DIAS = [
  { valor: 1, corto: 'L', largo: 'Lunes' },
  { valor: 2, corto: 'M', largo: 'Martes' },
  { valor: 3, corto: 'X', largo: 'Miércoles' },
  { valor: 4, corto: 'J', largo: 'Jueves' },
  { valor: 5, corto: 'V', largo: 'Viernes' },
  { valor: 6, corto: 'S', largo: 'Sábado' },
  { valor: 7, corto: 'D', largo: 'Domingo' },
]

export type Horario = { dias?: number[]; desde?: string; hasta?: string }

export function resumenDias(dias: number[]): string {
  const ordenados = [...dias].sort((a, b) => a - b)
  if (ordenados.length === 0) return 'Sin días'
  if (ordenados.length === 7) return 'Todos los días'
  if (ordenados.join() === '1,2,3,4,5') return 'Lunes a viernes'
  if (ordenados.join() === '1,2,3,4,5,6') return 'Lunes a sábado'
  if (ordenados.join() === '6,7') return 'Fines de semana'
  return ordenados.map((dia) => DIAS.find((item) => item.valor === dia)?.corto ?? '').join(' ')
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}_${Math.random().toString(36).slice(2, 9)}`
}

/** Porcentaje del camino A en «Dividir en dos caminos» (1 a 99). */
export function porcentajeA(datos: Record<string, unknown>): number {
  const valor = Math.round(Number(datos.porcentaje_a ?? 50))
  return Number.isFinite(valor) ? Math.min(99, Math.max(1, valor)) : 50
}
