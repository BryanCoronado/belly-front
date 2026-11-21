import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { esAdministrador, nombreVisible, type UsuarioSesion } from '@/sesion'
import { entradaActiva, type SeccionWa } from './seccionesWa'

type Props = {
  seccion: SeccionWa
  ruta: string
  usuario: UsuarioSesion
}

export function PanelSeccionWa({ seccion, ruta, usuario }: Props) {
  const activa = entradaActiva(seccion, ruta)
  const admin = esAdministrador(usuario)
  const { conectado, cargando } = useWhatsappConectado()
  const faltaWhatsapp = admin && !cargando && !conectado
  const nombre = nombreVisible(usuario)

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-r border-[var(--wa-borde)] bg-[var(--wa-cabecera)] md:flex xl:w-[360px]">
      <div className="flex h-16 shrink-0 items-center px-5">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-[var(--wa-texto)]">{seccion.titulo}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {seccion.id === 'ajustes' ? (
          <Link
            to="/perfil"
            className="mb-2 flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--wa-hover)]"
          >
            <Avatar className="size-[60px]">
              {usuario.foto ? <AvatarImage src={usuario.foto} alt={nombre} /> : null}
              <AvatarFallback className="bg-[#dfe5e7] text-xl font-medium text-[#54656f] dark:bg-[#6a7175] dark:text-[#e9edef]">
                {nombre.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-[17px] text-[var(--wa-texto)]">{nombre}</p>
              <p className="truncate text-[14px] text-[var(--wa-muted)]">
                {admin ? 'Administrador' : 'Asesor'} · {usuario.empresa_nombre || usuario.empresa}
              </p>
            </div>
          </Link>
        ) : null}

        <ul className="space-y-0.5">
          {seccion.entradas.map((entrada) => {
            const Icono = entrada.icono
            const actual = activa?.ruta === entrada.ruta
            const aviso = faltaWhatsapp && (entrada.ruta === '/integraciones/whatsapp' || entrada.ruta === '/integraciones')
            return (
              <li key={entrada.ruta}>
                <Link
                  to={entrada.ruta}
                  aria-current={actual ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-[64px] items-center gap-5 rounded-lg px-4 py-2.5 transition-colors hover:bg-[var(--wa-hover)]',
                    actual && 'bg-[var(--wa-seleccion)] hover:bg-[var(--wa-seleccion)]',
                  )}
                >
                  <Icono className={cn('size-6 shrink-0', actual ? 'text-[var(--wa-verde-oscuro)]' : 'text-[var(--wa-icono)]')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] leading-[21px] text-[var(--wa-texto)]">{entrada.titulo}</span>
                    <span className="block truncate text-[13.5px] leading-5 text-[var(--wa-muted)]">
                      {aviso ? 'Falta conectar tu número' : entrada.descripcion}
                    </span>
                  </span>
                  {aviso ? <span className="size-2.5 shrink-0 rounded-full bg-[var(--wa-badge)]" /> : null}
                  <ChevronRight className="size-4 shrink-0 text-[var(--wa-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
