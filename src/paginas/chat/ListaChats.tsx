import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock3, LayoutDashboard, ListFilter, MessagesSquare, Plus, X } from 'lucide-react'
import { useDeferredValue, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { leerChats, leerContadoresChat, type BandejaChat, type ConversacionChat, type FiltrosChat } from '@/api'
import { AvisoMeta } from '@/components/layout/AvisoMeta'
import { LimitesPlan } from '@/components/layout/LimitesPlan'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAjustesCrm } from '../clientes/crm'
import { fechaLista, leerFecha, nombreContacto, vistaPrevia } from './formato'
import {
  AvatarWa,
  IconoArchivados,
  IconoBuscar,
  IconoEtiqueta,
  IconoMenu,
  IconoNuevoChat,
  IconoTickDoble,
  IconoTickSimple,
} from './iconosWa'

const BANDEJAS: { id: BandejaChat; titulo: string }[] = [
  { id: 'activos', titulo: 'Todos' },
  { id: 'no_leidos', titulo: 'No leídos' },
  { id: 'pendientes', titulo: 'Por responder' },
]

type Props = {
  seleccionado: number | null
  alSeleccionar: (chat: ConversacionChat) => void
  className?: string
}

export function ListaChats({ seleccionado, alSeleccionar, className }: Props) {
  const navegar = useNavigate()
  const [bandeja, setBandeja] = useState<BandejaChat>('activos')
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<FiltrosChat>({})
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const busquedaDiferida = useDeferredValue(busqueda)
  const ajustes = useAjustesCrm()
  const hayFiltros = Boolean(filtros.id_etapa || filtros.id_etiqueta_cliente || (filtros.id_tipo ?? null) !== null)

  const chats = useQuery({
    queryKey: ['chats', bandeja, busquedaDiferida, filtros],
    queryFn: () => leerChats(bandeja, busquedaDiferida, filtros),
  })
  const contadores = useQuery({
    queryKey: ['chats-contadores'],
    queryFn: leerContadoresChat,
  })

  const cerrados = useQuery({
    queryKey: ['chats', 'finalizados', '', {}],
    queryFn: () => leerChats('finalizados', '', {}),
    staleTime: 60_000,
  })
  const archivados = cerrados.data?.length ?? 0

  const insignia: Partial<Record<BandejaChat, number>> = {
    no_leidos: contadores.data?.mensajes_no_leidos,
    pendientes: contadores.data?.falta_responder,
  }

  const enArchivados = bandeja === 'finalizados'

  return (
    <aside className={cn('flex min-h-0 flex-col border-r border-[var(--wa-borde)] bg-[var(--wa-cabecera)]', className)}>
      <div className="space-y-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div className="flex h-10 items-center gap-1">
          {enArchivados ? (
            <button
              type="button"
              onClick={() => setBandeja('activos')}
              className="-ml-1 flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06]"
              aria-label="Volver a chats"
            >
              <ArrowLeft className="size-6" strokeWidth={1.8} />
            </button>
          ) : (
            <Link
              to="/panel"
              className="-ml-1 flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06] md:hidden"
              title="Volver al CRM"
              aria-label="Volver al CRM"
            >
              <LayoutDashboard className="size-5" />
            </Link>
          )}
          <p className={cn('text-[var(--wa-texto)]', enArchivados ? 'text-[16px] font-medium' : 'text-[22px] font-bold tracking-[-0.01em]')}>
            {enArchivados ? 'Archivados' : 'WhatsApp'}
          </p>
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06] data-[popup-open]:bg-black/[0.08]"
                    aria-label="Menú"
                    title="Menú"
                  />
                }
              >
                <IconoMenu className="size-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Filtros CRM</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setMostrarFiltros((v) => !v)}
                  className={cn(hayFiltros && 'text-[var(--wa-verde)]')}
                >
                  <ListFilter />
                  {mostrarFiltros ? 'Ocultar filtros' : 'Etapa, tipo y etiqueta'}
                </DropdownMenuItem>
                {hayFiltros ? (
                  <DropdownMenuItem onClick={() => setFiltros({})}>
                    <X />
                    Quitar filtros
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <div className="space-y-2 px-2 py-1.5">
                  <LimitesPlan compacto />
                  <AvisoMeta compacto />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setBandeja('finalizados')}>
                  <IconoArchivados className="size-4" />
                  Archivados (cerrados)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navegar('/panel')}>
                  <LayoutDashboard />
                  Ir al CRM
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => navegar('/clientes')}
              className="flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06]"
              aria-label="Nuevo chat"
              title="Nuevo chat"
            >
              <IconoNuevoChat className="size-6" />
            </button>
          </div>
        </div>

        <div className="relative" data-tour="buscar-chat">
          <IconoBuscar className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--wa-muted)]" />
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder={enArchivados ? 'Buscar en archivados' : 'Buscar un chat o iniciar uno nuevo'}
            className="h-10 w-full rounded-full border border-transparent bg-[var(--wa-buscar)] pr-10 pl-12 text-[15px] text-[var(--wa-texto)] outline-none placeholder:text-[var(--wa-muted)] focus:border-[var(--wa-verde)] focus:bg-[var(--wa-cabecera)]"
            aria-label="Buscar conversación"
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--wa-muted)] hover:text-[var(--wa-texto)]"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {mostrarFiltros ? (
          <div className="grid gap-1.5 rounded-xl bg-[var(--wa-panel)] p-2">
            <select
              aria-label="Etapa"
              className={CLASE_FILTRO}
              value={filtros.id_etapa ?? ''}
              onChange={(e) => setFiltros({ ...filtros, id_etapa: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Todas las etapas</option>
              {ajustes.data?.etapas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nombre}
                </option>
              ))}
            </select>
            <select
              aria-label="Tipo de cliente"
              className={CLASE_FILTRO}
              value={filtros.id_tipo ?? ''}
              onChange={(e) => setFiltros({ ...filtros, id_tipo: e.target.value === '' ? null : Number(e.target.value) })}
            >
              <option value="">Todos los tipos</option>
              {ajustes.data?.tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
              <option value="0">Sin tipo</option>
            </select>
            <select
              aria-label="Etiqueta del cliente"
              className={CLASE_FILTRO}
              value={filtros.id_etiqueta_cliente ?? ''}
              onChange={(e) => setFiltros({ ...filtros, id_etiqueta_cliente: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Todas las etiquetas</option>
              {ajustes.data?.etiquetas.map((etiqueta) => (
                <option key={etiqueta.id} value={etiqueta.id}>
                  {etiqueta.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {enArchivados ? null : (
          <div className="flex items-center gap-2 overflow-x-auto" data-tour="bandejas-chat">
            {BANDEJAS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setBandeja(opcion.id)}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[14px] transition-colors',
                  bandeja === opcion.id
                    ? 'border-[var(--wa-chip-borde)] bg-[var(--wa-chip-activo)] font-medium text-[var(--wa-texto)]'
                    : 'border-[var(--wa-chip-borde)] text-[var(--wa-icono)] hover:bg-black/[0.04]',
                )}
              >
                {opcion.titulo}
                {insignia[opcion.id] ? <span>{insignia[opcion.id]}</span> : null}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMostrarFiltros((v) => !v)}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--wa-chip-borde)] text-[var(--wa-icono)] hover:bg-black/[0.04]',
                (mostrarFiltros || hayFiltros) && 'bg-[var(--wa-chip-activo)] text-[var(--wa-texto)]',
              )}
              aria-label="Filtros CRM"
              title="Filtros CRM: etapa, tipo y etiqueta"
            >
              <Plus className="size-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" data-tour="lista-chats">
        {enArchivados ? null : (
          <button
            type="button"
            onClick={() => setBandeja('finalizados')}
            className="flex h-12 w-full items-center gap-4 rounded-lg px-3 text-left hover:bg-[var(--wa-hover)]"
          >
            <span className="flex w-[49px] justify-center text-[var(--wa-icono)]">
              <IconoArchivados className="size-5" />
            </span>
            <span className="flex-1 text-[16px] text-[var(--wa-texto)]">Archivados</span>
            {archivados ? <span className="pr-1 text-[12px] text-[var(--wa-muted)]">{archivados}</span> : null}
          </button>
        )}
        {chats.isLoading ? (
          <CargandoLista />
        ) : chats.isError ? (
          <p className="p-6 text-center text-sm text-destructive">{chats.error.message}</p>
        ) : chats.data?.length ? (
          <ul>
            {chats.data.map((chat) => (
              <ItemChat key={chat.id} chat={chat} activo={chat.id === seleccionado} alElegir={() => alSeleccionar(chat)} />
            ))}
          </ul>
        ) : (
          <ListaVacia filtrando={busquedaDiferida.trim() !== '' || hayFiltros} bandeja={bandeja} />
        )}
      </div>
    </aside>
  )
}

type PropsItem = { chat: ConversacionChat; activo: boolean; alElegir: () => void; detalle?: ReactNode }

export function ItemChat({ chat, activo, alElegir, detalle }: PropsItem) {
  const nombre = nombreContacto(chat)
  const noLeidos = Number(chat.mensajes_no_leidos) || 0
  const espera = chat.id_estado !== 2 && chat.ultimo_mensaje_contesta === 'cliente' ? tiempoEspera(chat.ultimo_mensaje_fecha) : null
  const estado = Number(chat.ultimo_mensaje_id_estado ?? 0)
  const mio = chat.ultimo_mensaje_contesta && chat.ultimo_mensaje_contesta !== 'cliente'

  return (
    <li>
      <button
        type="button"
        onClick={alElegir}
        className={cn(
          'flex h-[72px] w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-[var(--wa-hover)]',
          activo && 'bg-[var(--wa-seleccion)] hover:bg-[var(--wa-seleccion)]',
        )}
      >
        <span className="relative shrink-0">
          <AvatarWa nombre={nombre} className="size-[49px]" />
          {detalle ? <span className="absolute -right-0.5 -bottom-0.5">{detalle}</span> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[17px] leading-[21px] text-[var(--wa-texto)]">{nombre}</span>
            <span
              className={cn(
                'shrink-0 text-[12px] leading-[14px]',
                noLeidos ? 'font-medium text-[var(--wa-badge)]' : 'text-[var(--wa-muted)]',
              )}
            >
              {fechaLista(chat.ultimo_mensaje_fecha)}
            </span>
          </div>
          <div className="mt-[3px] flex items-center justify-between gap-2">
            <span
              className={cn(
                'flex min-w-0 items-center gap-1 truncate text-[14px] leading-5',
                noLeidos ? 'font-medium text-[var(--wa-texto)]' : 'text-[var(--wa-muted)]',
              )}
            >
              {mio ? <IconoTick estado={estado} /> : null}
              <span className="truncate">{vistaPrevia(chat)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {espera ? (
                <span title={`Cliente esperando ${espera.texto}`} className={espera.claseTexto}>
                  <Clock3 className="size-[15px]" strokeWidth={2.2} />
                </span>
              ) : null}
              {chat.etapa_nombre ? (
                <span title={`Etapa: ${chat.etapa_nombre}`}>
                  <IconoEtiqueta className="size-[18px]" style={{ color: chat.etapa_color || '#8696a0' }} />
                </span>
              ) : null}
              {noLeidos ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--wa-badge)] px-1.5 text-[12px] font-semibold text-white">
                  {noLeidos > 99 ? '99+' : noLeidos}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </button>
    </li>
  )
}

function IconoTick({ estado }: { estado: number }) {
  if (estado === 4) return <IconoTickDoble className="h-[11px] w-4 shrink-0 text-[#53bdeb]" />
  if (estado === 3) return <IconoTickDoble className="h-[11px] w-4 shrink-0 text-[var(--wa-muted)]" />
  if (estado <= 1) return <Clock3 className="size-3 shrink-0 text-[var(--wa-muted)]" aria-hidden />
  return <IconoTickSimple className="h-[11px] w-3 shrink-0 text-[var(--wa-muted)]" />
}

export function CargandoLista() {
  return (
    <div className="space-y-1 p-3">
      {Array.from({ length: 7 }, (_, indice) => (
        <div key={indice} className="flex items-center gap-3 py-2">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function tiempoEspera(valor: string | null): { texto: string; claseTexto: string } | null {
  const fecha = leerFecha(valor)
  if (!fecha) return null
  const minutos = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 60_000))
  const texto =
    minutos < 1 ? 'Ahora' : minutos < 60 ? `${minutos} min` : minutos < 1440 ? `${Math.floor(minutos / 60)} h` : `${Math.floor(minutos / 1440)} d`
  const claseTexto =
    minutos < 15 ? 'text-emerald-600' : minutos < 60 ? 'text-amber-600' : 'text-rose-600'
  return { texto, claseTexto }
}

const CLASE_FILTRO =
  'h-8 w-full rounded-lg border-0 bg-white px-3 text-xs text-[var(--wa-texto)] outline-none dark:bg-[#2a3942]'

const VACIO: Record<BandejaChat, string> = {
  activos: 'Sin chats todavía',
  no_leidos: 'Todo leído',
  pendientes: 'Nada pendiente',
  finalizados: 'Sin chats cerrados',
}

function ListaVacia({ filtrando, bandeja }: { filtrando: boolean; bandeja: BandejaChat }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-[var(--wa-muted)]">
      <MessagesSquare className="size-5" />
      {filtrando ? 'Sin resultados' : VACIO[bandeja]}
    </div>
  )
}
