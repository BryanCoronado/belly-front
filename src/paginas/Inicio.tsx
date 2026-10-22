import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  Contact,
  Mail,
  MailOpen,
  MessageSquare,
  Reply,
  Smartphone,
  Trophy,
  UserMinus,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  leerDashboard,
  type CuadrosDashboard,
  type DashboardCrm,
  type DiasDashboard,
  type MiembroEquipoDashboard,
  type PendienteDashboard,
} from '@/api'
import { PrimerosPasos } from '@/components/PrimerosPasos'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGuia } from '@/guia/useGuia'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { fechaLista, iniciales } from '@/paginas/chat/formato'
import { AnilloResultado, Dona, EmbudoVisual, GraficoActividad, MiniSpark } from '@/paginas/inicio/graficos'
import { esAdministrador, leerSesion, nombreVisible } from '@/sesion'

const RUTA_WHATSAPP = '/integraciones/whatsapp'
const PERIODOS: { id: DiasDashboard; texto: string }[] = [
  { id: 7, texto: '7 días' },
  { id: 14, texto: '14 días' },
  { id: 30, texto: '30 días' },
]

export function Inicio() {
  useGuia('inicio')
  const usuario = leerSesion()?.usuario
  const admin = esAdministrador(usuario)
  const { conectado, cargando } = useWhatsappConectado()
  const pendiente = !cargando && !conectado
  const [dias, setDias] = useState<DiasDashboard>(14)
  const dashboard = useQuery({ queryKey: ['dashboard', dias], queryFn: () => leerDashboard(dias) })

  return (
    <div className="space-y-6">
      <Saludo
        nombre={usuario ? nombreVisible(usuario) : ''}
        empresa={usuario?.empresa ?? ''}
        conectado={conectado}
        dias={dias}
        alCambiarDias={setDias}
      />

      {admin && pendiente ? <AvisoConectar /> : null}
      {dashboard.data && dashboard.data.cuadros.por_responder > 0 ? (
        <AvisoPendientes cantidad={dashboard.data.cuadros.por_responder} admin={admin} />
      ) : null}

      {dashboard.isPending ? (
        <CargandoDashboard admin={admin} />
      ) : dashboard.isError ? (
        <p className="rounded-xl border bg-white p-6 text-sm text-destructive">{dashboard.error.message}</p>
      ) : dashboard.data ? (
        <Contenido data={dashboard.data} admin={admin} conectado={conectado} cargando={cargando} />
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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-muted-foreground capitalize">
          {fecha}
          {empresa ? ` · ${empresa}` : ''}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hola, {nombre}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-zinc-100 p-1">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.id}
              type="button"
              onClick={() => alCambiarDias(periodo.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                dias === periodo.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {periodo.texto}
            </button>
          ))}
        </div>
        <Link to={conectado ? '/chats' : RUTA_WHATSAPP} data-tour="conectar-whatsapp" className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-4')}>
          {conectado ? 'Ir al chat' : 'Conectar WhatsApp'}
          <ArrowRight />
        </Link>
      </div>
    </div>
  )
}

function AvisoConectar() {
  return (
    <Link
      to={RUTA_WHATSAPP}
      className="tema-fijo group flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-700 sm:p-6"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Smartphone className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">Conecta tu WhatsApp</span>
        <span className="block text-sm text-white/65">Sin un número conectado no llegan clientes ni se activa el chat.</span>
      </span>
      <span className="flex items-center gap-2 text-sm font-medium">
        Empezar
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
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
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 transition-colors hover:bg-amber-100"
    >
      <Reply className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{texto}</span>
      <span className="font-medium">Responder</span>
      <ArrowRight className="size-3.5" />
    </Link>
  )
}

function Contenido({
  data,
  admin,
  conectado,
  cargando,
}: {
  data: DashboardCrm
  admin: boolean
  conectado: boolean
  cargando: boolean
}) {
  return (
    <>
      <Cuadros cuadros={data.cuadros} admin={admin} dias={data.dias} actividad={data.actividad} />

      <Tarjeta titulo="Actividad" ayuda="Mensajes recibidos, enviados y chats cerrados">
        <GraficoActividad puntos={data.actividad} />
      </Tarjeta>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Embudo" ayuda={admin ? 'Clientes de la empresa por etapa' : 'Tus clientes por etapa'}>
          <EmbudoVisual items={data.embudo} vacio="Aún no hay clientes en el embudo." />
        </Tarjeta>
        <Tarjeta titulo="Tipos de cliente" ayuda="Cómo está repartida la cartera">
          <Dona items={data.tipos} vacio="Todavía no hay tipos asignados." etiquetaCentro="clientes" />
        </Tarjeta>
      </div>

      {admin ? (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Tarjeta titulo="Por qué se cierran" ayuda={`Motivos de los últimos ${data.dias} días`}>
            <Dona items={data.motivos} vacio="Nadie cerró un chat en este periodo." etiquetaCentro="cierres" />
          </Tarjeta>
          <Tarjeta titulo="Resultado del embudo" ayuda={`Ganados frente a perdidos en ${data.dias} días`}>
            <AnilloResultado ganados={data.cuadros.ganados} perdidos={data.cuadros.perdidos} />
          </Tarjeta>
        </div>
      ) : null}

      <div className={cn('grid items-start gap-6', admin ? 'xl:grid-cols-2' : '')}>
        <Tarjeta titulo="Esperan respuesta" ayuda="Toca uno para abrir el chat" extra={<Link to="/chats" className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver chats</Link>}>
          <ListaPendientes pendientes={data.pendientes} />
        </Tarjeta>
        {admin ? <TablaEquipo equipo={data.equipo} dias={data.dias} /> : null}
      </div>

      {admin ? (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {!cargando ? <PrimerosPasos /> : null}
          <Integraciones conectado={conectado} cargando={cargando} />
        </div>
      ) : null}
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
    { titulo: 'Sin leer', valor: cuadros.sin_leer, icono: MailOpen, ruta: '/chats', tono: cuadros.sin_leer > 0 ? 'ambar' : 'zinc', spark: recibidos, sparkColor: '#f59e0b' },
    { titulo: 'Por responder', valor: cuadros.por_responder, icono: Reply, ruta: '/chats', tono: cuadros.por_responder > 0 ? 'rosa' : 'zinc', spark: recibidos, sparkColor: '#f43f5e' },
    { titulo: 'Chats abiertos', valor: cuadros.abiertos, icono: MessageSquare, ruta: '/chats', tono: 'cielo', spark: enviados, sparkColor: '#0ea5e9' },
    { titulo: 'Cerrados', valor: cuadros.cerrados, icono: Check, ruta: '/chats', tono: 'verde', detalle: periodo, spark: cerrados, sparkColor: '#10b981' },
    { titulo: 'Clientes', valor: cuadros.clientes, icono: Contact, ruta: '/clientes', tono: 'zinc', detalle: cuadros.nuevos ? `+${cuadros.nuevos} ${periodo}` : undefined },
    { titulo: 'Pueden escribir', valor: cuadros.ventana_abierta, icono: Mail, ruta: '/clientes', tono: 'verde', detalle: 'ventana de 24 h' },
  ]

  const extrasAdmin = [
    { titulo: 'Sin asignar', valor: cuadros.sin_asignar ?? 0, icono: UserMinus, ruta: '/supervision', tono: (cuadros.sin_asignar ?? 0) > 0 ? 'ambar' : 'zinc' },
    { titulo: 'Ganados', valor: cuadros.ganados, icono: Trophy, ruta: '/clientes', tono: 'verde', detalle: periodo },
    { titulo: 'Perdidos', valor: cuadros.perdidos, icono: UserMinus, ruta: '/clientes', tono: cuadros.perdidos > 0 ? 'rosa' : 'zinc', detalle: periodo },
    { titulo: 'Equipo activo', valor: cuadros.equipo_activo ?? 0, icono: UsersRound, ruta: '/asesores', tono: 'violeta' },
  ]

  const items = admin ? [...comunes, ...extrasAdmin] : comunes

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', admin ? 'xl:grid-cols-5' : 'xl:grid-cols-3')} data-tour="metricas">
      {items.map((item) => (
        <Cuadro key={item.titulo} {...item} />
      ))}
    </div>
  )
}

