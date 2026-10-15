import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, Smartphone } from 'lucide-react'
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
import { esAdministrador, type UsuarioSesion } from '@/sesion'
import { MenuUsuario } from './MenuUsuario'
import { EQUIPO, NAVEGACION, gruposDesdeMenu, type EnlaceNavegacion, type GrupoNavegacion } from './navegacion'

export function BarraLateral({ usuario }: { usuario: UsuarioSesion }) {
  const { pathname } = useLocation()
  const admin = esAdministrador(usuario)
  const menu = useQuery({ queryKey: ['menu-modulos'], queryFn: leerMenu })
  const { conectado, cargando } = useWhatsappConectado()
  const pendiente = admin && !cargando && !conectado
  const grupos = integracionesPrimero(conEquipo(menu.data?.length ? gruposDesdeMenu(menu.data) : NAVEGACION, admin))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/inicio" />}>
              <LogoMarca className="size-9 rounded-xl" />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[15px] font-semibold">Belly</span>
                <span className="truncate text-xs text-muted-foreground">{usuario.empresa}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1" data-tour="menu">
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/80">{grupo.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              {pendiente && esGrupoIntegraciones(grupo) ? <AvisoConectar /> : null}
              <SidebarMenu className="gap-0.5">
                {grupo.enlaces.map((enlace) => (
                  <ItemMenu
                    key={`${grupo.titulo}-${enlace.ruta}-${enlace.titulo}`}
                    enlace={enlace}
                    ruta={pathname}
                    pendiente={pendiente && enlace.ruta === RUTA_WHATSAPP}
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

const BOTON = 'h-10 rounded-lg px-3 text-[14px] text-foreground/75 hover:text-foreground'
const BOTON_ACTIVO = 'data-active:bg-emerald-50 data-active:font-semibold data-active:text-emerald-800'
const RUTA_WHATSAPP = '/integraciones/whatsapp'

function esGrupoIntegraciones(grupo: GrupoNavegacion): boolean {
  return grupo.titulo.toLowerCase() === 'integraciones'
}

/** Lo primero que debe ver quien administra es conectar WhatsApp, por eso el grupo va arriba. */
function integracionesPrimero(grupos: GrupoNavegacion[]): GrupoNavegacion[] {
  const integraciones = grupos.filter(esGrupoIntegraciones)
  return [...integraciones, ...grupos.filter((grupo) => !esGrupoIntegraciones(grupo))]
}

function AvisoConectar() {
  return (
    <Link
      to={RUTA_WHATSAPP}
      className="tema-fijo group/aviso mx-1 mb-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3 text-white shadow-md shadow-emerald-600/20 transition-all group-data-[collapsible=icon]:hidden hover:from-emerald-700 hover:to-teal-700"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Smartphone className="size-4" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13px] font-medium">Conecta tu WhatsApp</span>
        <span className="block text-xs text-white/60">Para recibir clientes</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-white/60 transition-transform group-hover/aviso:translate-x-0.5" />
    </Link>
  )
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
        <Icono className={enHijo ? 'text-emerald-700' : 'text-muted-foreground'} />
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
                  'data-active:bg-emerald-50 data-active:font-medium data-active:text-emerald-800',
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

function conEquipo(grupos: GrupoNavegacion[], admin: boolean): GrupoNavegacion[] {
  if (!admin || grupos.length === 0) {
    return grupos
  }
  const [primero, ...resto] = grupos
  if (primero.enlaces.some((enlace) => enlace.ruta === EQUIPO.ruta)) {
    return grupos
  }
  return [{ ...primero, enlaces: [...primero.enlaces, EQUIPO] }, ...resto]
}
