import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Leaf } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { BotonTema } from '@/components/BotonTema'
import { TransformacionModo } from '@/components/TransformacionModo'
import { TransicionPagina } from '@/components/TransicionPagina'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AvisoMeta } from '@/components/layout/AvisoMeta'
import { LimitesPlan } from '@/components/layout/LimitesPlan'
import { BandejaAvisos } from '@/components/layout/BandejaAvisos'
import { BotonGuia } from '@/guia/BotonGuia'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTiempoReal } from '@/hooks/use-tiempo-real'
import { useModoAhorro } from '@/lib/modo-ahorro'
import { cn } from '@/lib/utils'
import { registrarModuloReciente } from '@/lib/modulosRecientes'
import { RailWhatsapp } from '@/paginas/chat/RailWhatsapp'
import { esAdministrador, esOperador, leerSesion, type UsuarioSesion } from '@/sesion'
import { BarraLateral } from './BarraLateral'
import { rutasPermitidas, useGruposMenu } from './menuPermitido'
import { PanelSeccionWa } from './PanelSeccionWa'
import { seccionDeRuta, seccionesVisibles } from './seccionesWa'
import { tituloDeRuta } from './navegacion'

const PANTALLA_COMPLETA = new Set(['/chats', '/supervision', '/catalogo/lab'])
/** Chat, constructor de catálogo y editor de flujos ocupan todo el alto: sin márgenes alrededor. */
const esPantallaCompleta = (ruta: string) => PANTALLA_COMPLETA.has(ruta) || /^\/automatizacion\/\d+/.test(ruta)
const esChatWhatsapp = (ruta: string) => ruta === '/chats' || ruta === '/supervision'

export function LayoutApp() {
  const [sesion, setSesion] = useState(leerSesion)
  const { pathname } = useLocation()
  const movil = useIsMobile()
  useTiempoReal()

  useEffect(() => {
    const alCambiar = () => setSesion(leerSesion())
    window.addEventListener('belly-sesion', alCambiar)
    return () => window.removeEventListener('belly-sesion', alCambiar)
  }, [])

  useEffect(() => {
    const id = sesion?.usuario.id
    if (!id) return
    registrarModuloReciente(id, pathname, tituloDeRuta(pathname))
  }, [pathname, sesion?.usuario.id])

  if (!sesion) {
    return <Navigate to="/" replace />
  }
  if (esOperador(sesion.usuario)) {
    return <Navigate to="/operador" replace />
  }

  return movil ? <LayoutMovil usuario={sesion.usuario} ruta={pathname} /> : <LayoutEscritorio usuario={sesion.usuario} ruta={pathname} />
}

type PropsLayout = { usuario: UsuarioSesion; ruta: string }

/** Escritorio: igual que WhatsApp Web (riel de íconos + panel de la sección + contenido). */
function LayoutEscritorio({ usuario, ruta }: PropsLayout) {
  const { ahorro } = useModoAhorro()
  const pantallaCompleta = esPantallaCompleta(ruta)
  const chatWa = esChatWhatsapp(ruta)
  const lab = ruta === '/catalogo/lab' || ruta.startsWith('/catalogo/lab/')
  const secciones = seccionesVisibles(rutasPermitidas(useGruposMenu(usuario)), esAdministrador(usuario))
  const seccion = seccionDeRuta(secciones, ruta)
  const conPanel = !chatWa && !lab && !pantallaCompleta && seccion !== null && seccion.entradas.length > 1
  const titulo = tituloDeRuta(ruta) || seccion?.titulo || ''

  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden">
      <TransformacionModo />
      <div className="chat-wa flex min-h-0 w-full flex-1 overflow-hidden bg-[var(--wa-cabecera)]">
        {lab ? null : <RailWhatsapp usuario={usuario} />}
        {conPanel && seccion ? <PanelSeccionWa seccion={seccion} ruta={ruta} usuario={usuario} /> : null}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          {chatWa || lab ? null : (
            <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--wa-borde)] bg-[var(--wa-cabecera)] px-6">
              <span className="truncate text-[17px] font-medium text-[var(--wa-texto)]">{titulo}</span>
              <PildoraAhorro ahorro={ahorro} />
              <AccionesCabecera ahorro={ahorro} />
            </header>
          )}
          {chatWa || lab ? null : <BannerAhorro ahorro={ahorro} usuario={usuario} />}
          {chatWa || lab ? null : (
            <div className="shrink-0">
              <LimitesPlan />
            </div>
          )}
          <Contenido ruta={ruta} pantallaCompleta={pantallaCompleta} />
        </main>
      </div>
    </SidebarProvider>
  )
}

function LayoutMovil({ usuario, ruta }: PropsLayout) {
  const { ahorro } = useModoAhorro()
  const pantallaCompleta = esPantallaCompleta(ruta)
  const inmersivo = ruta === '/catalogo/lab' || esChatWhatsapp(ruta)

  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden">
      <TransformacionModo />
      {inmersivo ? null : <BarraLateral usuario={usuario} />}
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        {inmersivo || pantallaCompleta ? null : (
          <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 text-foreground">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
            <span className="truncate text-base font-medium">{tituloDeRuta(ruta)}</span>
            <PildoraAhorro ahorro={ahorro} />
            <AccionesCabecera ahorro={ahorro} />
          </header>
        )}
        {inmersivo || pantallaCompleta ? null : <BannerAhorro ahorro={ahorro} usuario={usuario} />}
        {inmersivo || pantallaCompleta ? null : (
          <div className="shrink-0">
            <LimitesPlan />
          </div>
        )}
        <Contenido ruta={ruta} pantallaCompleta={pantallaCompleta} />
      </SidebarInset>
    </SidebarProvider>
  )
}

function Contenido({ ruta, pantallaCompleta }: { ruta: string; pantallaCompleta: boolean }) {
  return (
    <div
      className={cn(
        'w-full min-w-0 min-h-0 flex-1',
        pantallaCompleta ? 'flex flex-col overflow-hidden' : 'overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 xl:p-8',
      )}
    >
      <TransicionPagina
        id={ruta}
        suave={pantallaCompleta}
        className={cn('w-full min-w-0', pantallaCompleta && 'flex min-h-0 flex-1 flex-col')}
      >
        <Outlet />
      </TransicionPagina>
    </div>
  )
}

function PildoraAhorro({ ahorro }: { ahorro: boolean }) {
  return (
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
  )
}

function AccionesCabecera({ ahorro }: { ahorro: boolean }) {
  return (
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
  )
}

function BannerAhorro({ ahorro, usuario }: { ahorro: boolean; usuario: UsuarioSesion }): ReactNode {
  return (
    <AnimatePresence>
      {ahorro ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-1.5 text-center text-xs text-primary">
            Modo ahorro · el automático habla poco · cada mensaje de WhatsApp cuenta
            {esAdministrador(usuario) ? (
              <Link to="/integraciones/costos" className="font-medium underline-offset-2 hover:underline">
                Ver costos
              </Link>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
