import { useState, type ComponentType, type HTMLAttributes, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  Contact,
  BookImage,
  ExternalLink,
  LayoutDashboard,
  Mail,
  MailOpen,
  MessageSquare,
  Reply,
  Trophy,
  UserMinus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  leerDashboard,
  leerVitrina,
  type CuadrosDashboard,
  type DashboardCrm,
  type DiasDashboard,
  type MiembroEquipoDashboard,
  type PendienteDashboard,
} from '@/api'
import { Bienvenida } from '@/components/Bienvenida'
import { IconoTelegram } from '@/components/IconoTelegram'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { PrimerosPasos } from '@/components/PrimerosPasos'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGuia } from '@/guia/useGuia'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { hayRecienRegistrado } from '@/lib/onboarding'
import { cn } from '@/lib/utils'
import { moduloDeRuta } from '@/components/layout/navegacion'
import { leerModulosRecientes } from '@/lib/modulosRecientes'
import { fechaLista, iniciales } from '@/paginas/chat/formato'
import { AnilloResultado, Dona, EmbudoVisual, GraficoActividad, MiniSpark } from '@/paginas/inicio/graficos'
import { esAdministrador, leerSesion, nombreVisible } from '@/sesion'

const RUTA_WHATSAPP = '/integraciones/whatsapp'
const PERIODOS: { id: DiasDashboard; texto: string; corto: string }[] = [
  { id: 7, texto: '7 días', corto: '7d' },
  { id: 14, texto: '14 días', corto: '14d' },
  { id: 30, texto: '30 días', corto: '30d' },
]

export function Inicio() {
  const [mostrarBienvenida, setMostrarBienvenida] = useState(hayRecienRegistrado)
  const [omitirTourAuto] = useState(hayRecienRegistrado)
  useGuia('inicio', { silenciar: mostrarBienvenida || omitirTourAuto })
  const usuario = leerSesion()?.usuario
  const admin = esAdministrador(usuario)
  const { conectado, cargando } = useWhatsappConectado()
  const [dias, setDias] = useState<DiasDashboard>(14)
  const dashboard = useQuery({ queryKey: ['dashboard', dias], queryFn: () => leerDashboard(dias) })

  return (
    <div className="space-y-4 sm:space-y-6">
      <Bienvenida abierta={mostrarBienvenida} onCerrar={() => setMostrarBienvenida(false)} />
      <Saludo
        nombre={usuario ? nombreVisible(usuario) : ''}
        empresa={usuario?.empresa_nombre || usuario?.empresa || ''}
        conectado={conectado}
        dias={dias}
        alCambiarDias={setDias}
      />

      {dashboard.data && dashboard.data.cuadros.por_responder > 0 ? (
        <AvisoPendientes cantidad={dashboard.data.cuadros.por_responder} admin={admin} />
      ) : null}

      <div className="grid items-stretch gap-4 sm:gap-6 xl:grid-cols-3">
        <Integraciones conectado={conectado} cargando={cargando} admin={admin} />
        <MiWeb admin={admin} />
        <ModulosRecientes />
      </div>

      {dashboard.isPending ? (
        <CargandoDashboard admin={admin} />
      ) : dashboard.isError ? (
        <p className="superficie p-6 text-sm text-destructive">{dashboard.error.message}</p>
      ) : dashboard.data ? (
        <Contenido data={dashboard.data} admin={admin} cargando={cargando} />
      ) : null}
    </div>
  )
}

