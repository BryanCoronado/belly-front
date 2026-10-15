import {
  Bot,
  Boxes,
  ChartNoAxesCombined,
  CircleUserRound,
  Clapperboard,
  FolderKanban,
  Headset,
  Images,
  LayoutDashboard,
  Megaphone,
  MessageCircleMore,
  MessagesSquare,
  NotebookPen,
  ShieldBan,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Store,
  UserRoundSearch,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { GrupoMenu, ModuloMenu } from '@/api'

export type EnlaceNavegacion = {
  titulo: string
  ruta: string
  icono: LucideIcon
  tono: string
  hijos?: EnlaceNavegacion[]
}

export type GrupoNavegacion = {
  titulo: string
  enlaces: EnlaceNavegacion[]
}

const ICONOS: Record<string, LucideIcon> = {
  house_alt: LayoutDashboard,
  chat_bubble: MessageCircleMore,
  message: MessagesSquare,
  person_alt: Headset,
  tag: NotebookPen,
  campaign: Sparkles,
  photo_fill: Images,
  videocam_fill: Clapperboard,
  document_fill: FolderKanban,
  shopping_cart: Wallet,
  person: ShieldBan,
  people: CircleUserRound,
  chat: MessagesSquare,
  settings: SlidersHorizontal,
  store: Store,
  chart_bar_alt_fill: ChartNoAxesCombined,
  whatsapp: Smartphone,
  bot: Bot,
}

const TONOS = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
]

const TONO_RUTA: Record<string, string> = {
  '/inicio': 'bg-emerald-100 text-emerald-700',
  '/dashboard': 'bg-emerald-100 text-emerald-700',
  '/equipo': 'bg-violet-100 text-violet-700',
  '/conversaciones': 'bg-sky-100 text-sky-700',
  '/chats': 'bg-sky-100 text-sky-700',
  '/metricas': 'bg-indigo-100 text-indigo-700',
  '/leads': 'bg-amber-100 text-amber-700',
  '/clientes': 'bg-amber-100 text-amber-700',
  '/lista-negra': 'bg-rose-100 text-rose-700',
  '/asesores': 'bg-teal-100 text-teal-700',
  '/automatizacion': 'bg-violet-100 text-violet-700',
  '/marketing': 'bg-fuchsia-100 text-fuchsia-700',
  '/productos': 'bg-orange-100 text-orange-700',
  '/ventas': 'bg-lime-100 text-lime-700',
  '/plantillas': 'bg-cyan-100 text-cyan-700',
  '/integraciones': 'bg-green-100 text-green-700',
  '/integraciones/whatsapp': 'bg-green-100 text-green-700',
}

const RUTAS_FRONT: Record<string, string> = {
  '/dashboard': '/inicio',
  '/conversaciones/chat': '/chats',
  '/conversaciones/chat/mis_conversaciones': '/chats',
  '/conversaciones/chat/mis_plantillas': '/plantillas',
  '/conversaciones/configuracion': '/integraciones/whatsapp',
  '/leads/clientes': '/clientes',
  '/leads/lista-negra': '/lista-negra',
}

export const EQUIPO: EnlaceNavegacion = {
  titulo: 'Equipo',
  ruta: '/equipo',
  icono: Users,
  tono: TONO_RUTA['/equipo'],
}

