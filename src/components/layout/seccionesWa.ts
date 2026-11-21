import {
  BookImage,
  Bot,
  Boxes,
  CircleUserRound,
  FolderKanban,
  Headset,
  LayoutDashboard,
  MessageCircleMore,
  Plug,
  Receipt,
  Send,
  ShieldBan,
  Smartphone,
  Sparkles,
  Upload,
  UserRound,
  UserRoundSearch,
  Users,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import {
  IconoAjustes,
  IconoCanales,
  IconoChats,
  IconoComunidades,
  IconoDifusion,
  IconoEstados,
  IconoLlamadas,
  IconoMultimedia,
  IconoTienda,
} from '@/paginas/chat/iconosWa'

type IconoRail = ComponentType<{ activo?: boolean; className?: string }>
type IconoEntrada = ComponentType<{ className?: string }>

export type EntradaWa = {
  titulo: string
  descripcion: string
  ruta: string
  icono: IconoEntrada
  /** Ruta del menú que debe tener permitida (por defecto, la misma). */
  requiere?: string
  siempre?: boolean
  soloAdmin?: boolean
}

export type SeccionWa = {
  id: string
  titulo: string
  icono: IconoRail
  zona: 'arriba' | 'herramientas' | 'abajo'
  entradas: EntradaWa[]
  badgeChats?: boolean
}

export const SECCIONES_WA: SeccionWa[] = [
  {
    id: 'chats',
    titulo: 'Chats',
    icono: IconoChats,
    zona: 'arriba',
    badgeChats: true,
    entradas: [{ titulo: 'Chats', descripcion: 'Tus conversaciones', ruta: '/chats', icono: MessageCircleMore }],
  },
  {
    id: 'contactos',
    titulo: 'Contactos',
    icono: IconoLlamadas,
    zona: 'arriba',
    entradas: [
      { titulo: 'Todos los clientes', descripcion: 'Etapas, etiquetas y quién los atiende', ruta: '/clientes', icono: UserRoundSearch },
      { titulo: 'Mis clientes', descripcion: 'Los que atiendes tú', ruta: '/conversaciones/chat/mis_clientes', icono: CircleUserRound },
      { titulo: 'Importar clientes', descripcion: 'Sube un Excel o CSV', ruta: '/clientes/importar', icono: Upload, requiere: '/clientes' },
      { titulo: 'Lista negra', descripcion: 'Números que no reciben mensajes', ruta: '/lista-negra', icono: ShieldBan },
    ],
  },
  {
    id: 'supervision',
    titulo: 'Supervisión',
    icono: IconoEstados,
    zona: 'arriba',
    entradas: [{ titulo: 'Supervisión', descripcion: 'Chats de todo el equipo', ruta: '/supervision', icono: UserRound }],
  },
  {
    id: 'automatizacion',
    titulo: 'Automatización',
    icono: IconoCanales,
    zona: 'arriba',
    entradas: [
      { titulo: 'Respuestas automáticas', descripcion: 'Flujos y bots que contestan solos', ruta: '/automatizacion', icono: Bot },
      { titulo: 'Asistente IA', descripcion: 'Un agente que responde con tu información', ruta: '/agente-ia', icono: Sparkles },
      { titulo: 'Respuestas rápidas', descripcion: 'Textos listos para el rayo del chat', ruta: '/plantillas', icono: FolderKanban },
    ],
  },
  {
    id: 'equipo',
    titulo: 'Equipo',
    icono: IconoComunidades,
    zona: 'arriba',
    entradas: [
      { titulo: 'Asesores', descripcion: 'Quién atiende y cuántos chats tiene', ruta: '/asesores', icono: Headset },
      { titulo: 'Usuarios y permisos', descripcion: 'Accesos de tu equipo', ruta: '/equipo', icono: Users },
    ],
  },
  {
    id: 'catalogo',
    titulo: 'Catálogo',
    icono: IconoTienda,
    zona: 'herramientas',
    entradas: [
      { titulo: 'Productos y servicios', descripcion: 'Precios, fotos y stock', ruta: '/productos', icono: Boxes },
      { titulo: 'Mi catálogo', descripcion: 'Tu vitrina para compartir por WhatsApp', ruta: '/catalogo', icono: BookImage },
    ],
  },
  {
    id: 'difusion',
    titulo: 'Difusión',
    icono: IconoDifusion,
    zona: 'herramientas',
    entradas: [{ titulo: 'Envíos masivos', descripcion: 'Campañas con plantillas', ruta: '/envios', icono: Send }],
  },
  {
    id: 'panel',
    titulo: 'Panel del CRM',
    icono: IconoMultimedia,
    zona: 'abajo',
    entradas: [{ titulo: 'Dashboard', descripcion: 'Resumen del negocio', ruta: '/panel', icono: LayoutDashboard }],
  },
  {
    id: 'ajustes',
    titulo: 'Ajustes',
    icono: IconoAjustes,
    zona: 'abajo',
    entradas: [
      { titulo: 'Mi perfil', descripcion: 'Nombre, foto y contraseña', ruta: '/perfil', icono: UserRound, siempre: true },
      { titulo: 'Membresía', descripcion: 'Plan, límites y pagos', ruta: '/cuenta', icono: Wallet, soloAdmin: true, siempre: true },
      { titulo: 'Integraciones', descripcion: 'Conecta tus canales y apps', ruta: '/integraciones', icono: Plug },
      { titulo: 'WhatsApp Business', descripcion: 'Número, plantillas y conexión con Meta', ruta: '/integraciones/whatsapp', icono: IconoWhatsapp, requiere: '/integraciones' },
      { titulo: 'App del asesor', descripcion: 'Atiende desde el celular', ruta: '/integraciones/app-asesor', icono: Smartphone, requiere: '/integraciones' },
      { titulo: 'Costos de WhatsApp', descripcion: 'Cuánto cobra Meta por mensaje', ruta: '/integraciones/costos', icono: Receipt, requiere: '/integraciones' },
    ],
  },
]

export function seccionesVisibles(permitidas: Set<string>, admin: boolean): SeccionWa[] {
  return SECCIONES_WA.map((seccion) => ({
    ...seccion,
    entradas: seccion.entradas.filter((entrada) => {
      if (entrada.soloAdmin && !admin) return false
      if (entrada.siempre) return true
      return permitidas.has(entrada.requiere ?? entrada.ruta)
    }),
  })).filter((seccion) => seccion.entradas.length > 0)
}

function coincide(ruta: string, destino: string): boolean {
  return ruta === destino || ruta.startsWith(`${destino}/`)
}

export function seccionDeRuta(secciones: SeccionWa[], ruta: string): SeccionWa | null {
  let mejor: { seccion: SeccionWa; largo: number } | null = null
  for (const seccion of SECCIONES_WA) {
    for (const entrada of seccion.entradas) {
      if (coincide(ruta, entrada.ruta) && (!mejor || entrada.ruta.length > mejor.largo)) {
        mejor = { seccion, largo: entrada.ruta.length }
      }
    }
  }
  return mejor ? (secciones.find((seccion) => seccion.id === mejor.seccion.id) ?? mejor.seccion) : null
}

export function entradaActiva(seccion: SeccionWa, ruta: string): EntradaWa | null {
  return [...seccion.entradas].sort((a, b) => b.ruta.length - a.ruta.length).find((entrada) => coincide(ruta, entrada.ruta)) ?? null
}