function Saludo({
  nombre,
  empresa,
  conectado,
  dias,
  alCambiarDias,
}: {
  nombre: string
  empresa: string
  conectado: boolean
  dias: DiasDashboard
  alCambiarDias: (dias: DiasDashboard) => void
}) {
  const fecha = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Hola, {nombre}</p>
        <h1 className="mt-1 truncate font-heading text-[1.55rem] leading-none font-bold tracking-[-0.04em] sm:text-[2.15rem]">
          {empresa || 'Tu empresa'}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground capitalize">{fecha}</p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="flex min-w-0 flex-1 rounded-lg bg-muted p-1 sm:flex-none">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.id}
              type="button"
              onClick={() => alCambiarDias(periodo.id)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-2.5 sm:py-1',
                dias === periodo.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="sm:hidden">{periodo.corto}</span>
              <span className="hidden sm:inline">{periodo.texto}</span>
            </button>
          ))}
        </div>
        {conectado ? (
          <Link to="/chats" className={cn(buttonVariants({ size: 'lg' }), 'h-9 shrink-0 px-3 sm:h-10 sm:px-4')}>
            <span className="sm:hidden">Chat</span>
            <span className="hidden sm:inline">Ir al chat</span>
            <ArrowRight />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function AvisoPendientes({ cantidad, admin }: { cantidad: number; admin: boolean }) {
  const texto = admin
    ? cantidad === 1
      ? 'Hay 1 chat sin responder en el equipo.'
      : `Hay ${cantidad} chats sin responder en el equipo.`
    : cantidad === 1
      ? 'Tienes 1 chat esperando tu respuesta.'
      : `Tienes ${cantidad} chats esperando tu respuesta.`

  return (
    <Link
      to={admin ? '/supervision' : '/chats'}
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 transition-colors hover:bg-amber-100 sm:px-4 sm:py-3"
    >
      <Reply className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{texto}</span>
      <span className="hidden font-medium sm:inline">Responder</span>
      <ArrowRight className="size-3.5" />
    </Link>
  )
}

function Contenido({
  data,
  admin,
  cargando,
}: {
  data: DashboardCrm
  admin: boolean
  cargando: boolean
}) {
  return (
    <>
      <Cuadros cuadros={data.cuadros} admin={admin} dias={data.dias} actividad={data.actividad} />

      <Tarjeta titulo="Actividad" ayuda="Mensajes recibidos, enviados y chats cerrados">
        <GraficoActividad puntos={data.actividad} />
      </Tarjeta>

      <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Embudo" ayuda={admin ? 'Clientes de la empresa por etapa' : 'Tus clientes por etapa'}>
          <EmbudoVisual items={data.embudo} vacio="Aún no hay clientes en el embudo." />
        </Tarjeta>
        <Tarjeta titulo="Tipos de cliente" ayuda="Cómo está repartida la cartera">
          <Dona items={data.tipos} vacio="Todavía no hay tipos asignados." etiquetaCentro="clientes" />
        </Tarjeta>
      </div>

      {admin ? (
        <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
          <Tarjeta titulo="Por qué se cierran" ayuda={`Motivos de los últimos ${data.dias} días`}>
            <Dona items={data.motivos} vacio="Nadie cerró un chat en este periodo." etiquetaCentro="cierres" />
          </Tarjeta>
          <Tarjeta titulo="Resultado del embudo" ayuda={`Ganados frente a perdidos en ${data.dias} días`}>
            <AnilloResultado ganados={data.cuadros.ganados} perdidos={data.cuadros.perdidos} />
          </Tarjeta>
        </div>
      ) : null}

      <div className={cn('grid items-start gap-4 sm:gap-6', admin ? 'xl:grid-cols-2' : '')}>
        <Tarjeta titulo="Esperan respuesta" ayuda="Toca uno para abrir el chat" extra={<Link to="/chats" className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver chats</Link>}>
          <ListaPendientes pendientes={data.pendientes} />
        </Tarjeta>
        {admin ? <TablaEquipo equipo={data.equipo} dias={data.dias} /> : null}
      </div>

      {admin && !cargando ? <PrimerosPasos /> : null}
    </>
  )
}

function Cuadros({
  cuadros,
  admin,
  dias,
  actividad,
}: {
  cuadros: CuadrosDashboard
  admin: boolean
  dias: number
  actividad: DashboardCrm['actividad']
}) {
  const periodo = `en ${dias} días`
  const recibidos = actividad.map((p) => p.recibidos)
  const enviados = actividad.map((p) => p.enviados)
  const cerrados = actividad.map((p) => p.cerrados)

  const comunes = [
    { titulo: 'Sin leer', corto: 'Leer', valor: cuadros.sin_leer, icono: MailOpen, ruta: '/chats', tono: cuadros.sin_leer > 0 ? 'ambar' : 'marca', spark: recibidos, sparkColor: '#f59e0b' },
    { titulo: 'Por responder', corto: 'Respuesta', valor: cuadros.por_responder, icono: Reply, ruta: '/chats', tono: cuadros.por_responder > 0 ? 'rosa' : 'marca', spark: recibidos, sparkColor: '#f43f5e' },
    { titulo: 'Chats abiertos', corto: 'Abiertos', valor: cuadros.abiertos, icono: MessageSquare, ruta: '/chats', tono: 'navy', spark: enviados, sparkColor: '#5B46B4' },
    { titulo: 'Cerrados', corto: 'Cerrados', valor: cuadros.cerrados, icono: Check, ruta: '/chats', tono: 'marca', detalle: periodo, spark: cerrados, sparkColor: '#A78BFA' },
    { titulo: 'Clientes', corto: 'Clientes', valor: cuadros.clientes, icono: Contact, ruta: '/clientes', tono: 'marca', detalle: cuadros.nuevos ? `+${cuadros.nuevos} ${periodo}` : undefined },
    { titulo: 'Pueden escribir', corto: 'Ventana', valor: cuadros.ventana_abierta, icono: Mail, ruta: '/clientes', tono: 'marca', detalle: 'ventana de 24 h' },
  ]

  const extrasAdmin = [
    { titulo: 'Sin asignar', corto: 'Sin asig.', valor: cuadros.sin_asignar ?? 0, icono: UserMinus, ruta: '/supervision', tono: (cuadros.sin_asignar ?? 0) > 0 ? 'ambar' : 'marca' },
    { titulo: 'Ganados', corto: 'Ganados', valor: cuadros.ganados, icono: Trophy, ruta: '/clientes', tono: 'marca', detalle: periodo },
    { titulo: 'Perdidos', corto: 'Perdidos', valor: cuadros.perdidos, icono: UserMinus, ruta: '/clientes', tono: cuadros.perdidos > 0 ? 'rosa' : 'marca', detalle: periodo },
    { titulo: 'Equipo activo', corto: 'Equipo', valor: cuadros.equipo_activo ?? 0, icono: UsersRound, ruta: '/asesores', tono: 'navy' },
  ]

  const items = admin ? [...comunes, ...extrasAdmin] : comunes

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 xl:grid-cols-5" data-tour="metricas">
      {items.map((item) => (
        <Cuadro key={item.titulo} {...item} />
      ))}
    </div>
  )
}

function Cuadro({
  titulo,
  corto,
  valor,
  icono: Icono,
  ruta,
  tono,
  detalle,
  spark,
  sparkColor,
}: {
  titulo: string
  corto?: string
  valor: number
  icono: LucideIcon
  ruta: string
  tono: string
  detalle?: string
  spark?: number[]
  sparkColor?: string
}) {
  return (
    <Link to={ruta} className="superficie flex min-h-0 flex-col justify-between gap-1 p-2.5 sm:min-h-[8.25rem] sm:gap-2 sm:p-4">
      <span className="flex items-center justify-between gap-1">
        <span className="truncate text-[10px] font-semibold tracking-[0.04em] text-muted-foreground uppercase sm:text-[11px] sm:tracking-[0.08em]">
          <span className="sm:hidden">{corto || titulo}</span>
          <span className="hidden sm:inline">{titulo}</span>
        </span>
        <Icono className="hidden size-3.5 shrink-0 text-muted-foreground/70 sm:block" />
      </span>
      <span>
        <span className="block text-[1.35rem] leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-[2rem]">{valor}</span>
        <span className={cn('trazo-marca mt-1.5 hidden sm:block', tono === 'ambar' && 'bg-amber-500', tono === 'rosa' && 'bg-rose-500')} />
        {detalle ? <span className="mt-1.5 hidden text-[11px] text-muted-foreground sm:block">{detalle}</span> : null}
        {spark ? (
          <div className="hidden sm:block">
            <MiniSpark valores={spark} color={sparkColor} />
          </div>
        ) : null}
      </span>
    </Link>
  )
}

function Tarjeta({
  titulo,
  ayuda,
  extra,
  className,
  children,
  ...rest
}: {
  titulo: string
  ayuda?: string
  extra?: ReactNode
  className?: string
  children: ReactNode
} & HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('superficie', className)} {...rest}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">{titulo}</h2>
          {ayuda ? <p className="mt-1 text-sm text-muted-foreground">{ayuda}</p> : null}
        </div>
        {extra}
      </header>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </section>
  )
}

