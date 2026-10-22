import type { DefinicionReparto, NodoReparto, ProblemaReparto, RevisionReparto, TipoNodoReparto, TramoHorario } from '@/api'
import { salidasDe, tramosDe, type Catalogo } from './tiposReparto'
import { cruces } from './crucesHorario'
import { validarEnlacesTurnoReparto } from './validarEnlacesTurnoReparto'
import { avisosTurnosGrupos } from './validarGruposTurno'

/** Mismo límite que el servidor. */
export const MAX_PASOS = 80

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/
const DE_DECISION: TipoNodoReparto[] = ['horario', 'turnos_grupos', 'cliente', 'origen', 'palabras', 'dividir']
const ENTREGAN: TipoNodoReparto[] = ['repartir', 'persona', 'agente_ia']

/** Problemas de un horario suelto, para mostrarlos junto al campo mientras se edita. */
export function problemasTramo(tramo: TramoHorario, tramos: TramoHorario[]): string[] {
  const problemas: string[] = []
  if (!tramo.nombre.trim()) problemas.push('Ponle un nombre.')
  else if (tramos.some((t) => t.id !== tramo.id && t.nombre.trim().toLowerCase() === tramo.nombre.trim().toLowerCase())) problemas.push('Ya hay otro horario con este nombre.')
  if (!tramo.dias.length) problemas.push('Elige al menos un día.')
  if (!HORA.test(tramo.desde) || !HORA.test(tramo.hasta)) problemas.push('Completa la hora de inicio y de fin.')
  else if (tramo.desde === tramo.hasta) problemas.push('La hora de inicio y de fin no pueden ser iguales.')
  return problemas
}

/**
 * Revisión inmediata en el navegador, igual a la del servidor, para avisar mientras se arma el camino.
 * El servidor vuelve a revisar al guardar: esta es solo para no esperar.
 */
