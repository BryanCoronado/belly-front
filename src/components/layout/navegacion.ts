import {
  Bot,
  Boxes,
  CircleUserRound,
  Eye,
  FolderKanban,
  Headset,
  LayoutDashboard,
  MessageCircleMore,
  MessagesSquare,
  Send,
  ShieldBan,
  Smartphone,
  UserRoundSearch,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { GrupoMenu, ModuloMenu } from '@/api'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'

type IconoNav = LucideIcon | ComponentType<{ className?: string }>

export type EnlaceNavegacion = {
  titulo: string
  ruta: string
  icono: IconoNav
  tono: string
  hijos?: EnlaceNavegacion[]
}

export type GrupoNavegacion = {
  titulo: string
  enlaces: EnlaceNavegacion[]
}

const ICONOS: Record<string, IconoNav> = {
  house_alt: LayoutDashboard,
  message: MessagesSquare,
  chat: MessageCircleMore,
  person_alt: UserRoundSearch,
  people: CircleUserRound,
  store: Boxes,
  whatsapp: IconoWhatsapp,
  bot: Bot,
  sparkles: Bot,
  send: Send,
  wallet: Wallet,
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
  '/chats': 'bg-sky-100 text-sky-700',
  '/supervision': 'bg-indigo-100 text-indigo-700',
  '/conversaciones/chat/mis_clientes': 'bg-amber-100 text-amber-700',
  '/clientes': 'bg-amber-100 text-amber-700',
  '/lista-negra': 'bg-rose-100 text-rose-700',
  '/envios': 'bg-lime-100 text-lime-700',
  '/asesores': 'bg-teal-100 text-teal-700',
  '/automatizacion': 'bg-violet-100 text-violet-700',
  '/agente-ia': 'bg-zinc-100 text-zinc-700',
  '/productos': 'bg-orange-100 text-orange-700',
  '/plantillas': 'bg-cyan-100 text-cyan-700',
  '/integraciones': 'bg-green-100 text-green-700',
  '/integraciones/whatsapp': 'bg-green-100 text-green-700',
  '/integraciones/costos': 'bg-lime-100 text-lime-700',
}

const RUTAS_FRONT: Record<string, string> = {
  '/dashboard': '/inicio',
  '/conversaciones/chat': '/chats',
  '/conversaciones/chat/mis_conversaciones': '/chats',
  '/conversaciones/chat/mis_plantillas': '/plantillas',
  '/conversaciones/configuracion': '/integraciones/whatsapp',
  '/leads': '/clientes',
  '/leads/clientes': '/clientes',
  '/leads/lista-negra': '/lista-negra',
}

export const EQUIPO: EnlaceNavegacion = {
  titulo: 'Equipo',
  ruta: '/equipo',
  icono: Users,
  tono: TONO_RUTA['/equipo'],
}

export const SUPERVISION: EnlaceNavegacion = {
  titulo: 'Supervisión',
  ruta: '/supervision',
  icono: Eye,
  tono: TONO_RUTA['/supervision'],
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
          { titulo: 'Respuestas rápidas', ruta: '/plantillas', icono: FolderKanban, tono: TONO_RUTA['/plantillas'] },
        ],
      },
      {
        titulo: 'Clientes',
        ruta: '/clientes',
        icono: UserRoundSearch,
        tono: TONO_RUTA['/clientes'],
        hijos: [
          { titulo: 'Todos los clientes', ruta: '/clientes', icono: CircleUserRound, tono: TONO_RUTA['/clientes'] },
          { titulo: 'Lista negra', ruta: '/lista-negra', icono: ShieldBan, tono: TONO_RUTA['/lista-negra'] },
        ],
      },
      { titulo: 'Envíos masivos', ruta: '/envios', icono: Send, tono: TONO_RUTA['/envios'] },
      { titulo: 'Asesores', ruta: '/asesores', icono: Headset, tono: TONO_RUTA['/asesores'] },
      { titulo: 'Respuestas automáticas', ruta: '/automatizacion', icono: Bot, tono: TONO_RUTA['/automatizacion'] },
      { titulo: 'Asistente IA', ruta: '/agente-ia', icono: Bot, tono: TONO_RUTA['/agente-ia'] },
    ],
  },
  {
    titulo: 'Catálogo',
    enlaces: [{ titulo: 'Productos', ruta: '/productos', icono: Boxes, tono: TONO_RUTA['/productos'] }],
  },
  {
    titulo: 'Integraciones',
    enlaces: [
      { titulo: 'WhatsApp', ruta: '/integraciones/whatsapp', icono: IconoWhatsapp, tono: TONO_RUTA['/integraciones/whatsapp'] },
      { titulo: 'Costos WhatsApp', ruta: '/integraciones/costos', icono: Wallet, tono: TONO_RUTA['/integraciones/costos'] },
    ],
  },
]

export const COSTOS_WHATSAPP: EnlaceNavegacion = {
  titulo: 'Costos WhatsApp',
  ruta: '/integraciones/costos',
  icono: Wallet,
  tono: TONO_RUTA['/integraciones/costos'],
}

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
  if (ruta === '/perfil') return 'Mi perfil'
  const plano = aplanar([...NAVEGACION.flatMap((grupo) => grupo.enlaces), EQUIPO, SUPERVISION, INTEGRACIONES, COSTOS_WHATSAPP])
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
