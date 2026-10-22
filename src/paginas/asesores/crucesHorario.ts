import type { TramoHorario } from '@/api'

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/

function minutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** Pares de horarios que comparten algún minuto de la semana; si cruza la medianoche, cuenta desde la hora de inicio hasta el final del día y desde el comienzo del día hasta la hora de fin. */
export function cruces(tramos: TramoHorario[]): [string, string][] {
  const rangos = tramos.map((t) => {
    if (!t.dias.length || !HORA.test(t.desde) || !HORA.test(t.hasta) || t.desde === t.hasta) return []
    const desde = minutos(t.desde)
    const hasta = minutos(t.hasta)
    return t.dias.flatMap((dia): [number, number][] => {
      const base = (dia - 1) * 1440
      return desde < hasta ? [[base + desde, base + hasta]] : [[base, base + hasta], [base + desde, base + 1440]]
    })
  })

  const pares: [string, string][] = []
  for (let a = 0; a < tramos.length; a++) {
    for (let b = a + 1; b < tramos.length; b++) {
      if (rangos[a].some(([a1, a2]) => rangos[b].some(([b1, b2]) => a1 < b2 && b1 < a2))) {
        pares.push([tramos[a].nombre.trim() || 'sin nombre', tramos[b].nombre.trim() || 'sin nombre'])
      }
    }
  }
  return pares
}

export function horariosSeSolapan(a: Pick<TramoHorario, 'dias' | 'desde' | 'hasta'>, b: Pick<TramoHorario, 'dias' | 'desde' | 'hasta'>): boolean {
  return cruces([
    { id: 'a', nombre: 'a', dias: a.dias, desde: a.desde, hasta: a.hasta },
    { id: 'b', nombre: 'b', dias: b.dias, desde: b.desde, hasta: b.hasta },
  ]).length > 0
}
