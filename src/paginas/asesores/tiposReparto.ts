import {
  CalendarClock,
  History,
  Megaphone,
  MessageCirclePlus,
  Shuffle,
  Sparkles,
  Split,
  TextSearch,
  UserCheck,
  UserRoundSearch,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { EstrategiaReparto, GrupoAtencion, RepartoCompleto, ResultadoPrueba, TipoNodoReparto, TramoHorario } from '@/api'
import { nuevoId, porcentajeA, resumenDias } from '@/lib/editorPasos'

export type Catalogo = Pick<RepartoCompleto, 'grupos' | 'asesores' | 'personas' | 'agentes'>

type Meta = {
  titulo: string
  descripcion: string
  icono: LucideIcon
  color: string
  cabecera: string
  suave: string
}

export const META: Record<TipoNodoReparto, Meta> = {
  inicio: {
    titulo: 'El cliente escribe',
    descripcion: 'Un cliente inicia la conversación por WhatsApp',
    icono: MessageCirclePlus,
    color: '#10b981',
    cabecera: 'bg-emerald-500 text-white',
    suave: 'bg-emerald-100 text-emerald-700',
  },
  asesor_previo: {
    titulo: 'Vuelve con su asesor',
    descripcion: 'Si ya lo atendió alguien, le llega a esa persona',
    icono: History,
    color: '#14b8a6',
    cabecera: 'bg-teal-500 text-white',
    suave: 'bg-teal-100 text-teal-700',
  },
  turnos_grupos: {
    titulo: 'Según turnos del equipo',
    descripcion: 'Usa los horarios de tus grupos tipo turno (mañana, tarde…)',
    icono: UsersRound,
    color: '#d97706',
    cabecera: 'bg-orange-500 text-white',
    suave: 'bg-orange-100 text-orange-800',
  },
  horario: {
    titulo: 'Horario a mano (antiguo)',
    descripcion: 'Cámbialo por «Según turnos del equipo»',
    icono: CalendarClock,
    color: '#f59e0b',
    cabecera: 'bg-amber-500 text-white',
    suave: 'bg-amber-100 text-amber-700',
  },
  cliente: {
    titulo: 'Nuevo o conocido',
    descripcion: 'Separa clientes nuevos de los que ya escribieron',
    icono: UserRoundSearch,
    color: '#0ea5e9',
    cabecera: 'bg-sky-500 text-white',
    suave: 'bg-sky-100 text-sky-700',
  },
  origen: {
    titulo: 'De dónde viene',
    descripcion: 'Desde un anuncio de Facebook/Instagram o directo',
    icono: Megaphone,
    color: '#ec4899',
    cabecera: 'bg-pink-500 text-white',
    suave: 'bg-pink-100 text-pink-700',
  },
  palabras: {
    titulo: 'Si menciona…',
    descripcion: 'Busca palabras en su primer mensaje',
    icono: TextSearch,
    color: '#6366f1',
    cabecera: 'bg-indigo-500 text-white',
    suave: 'bg-indigo-100 text-indigo-700',
  },
  dividir: {
    titulo: 'Dividir al azar',
    descripcion: 'Reparte por porcentaje entre dos caminos',
    icono: Split,
    color: '#64748b',
    cabecera: 'bg-slate-500 text-white',
    suave: 'bg-slate-100 text-slate-700',
  },
  repartir: {
    titulo: 'Repartir entre asesores',
    descripcion: 'Entre todos o entre un grupo',
    icono: Shuffle,
    color: '#0d9488',
    cabecera: 'bg-teal-600 text-white',
    suave: 'bg-teal-100 text-teal-700',
  },
  persona: {
    titulo: 'A una persona',
    descripcion: 'Siempre le llega a alguien en particular',
    icono: UserCheck,
    color: '#8b5cf6',
    cabecera: 'bg-violet-500 text-white',
    suave: 'bg-violet-100 text-violet-700',
  },
  agente_ia: {
    titulo: 'Asistente IA',
    descripcion: 'Lo atiende la IA hasta pasarlo a una persona',
    icono: Sparkles,
    color: '#c026d3',
    cabecera: 'bg-fuchsia-600 text-white',
    suave: 'bg-fuchsia-100 text-fuchsia-700',
  },
}

export const GRUPOS_PASOS: { titulo: string; pasos: TipoNodoReparto[] }[] = [
  { titulo: 'Decidir el camino', pasos: ['asesor_previo', 'turnos_grupos', 'cliente', 'origen', 'palabras', 'dividir'] },
  { titulo: 'Quién atiende', pasos: ['repartir', 'persona', 'agente_ia'] },
]

export const PASOS_AGREGABLES = GRUPOS_PASOS.flatMap((grupo) => grupo.pasos)

/** Pasos que entregan el chat; su salida solo se usa si no pueden atender. */
export const PASOS_FINALES: TipoNodoReparto[] = ['asesor_previo', 'repartir', 'persona', 'agente_ia']

export const ESTRATEGIAS: { valor: EstrategiaReparto; titulo: string; ayuda: string }[] = [
  { valor: 'equitativo', titulo: 'Parejo', ayuda: 'Al asesor que recibió menos chats hoy.' },
  { valor: 'rotativo', titulo: 'Por turnos', ayuda: 'Al asesor que lleva más tiempo sin recibir un chat.' },
  { valor: 'menos_carga', titulo: 'Menos ocupado', ayuda: 'Al asesor con menos chats abiertos ahora.' },
  { valor: 'prioridad', titulo: 'Por prioridad', ayuda: 'Al primero del grupo que esté disponible; si no, al siguiente.' },
]

export function nuevoTramo(nombre = 'Horario de atención'): TramoHorario {
  return { id: nuevoId('t'), nombre, dias: [1, 2, 3, 4, 5], desde: '09:00', hasta: '18:00' }
}

export function datosIniciales(tipo: TipoNodoReparto): Record<string, unknown> {
  switch (tipo) {
    case 'horario':
      return { tramos: [nuevoTramo()] }
    case 'palabras':
      return { palabras: [] }
    case 'dividir':
      return { porcentaje_a: 50 }
    case 'turnos_grupos':
      return { grupos_turno: [] }
    case 'repartir':
      return { id_grupo: null, estrategia: 'equitativo', limite_chats: null }
    case 'persona':
      return { id_usuario: null }
    case 'agente_ia':
      return { id_agente: null }
    case 'inicio':
      return { id_usuario_respaldo: null }
    default:
      return {}
  }
}

export function tramosDe(datos: Record<string, unknown>): TramoHorario[] {
  return Array.isArray(datos.tramos) ? (datos.tramos as TramoHorario[]) : []
}

export type Salida = { id: string; etiqueta: string; secundaria?: boolean }

export function gruposTurnoDe(catalogo: Catalogo): GrupoAtencion[] {
  return catalogo.grupos.filter((g) => g.tipo === 'turno')
}

export function etiquetaTurnoGrupo(grupo: GrupoAtencion): string {
  if (grupo.tipo !== 'turno' || !grupo.turno_desde || !grupo.turno_hasta) return grupo.nombre
  return `${grupo.nombre} · ${resumenDias(grupo.turno_dias)} ${grupo.turno_desde}–${grupo.turno_hasta}`
}

export function salidasDe(tipo: TipoNodoReparto, datos: Record<string, unknown>, catalogo?: Catalogo): Salida[] {
  switch (tipo) {
    case 'inicio':
      return [{ id: 'siguiente', etiqueta: 'Siguiente' }]
    case 'asesor_previo':
      return [{ id: 'no', etiqueta: 'Es nuevo o su asesor no está', secundaria: true }]
    case 'turnos_grupos':
      return [
        ...(catalogo ? gruposTurnoDe(catalogo).map((g) => ({ id: `g_${g.id}`, etiqueta: etiquetaTurnoGrupo(g) })) : []),
        { id: 'fuera', etiqueta: 'Fuera de turno', secundaria: true },
      ]
    case 'horario':
      return [
        ...tramosDe(datos).map((t) => ({ id: t.id, etiqueta: `${t.nombre || 'Sin nombre'} · ${resumenDias(t.dias)} ${t.desde}–${t.hasta}` })),
        { id: 'fuera', etiqueta: 'Fuera de horario', secundaria: true },
      ]
    case 'cliente':
      return [
        { id: 'nuevo', etiqueta: 'Cliente nuevo' },
        { id: 'recurrente', etiqueta: 'Ya había escrito antes' },
      ]
    case 'origen':
      return [
        { id: 'anuncio', etiqueta: 'Viene de un anuncio' },
        { id: 'directo', etiqueta: 'Escribió directo' },
      ]
    case 'palabras':
      return [
        { id: 'si', etiqueta: 'Menciona alguna' },
        { id: 'no', etiqueta: 'No menciona ninguna', secundaria: true },
      ]
    case 'dividir': {
      const a = porcentajeA(datos)
      return [
        { id: 'a', etiqueta: `Camino A · ${a}%` },
        { id: 'b', etiqueta: `Camino B · ${100 - a}%` },
      ]
    }
    case 'repartir':
    case 'persona':
      return [{ id: 'nadie', etiqueta: 'Si nadie está disponible', secundaria: true }]
    case 'agente_ia':
      return [{ id: 'humano', etiqueta: 'Cuando pase a una persona' }]
  }
}

function nombrePorId<T extends { id: number; nombre: string }>(lista: T[], id: unknown): T | undefined {
  return lista.find((item) => item.id === Number(id))
}

export function resumenPaso(tipo: TipoNodoReparto, datos: Record<string, unknown>, catalogo: Catalogo): string {
  switch (tipo) {
    case 'inicio': {
      const respaldo = nombrePorId(catalogo.personas, datos.id_usuario_respaldo)
      return `Si ningún camino encuentra a alguien, le llega a ${respaldo?.nombre ?? 'un administrador'}.`
    }
    case 'asesor_previo':
      return 'Si ya habló con un asesor que sigue activo, vuelve con él.'
    case 'turnos_grupos': {
      const n = catalogo ? gruposTurnoDe(catalogo).length : 0
      return n ? `Elige según ${n} ${n === 1 ? 'grupo turno' : 'grupos turno'} (horario en Grupos).` : 'Crea grupos tipo turno en la pestaña Grupos.'
    }
    case 'horario':
      return tramosDe(datos).length ? 'Elige el camino según el día y la hora en que escribe.' : 'Agrega al menos un horario.'
    case 'cliente':
      return 'Revisa si este número ya te escribió antes.'
    case 'origen':
      return 'Revisa si llegó tocando un anuncio.'
    case 'palabras': {
      const palabras = Array.isArray(datos.palabras) ? (datos.palabras as string[]) : []
      return palabras.length ? `“${palabras.slice(0, 6).join('”, “')}”${palabras.length > 6 ? '…' : ''}` : 'Escribe las palabras a buscar.'
    }
    case 'dividir':
      return 'Reparte al azar entre los dos caminos.'
    case 'repartir': {
      const grupo = datos.id_grupo ? nombrePorId(catalogo.grupos, datos.id_grupo) : null
      const estrategia = ESTRATEGIAS.find((e) => e.valor === datos.estrategia)?.titulo ?? 'Parejo'
      const limite = Number(datos.limite_chats ?? 0)
      const quienes = datos.id_grupo ? (grupo ? `Grupo «${grupo.nombre}»` : 'Grupo eliminado') : 'Todos los asesores'
      const turno = grupo?.tipo === 'turno' && grupo.turno_desde && grupo.turno_hasta ? ` · ${resumenDias(grupo.turno_dias)} ${grupo.turno_desde}–${grupo.turno_hasta}` : ''
      return `${quienes} · ${estrategia}${turno}${limite > 0 ? ` · hasta ${limite} chats abiertos` : ''}`
    }
    case 'persona':
      return nombrePorId(catalogo.personas, datos.id_usuario)?.nombre ?? 'Elige a quién le llega.'
    case 'agente_ia': {
      const agente = nombrePorId(catalogo.agentes, datos.id_agente)
      if (!agente) return 'Elige qué asistente atiende.'
      return agente.listo ? agente.nombre : `${agente.nombre} · ${agente.activo ? 'falta conectar OpenAI' : 'apagado'}`
    }
  }
}

export function explicarResultado(resultado: ResultadoPrueba): string {
  const quien = resultado.nombre ?? 'nadie'
  switch (resultado.motivo) {
    case 'asesor_previo':
      return `Le llegaría a ${quien}, porque ya había atendido a este cliente.`
    case 'repartir':
      return resultado.grupo_reparto
        ? `Le tocaría a ${quien} en el reparto del grupo «${resultado.grupo_reparto}».`
        : `Le tocaría a ${quien} entre todos los asesores del reparto.`
    case 'persona':
      return `Le llegaría directo a ${quien}.`
    case 'agente':
      return `Lo atendería el asistente ${quien}. Cuando pase a una persona, sigue por su salida.`
    case 'respaldo':
      return `El camino no encontró a nadie disponible, así que le llegaría a ${quien} (respaldo).`
    default:
      return 'No hay a quién asignarle el chat. Activa al menos un asesor o un administrador.'
  }
}
