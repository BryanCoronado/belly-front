import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { Link, Outlet } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

export function RequiereWhatsapp({ children }: { children?: ReactNode }) {
  const { conectado, cargando } = useWhatsappConectado()

  if (cargando) {
    return <Skeleton className="m-6 h-64 rounded-lg" />
  }
  if (conectado) {
    return children ?? <Outlet />
  }

  const admin = esAdministrador(leerSesion()?.usuario)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <IconoWhatsapp className="size-8" />
      <p className="font-medium">WhatsApp no está conectado</p>
      {admin ? (
        <Link to="/integraciones/whatsapp" className={cn(buttonVariants())}>
          Conectar
          <ArrowRight />
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">Lo conecta el administrador.</p>
      )}
    </div>
  )
}
