import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

export function AvisoMeta({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const admin = esAdministrador(leerSesion()?.usuario)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={compacto ? 'icon-sm' : 'sm'}
            className={cn(
              'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70',
              compacto ? '' : 'h-7 gap-1 px-2 text-xs',
              className,
            )}
            aria-label="Cómo cobra Meta desde octubre 2026"
            title="Cómo cobra Meta desde octubre 2026"
          />
        }
      >
        <CircleAlert className="size-3.5" />
        {compacto ? null : <span className="hidden sm:inline">Meta desde oct 2026</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-3">
        <p className="text-sm font-medium">Desde el 1 de octubre de 2026</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta empezó a cobrar los mensajes de servicio que salen por la API. Antes eran gratis.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-foreground">
          <li>1.000 mensajes de servicio gratis por número, cada mes.</li>
          <li>Del 1.001 en adelante, en Perú unos US$ 0,03 por mensaje entregado.</li>
          <li>Lo que escribe el cliente no cobra.</li>
          <li>Si contestás desde la app de WhatsApp del celular, tampoco.</li>
        </ul>
        {admin ? (
          <Link
            to="/integraciones/costos"
            className="mt-3 block text-sm font-medium text-foreground underline-offset-2 hover:underline"
          >
            Ver el cupo de este mes
          </Link>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
