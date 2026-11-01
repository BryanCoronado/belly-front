import { Building2, ChevronsUpDown, LayoutDashboard, LogOut, Receipt, Wallet } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogoMarca } from '@/components/Marca'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { avisoInfo } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { cerrarSesion, nombreVisible, type UsuarioSesion } from '@/sesion'

const ENLACES = [
  { titulo: 'Resumen', ruta: '/operador', icono: LayoutDashboard },
  { titulo: 'Empresas', ruta: '/operador/empresas', icono: Building2 },
  { titulo: 'Planes', ruta: '/operador/planes', icono: Wallet },
  { titulo: 'Pagos', ruta: '/operador/pagos', icono: Receipt },
]

export function BarraOperador({ usuario }: { usuario: UsuarioSesion }) {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { isMobile } = useSidebar()
  const nombre = nombreVisible(usuario)

  function salir() {
    cerrarSesion()
    avisoInfo('Sesión cerrada', 'Vuelve cuando quieras.')
    navegar('/acceso', { replace: true })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-[4.25rem] justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/operador" />} className="h-12 group-data-[collapsible=icon]:size-10!">
              <LogoMarca className="size-11" />
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-[15px] font-bold tracking-[-0.03em]">Belly</span>
                <span className="truncate text-[11px] text-muted-foreground">Dueño</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 overflow-y-auto px-1">
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground/70 uppercase">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {ENLACES.map((enlace) => {
                const Icono = enlace.icono
                const activo = pathname === enlace.ruta
                return (
                  <SidebarMenuItem key={enlace.ruta}>
                    <SidebarMenuButton
                      className="h-10 rounded-lg px-3 text-[13.5px] font-medium text-foreground/75 hover:text-foreground data-active:bg-primary/10 data-active:font-semibold data-active:text-primary"
                      tooltip={enlace.titulo}
                      isActive={activo}
                      render={<Link to={enlace.ruta} />}
                    >
                      <Icono className={cn(activo ? 'text-primary' : 'text-muted-foreground')} />
                      <span>{enlace.titulo}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="rounded-lg">
                  {usuario.foto ? <AvatarImage src={usuario.foto} alt={nombre} /> : null}
                  <AvatarFallback className="rounded-lg">{iniciales(nombre)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{nombre}</span>
                  <span className="truncate text-xs text-muted-foreground">Dueño</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56" side={isMobile ? 'bottom' : 'right'} align="end">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-foreground">{nombre}</p>
                  <p className="text-xs text-muted-foreground">Dueño de Belly</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={salir}>
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}