function ListaPendientes({ pendientes }: { pendientes: PendienteDashboard[] }) {
  if (pendientes.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Nadie te está esperando.</p>
  }

  return (
    <ul className="-mx-2 divide-y">
      {pendientes.map((item) => (
        <li key={item.id}>
          <Link to={`/chats?c=${item.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/6">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">{iniciales(item.nombre)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{item.nombre}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{fechaLista(item.fecha)}</span>
              </span>
              <span className="block truncate text-xs text-muted-foreground">{item.preview || 'Mensaje'}</span>
            </span>
            {item.sin_leer ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {item.sin_leer > 99 ? '99+' : item.sin_leer}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function BarraEquipo({ valor, max, color }: { valor: number; max: number; color: string }) {
  const ancho = max > 0 ? (valor / max) * 100 : 0
  return (
    <div className="min-w-16">
      <p className="tabular-nums">{valor}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/10">
        <div className="h-full rounded-full" style={{ width: `${ancho}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function TablaEquipo({ equipo, dias }: { equipo: MiembroEquipoDashboard[]; dias: number }) {
  const maxEquipo = {
    abiertos: Math.max(1, ...equipo.map((p) => p.abiertos)),
    cerrados: Math.max(1, ...equipo.map((p) => p.cerrados)),
    sin_leer: Math.max(1, ...equipo.map((p) => p.sin_leer)),
    clientes: Math.max(1, ...equipo.map((p) => p.clientes)),
  }

  return (
    <section className="superficie h-full overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">Equipo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cómo va cada asesor en los últimos {dias} días</p>
        </div>
        <Link to="/asesores" className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground">
          Ver asesores
        </Link>
      </header>
      {equipo.length === 0 ? (
        <p className="px-5 pb-8 text-sm text-muted-foreground">Aún no hay asesores.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-t">
                <th className="px-5 py-2 font-medium">Asesor</th>
                <th className="px-3 py-2 font-medium">Abiertos</th>
                <th className="px-3 py-2 font-medium">Cerrados</th>
                <th className="px-3 py-2 font-medium">Sin leer</th>
                <th className="px-5 py-2 font-medium">Clientes</th>
              </tr>
            </thead>
            <tbody>
              {equipo.map((persona) => (
                <tr key={persona.id} className="border-t">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        {persona.foto ? <AvatarImage src={persona.foto} alt={persona.nombre} /> : null}
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">{iniciales(persona.nombre)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{persona.nombre}</p>
                        {persona.activo ? null : <p className="text-[11px] text-muted-foreground">Inactivo</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><BarraEquipo valor={persona.abiertos} max={maxEquipo.abiertos} color="#5B46B4" /></td>
                  <td className="px-3 py-2.5"><BarraEquipo valor={persona.cerrados} max={maxEquipo.cerrados} color="#A78BFA" /></td>
                  <td className="px-3 py-2.5"><BarraEquipo valor={persona.sin_leer} max={maxEquipo.sin_leer} color="#f59e0b" /></td>
                  <td className="px-5 py-2.5"><BarraEquipo valor={persona.clientes} max={maxEquipo.clientes} color="#0B1026" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function CargandoDashboard({ admin }: { admin: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: admin ? 10 : 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl sm:h-24" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-xl xl:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

function Integraciones({ conectado, cargando, admin }: { conectado: boolean; cargando: boolean; admin: boolean }) {
  const vitrina = useQuery({
    queryKey: ['catalogo-vitrina'],
    queryFn: leerVitrina,
    enabled: admin,
    staleTime: 60_000,
    retry: false,
  })
  const publicado = vitrina.data?.publicado === true

  return (
    <section className="superficie overflow-hidden" data-tour="integraciones">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">Integraciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Qué está conectado</p>
        </div>
        <Link to="/integraciones" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Ver todas
        </Link>
      </header>
      <ul className="divide-y border-t">
        <li>
          <Link to={RUTA_WHATSAPP} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-primary/6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border">
              <IconoWhatsapp className="size-5" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium">WhatsApp Business</span>
            {cargando ? (
              <Skeleton className="h-5 w-20" />
            ) : conectado ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <Check />
                Conectado
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">Pendiente</Badge>
            )}
          </Link>
        </li>
        <li>
          <Link to="/catalogo" className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-primary/6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0B1026]/8 text-[#0B1026]">
              <BookImage className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium">Mi Catálogo</span>
            {!admin || vitrina.isLoading ? null : publicado ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <Check />
                Publicado
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">Sin publicar</Badge>
            )}
          </Link>
        </li>
        <FilaProxima icono={IconoTelegram} titulo="Telegram" />
      </ul>
    </section>
  )
}

function MiWeb({ admin }: { admin: boolean }) {
  const vitrina = useQuery({
    queryKey: ['catalogo-vitrina'],
    queryFn: leerVitrina,
    enabled: admin,
    staleTime: 60_000,
    retry: false,
  })
  const url = vitrina.data?.publicado && vitrina.data.enlace ? `${window.location.origin}${vitrina.data.enlace}` : ''

  return (
    <section className="superficie flex flex-col overflow-hidden">
      <header className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">Mi web</h2>
        <p className="mt-1 text-sm text-muted-foreground">La tienda pública de tu catálogo</p>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex items-center gap-3">
          {vitrina.data?.logo_url ? (
            <img src={vitrina.data.logo_url} alt="" className="size-12 rounded-xl object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-xl bg-[#0B1026]/8 text-[#0B1026]">
              <BookImage className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{vitrina.data?.titulo || 'Tu catálogo'}</p>
            <p className="truncate text-xs text-muted-foreground">{url || 'Aún no está publicada'}</p>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: 'sm' }), 'h-9')}>
              Ver mi web
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          <Link to="/catalogo" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')}>
            {url ? 'Configurar' : 'Crear catálogo'}
          </Link>
        </div>
      </div>
    </section>
  )
}

function ModulosRecientes() {
  const id = leerSesion()?.usuario.id
  const recientes = id ? leerModulosRecientes(id) : []

  return (
    <section className="superficie overflow-hidden">
      <header className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">Recientes</h2>
        <p className="mt-1 text-sm text-muted-foreground">Los últimos módulos que abriste</p>
      </header>
      {recientes.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-muted-foreground">Cuando entres a Chat, Productos o Catálogo, aparecen aquí.</p>
      ) : (
        <ul className="divide-y border-t">
          {recientes.slice(0, 6).map((item) => {
            const modulo = moduloDeRuta(item.ruta)
            const Icono = modulo?.icono ?? LayoutDashboard
            return (
              <li key={item.ruta}>
                <Link to={item.ruta} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-primary/6">
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', modulo?.tono || 'bg-muted')}>
                    <Icono className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.titulo}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function FilaProxima({ icono: Icono, titulo }: { icono: LucideIcon | ComponentType<{ className?: string }>; titulo: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 opacity-60">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icono className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{titulo}</span>
      <span className="text-xs text-muted-foreground">Próximamente</span>
    </li>
  )
}
