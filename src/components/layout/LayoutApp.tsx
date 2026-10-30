import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Leaf } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { BotonTema } from '@/components/BotonTema'
import { TransformacionModo } from '@/components/TransformacionModo'
import { TransicionPagina } from '@/components/TransicionPagina'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AvisoMeta } from '@/components/layout/AvisoMeta'
import { BandejaAvisos } from '@/components/layout/BandejaAvisos'
import { BotonGuia } from '@/guia/BotonGuia'
import { useTiempoReal } from '@/hooks/use-tiempo-real'
import { useModoAhorro } from '@/lib/modo-ahorro'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'
import { BarraLateral } from './BarraLateral'
import { tituloDeRuta } from './navegacion'

const PANTALLA_COMPLETA = new Set(['/chats', '/supervision'])
/** Chat y editor de flujos ocupan todo el alto: sin márgenes alrededor. */
const esPantallaCompleta = (ruta: string) => PANTALLA_COMPLETA.has(ruta) || /^\/automatizacion\/\d+/.test(ruta)

export function LayoutApp() {
  const [sesion, setSesion] = useState(leerSesion)
  const { pathname } = useLocation()
  const { ahorro } = useModoAhorro()
  const pantallaCompleta = esPantallaCompleta(pathname)
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
    <SidebarProvider className={cn('overflow-x-hidden', pantallaCompleta && 'h-svh max-h-svh overflow-hidden')}>
      <TransformacionModo />
      <BarraLateral usuario={sesion.usuario} />
      <SidebarInset className={cn('overflow-x-hidden', pantallaCompleta && 'min-h-0 overflow-hidden')}>
        <header
          className={cn(
            'sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 text-foreground md:h-16 md:px-6',
            pantallaCompleta && 'hidden md:flex',
          )}
        >
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
          <span className="truncate text-base font-medium">{tituloDeRuta(pathname)}</span>
          <AnimatePresence>
            {ahorro ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.85, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: -8 }}
                className="hidden items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary sm:inline-flex"
              >
                <Leaf className="size-3.5" />
                Modo ahorro
              </motion.span>
            ) : null}
          </AnimatePresence>
          <div className="ml-auto flex items-center gap-2">
            <AvisoMeta />
            <BandejaAvisos />
            <BotonTema />
            <AnimatePresence>
              {!ahorro ? (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <BotonGuia />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>
        <AnimatePresence>
          {ahorro ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  'flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-1.5 text-center text-xs text-primary',
                  pantallaCompleta && 'hidden md:flex',
                )}
              >
                Modo ahorro · el automático habla poco · cada mensaje de WhatsApp cuenta
                {esAdministrador(sesion.usuario) ? (
                  <Link to="/integraciones/costos" className="font-medium underline-offset-2 hover:underline">
                    Ver costos
                  </Link>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div
          className={cn(
            'w-full min-w-0 flex-1',
            pantallaCompleta ? 'flex min-h-0 flex-col overflow-hidden' : 'p-4 md:p-6 xl:p-8',
          )}
        >
          <TransicionPagina
            id={pathname}
            suave={pantallaCompleta}
            className={cn('w-full min-w-0', pantallaCompleta && 'flex min-h-0 flex-1 flex-col')}
          >
            <Outlet />
          </TransicionPagina>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
