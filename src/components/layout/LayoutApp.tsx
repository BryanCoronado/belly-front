import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BotonTema } from '@/components/BotonTema'
import { TransicionPagina } from '@/components/TransicionPagina'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { BandejaAvisos } from '@/components/layout/BandejaAvisos'
import { BotonGuia } from '@/guia/BotonGuia'
import { useTiempoReal } from '@/hooks/use-tiempo-real'
import { cn } from '@/lib/utils'
import { leerSesion } from '@/sesion'
import { BarraLateral } from './BarraLateral'
import { tituloDeRuta } from './navegacion'

const PANTALLA_COMPLETA = new Set(['/chats', '/supervision'])
/** Chat y editor de flujos ocupan todo el alto: sin márgenes alrededor. */
const esPantallaCompleta = (ruta: string) => PANTALLA_COMPLETA.has(ruta) || /^\/automatizacion\/\d+/.test(ruta)

export function LayoutApp() {
  const [sesion, setSesion] = useState(leerSesion)
  const { pathname } = useLocation()
  useTiempoReal()

  useEffect(() => {
    const alCambiar = () => setSesion(leerSesion())
    window.addEventListener('belly-sesion', alCambiar)
    return () => window.removeEventListener('belly-sesion', alCambiar)
  }, [])

  if (!sesion) {
    return <Navigate to="/" replace />
  }

  return (
    <SidebarProvider className="overflow-x-hidden">
      <BarraLateral usuario={sesion.usuario} />
      <SidebarInset className="overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 text-foreground md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
          <span className="truncate text-base font-medium">{tituloDeRuta(pathname)}</span>
          <div className="ml-auto flex items-center gap-2">
            <BandejaAvisos />
            <BotonTema />
            <BotonGuia />
          </div>
        </header>
        <div className={cn('w-full min-w-0 flex-1', !esPantallaCompleta(pathname) && 'p-4 md:p-6 xl:p-8')}>
          <TransicionPagina id={pathname} suave={esPantallaCompleta(pathname)} className="w-full min-w-0">
            <Outlet />
          </TransicionPagina>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
