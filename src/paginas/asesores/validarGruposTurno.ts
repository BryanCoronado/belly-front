import type { GrupoAtencion, TramoHorario } from '@/api'
import { cruces, horariosSeSolapan } from './crucesHorario'

function tramoDeGrupo(g: GrupoAtencion): TramoHorario | null {
  if (g.tipo !== 'turno' || !g.turno_desde || !g.turno_hasta || !g.turno_dias.length) return null
  return { id: String(g.id), nombre: g.nombre, dias: [...g.turno_dias], desde: g.turno_desde, hasta: g.turno_hasta }
}

function horarioSolapa(a: GrupoAtencion, b: GrupoAtencion): boolean {
  const ta = tramoDeGrupo(a)
  const tb = tramoDeGrupo(b)
  if (!ta || !tb) return false
  return horariosSeSolapan(ta, tb)
}

/** Bloquea guardar si el turno choca con otro grupo turno o repite asesores en horarios cruzados. */
export function errorConflictoGrupoTurno(datos: DatosGrupoTurno, todos: GrupoAtencion[], idPropio?: number): string | null {
  if (datos.tipo !== 'turno') return null
  const propio: GrupoAtencion = {
    id: idPropio ?? -1,
    nombre: datos.nombre.trim() || 'nuevo',
    descripcion: null,
    color: '#0d9488',
    tipo: 'turno',
    turno_dias: datos.turno_dias,
    turno_desde: datos.turno_desde,
    turno_hasta: datos.turno_hasta,
    miembros: datos.miembros,
  }
  const otros = todos.filter((g) => g.tipo === 'turno' && g.id !== idPropio)
  for (const otro of otros) {
    if (!horarioSolapa(propio, otro)) continue
    return `El horario se cruza con «${otro.nombre}». Separa las horas para que no coincidan.`
  }
  for (const otro of otros) {
    if (!horarioSolapa(propio, otro)) continue
    const repetidos = datos.miembros.filter((id) => otro.miembros.includes(id))
    if (repetidos.length) {
      return `Un asesor no puede estar en «${otro.nombre}» y aquí si los horarios se cruzan. Quítalo de uno o ajusta las horas.`
    }
  }
  return null
}

export type DatosGrupoTurno = {
  nombre: string
  tipo: GrupoAtencion['tipo']
  turno_dias: number[]
  turno_desde: string
  turno_hasta: string
  miembros: number[]
}

/** Avisos al revisar el reparto (mismo criterio que el servidor). */
export function avisosTurnosGrupos(grupos: GrupoAtencion[]): string[] {
  const turnos = grupos.filter((g) => g.tipo === 'turno')
  const tramos = turnos.map((g) => tramoDeGrupo(g)).filter((t): t is TramoHorario => t !== null)
  const avisos = cruces(tramos).map(
    ([a, b]) => `Los turnos «${a}» y «${b}» se cruzan: en esas horas gana «${a}», el que aparece primero en la lista de Grupos.`,
  )
  for (let i = 0; i < turnos.length; i++) {
    for (let j = i + 1; j < turnos.length; j++) {
      if (!horarioSolapa(turnos[i], turnos[j])) continue
      const compartidos = turnos[i].miembros.filter((id) => turnos[j].miembros.includes(id))
      if (!compartidos.length) continue
      avisos.push(
        `Hay asesores en «${turnos[i].nombre}» y «${turnos[j].nombre}» con horarios que se cruzan: en esas horas solo cuenta el turno que gana.`,
      )
    }
  }
  return avisos
}
