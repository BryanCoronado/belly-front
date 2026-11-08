import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Leaf } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { leerMenu } from '@/api'
import { LogoMarca } from '@/components/Marca'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { ocultaEnAhorro, useModoAhorro } from '@/lib/modo-ahorro'
import { esAdministrador, type UsuarioSesion } from '@/sesion'
import { MenuUsuario } from './MenuUsuario'
import {
  EQUIPO,
  INTEGRACIONES,
  NAVEGACION,
  SUPERVISION,
  gruposDesdeMenu,
  type EnlaceNavegacion,
  type GrupoNavegacion,
} from './navegacion'

export function BarraLateral({ usuario }: { usuario: UsuarioSesion }) {
  const { pathname } = useLocation()
  const admin = esAdministrador(usuario)
  const menu = useQuery({ queryKey: ['menu-modulos'], queryFn: leerMenu })
  const { conectado, cargando } = useWhatsappConectado()
  const { ahorro } = useModoAhorro()
  const pendiente = admin && !cargando && !conectado
  const grupos = paraAhorro(
    integracionesPrimero(
      conIntegraciones(
        conSupervision(conEquipo(sinCuenta(menu.data?.length ? gruposDesdeMenu(menu.data) : NAVEGACION), admin), admin),
        admin,
      ),
    ),
    ahorro,
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-[4.25rem] justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/inicio" />} className="h-12 group-data-[collapsible=icon]:size-10!">
              <LogoMarca className="size-11" />
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-[15px] font-bold tracking-[-0.03em]">
                  {usuario.empresa_nombre || usuario.empresa || 'Tu empresa'}
                </span>
                <span className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                  <span>Belly</span>
                  {ahorro ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      <Leaf className="size-2.5" />
                      Ahorro
                    </span>
                  ) : null}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 overflow-y-auto px-1" data-tour="menu">
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo} className="py-1">
            <SidebarGroupLabel className="text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground/70 uppercase">{grupo.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {grupo.enlaces.map((enlace) => (
                  <ItemMenu
                    key={`${grupo.titulo}-${enlace.ruta}-${enlace.titulo}`}
                    enlace={enlace}
                    ruta={pathname}
                    pendiente={pendiente && (enlace.ruta === '/integraciones' || enlace.ruta === RUTA_WHATSAPP)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <MenuUsuario usuario={usuario} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

const BOTON = 'h-10 rounded-lg px-3 text-[13.5px] font-medium tracking-[-0.015em] text-foreground/75 hover:text-foreground'
const BOTON_ACTIVO = 'data-active:bg-primary/10 data-active:font-semibold data-active:text-primary'
const RUTA_WHATSAPP = '/integraciones/whatsapp'

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

function ItemMenu({ enlace, ruta, pendiente = false }: { enlace: EnlaceNavegacion; ruta: string; pendiente?: boolean }) {
  const { state, isMobile } = useSidebar()
  const Icono = enlace.icono
  const hijos = enlace.hijos?.filter((hijo) => hijo.ruta) ?? []
  const estaEn = (destino: string) => ruta === destino || ruta.startsWith(`${destino}/`)
  const enHijo = hijos.some((hijo) => estaEn(hijo.ruta))

  if (hijos.length === 0 || (state === 'collapsed' && !isMobile)) {
    const activo = enHijo || (enlace.ruta === '/inicio' ? ruta === '/inicio' : estaEn(enlace.ruta))
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className={cn(BOTON, BOTON_ACTIVO)}
          tooltip={enlace.titulo}
          isActive={activo}
          render={<Link to={enlace.ruta} />}
        >
          <Icono className="text-muted-foreground" />
          <span>{enlace.titulo}</span>
          {pendiente ? (
            <span
              aria-label="Pendiente"
              className="ml-auto size-2 rounded-full bg-amber-500 group-data-[collapsible=icon]:hidden"
            />
          ) : null}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      key={enHijo ? 'dentro' : 'fuera'}
      defaultOpen={enHijo}
      render={<SidebarMenuItem />}
      className="group/desplegable"
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton className={cn(BOTON, enHijo && 'font-semibold text-foreground')} />
        }
      >
        <Icono className={enHijo ? 'text-primary' : 'text-muted-foreground'} />
        <span>{enlace.titulo}</span>
        <ChevronRight className="ml-auto text-muted-foreground transition-transform duration-200 group-data-open/desplegable:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="mx-0 ml-5 gap-0.5 border-l border-border/70 py-1 pl-3">
          {hijos.map((hijo) => (
            <SidebarMenuSubItem key={`${hijo.ruta}-${hijo.titulo}`}>
              <SidebarMenuSubButton
                className={cn(
                  'h-9 rounded-lg px-3 text-[13.5px] text-foreground/70 hover:text-foreground',
                  'data-active:bg-primary/10 data-active:font-medium data-active:text-primary',
                )}
                isActive={estaEn(hijo.ruta)}
                render={<Link to={hijo.ruta} />}
              >
                <span>{hijo.titulo}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
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
      grupo.enlaces.some((enlace) => enlace.ruta === '/inicio' || enlace.ruta === '/dashboard'),
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
