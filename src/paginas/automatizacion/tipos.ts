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
import { nuevoId, porcentajeA } from '@/lib/editorPasos'

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
    descripcion: 'Cuándo empieza el flujo',
    icono: Zap,
    color: '#10b981',
    cabecera: 'bg-emerald-500 text-white',
    suave: 'bg-emerald-100 text-emerald-700',
    unico: true,
  },
  mensaje: {
    titulo: 'Mensaje',
    descripcion: 'Envía texto, imagen, video, audio o documento',
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
    descripcion: 'Menú con hasta 10 opciones',
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
    titulo: 'Decisión',
    descripcion: 'Sigue un camino u otro según un dato',
    icono: GitBranch,
    color: '#f43f5e',
    cabecera: 'bg-rose-500 text-white',
    suave: 'bg-rose-100 text-rose-700',
  },
  horario: {
    titulo: '¿Hay turno ahora?',
    descripcion: 'Usa los turnos de Asesores → Grupos',
    icono: Clock,
    color: '#14b8a6',
    cabecera: 'bg-teal-500 text-white',
    suave: 'bg-teal-100 text-teal-700',
  },
  variable: {
    titulo: 'Guardar dato',
    descripcion: 'Anota un dato para usarlo después',
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
    titulo: 'Ubicación',
    descripcion: 'Envía un punto del mapa',
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
    titulo: 'Marcar interés',
    descripcion: 'Marca al contacto como frío, tibio o caliente',
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

/** Cómo se agrupan los pasos en la barra lateral del editor. */
export const GRUPOS_PASOS: { titulo: string; pasos: TipoPaso[] }[] = [
  { titulo: 'Enviar', pasos: ['mensaje', 'ubicacion'] },
  { titulo: 'Preguntar', pasos: ['botones', 'lista', 'pregunta'] },
  { titulo: 'Lógica', pasos: ['condicion', 'horario', 'espera', 'variable', 'dividir'] },
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
  { valor: 'vacio', etiqueta: 'está vacío', sinValor: true },
  { valor: 'no_vacio', etiqueta: 'tiene algo escrito', sinValor: true },
]

export const VALIDACIONES = [
  { valor: 'texto', etiqueta: 'Cualquier texto' },
  { valor: 'numero', etiqueta: 'Un número' },
  { valor: 'email', etiqueta: 'Un correo electrónico' },
  { valor: 'telefono', etiqueta: 'Un teléfono' },
]

export const UNIDADES_ESPERA = [
  { valor: 'segundos', etiqueta: 'segundos' },
  { valor: 'minutos', etiqueta: 'minutos' },
  { valor: 'horas', etiqueta: 'horas' },
  { valor: 'dias', etiqueta: 'días' },
]

export const AUDIENCIAS = [
  { valor: 'nuevos', etiqueta: 'Solo contactos nuevos', ayuda: 'Personas con las que nunca habías hablado.' },
  { valor: 'todos', etiqueta: 'Todos los contactos', ayuda: 'También personas que ya te habían escrito.' },
]

export const REPETICIONES = [
  { valor: 'una_vez', etiqueta: 'Una sola vez por contacto' },
  { valor: 'cada_horas', etiqueta: 'Cada cierto tiempo' },
  { valor: 'siempre', etiqueta: 'Cada vez que cumpla la condición' },
]

export const MAX_PAUSA = 10

/** Paso «Pasar a un asesor»: repartir entre asesores es tarea de Reparto de chats, aquí solo se respeta o se fija una persona. */
export const MODOS_ASIGNACION = [
  {
    valor: 'mantener',
    etiqueta: 'Al asesor que asignó Reparto de chats',
    ayuda: 'Lo atiende quien ya tiene el chat según tus turnos y grupos.',
  },
  { valor: 'elegir', etiqueta: 'A un asesor en particular', ayuda: 'Siempre pasa con la misma persona, sin importar el reparto.' },
] as const

export function modoAsignacion(datos: DatosPaso): 'mantener' | 'elegir' {
  return datos.asignar === 'elegir' ? 'elegir' : 'mantener'
}

export const TEMPERATURAS = [
  { valor: 'frio', etiqueta: 'Frío', ayuda: 'Solo está mirando.', emoji: '🧊' },
  { valor: 'tibio', etiqueta: 'Tibio', ayuda: 'Tiene interés, pero aún no decide.', emoji: '🌤' },
  { valor: 'caliente', etiqueta: 'Caliente', ayuda: 'Quiere comprar o contratar pronto.', emoji: '🔥' },
]

/** Datos que el bot ya conoce sin preguntar. */
export const VARIABLES_BASE = [
  { nombre: 'nombre', ayuda: 'Nombre del cliente' },
  { nombre: 'telefono', ayuda: 'Teléfono del cliente' },
  { nombre: 'ultima_opcion', ayuda: 'Última opción que eligió' },
  { nombre: 'hora', ayuda: 'Hora actual' },
  { nombre: 'fecha', ayuda: 'Fecha de hoy' },
]

export function datosIniciales(tipo: TipoPaso): DatosPaso {
  switch (tipo) {
    case 'inicio':
      return { disparador: 'primer_mensaje', palabras: [], exacta: false, audiencia: 'nuevos', repetir: 'una_vez' }
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
          { id: nuevoId('b'), titulo: 'Opción 1' },
          { id: nuevoId('b'), titulo: 'Opción 2' },
        ],
      }
    case 'lista':
      return {
        texto: '',
        boton: 'Ver opciones',
        opciones: [
          { id: nuevoId('o'), titulo: 'Opción 1', descripcion: '' },
          { id: nuevoId('o'), titulo: 'Opción 2', descripcion: '' },
          { id: nuevoId('o'), titulo: 'Opción 3', descripcion: '' },
        ],
      }
    case 'pregunta':
      return { texto: '', variable: '', validacion: 'texto', error: '' }
    case 'condicion':
      return { variable: '', operador: 'igual', valor: '' }
    case 'variable':
      return { variable: '', valor: '' }
    case 'temperatura':
      return { valor: 'caliente' }
    case 'dividir':
      return { porcentaje_a: 50 }
    case 'asesor':
      return { texto: 'Te paso con {{asesor}}, en breve te atiende. 🙌', asignar: 'mantener', asesor_id: 0 }
    case 'fin':
      return { texto: '¡Gracias por escribirnos! 💚' }
    case 'horario':
      return {}
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

/** «30 min», «2 h», «1 día» a partir de minutos. */
export function duracionCorta(minutos: number): string {
  if (minutos % 1440 === 0) {
    return `${minutos / 1440} ${minutos === 1440 ? 'día' : 'días'}`
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
        { id: 'si', etiqueta: 'Sí se cumple' },
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
        { id: 'abierto', etiqueta: 'En turno' },
        { id: 'cerrado', etiqueta: 'Fuera de turno' },
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

/** Línea corta para la tarjeta del paso «Pasar a un asesor». */
export function resumenAsignacion(datos: DatosPaso): string {
  if (modoAsignacion(datos) === 'elegir') {
    return Number(datos.asesor_id) > 0 ? 'A un asesor elegido' : 'Falta elegir al asesor'
  }
  return 'Al asesor que asignó Reparto de chats'
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
          ? '🖼 Imagen'
          : media === 'video'
            ? '🎬 Video'
            : media === 'audio'
              ? '🎤 Audio'
              : media === 'documento'
                ? '📄 Documento'
                : ''
      return [etiqueta, texto(datos, 'texto')].filter(Boolean).join(' · ') || 'Escribe el mensaje…'
    }
    case 'espera': {
      const unidad = UNIDADES_ESPERA.find((u) => u.valor === datos.unidad)?.etiqueta ?? 'segundos'
      return `Espera ${Number(datos.cantidad ?? 0)} ${unidad}`
    }
    case 'ubicacion':
      return texto(datos, 'nombre') || texto(datos, 'direccion') || (texto(datos, 'latitud') ? 'Punto en el mapa' : 'Elige el lugar…')
    case 'botones':
    case 'lista':
    case 'pregunta':
    case 'fin':
      return texto(datos, 'texto') || 'Escribe el mensaje…'
    case 'asesor':
      return `${resumenAsignacion(datos)}\n${texto(datos, 'texto') || 'Sin mensaje'}`
    case 'temperatura': {
      const nivel = TEMPERATURAS.find((t) => t.valor === datos.valor)
      return nivel ? `${nivel.emoji} Marca al contacto como ${nivel.etiqueta.toLowerCase()}` : 'Elige qué tan interesado está…'
    }
    case 'dividir':
      return `${porcentajeA(datos)}% va por el camino A y ${100 - porcentajeA(datos)}% por el B`
    case 'condicion': {
      const operador = OPERADORES.find((o) => o.valor === datos.operador)
      const variable = texto(datos, 'variable')
      if (!variable) {
        return 'Elige qué dato comparar…'
      }
      return `Si ${variable} ${operador?.etiqueta ?? ''} ${operador?.sinValor ? '' : texto(datos, 'valor')}`.trim()
    }
    case 'horario':
      return 'Según los turnos de tus grupos'
    case 'variable':
      return texto(datos, 'variable') ? `${texto(datos, 'variable')} = ${texto(datos, 'valor')}` : 'Elige el nombre del dato…'
  }
}