export const NAVEGACION: GrupoNavegacion[] = [
  {
    titulo: 'General',
    enlaces: [{ titulo: 'Dashboard', ruta: '/inicio', icono: LayoutDashboard, tono: TONO_RUTA['/inicio'] }],
  },
  {
    titulo: 'Atención',
    enlaces: [
      {
        titulo: 'Chat',
        ruta: '/chats',
        icono: MessagesSquare,
        tono: TONO_RUTA['/chats'],
        hijos: [
          { titulo: 'Mis conversaciones', ruta: '/chats', icono: MessageCircleMore, tono: TONO_RUTA['/chats'] },
          { titulo: 'Mis clientes', ruta: '/conversaciones/chat/mis_clientes', icono: CircleUserRound, tono: TONO_RUTA['/clientes'] },
          { titulo: 'Respuestas rápidas', ruta: '/plantillas', icono: FolderKanban, tono: TONO_RUTA['/plantillas'] },
        ],
      },
      {
        titulo: 'Conversaciones',
        ruta: '/conversaciones',
        icono: MessageCircleMore,
        tono: TONO_RUTA['/conversaciones'],
        hijos: [
          { titulo: 'De asesores', ruta: '/conversaciones/contact_center', icono: Headset, tono: 'bg-sky-100 text-sky-700' },
          { titulo: 'De customer success', ruta: '/conversaciones/customer_success', icono: CircleUserRound, tono: 'bg-sky-100 text-sky-700' },
        ],
      },
      {
        titulo: 'Clientes',
        ruta: '/leads',
        icono: UserRoundSearch,
        tono: TONO_RUTA['/leads'],
        hijos: [
          { titulo: 'Todos los clientes', ruta: '/clientes', icono: CircleUserRound, tono: TONO_RUTA['/clientes'] },
          { titulo: 'Lista negra', ruta: '/lista-negra', icono: ShieldBan, tono: TONO_RUTA['/lista-negra'] },
        ],
      },
      {
        titulo: 'Asesores',
        ruta: '/asesores',
        icono: Headset,
        tono: TONO_RUTA['/asesores'],
        hijos: [
          { titulo: 'De venta', ruta: '/asesores/contact_center', icono: Headset, tono: TONO_RUTA['/asesores'] },
          { titulo: 'De customer success', ruta: '/asesores/customer_success', icono: Users, tono: TONO_RUTA['/asesores'] },
        ],
      },
      { titulo: 'Respuestas automáticas', ruta: '/automatizacion', icono: Bot, tono: TONO_RUTA['/automatizacion'] },
      {
        titulo: 'Métricas',
        ruta: '/metricas',
        icono: ChartNoAxesCombined,
        tono: TONO_RUTA['/metricas'],
        hijos: [
          { titulo: 'De asesores', ruta: '/metricas/contact_center', icono: ChartNoAxesCombined, tono: 'bg-indigo-100 text-indigo-700' },
          { titulo: 'De customer success', ruta: '/metricas/customer_success', icono: ChartNoAxesCombined, tono: 'bg-indigo-100 text-indigo-700' },
          { titulo: 'Por origen', ruta: '/metricas/origenes', icono: ChartNoAxesCombined, tono: 'bg-indigo-100 text-indigo-700' },
        ],
      },
    ],
  },
  {
    titulo: 'Marketing',
    enlaces: [
      {
        titulo: 'Marketing',
        ruta: '/marketing',
        icono: Megaphone,
        tono: TONO_RUTA['/marketing'],
        hijos: [
          { titulo: 'Imágenes', ruta: '/marketing/image', icono: Images, tono: TONO_RUTA['/marketing'] },
          { titulo: 'Videos', ruta: '/marketing/video', icono: Clapperboard, tono: TONO_RUTA['/marketing'] },
          { titulo: 'Plantillas de WhatsApp', ruta: '/marketing/plantilla', icono: FolderKanban, tono: TONO_RUTA['/plantillas'] },
          { titulo: 'Métricas', ruta: '/metricas/marketing', icono: Sparkles, tono: 'bg-fuchsia-100 text-fuchsia-700' },
        ],
      },
      { titulo: 'Productos', ruta: '/productos', icono: Boxes, tono: TONO_RUTA['/productos'] },
    ],
  },
  {
    titulo: 'Integraciones',
    enlaces: [
      { titulo: 'WhatsApp', ruta: '/integraciones/whatsapp', icono: Smartphone, tono: TONO_RUTA['/integraciones/whatsapp'] },
      { titulo: 'Ventas', ruta: '/ventas', icono: Wallet, tono: TONO_RUTA['/ventas'] },
    ],
  },
]

export const INTEGRACIONES: EnlaceNavegacion = {
  titulo: 'Integraciones',
  ruta: '/integraciones',
  icono: Smartphone,
  tono: TONO_RUTA['/integraciones'],
}

export function rutaFront(url: string): string {
  if (!url) {
    return ''
  }
  return RUTAS_FRONT[url] ?? url
}

export function gruposDesdeMenu(grupos: GrupoMenu[]): GrupoNavegacion[] {
  return grupos
    .map((grupo) => ({
      titulo: grupo.grupo,
      enlaces: grupo.modulos.map((modulo, indice) => enlaceDesdeModulo(modulo, indice)).filter((enlace) => enlace.ruta),
    }))
    .filter((grupo) => grupo.enlaces.length > 0)
}

export function tituloDeRuta(ruta: string): string {
  const plano = aplanar([...NAVEGACION.flatMap((grupo) => grupo.enlaces), EQUIPO, INTEGRACIONES])
  const exacto = plano.find((item) => item.ruta === ruta)
  if (exacto) {
    return exacto.titulo
  }
  return plano.find((item) => ruta.startsWith(item.ruta) && item.ruta !== '/inicio')?.titulo ?? ''
}

function enlaceDesdeModulo(modulo: ModuloMenu, indice = 0): EnlaceNavegacion {
  const ruta = rutaFront(modulo.url)
  return {
    titulo: modulo.nombre,
    ruta,
    icono: ICONOS[modulo.icon] ?? LayoutDashboard,
    tono: TONO_RUTA[ruta] ?? TONOS[indice % TONOS.length],
    hijos: modulo.hijos?.length ? modulo.hijos.map((hijo, i) => enlaceDesdeModulo(hijo, i)) : undefined,
  }
}

function aplanar(enlaces: EnlaceNavegacion[]): EnlaceNavegacion[] {
  return enlaces.flatMap((enlace) => [enlace, ...(enlace.hijos ? aplanar(enlace.hijos) : [])])
}
