import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BotonTema } from '@/components/BotonTema'
import { TransicionPagina } from '@/components/TransicionPagina'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { esOperador, leerSesion } from '@/sesion'
import { BarraOperador } from './BarraOperador'

const TITULOS: Record<string, string> = {
  '/operador': 'Resumen',
  '/operador/empresas': 'Empresas',
  '/operador/planes': 'Planes',
  '/operador/pagos': 'Pagos',
}

export function LayoutOperador() {
  const [sesion, setSesion] = useState(leerSesion)
  const { pathname } = useLocation()

  useEffect(() => {
    const alCambiar = () => setSesion(leerSesion())
    window.addEventListener('belly-sesion', alCambiar)
    return () => window.removeEventListener('belly-sesion', alCambiar)
  }, [])

  if (!sesion) {
    return <Navigate to="/acceso" replace />
  }
  if (!esOperador(sesion.usuario)) {
    return <Navigate to="/inicio" replace />
  }

  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden">
      <BarraOperador usuario={sesion.usuario} />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 text-foreground md:h-16 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
          <span className="truncate text-base font-medium">{TITULOS[pathname] ?? 'Panel'}</span>
          <div className="ml-auto">
            <BotonTema />
          </div>
        </header>
        <div className="w-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 xl:p-8">
          <TransicionPagina id={pathname} className="w-full min-w-0">
            <Outlet />
          </TransicionPagina>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
