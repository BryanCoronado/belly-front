import { useQuery } from '@tanstack/react-query'
import { leerMenu } from '@/api'
import { ocultaEnAhorro, useModoAhorro } from '@/lib/modo-ahorro'
import { esAdministrador, type UsuarioSesion } from '@/sesion'
import {
  EQUIPO,
  INTEGRACIONES,
  NAVEGACION,
  SUPERVISION,
  gruposDesdeMenu,
  type EnlaceNavegacion,
  type GrupoNavegacion,
} from './navegacion'

/** Menú que el usuario puede ver según sus permisos (lo comparten la barra lateral y el riel WhatsApp). */
export function useGruposMenu(usuario: UsuarioSesion): GrupoNavegacion[] {
  const admin = esAdministrador(usuario)
  const menu = useQuery({ queryKey: ['menu-modulos'], queryFn: leerMenu })
  const { ahorro } = useModoAhorro()
  return paraAhorro(
    integracionesPrimero(
      conIntegraciones(
        conSupervision(conEquipo(sinCuenta(menu.data?.length ? gruposDesdeMenu(menu.data) : NAVEGACION), admin), admin),
        admin,
      ),
    ),
    ahorro,
  )
}

export function rutasPermitidas(grupos: GrupoNavegacion[]): Set<string> {
  const aplanar = (enlaces: EnlaceNavegacion[]): string[] =>
    enlaces.flatMap((enlace) => [enlace.ruta, ...(enlace.hijos ? aplanar(enlace.hijos) : [])])
  return new Set(grupos.flatMap((grupo) => aplanar(grupo.enlaces)))
}

function paraAhorro(grupos: GrupoNavegacion[], ahorro: boolean): GrupoNavegacion[] {
  if (!ahorro) {
    return grupos
  }
  return grupos
    .map((grupo) => ({
      ...grupo,
      enlaces: grupo.enlaces.filter((enlace) => !ocultaEnAhorro(enlace.ruta)),
    }))
    .filter((grupo) => grupo.enlaces.length > 0)
}

function esRutaIntegracion(ruta: string): boolean {
  return ruta === '/integraciones' || ruta.startsWith('/integraciones/')
}

function esGrupoIntegraciones(grupo: GrupoNavegacion): boolean {
  return grupo.titulo.toLowerCase().includes('integracion') || grupo.enlaces.some((enlace) => esRutaIntegracion(enlace.ruta))
}

/** Lo primero que debe ver quien administra es conectar WhatsApp, por eso el grupo va arriba. */
function integracionesPrimero(grupos: GrupoNavegacion[]): GrupoNavegacion[] {
  const integraciones = grupos.filter(esGrupoIntegraciones)
  return [...integraciones, ...grupos.filter((grupo) => !esGrupoIntegraciones(grupo))]
}

/** Plan / membresía vive en el menú del usuario, no en el CRM. */
function sinCuenta(grupos: GrupoNavegacion[]): GrupoNavegacion[] {
  return grupos
    .map((grupo) => ({
      ...grupo,
      enlaces: grupo.enlaces.filter((enlace) => enlace.ruta !== '/cuenta'),
    }))
    .filter((grupo) => grupo.enlaces.length > 0)
}

function conEquipo(grupos: GrupoNavegacion[], admin: boolean): GrupoNavegacion[] {
  if (!admin || grupos.some((grupo) => grupo.enlaces.some((enlace) => enlace.ruta === EQUIPO.ruta))) {
    return grupos
  }
  const indice = grupos.findIndex(
    (grupo) =>
      grupo.titulo.toLowerCase() === 'general' ||
      grupo.enlaces.some((enlace) => enlace.ruta === '/panel' || enlace.ruta === '/dashboard'),
  )
  if (indice < 0) {
    return grupos
  }
  return grupos.map((grupo, i) => (i === indice ? { ...grupo, enlaces: [...grupo.enlaces, EQUIPO] } : grupo))
}

function conIntegraciones(grupos: GrupoNavegacion[], admin: boolean): GrupoNavegacion[] {
  if (!admin) {
    return grupos
  }

  const indice = grupos.findIndex(esGrupoIntegraciones)
  if (indice < 0) {
    return [{ titulo: 'Integraciones', enlaces: [INTEGRACIONES] }, ...grupos]
  }

  return grupos.map((grupo, i) => {
    if (i !== indice) {
      return grupo
    }
    const extras = grupo.enlaces.filter((enlace) => !esRutaIntegracion(enlace.ruta))
    return { titulo: 'Integraciones', enlaces: [INTEGRACIONES, ...extras] }
  })
}

function conSupervision(grupos: GrupoNavegacion[], admin: boolean): GrupoNavegacion[] {
  const tieneChat = (enlace: EnlaceNavegacion) => enlace.ruta === '/chats' || enlace.hijos?.some((hijo) => hijo.ruta === '/chats')
  const indice = grupos.findIndex((grupo) => grupo.enlaces.some(tieneChat))
  if (!admin || indice < 0 || grupos.some((grupo) => grupo.enlaces.some((enlace) => enlace.ruta === SUPERVISION.ruta))) {
    return grupos
  }
  return grupos.map((grupo, i) => {
    if (i !== indice) {
      return grupo
    }
    const posicion = grupo.enlaces.findIndex(tieneChat) + 1
    return { ...grupo, enlaces: [...grupo.enlaces.slice(0, posicion), SUPERVISION, ...grupo.enlaces.slice(posicion)] }
  })
}
