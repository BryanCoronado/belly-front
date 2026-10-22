import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BotonTema } from '@/components/BotonTema'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { BotonGuia } from '@/guia/BotonGuia'
import { cn } from '@/lib/utils'
import { leerSesion } from '@/sesion'
import { BarraLateral } from './BarraLateral'
import { tituloDeRuta } from './navegacion'

const PANTALLA_COMPLETA = new Set(['/chats', '/supervision'])
/** Chat y editor de flujos ocupan todo el alto: sin márgenes alrededor. */
const esPantallaCompleta = (ruta: string) => PANTALLA_COMPLETA.has(ruta) || /^\/automatizacion\/\d+/.test(ruta)

export function LayoutApp() {
  const sesion = leerSesion()
  const { pathname } = useLocation()

  if (!sesion) {
    return <Navigate to="/" replace />
  }

  return (
    <SidebarProvider>
      <BarraLateral usuario={sesion.usuario} />
      <SidebarInset className="bg-gradient-to-b from-emerald-50/50 via-zinc-50 to-zinc-50">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
          <span className="truncate text-base font-medium">{tituloDeRuta(pathname)}</span>
          <div className="ml-auto flex items-center gap-1">
            <BotonTema className="rounded-full" />
            <BotonGuia />
          </div>
        </header>
        <div className={cn('w-full min-w-0 flex-1', !esPantallaCompleta(pathname) && 'p-4 md:p-6 xl:p-8')}>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
