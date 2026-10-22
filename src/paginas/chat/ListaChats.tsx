import { useQuery } from '@tanstack/react-query'
import { CheckCheck, ListFilter, MessagesSquare, Search, X } from 'lucide-react'
import { useDeferredValue, useState, type ReactNode } from 'react'
import { leerChats, leerContadoresChat, type BandejaChat, type ConversacionChat, type FiltrosChat } from '@/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAjustesCrm } from '../clientes/crm'
import { fechaLista, iniciales, nombreContacto, vistaPrevia } from './formato'

const BANDEJAS: { id: BandejaChat; titulo: string }[] = [
  { id: 'activos', titulo: 'Activos' },
  { id: 'no_leidos', titulo: 'No leídos' },
  { id: 'pendientes', titulo: 'Por responder' },
  { id: 'finalizados', titulo: 'Finalizados' },
]

type Props = {
  seleccionado: number | null
  alSeleccionar: (chat: ConversacionChat) => void
  className?: string
}

export function ListaChats({ seleccionado, alSeleccionar, className }: Props) {
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

  const insignia: Partial<Record<BandejaChat, number>> = {
    no_leidos: contadores.data?.mensajes_no_leidos,
    pendientes: contadores.data?.falta_responder,
  }

  return (
    <aside className={cn('flex min-h-0 flex-col border-r border-[var(--wa-borde)] bg-white', className)}>
      <div className="space-y-2.5 bg-[var(--wa-panel)] px-3 py-2.5">
        <p className="px-1 pt-1 text-[19px] font-medium">Chats</p>
        <div className="flex gap-1.5">
          <div className="relative min-w-0 flex-1" data-tour="buscar-chat">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--wa-muted)]" />
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar un chat"
              className="h-9 w-full rounded-full bg-white pr-3 pl-9 text-sm text-[var(--wa-texto)] outline-none placeholder:text-[var(--wa-muted)]"
              aria-label="Buscar conversación"
            />
          </div>
          <button
            type="button"
            onClick={() => setMostrarFiltros((v) => !v)}
            className={cn(
              'relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wa-muted)] hover:bg-white/80',
              (mostrarFiltros || hayFiltros) && 'text-[var(--wa-verde)]',
            )}
            aria-label="Filtros del listado"
            aria-expanded={mostrarFiltros}
          >
            <ListFilter className="size-4" />
            {hayFiltros ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[var(--wa-verde)]" /> : null}
          </button>
        </div>
        {mostrarFiltros ? (
          <div className="grid gap-1.5">
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
            {hayFiltros ? (
              <button
                type="button"
                onClick={() => setFiltros({})}
                className="inline-flex items-center gap-1 px-1 py-0.5 text-xs text-[var(--wa-muted)] hover:text-[var(--wa-texto)]"
              >
                <X className="size-3" />
                Quitar filtros
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" data-tour="bandejas-chat">
          {BANDEJAS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => setBandeja(opcion.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                bandeja === opcion.id
                  ? 'bg-[var(--wa-verde)] text-white'
                  : 'bg-white text-[var(--wa-muted)] hover:bg-white/80',
              )}
            >
              {opcion.titulo}
              {insignia[opcion.id] ? (
                <span
                  className={cn(
                    'min-w-4 rounded-full px-1 text-[10px] leading-4',
                    bandeja === opcion.id ? 'bg-white/25' : 'bg-[var(--wa-badge)] text-white',
                  )}
                >
                  {insignia[opcion.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white" data-tour="lista-chats">
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

  return (
    <li>
      <button
        type="button"
        onClick={alElegir}
        className={cn(
          'flex w-full items-center gap-3 border-b border-[var(--wa-borde)] px-3 py-3 text-left transition-colors hover:bg-[var(--wa-hover)]',
          activo && 'bg-[var(--wa-seleccion)] hover:bg-[var(--wa-seleccion)]',
        )}
      >
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="bg-[#dfe5e7] text-sm font-medium text-[#54656f] dark:bg-[#2a3942] dark:text-[#aebac1]">{iniciales(nombre)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[15px] font-medium">{nombre}</span>
            <span
              className={cn(
                'shrink-0 text-[11px]',
                noLeidos ? 'font-medium text-[var(--wa-verde)]' : 'text-[var(--wa-muted)]',
              )}
            >
              {fechaLista(chat.ultimo_mensaje_fecha)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span
              className={cn(
                'flex min-w-0 items-center gap-1 truncate text-[13px]',
                noLeidos ? 'font-medium text-[var(--wa-texto)]' : 'text-[var(--wa-muted)]',
              )}
            >
              {chat.ultimo_mensaje_contesta && chat.ultimo_mensaje_contesta !== 'cliente' ? (
                <CheckCheck className="size-3.5 shrink-0 text-[var(--wa-muted)]" aria-hidden />
              ) : null}
              <span className="truncate">{vistaPrevia(chat)}</span>
            </span>
            {noLeidos ? (
              <span className="flex h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-full bg-[var(--wa-badge)] px-1 text-[11px] font-semibold text-white">
                {noLeidos > 99 ? '99+' : noLeidos}
              </span>
            ) : null}
          </div>
          {chat.etapa_nombre || chat.tipo_nombre || chat.etiqueta_nombre ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {chat.etapa_nombre ? <Chip color={chat.etapa_color}>{chat.etapa_nombre}</Chip> : null}
              {chat.tipo_nombre ? <Chip color={chat.tipo_color}>{chat.tipo_nombre}</Chip> : null}
              {chat.etiqueta_nombre ? <Chip color={chat.etiqueta_color}>{chat.etiqueta_nombre}</Chip> : null}
            </div>
          ) : null}
          {detalle}
        </div>
      </button>
    </li>
  )
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

const CLASE_FILTRO =
  'h-8 w-full rounded-full border-0 bg-white px-3 text-xs text-[var(--wa-texto)] outline-none'

function Chip({ color, children }: { color: string | null; children: ReactNode }) {
  return (
    <span
      className="inline-flex max-w-full truncate rounded px-1.5 text-[10px] font-medium leading-4 text-white"
      style={{ backgroundColor: color || '#667781' }}
    >
      {children}
    </span>
  )
}

const VACIO: Record<BandejaChat, string> = {
  activos: 'Sin chats activos',
  no_leidos: 'Todo leído',
  pendientes: 'Nada pendiente',
  finalizados: 'Sin chats finalizados',
}

function ListaVacia({ filtrando, bandeja }: { filtrando: boolean; bandeja: BandejaChat }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-[var(--wa-muted)]">
      <MessagesSquare className="size-5" />
      {filtrando ? 'Sin resultados' : VACIO[bandeja]}
    </div>
  )
}
