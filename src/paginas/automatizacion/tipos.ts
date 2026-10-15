import {
  Clock,
  Flag,
  GitBranch,
  Headset,
  Hourglass,
  List,
  MapPin,
  MessageCircleQuestion,
  MessageSquareText,
  MousePointerClick,
  Shuffle,
  Tag,
  Thermometer,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { DatosPaso, TipoPaso } from '@/api'

export const MAX_BOTONES = 3
export const MAX_OPCIONES = 10
export const LARGO_BOTON = 20
export const LARGO_OPCION = 24
export const LARGO_DESCRIPCION = 72
export const LARGO_CUERPO = 1000

export type Salida = { id: string; etiqueta: string }

export type MetaPaso = {
  titulo: string
  descripcion: string
  icono: LucideIcon
  /** Color principal en hexadecimal (conectores, minimapa). */
  color: string
  /** Clases de Tailwind para la cabecera de la tarjeta. */
  cabecera: string
  /** Clases de Tailwind para el icono sobre fondo suave. */
  suave: string
  unico?: boolean
}

export const META: Record<TipoPaso, MetaPaso> = {
  inicio: {
    titulo: 'Inicio',
    descripcion: 'CuÃ¡ndo empieza el flujo',
    icono: Zap,
    color: '#10b981',
    cabecera: 'bg-emerald-500 text-white',
    suave: 'bg-emerald-100 text-emerald-700',
    unico: true,
  },
  mensaje: {
    titulo: 'Mensaje',
    descripcion: 'EnvÃ­a texto, imagen, video, audio o documento',
    icono: MessageSquareText,
    color: '#0ea5e9',
    cabecera: 'bg-sky-500 text-white',
    suave: 'bg-sky-100 text-sky-700',
  },
  botones: {
    titulo: 'Botones',
    descripcion: 'Pregunta con hasta 3 botones',
    icono: MousePointerClick,
    color: '#8b5cf6',
    cabecera: 'bg-violet-500 text-white',
    suave: 'bg-violet-100 text-violet-700',
  },
  lista: {
    titulo: 'Lista de opciones',
    descripcion: 'MenÃº con hasta 10 opciones',
    icono: List,
    color: '#6366f1',
    cabecera: 'bg-indigo-500 text-white',
    suave: 'bg-indigo-100 text-indigo-700',
  },
  pregunta: {
    titulo: 'Pedir un dato',
    descripcion: 'Pregunta algo y guarda la respuesta',
    icono: MessageCircleQuestion,
    color: '#f59e0b',
    cabecera: 'bg-amber-500 text-white',
    suave: 'bg-amber-100 text-amber-700',
  },
  condicion: {
    titulo: 'DecisiÃ³n',
    descripcion: 'Sigue un camino u otro segÃºn un dato',
    icono: GitBranch,
    color: '#f43f5e',
    cabecera: 'bg-rose-500 text-white',
    suave: 'bg-rose-100 text-rose-700',
  },
  horario: {
    titulo: 'Horario',
    descripcion: 'Distingue si estÃ¡s en horario de atenciÃ³n',
    icono: Clock,
    color: '#14b8a6',
    cabecera: 'bg-teal-500 text-white',
    suave: 'bg-teal-100 text-teal-700',
  },
  variable: {
    titulo: 'Guardar dato',
    descripcion: 'Anota un dato para usarlo despuÃ©s',
    icono: Tag,
    color: '#f97316',
    cabecera: 'bg-orange-500 text-white',
    suave: 'bg-orange-100 text-orange-700',
  },
  espera: {
    titulo: 'Esperar',
    descripcion: 'Hace una pausa y luego sigue solo',
    icono: Hourglass,
    color: '#06b6d4',
    cabecera: 'bg-cyan-500 text-white',
    suave: 'bg-cyan-100 text-cyan-700',
  },
  ubicacion: {
    titulo: 'UbicaciÃ³n',
    descripcion: 'EnvÃ­a un punto del mapa',
    icono: MapPin,
    color: '#84cc16',
    cabecera: 'bg-lime-600 text-white',
    suave: 'bg-lime-100 text-lime-700',
  },
  asesor: {
    titulo: 'Pasar a un asesor',
    descripcion: 'El bot se detiene y atiende una persona',
    icono: Headset,
    color: '#d946ef',
    cabecera: 'bg-fuchsia-500 text-white',
    suave: 'bg-fuchsia-100 text-fuchsia-700',
  },
  temperatura: {
    titulo: 'Marcar interÃ©s',
    descripcion: 'Marca al contacto como frÃ­o, tibio o caliente',
    icono: Thermometer,
    color: '#ef4444',
    cabecera: 'bg-red-500 text-white',
    suave: 'bg-red-100 text-red-700',
  },
  dividir: {
    titulo: 'Dividir en dos caminos',
    descripcion: 'Prueba A/B: reparte a los clientes al azar',
    icono: Shuffle,
    color: '#a855f7',
    cabecera: 'bg-purple-500 text-white',
    suave: 'bg-purple-100 text-purple-700',
  },
  fin: {
    titulo: 'Terminar',
    descripcion: 'Cierra el flujo con un mensaje final',
    icono: Flag,
    color: '#64748b',
    cabecera: 'bg-slate-600 text-white',
    suave: 'bg-slate-100 text-slate-700',
  },
}

/** CÃ³mo se agrupan los pasos en la barra lateral del editor. */
export const GRUPOS_PASOS: { titulo: string; pasos: TipoPaso[] }[] = [
  { titulo: 'Enviar', pasos: ['mensaje', 'ubicacion'] },
  { titulo: 'Preguntar', pasos: ['botones', 'lista', 'pregunta'] },
  { titulo: 'LÃ³gica', pasos: ['condicion', 'horario', 'espera', 'variable', 'dividir'] },
  { titulo: 'Contacto', pasos: ['temperatura'] },
  { titulo: 'Terminar', pasos: ['asesor', 'fin'] },
]

export const PASOS_AGREGABLES: TipoPaso[] = [
  'mensaje',
  'ubicacion',
  'botones',
  'lista',
  'pregunta',
  'espera',
  'condicion',
  'horario',
  'variable',
  'dividir',
  'temperatura',
  'asesor',
  'fin',
]

export const OPERADORES: { valor: string; etiqueta: string; sinValor?: boolean }[] = [
  { valor: 'igual', etiqueta: 'es igual a' },
  { valor: 'distinto', etiqueta: 'es distinto de' },
  { valor: 'contiene', etiqueta: 'contiene la palabra' },
  { valor: 'empieza', etiqueta: 'empieza con' },
  { valor: 'mayor', etiqueta: 'es mayor que' },
  { valor: 'menor', etiqueta: 'es menor que' },
  { valor: 'vacio', etiqueta: 'estÃ¡ vacÃ­o', sinValor: true },
  { valor: 'no_vacio', etiqueta: 'tiene algo escrito', sinValor: true },
]

export const VALIDACIONES = [
  { valor: 'texto', etiqueta: 'Cualquier texto' },
  { valor: 'numero', etiqueta: 'Un nÃºmero' },
  { valor: 'email', etiqueta: 'Un correo electrÃ³nico' },
  { valor: 'telefono', etiqueta: 'Un telÃ©fono' },
]

export const UNIDADES_ESPERA = [
  { valor: 'segundos', etiqueta: 'segundos' },
  { valor: 'minutos', etiqueta: 'minutos' },
  { valor: 'horas', etiqueta: 'horas' },
  { valor: 'dias', etiqueta: 'dÃ­as' },
]

export const AUDIENCIAS = [
  { valor: 'nuevos', etiqueta: 'Solo contactos nuevos', ayuda: 'Personas con las que nunca habÃ­as hablado.' },
  { valor: 'todos', etiqueta: 'Todos los contactos', ayuda: 'TambiÃ©n personas que ya te habÃ­an escrito.' },
]

export const REPETICIONES = [
  { valor: 'una_vez', etiqueta: 'Una sola vez por contacto' },
  { valor: 'cada_horas', etiqueta: 'Cada cierto tiempo' },
  { valor: 'siempre', etiqueta: 'Cada vez que cumpla la condiciÃ³n' },
]

export const MAX_PAUSA = 10

/** CÃ³mo se reparten los chats entre los asesores cuando el bot termina su parte. */
export const REPARTOS = [
  {
    valor: 'mantener',
    etiqueta: 'Que siga con quien ya lo tiene',
    ayuda: 'No se cambia de asesor: lo atiende quien recibiÃ³ el chat.',
  },
  {
    valor: 'equitativo',
    etiqueta: 'Repartir parejo entre mis asesores',
    ayuda: 'Cada chat nuevo va para quien lleva menos chats asignados hoy.',
  },
  {
    valor: 'menos_carga',
    etiqueta: 'Al asesor con menos chats abiertos',
    ayuda: 'Se elige a quien tiene menos conversaciones en curso en este momento.',
  },
]

/** Lo mismo, pero dentro de un paso Â«Pasar a un asesorÂ» (puede anular lo del flujo). */
export const MODOS_ASIGNACION = [
  { valor: 'flujo', etiqueta: 'Como lo configurÃ© en el flujo', ayuda: 'Usa el reparto que elegiste en Â«Configurar flujoÂ».' },
  { valor: 'elegir', etiqueta: 'A un asesor en particular', ayuda: 'Siempre pasa con la misma persona.' },
  { valor: 'equitativo', etiqueta: 'Repartir parejo entre estos asesores', ayuda: 'Para quien lleva menos chats asignados hoy.' },
  { valor: 'menos_carga', etiqueta: 'Al que tenga menos chats abiertos', ayuda: 'Para quien tiene menos conversaciones en curso.' },
  { valor: 'mantener', etiqueta: 'Que siga con quien ya lo tiene', ayuda: 'No cambia de asesor.' },
]

export const TEMPERATURAS = [
  { valor: 'frio', etiqueta: 'FrÃ­o', ayuda: 'Solo estÃ¡ mirando.', emoji: 'ðŸ§Š' },
  { valor: 'tibio', etiqueta: 'Tibio', ayuda: 'Tiene interÃ©s, pero aÃºn no decide.', emoji: 'ðŸŒ¤' },
  { valor: 'caliente', etiqueta: 'Caliente', ayuda: 'Quiere comprar o contratar pronto.', emoji: 'ðŸ”¥' },
]

export const DIAS = [
  { valor: 1, corto: 'L', largo: 'Lunes' },
  { valor: 2, corto: 'M', largo: 'Martes' },
  { valor: 3, corto: 'M', largo: 'MiÃ©rcoles' },
  { valor: 4, corto: 'J', largo: 'Jueves' },
  { valor: 5, corto: 'V', largo: 'Viernes' },
  { valor: 6, corto: 'S', largo: 'SÃ¡bado' },
  { valor: 7, corto: 'D', largo: 'Domingo' },
]

/** Datos que el bot ya conoce sin preguntar. */
export const VARIABLES_BASE = [
  { nombre: 'nombre', ayuda: 'Nombre del cliente' },
  { nombre: 'telefono', ayuda: 'TelÃ©fono del cliente' },
  { nombre: 'ultima_opcion', ayuda: 'Ãšltima opciÃ³n que eligiÃ³' },
  { nombre: 'hora', ayuda: 'Hora actual' },
  { nombre: 'fecha', ayuda: 'Fecha de hoy' },
]

export function nuevoId(prefijo: string): string {
  return `${prefijo}${Math.random().toString(36).slice(2, 8)}`
}

export function datosIniciales(tipo: TipoPaso): DatosPaso {
  switch (tipo) {
    case 'inicio':
      return { disparador: 'primer_mensaje', palabras: [], exacta: false, audiencia: 'nuevos', repetir: 'una_vez', reparto: 'mantener', equipo: [] }
    case 'mensaje':
      return { texto: '', media: 'ninguno', url: '', nombre_archivo: '', pausa: 0 }
    case 'espera':
      return { cantidad: 1, unidad: 'horas' }
    case 'ubicacion':
      return { latitud: '', longitud: '', nombre: '', direccion: '', pausa: 0 }
    case 'botones':
      return {
        texto: '',
        botones: [
          { id: nuevoId('b'), titulo: 'OpciÃ³n 1' },
          { id: nuevoId('b'), titulo: 'OpciÃ³n 2' },
        ],
      }
    case 'lista':
      return {
        texto: '',
        boton: 'Ver opciones',
        opciones: [
          { id: nuevoId('o'), titulo: 'OpciÃ³n 1', descripcion: '' },
          { id: nuevoId('o'), titulo: 'OpciÃ³n 2', descripcion: '' },
          { id: nuevoId('o'), titulo: 'OpciÃ³n 3', descripcion: '' },
        ],
      }
    case 'pregunta':
      return { texto: '', variable: '', validacion: 'texto', error: '' }
    case 'condicion':
      return { variable: '', operador: 'igual', valor: '' }
    case 'horario':
      return { dias: [1, 2, 3, 4, 5], desde: '09:00', hasta: '18:00' }
    case 'variable':
      return { variable: '', valor: '' }
    case 'temperatura':
      return { valor: 'caliente' }
    case 'dividir':
      return { porcentaje_a: 50 }
    case 'asesor':
      return { texto: 'Te paso con {{asesor}}, en breve te atiende. ðŸ™Œ', asignar: 'flujo', asesor_id: 0, asesores: [] }
    case 'fin':
      return { texto: 'Â¡Gracias por escribirnos! ðŸ’š' }
  }
}

type Opcion = { id: string; titulo?: string }

export function opcionesDe(tipo: TipoPaso, datos: DatosPaso): Opcion[] {
  const lista = tipo === 'botones' ? datos.botones : tipo === 'lista' ? datos.opciones : []
  return Array.isArray(lista) ? (lista as Opcion[]) : []
}

export function minutosSinRespuesta(datos: DatosPaso): number {
  const minutos = Number(datos.timeout_min ?? 0)
  return Number.isFinite(minutos) && minutos > 0 ? Math.floor(minutos) : 0
}

/** Â«30 minÂ», Â«2 hÂ», Â«1 dÃ­aÂ» a partir de minutos. */
export function duracionCorta(minutos: number): string {
  if (minutos % 1440 === 0) {
    return `${minutos / 1440} ${minutos === 1440 ? 'dÃ­a' : 'dÃ­as'}`
  }
  if (minutos % 60 === 0) {
    return `${minutos / 60} h`
  }
  return `${minutos} min`
}

export function salidasDe(tipo: TipoPaso, datos: DatosPaso): Salida[] {
  const tiempo: Salida[] = minutosSinRespuesta(datos)
    ? [{ id: 'sin_respuesta', etiqueta: `Sin respuesta (${duracionCorta(minutosSinRespuesta(datos))})` }]
    : []

  switch (tipo) {
    case 'botones':
    case 'lista':
      return [
        ...opcionesDe(tipo, datos).map((o) => ({ id: o.id, etiqueta: o.titulo?.trim() || 'Sin texto' })),
        { id: 'otro', etiqueta: 'Otra respuesta' },
        ...tiempo,
      ]
    case 'pregunta':
      return [{ id: 'siguiente', etiqueta: '' }, ...tiempo]
    case 'condicion':
      return [
        { id: 'si', etiqueta: 'SÃ­ se cumple' },
        { id: 'no', etiqueta: 'No se cumple' },
      ]
    case 'dividir': {
      const a = porcentajeA(datos)
      return [
        { id: 'a', etiqueta: `Camino A (${a}%)` },
        { id: 'b', etiqueta: `Camino B (${100 - a}%)` },
      ]
    }
    case 'horario':
      return [
        { id: 'abierto', etiqueta: 'En horario' },
        { id: 'cerrado', etiqueta: 'Fuera de horario' },
      ]
    case 'inicio':
    case 'mensaje':
    case 'variable':
    case 'espera':
    case 'ubicacion':
    case 'temperatura':
      return [{ id: 'siguiente', etiqueta: '' }]
    default:
      return []
  }
}

export function texto(datos: DatosPaso, clave: string): string {
  const valor = datos[clave]
  return typeof valor === 'string' ? valor : ''
}

export function resumenInicio(datos: DatosPaso): string {
  const palabras = Array.isArray(datos.palabras) ? (datos.palabras as string[]) : []
  switch (datos.disparador) {
    case 'palabra_clave':
      return palabras.length ? `Cuando escriban: ${palabras.join(', ')}` : 'Cuando escriban una palabra (falta elegirla)'
    case 'cualquier_mensaje':
      return audienciaDe(datos) === 'nuevos' ? 'Con el mensaje de un contacto nuevo' : 'Con cualquier mensaje'
    default:
      return audienciaDe(datos) === 'nuevos' ? 'Cuando un contacto nuevo escribe' : 'Cuando alguien escribe por primera vez'
  }
}

/** Misma regla que el servidor: por defecto el flujo es para contactos nuevos, salvo si se activa con una palabra. */
export function audienciaDe(datos: DatosPaso): 'nuevos' | 'todos' {
  if (datos.audiencia === 'nuevos' || datos.audiencia === 'todos') {
    return datos.audiencia
  }
  return datos.disparador === 'palabra_clave' ? 'todos' : 'nuevos'
}

export function porcentajeA(datos: DatosPaso): number {
  const valor = Math.round(Number(datos.porcentaje_a ?? 50))
  return Number.isFinite(valor) ? Math.min(99, Math.max(1, valor)) : 50
}

export function idsDe(valor: unknown): number[] {
  return Array.isArray(valor) ? valor.map(Number).filter((n) => Number.isInteger(n) && n > 0) : []
}

export function repartoDe(datos: DatosPaso): 'mantener' | 'equitativo' | 'menos_carga' {
  return datos.reparto === 'equitativo' || datos.reparto === 'menos_carga' ? datos.reparto : 'mantener'
}

function cuantos(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

/** Â«Reparto parejo entre 3 asesoresÂ» para el resumen del inicio. */
export function resumenEquipo(datos: DatosPaso): string {
  const reparto = repartoDe(datos)
  const equipo = idsDe(datos.equipo).length
  if (reparto === 'mantener') {
    return 'Al terminar, el chat sigue con quien ya lo tiene.'
  }
  const quien = equipo ? `entre ${cuantos(equipo, 'asesor elegido', 'asesores elegidos')}` : 'entre todos tus asesores'
  return reparto === 'equitativo' ? `Al terminar, reparte los chats parejo ${quien}.` : `Al terminar, pasa el chat al que tenga menos abiertos ${quien}.`
}

/** LÃ­nea corta para la tarjeta del paso Â«Pasar a un asesorÂ». */
export function resumenAsignacion(datos: DatosPaso): string {
  const modo = typeof datos.asignar === 'string' ? datos.asignar : 'flujo'
  const equipo = idsDe(datos.asesores).length
  switch (modo) {
    case 'elegir':
      return Number(datos.asesor_id) > 0 ? 'ðŸ‘¤ A un asesor elegido' : 'ðŸ‘¤ Falta elegir al asesor'
    case 'equitativo':
      return `âš–ï¸ Reparto parejo${equipo ? ` (${cuantos(equipo, 'asesor', 'asesores')})` : ''}`
    case 'menos_carga':
      return `ðŸ“‰ Al que tenga menos chats${equipo ? ` (${cuantos(equipo, 'asesor', 'asesores')})` : ''}`
    case 'mantener':
      return 'âž¡ï¸ Sigue con quien ya lo tiene'
    default:
      return 'âš™ï¸ SegÃºn el reparto del flujo'
  }
}

export function repeticionDe(datos: DatosPaso): 'una_vez' | 'cada_horas' | 'siempre' {
  if (datos.repetir === 'una_vez' || datos.repetir === 'cada_horas' || datos.repetir === 'siempre') {
    return datos.repetir
  }
  return datos.disparador === 'palabra_clave' ? 'siempre' : 'una_vez'
}

export function resumenPaso(tipo: TipoPaso, datos: DatosPaso): string {
  switch (tipo) {
    case 'inicio':
      return resumenInicio(datos)
    case 'mensaje': {
      const media = texto(datos, 'media')
      const etiqueta =
        media === 'imagen'
          ? 'ðŸ–¼ Imagen'
          : media === 'video'
            ? 'ðŸŽ¬ Video'
            : media === 'audio'
              ? 'ðŸŽ¤ Audio'
              : media === 'documento'
                ? 'ðŸ“„ Documento'
                : ''
      return [etiqueta, texto(datos, 'texto')].filter(Boolean).join(' Â· ') || 'Escribe el mensajeâ€¦'
    }
    case 'espera': {
      const unidad = UNIDADES_ESPERA.find((u) => u.valor === datos.unidad)?.etiqueta ?? 'segundos'
      return `Espera ${Number(datos.cantidad ?? 0)} ${unidad}`
    }
    case 'ubicacion':
      return texto(datos, 'nombre') || texto(datos, 'direccion') || (texto(datos, 'latitud') ? 'Punto en el mapa' : 'Elige el lugarâ€¦')
    case 'botones':
    case 'lista':
    case 'pregunta':
    case 'fin':
      return texto(datos, 'texto') || 'Escribe el mensajeâ€¦'
    case 'asesor':
      return `${resumenAsignacion(datos)}\n${texto(datos, 'texto') || 'Sin mensaje'}`
    case 'temperatura': {
      const nivel = TEMPERATURAS.find((t) => t.valor === datos.valor)
      return nivel ? `${nivel.emoji} Marca al contacto como ${nivel.etiqueta.toLowerCase()}` : 'Elige quÃ© tan interesado estÃ¡â€¦'
    }
    case 'dividir':
      return `${porcentajeA(datos)}% va por el camino A y ${100 - porcentajeA(datos)}% por el B`
    case 'condicion': {
      const operador = OPERADORES.find((o) => o.valor === datos.operador)
      const variable = texto(datos, 'variable')
      if (!variable) {
        return 'Elige quÃ© dato compararâ€¦'
      }
      return `Si ${variable} ${operador?.etiqueta ?? ''} ${operador?.sinValor ? '' : texto(datos, 'valor')}`.trim()
    }
    case 'horario': {
      const dias = Array.isArray(datos.dias) ? (datos.dias as number[]) : []
      return `${texto(datos, 'desde')} a ${texto(datos, 'hasta')} Â· ${dias.length} dÃ­as`
    }
    case 'variable':
      return texto(datos, 'variable') ? `${texto(datos, 'variable')} = ${texto(datos, 'valor')}` : 'Elige el nombre del datoâ€¦'
  }
}

/** Días y horas en que un flujo (o un paso) puede actuar. */
export type Horario = { activo?: boolean; dias?: number[]; desde?: string; hasta?: string }

export function horarioActivo(datos: DatosPaso): Horario {
  const h = datos.horario_activo
  const base = h && typeof h === 'object' ? (h as Horario) : {}
  return { dias: [1, 2, 3, 4, 5], desde: '09:00', hasta: '18:00', ...base }
}
