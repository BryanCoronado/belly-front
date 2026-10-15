import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { avisoInfo } from '@/lib/avisos'
import { cerrarSesion, esAdministrador, nombreVisible, type UsuarioSesion } from '@/sesion'

export function MenuUsuario({ usuario }: { usuario: UsuarioSesion }) {
  const navegar = useNavigate()
  const { isMobile } = useSidebar()
  const nombre = nombreVisible(usuario)

  function salir() {
    cerrarSesion()
    avisoInfo('Sesión cerrada', 'Vuelve cuando quieras.')
    navegar('/', { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="rounded-lg">
              <AvatarFallback className="rounded-lg">{iniciales(nombre)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{nombre}</span>
              <span className="truncate text-xs text-muted-foreground">@{usuario.usuario}</span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" side={isMobile ? 'bottom' : 'right'} align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-foreground">{nombre}</p>
                <p className="text-xs">
                  {esAdministrador(usuario) ? 'Administrador' : 'Usuario'} · {usuario.empresa}
                </p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={salir}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}