const TONO: Record<string, string> = {
  zinc: 'bg-zinc-100 text-zinc-700',
  verde: 'bg-emerald-50 text-emerald-700',
  ambar: 'bg-amber-50 text-amber-800',
  rosa: 'bg-rose-50 text-rose-700',
  cielo: 'bg-sky-50 text-sky-700',
  violeta: 'bg-violet-50 text-violet-700',
}

function Cuadro({
  titulo,
  valor,
  icono: Icono,
  ruta,
  tono,
  detalle,
  spark,
  sparkColor,
}: {
  titulo: string
  valor: number
  icono: LucideIcon
  ruta: string
  tono: string
  detalle?: string
  spark?: number[]
  sparkColor?: string
}) {
  return (
    <Link to={ruta} className="group rounded-xl border bg-white p-4 transition-colors hover:border-zinc-400">
      <span className="flex items-start gap-3">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TONO[tono] ?? TONO.zinc)}>
          <Icono className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">{titulo}</span>
          <span className="block text-2xl font-semibold tabular-nums">{valor}</span>
          {detalle ? <span className="block text-[11px] text-muted-foreground">{detalle}</span> : null}
        </span>
      </span>
      {spark ? <MiniSpark valores={spark} color={sparkColor} /> : null}
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
    <section className={cn('rounded-xl border bg-white', className)} {...rest}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
        </div>
        {extra}
      </header>
      <div className="px-5 pb-5">{children}</div>
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
          <Link to={`/chats?c=${item.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-zinc-50">
            <Avatar className="size-9">
              <AvatarFallback className="bg-zinc-100 text-xs">{iniciales(item.nombre)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{item.nombre}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{fechaLista(item.fecha)}</span>
              </span>
              <span className="block truncate text-xs text-muted-foreground">{item.preview || 'Mensaje'}</span>
            </span>
            {item.sin_leer ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white">
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
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
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
    <section className="overflow-hidden rounded-xl border bg-white h-full">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="font-semibold">Equipo</h2>
          <p className="text-xs text-muted-foreground">Cómo va cada asesor en los últimos {dias} días</p>
        </div>
        <Link to="/asesores" className="text-sm font-medium text-muted-foreground hover:text-foreground">
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
                        <AvatarFallback className="bg-zinc-100 text-xs">{iniciales(persona.nombre)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{persona.nombre}</p>
                        {persona.activo ? null : <p className="text-[11px] text-muted-foreground">Inactivo</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><BarraEquipo valor={persona.abiertos} max={maxEquipo.abiertos} color="#0ea5e9" /></td>
                  <td className="px-3 py-2.5"><BarraEquipo valor={persona.cerrados} max={maxEquipo.cerrados} color="#10b981" /></td>
                  <td className="px-3 py-2.5"><BarraEquipo valor={persona.sin_leer} max={maxEquipo.sin_leer} color="#f59e0b" /></td>
                  <td className="px-5 py-2.5"><BarraEquipo valor={persona.clientes} max={maxEquipo.clientes} color="#8b5cf6" /></td>
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
      <div className={cn('grid gap-3 sm:grid-cols-2', admin ? 'xl:grid-cols-5' : 'xl:grid-cols-3')}>
        {Array.from({ length: admin ? 10 : 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-xl xl:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

function Integraciones({ conectado, cargando }: { conectado: boolean; cargando: boolean }) {
  return (
    <section className="rounded-xl border bg-white" data-tour="integraciones">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-semibold">Integraciones</h2>
        <Link to="/integraciones" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Ver todas
        </Link>
      </header>
      <ul className="divide-y">
        <li>
          <Link to={RUTA_WHATSAPP} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Smartphone className="size-4" />
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
        <FilaProxima icono={Wallet} titulo="Ventas" />
        <FilaProxima icono={Mail} titulo="Correo" />
      </ul>
    </section>
  )
}

function FilaProxima({ icono: Icono, titulo }: { icono: LucideIcon; titulo: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 opacity-60">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icono className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{titulo}</span>
      <span className="text-xs text-muted-foreground">Próximamente</span>
    </li>
  )
}
