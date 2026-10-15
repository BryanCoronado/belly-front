import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Contact,
  Mail,
  MailOpen,
  MessagesSquare,
  Reply,
  Smartphone,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { leerChats, leerContadoresChat, leerLista, type ConversacionChat } from '@/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGuia } from '@/guia/useGuia'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { fechaLista, iniciales, nombreContacto, vistaPrevia } from '@/paginas/chat/formato'
import { esAdministrador, leerSesion, nombreVisible } from '@/sesion'

const RUTA_WHATSAPP = '/integraciones/whatsapp'

export function Inicio() {
  useGuia('inicio')
  const usuario = leerSesion()?.usuario
  const admin = esAdministrador(usuario)
  const { conectado, cargando } = useWhatsappConectado()
  const pendiente = !cargando && !conectado

  return (
    <div className="space-y-6">
      <Saludo nombre={usuario ? nombreVisible(usuario) : ''} empresa={usuario?.empresa ?? ''} conectado={conectado} />

      {admin && pendiente ? <AvisoConectar /> : null}

      <Indicadores admin={admin} conectado={conectado} />

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <ConversacionesRecientes conectado={conectado} cargando={cargando} admin={admin} className="xl:col-span-2" />
        <div className="space-y-6">
          {admin ? <Integraciones conectado={conectado} cargando={cargando} /> : null}
          <PrimerosPasos conectado={conectado} />
        </div>
      </div>
    </div>
  )
}

function Saludo({ nombre, empresa, conectado }: { nombre: string; empresa: string; conectado: boolean }) {
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
      <Link
        to={conectado ? '/chats' : RUTA_WHATSAPP}
        data-tour="conectar-whatsapp"
        className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-4')}
      >
        {conectado ? 'Ir al chat' : 'Conectar WhatsApp'}
        <ArrowRight />
      </Link>
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

function Indicadores({ admin, conectado }: { admin: boolean; conectado: boolean }) {
  const contadores = useQuery({ queryKey: ['chats-contadores'], queryFn: leerContadoresChat, enabled: conectado })
  const clientes = useQuery({ queryKey: ['inicio-clientes'], queryFn: () => leerLista('/v1/clientes/listar?page=1&perPage=20') })
  const equipo = useQuery({
    queryKey: ['inicio-equipo'],
    queryFn: () => leerLista('/v1/usuario?page=1&perPage=20'),
    enabled: admin,
  })

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour="metricas">
      <Indicador
        titulo="Sin leer"
        icono={MailOpen}
        ruta="/chats"
        valor={conectado ? contadores.data?.mensajes_no_leidos : undefined}
        cargando={conectado && contadores.isPending}
      />
      <Indicador
        titulo="Por responder"
        icono={Reply}
        ruta="/chats"
        valor={conectado ? contadores.data?.falta_responder : undefined}
        cargando={conectado && contadores.isPending}
      />
      <Indicador titulo="Clientes" icono={Contact} ruta="/clientes" valor={clientes.data?.total} cargando={clientes.isPending} />
      {admin ? (
        <Indicador titulo="Equipo" icono={UsersRound} ruta="/equipo" valor={equipo.data?.total} cargando={equipo.isPending} />
      ) : null}
    </div>
  )
}

function Indicador({
  titulo,
  icono: Icono,
  ruta,
  valor,
  cargando,
}: {
  titulo: string
  icono: LucideIcon
  ruta: string
  valor?: number | string
  cargando: boolean
}) {
  return (
    <Link to={ruta} className="group flex items-center gap-4 rounded-xl border bg-white p-5 transition-colors hover:border-zinc-400">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icono className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-muted-foreground">{titulo}</span>
        {cargando ? (
          <Skeleton className="mt-1 h-7 w-12" />
        ) : (
          <span className="block text-2xl font-semibold tabular-nums">{valor ?? '—'}</span>
        )}
      </span>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function ConversacionesRecientes({
  conectado,
  cargando,
  admin,
  className,
}: {
  conectado: boolean
  cargando: boolean
  admin: boolean
  className?: string
}) {
  const chats = useQuery({
    queryKey: ['chats', 'activos', ''],
    queryFn: () => leerChats('activos', ''),
    enabled: conectado,
  })

  return (
    <section className={cn('rounded-xl border bg-white', className)}>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-semibold">Conversaciones recientes</h2>
        {conectado ? (
          <Link to="/chats" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            Ver todas
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </header>

      {cargando || (conectado && chats.isPending) ? (
        <div className="space-y-1 p-4">
          {Array.from({ length: 5 }, (_, indice) => (
            <div key={indice} className="flex items-center gap-3 py-2">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !conectado ? (
        <Vacio
          icono={MessagesSquare}
          texto="Aquí verás tus conversaciones cuando conectes WhatsApp."
          accion={admin ? { texto: 'Conectar WhatsApp', ruta: RUTA_WHATSAPP } : undefined}
        />
      ) : chats.data?.length ? (
        <ul className="divide-y">
          {chats.data.slice(0, 7).map((chat) => (
            <FilaChat key={chat.id} chat={chat} />
          ))}
        </ul>
      ) : (
        <Vacio icono={MessagesSquare} texto="Todavía no hay conversaciones." />
      )}
    </section>
  )
}

function FilaChat({ chat }: { chat: ConversacionChat }) {
  const nombre = nombreContacto(chat)
  const noLeidos = Number(chat.mensajes_no_leidos) || 0

  return (
    <li>
      <Link to={`/chats?c=${chat.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-zinc-100 text-sm font-medium text-zinc-600">{iniciales(nombre)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{vistaPrevia(chat)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">{fechaLista(chat.ultimo_mensaje_fecha)}</span>
          {noLeidos ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
              {noLeidos > 99 ? '99+' : noLeidos}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  )
}

function Vacio({
  icono: Icono,
  texto,
  accion,
}: {
  icono: LucideIcon
  texto: string
  accion?: { texto: string; ruta: string }
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <Icono className="size-5" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{texto}</p>
      {accion ? (
        <Link to={accion.ruta} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          {accion.texto}
        </Link>
      ) : null}
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

function PrimerosPasos({ conectado }: { conectado: boolean }) {
  const pasos = [
    { titulo: 'Conectar WhatsApp', ruta: RUTA_WHATSAPP, hecho: conectado },
    { titulo: 'Agregar a tu equipo', ruta: '/equipo', hecho: false },
    { titulo: 'Atender tu bandeja', ruta: '/chats', hecho: false },
  ]

  return (
    <section className="rounded-xl border bg-white" data-tour="primeros-pasos">
      <header className="border-b px-5 py-4">
        <h2 className="font-semibold">Primeros pasos</h2>
      </header>
      <ol className="divide-y">
        {pasos.map((paso, indice) => (
          <li key={paso.ruta}>
            <Link to={paso.ruta} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  paso.hecho ? 'bg-emerald-600 text-white' : 'border text-zinc-500',
                )}
              >
                {paso.hecho ? <Check className="size-3.5" /> : indice + 1}
              </span>
              <span className={cn('min-w-0 flex-1 text-sm font-medium', paso.hecho && 'text-muted-foreground line-through')}>
                {paso.titulo}
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
