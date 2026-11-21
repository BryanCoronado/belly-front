import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, LogOut, Settings, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { leerContadoresChat } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { rutasPermitidas, useGruposMenu } from '@/components/layout/menuPermitido'
import { seccionDeRuta, seccionesVisibles, type SeccionWa } from '@/components/layout/seccionesWa'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { avisoInfo } from '@/lib/avisos'
import { cerrarSesion, esAdministrador, nombreVisible, type UsuarioSesion } from '@/sesion'

type Props = {
  usuario: UsuarioSesion
  className?: string
}

export function RailWhatsapp({ usuario, className }: Props) {
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const admin = esAdministrador(usuario)
  const nombre = nombreVisible(usuario)
  const secciones = seccionesVisibles(rutasPermitidas(useGruposMenu(usuario)), admin)
  const activa = seccionDeRuta(secciones, pathname)
  const contadores = useQuery({ queryKey: ['chats-contadores'], queryFn: leerContadoresChat })
  const noLeidos = contadores.data?.mensajes_no_leidos ?? 0
  const { conectado, cargando } = useWhatsappConectado()
  const falta = admin && !cargando && !conectado

  function salir() {
    cerrarSesion()
    avisoInfo('Sesión cerrada', 'Vuelve cuando quieras.')
    navegar('/', { replace: true })
  }

  const item = (seccion: SeccionWa) => (
    <ItemRail
      key={seccion.id}
      seccion={seccion}
      activo={activa?.id === seccion.id}
      badge={seccion.badgeChats ? noLeidos : 0}
      punto={seccion.id === 'ajustes' && falta}
    />
  )
  const arriba = secciones.filter((seccion) => seccion.zona === 'arriba')
  const herramientas = secciones.filter((seccion) => seccion.zona === 'herramientas')
  const abajo = secciones.filter((seccion) => seccion.zona === 'abajo')

  return (
    <nav
      className={cn(
        'chat-wa-rail hidden w-16 shrink-0 flex-col items-center border-r border-[var(--wa-borde)] bg-[var(--wa-rail)] pt-2.5 pb-2.5 md:flex',
        className,
      )}
      aria-label="Navegación"
      data-tour="menu"
    >
      <div className="flex flex-col items-center gap-1">{arriba.map(item)}</div>
      {herramientas.length ? (
        <>
          <span className="my-2 h-px w-8 bg-[var(--wa-chip-borde)]" />
          <div className="flex flex-col items-center gap-1">{herramientas.map(item)}</div>
        </>
      ) : null}

      <div className="mt-auto flex flex-col items-center gap-1">
        {abajo.map(item)}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                title={nombre}
                className="mt-1 flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              />
            }
          >
            <Avatar className="pointer-events-none size-8">
              {usuario.foto ? <AvatarImage src={usuario.foto} alt={nombre} /> : null}
              <AvatarFallback className="bg-[#dfe5e7] text-[#8696a0] dark:bg-[#6a7175] dark:text-[#cfd4d6]">
                <UserRound className="size-5" fill="currentColor" strokeWidth={0} />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="min-w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{nombre}</p>
              <p className="text-xs text-muted-foreground">
                {admin ? 'Administrador' : 'Asesor'} · {usuario.empresa_nombre || usuario.empresa}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navegar('/panel')}>
              <LayoutDashboard />
              Dashboard
            </DropdownMenuItem>
            {admin ? (
              <DropdownMenuItem onClick={() => navegar('/cuenta')}>
                <Settings />
                Membresía
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => navegar('/perfil')}>
              <UserRound />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={salir}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

function ItemRail({ seccion, activo, badge, punto }: { seccion: SeccionWa; activo: boolean; badge: number; punto: boolean }) {
  const Icono = seccion.icono
  return (
    <Link
      to={seccion.entradas[0].ruta}
      title={seccion.titulo}
      aria-label={seccion.titulo}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]',
        activo && 'bg-black/[0.08] text-[var(--wa-texto)] dark:bg-white/[0.1]',
      )}
    >
      <Icono activo={activo} className="size-6" />
      {badge > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--wa-rail)] bg-[var(--wa-badge)] px-1 text-[10px] leading-none font-semibold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : punto ? (
        <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full border-2 border-[var(--wa-rail)] bg-[var(--wa-badge)]" />
      ) : null}
    </Link>
  )
}