export function validarReparto(definicion: DefinicionReparto, catalogo: Catalogo): RevisionReparto {
  const errores: ProblemaReparto[] = []
  const avisos: ProblemaReparto[] = []
  const inicios = definicion.nodos.filter((n) => n.tipo === 'inicio')
  if (inicios.length !== 1) errores.push({ nodo: null, mensaje: 'Debe haber un solo paso «El cliente escribe».' })
  if (definicion.nodos.length > MAX_PASOS) errores.push({ nodo: null, mensaje: `El lienzo puede tener hasta ${MAX_PASOS} pasos.` })

  const conectadas = new Set(definicion.conexiones.map((c) => `${c.desde}:${c.salida}`))
  const siguientes = new Map<string, string[]>()
  for (const c of definicion.conexiones) siguientes.set(c.desde, [...(siguientes.get(c.desde) ?? []), c.hacia])

  const alcanzables = inicios[0] ? alcanzablesDesde(inicios[0].id, siguientes) : new Set<string>()
  const circulo = nodoEnCirculo(definicion.nodos, siguientes)
  if (circulo) errores.push({ nodo: circulo, mensaje: 'Las flechas forman un círculo y vuelven a un paso anterior. Quita alguna para que el camino termine.' })

  let entregan = false
  for (const nodo of definicion.nodos) {
    const d = nodo.datos
    const alcanzable = alcanzables.has(nodo.id)
    const mal = (mensaje: string) => errores.push({ nodo: nodo.id, mensaje })
    const ojo = (mensaje: string) => avisos.push({ nodo: nodo.id, mensaje })
    if (alcanzable && ENTREGAN.includes(nodo.tipo)) entregan = true

    switch (nodo.tipo) {
      case 'inicio': {
        const respaldo = d.id_usuario_respaldo
        if (respaldo && !catalogo.personas.some((p) => p.id === Number(respaldo))) mal('La persona de respaldo ya no está activa. Elige otra.')
        break
      }
      case 'turnos_grupos':
        if (!catalogo.grupos.some((g) => g.tipo === 'turno')) mal('Crea al menos un grupo tipo «Turno» con horario en la pestaña Grupos.')
        else for (const mensaje of avisosTurnosGrupos(catalogo.grupos)) ojo(mensaje)
        break
      case 'horario': {
        ojo('Este paso tiene horas escritas a mano. Cámbialo por «Según turnos del equipo» para que el horario se lea de Grupos y no tengas dos horarios distintos.')
        const tramos = tramosDe(d)
        if (!tramos.length) mal('Agrega al menos un horario.')
        for (const tramo of tramos) {
          const problemas = problemasTramo(tramo, tramos)
          if (problemas.length) mal(`Revisa el horario «${tramo.nombre.trim() || 'sin nombre'}»: ${problemas[0].toLowerCase()}`)
        }
        for (const [a, b] of cruces(tramos)) ojo(`Los horarios «${a}» y «${b}» se cruzan: en esas horas gana «${a}», el que está primero.`)
        break
      }
      case 'palabras':
        if (!Array.isArray(d.palabras) || !d.palabras.length) mal('Escribe al menos una palabra clave.')
        break
      case 'repartir': {
        const grupo = d.id_grupo ? catalogo.grupos.find((g) => g.id === Number(d.id_grupo)) : null
        if (d.id_grupo && !grupo) mal('El grupo elegido ya no existe. Elige otro.')
        else if (grupo && !grupo.miembros.length) ojo('El grupo elegido no tiene asesores: los chats seguirán por «Si nadie está disponible».')
        if (d.estrategia === 'prioridad' && !d.id_grupo) mal('Para repartir por prioridad elige un grupo: su orden define quién va primero.')
        break
      }
      case 'persona':
        if (!catalogo.personas.some((p) => p.id === Number(d.id_usuario))) mal('Elige a qué persona le llega el chat.')
        break
      case 'agente_ia': {
        const agente = catalogo.agentes.find((a) => a.id === Number(d.id_agente))
        if (!agente) mal('Elige qué asistente atiende.')
        else if (!agente.listo) ojo(`${agente.activo ? 'Falta conectar tu cuenta de OpenAI' : 'Este asistente está apagado'}: mientras tanto los chats seguirán por «Cuando pase a una persona».`)
        if (alcanzable && !conectadas.has(`${nodo.id}:humano`)) ojo('«Cuando pase a una persona» no va a ningún paso: esos chats le llegarán a la persona de respaldo.')
        break
      }
    }

    if (nodo.tipo === 'inicio') {
      if (!conectadas.has(`${nodo.id}:siguiente`)) ojo('El inicio no está unido a nada: todos los chats irán a la persona de respaldo.')
      continue
    }
    if (!alcanzable) {
      ojo('Ningún camino llega a este paso: nunca se usará.')
      continue
    }
    if (DE_DECISION.includes(nodo.tipo)) {
      for (const salida of salidasDe(nodo.tipo, d, catalogo)) {
        if (nodo.tipo === 'turnos_grupos' && salida.id.startsWith('g_')) continue
        if (!conectadas.has(`${nodo.id}:${salida.id}`)) {
          ojo(`La salida «${salida.etiqueta.split(' · ')[0]}» no va a ningún paso: esos chats le llegarán a la persona de respaldo.`)
        }
      }
    }
  }

  if (inicios[0] && conectadas.has(`${inicios[0].id}:siguiente`) && !entregan) {
    avisos.push({ nodo: null, mensaje: 'Ningún camino termina en «Repartir», «A una persona» o «Asistente IA»: los chats nuevos irán a la persona de respaldo.' })
  }

  const enlaces = validarEnlacesTurnoReparto(definicion, catalogo, alcanzables)
  errores.push(...enlaces.errores)
  avisos.push(...enlaces.avisos)

  return { errores, avisos }
}

function alcanzablesDesde(inicio: string, siguientes: Map<string, string[]>): Set<string> {
  const vistos = new Set([inicio])
  const pendientes = [inicio]
  while (pendientes.length) {
    for (const hacia of siguientes.get(pendientes.pop()!) ?? []) {
      if (!vistos.has(hacia)) {
        vistos.add(hacia)
        pendientes.push(hacia)
      }
    }
  }
  return vistos
}

function nodoEnCirculo(nodos: NodoReparto[], siguientes: Map<string, string[]>): string | null {
  const estado = new Map<string, 1 | 2>()
  for (const nodo of nodos) {
    if (estado.has(nodo.id)) continue
    const pila: [string, number][] = [[nodo.id, 0]]
    estado.set(nodo.id, 1)
    while (pila.length) {
      const tope = pila[pila.length - 1]
      const hijos = siguientes.get(tope[0]) ?? []
      if (tope[1] >= hijos.length) {
        estado.set(tope[0], 2)
        pila.pop()
        continue
      }
      const hijo = hijos[tope[1]++]
      if (estado.get(hijo) === 1) return hijo
      if (!estado.has(hijo)) {
        estado.set(hijo, 1)
        pila.push([hijo, 0])
      }
    }
  }
  return null
}

