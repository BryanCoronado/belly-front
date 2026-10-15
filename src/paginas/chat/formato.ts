import type { ConversacionChat, MensajeChat, PlantillaWhatsapp } from '@/api'

const VENTANA_WHATSAPP_MS = 24 * 60 * 60 * 1000

export function nombreContacto(chat: ConversacionChat): string {
  const completo = chat.nombre_completo_cliente?.trim()
  if (completo) {
    return completo
  }
  const nombre = [chat.nombre_cliente, chat.apellido_cliente].filter(Boolean).join(' ').trim()
  return nombre || chat.telefono || 'Contacto sin nombre'
}

export function iniciales(nombre: string): string {
  const partes = nombre.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) {
    return '#'
  }
  return partes
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}

type FechaPhp = { date?: string }

/** El API a veces serializa las fechas como objeto de PHP: `{ date: 'Y-m-d H:i:s.u', timezone, ... }`. */
export function leerFecha(valor: string | FechaPhp | null | undefined): Date | null {
  const texto = typeof valor === 'string' ? valor : valor?.date
  if (!texto) {
    return null
  }
  const fecha = new Date(texto.replace(' ', 'T'))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function ayer(): Date {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - 1)
  return fecha
}

export function horaCorta(valor: string | null | undefined): string {
  const fecha = leerFecha(valor)
  return fecha ? fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''
}

export function fechaLista(valor: string | null | undefined): string {
  const fecha = leerFecha(valor)
  if (!fecha) {
    return ''
  }
  if (mismoDia(fecha, new Date())) {
    return horaCorta(valor)
  }
  if (mismoDia(fecha, ayer())) {
    return 'Ayer'
  }
  return fecha.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function etiquetaDia(fecha: Date): string {
  if (mismoDia(fecha, new Date())) {
    return 'Hoy'
  }
  if (mismoDia(fecha, ayer())) {
    return 'Ayer'
  }
  return fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function claveDia(valor: string): string {
  const fecha = leerFecha(valor)
  return fecha ? `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}` : ''
}

/** WhatsApp solo permite texto libre dentro de las 24 h siguientes al último mensaje del cliente. */
export function ventanaAbierta(mensajes: MensajeChat[]): boolean {
  const ultimoCliente = [...mensajes].reverse().find((mensaje) => mensaje.contesta === 'cliente')
  const fecha = leerFecha(ultimoCliente?.created_at)
  return fecha !== null && Date.now() - fecha.getTime() < VENTANA_WHATSAPP_MS
}

export function textoPlantilla(plantilla: PlantillaWhatsapp, tipo: 'HEADER' | 'BODY'): string {
  return plantilla.components?.find((componente) => componente.type === tipo)?.text ?? ''
}

export function contarVariables(texto: string): number {
  const encontradas = texto.match(/\{\{\s*\d+\s*\}\}/g) ?? []
  return new Set(encontradas.map((variable) => variable.replace(/\D/g, ''))).size
}

export function vistaPrevia(chat: ConversacionChat): string {
  const texto = etiquetaVistaPrevia(chat.texto_ultimo_mensaje?.trim() || 'Sin mensajes')
  return chat.ultimo_mensaje_contesta && chat.ultimo_mensaje_contesta !== 'cliente' ? `Tú: ${texto}` : texto
}

function etiquetaVistaPrevia(texto: string): string {
  const match = texto.match(/^\[(Imagen|Sticker|Documento|Video|Audio)(?:\s*:\s*([^\]]+))?\](?:\s*(.*))?$/is)
  if (!match) {
    return texto
  }
  const tipo = match[1].toLowerCase()
  const nombre = (match[2] ?? '').trim()
  const caption = (match[3] ?? '').trim()
  if (caption && caption !== '[Sin descripción]') {
    return caption
  }
  if (tipo === 'imagen') return 'Foto'
  if (tipo === 'sticker') return 'Sticker'
  if (tipo === 'video') return 'Video'
  if (tipo === 'audio') return 'Audio'
  if (tipo === 'documento') return nombre || 'Documento'
  return texto
}
