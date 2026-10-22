import type { DefinicionReparto, ProblemaReparto } from '@/api'
import type { Catalogo } from './tiposReparto'

type Resultado = { errores: ProblemaReparto[]; avisos: ProblemaReparto[] }

function nombresAsesoresActivos(grupoId: number, catalogo: Catalogo): string[] {
  const grupo = catalogo.grupos.find((g) => g.id === grupoId)
  if (!grupo) return []
  return grupo.miembros
    .map((id) => catalogo.asesores.find((a) => a.id === id))
    .filter((a) => a?.activo)
    .map((a) => a!.nombre)
}

/** Cruces de configuración entre salidas de turno y pasos Repartir. */
export function validarEnlacesTurnoReparto(
  definicion: DefinicionReparto,
  catalogo: Catalogo,
  alcanzables: Set<string>,
): Resultado {
  const errores: ProblemaReparto[] = []
  const avisos: ProblemaReparto[] = []
  const porId = new Map(definicion.nodos.map((n) => [n.id, n]))
  const turnosPorRepartir = new Map<string, number[]>()

  for (const c of definicion.conexiones) {
    const origen = porId.get(c.desde)
    const destino = porId.get(c.hacia)
    if (!origen || origen.tipo !== 'turnos_grupos') continue
    const m = /^g_(\d+)$/.exec(c.salida)
    if (!m) continue
    if (!alcanzables.has(c.desde)) continue

    const idTurno = Number(m[1])
    const grupo = catalogo.grupos.find((g) => g.id === idTurno)
    const nombreTurno = grupo?.nombre ?? 'turno'

    if (!destino) continue

    if (destino.tipo !== 'repartir') {
      avisos.push({
        nodo: c.desde,
        mensaje: `La salida «${nombreTurno}» debería llegar a un paso «Repartir entre asesores», no a otro tipo de paso.`,
      })
      continue
    }

    const lista = turnosPorRepartir.get(c.hacia) ?? []
    lista.push(idTurno)
    turnosPorRepartir.set(c.hacia, lista)

    const explicito = destino.datos.id_grupo ? Number(destino.datos.id_grupo) : null
    if (explicito !== null && explicito !== idTurno) {
      const otro = catalogo.grupos.find((g) => g.id === explicito)?.nombre ?? 'otro grupo'
      errores.push({
        nodo: c.hacia,
        mensaje: `Este reparto apunta a «${otro}», pero la flecha viene del turno «${nombreTurno}». Usa el mismo grupo o un paso Repartir aparte.`,
      })
    }

    if (!grupo) {
      errores.push({ nodo: c.hacia, mensaje: `El turno «${nombreTurno}» ya no existe. Actualiza Grupos o quita esa flecha.` })
      continue
    }

    if (!grupo.miembros.length) {
      errores.push({
        nodo: c.hacia,
        mensaje: `En el horario de «${nombreTurno}» no hay asesores en el grupo: nadie podrá recibir esos chats.`,
      })
      continue
    }

    const activos = nombresAsesoresActivos(idTurno, catalogo)
    if (!activos.length) {
      errores.push({
        nodo: c.hacia,
        mensaje: `«${nombreTurno}» tiene asesores pero ninguno está activo: activa al menos uno en Mi equipo.`,
      })
    } else if (explicito === null) {
      avisos.push({
        nodo: c.hacia,
        mensaje: `Por la flecha de «${nombreTurno}» se repartirá solo entre: ${activos.join(', ')}.`,
      })
    } else {
      avisos.push({
        nodo: destino.id,
        mensaje: `«${nombreTurno}» listo: reparte entre ${activos.join(', ')}.`,
      })
    }
  }

  for (const [repartirId, ids] of turnosPorRepartir) {
    const unicos = [...new Set(ids)]
    if (unicos.length > 1) {
      const nombres = unicos.map((id) => catalogo.grupos.find((g) => g.id === id)?.nombre ?? `grupo ${id}`).join(', ')
      errores.push({
        nodo: repartirId,
        mensaje: `Varios turnos (${nombres}) llegan al mismo paso Repartir. Pon un Repartir distinto para cada turno.`,
      })
    }
  }

  avisosTurnosSinRepartir(definicion, catalogo, alcanzables, avisos)

  return { errores, avisos }
}

function avisosTurnosSinRepartir(definicion: DefinicionReparto, catalogo: Catalogo, alcanzables: Set<string>, avisos: ProblemaReparto[]) {
  for (const nodo of definicion.nodos) {
    if (nodo.tipo !== 'turnos_grupos' || !alcanzables.has(nodo.id)) continue
    for (const g of catalogo.grupos.filter((gr) => gr.tipo === 'turno')) {
      const salida = `g_${g.id}`
      const conectada = definicion.conexiones.some((c) => c.desde === nodo.id && c.salida === salida)
      if (conectada) continue
      avisos.push({
        nodo: nodo.id,
        mensaje: `Conecta la salida «${g.nombre}» a un paso Repartir con ese mismo grupo.`,
      })
    }
  }
}
