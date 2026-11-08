import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Clock3,
  Copy,
  LoaderCircle,
  Mail,
  MapPin,
  MessagesSquare,
  NotebookPen,
  PencilLine,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import {
  actualizarClienteCrm,
  leerFichaCliente,
  leerPedidosCatalogo,
  type AjustesCrm,
  type CambiosCliente,
  type FichaCliente,
} from '@/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError } from '@/lib/avisos'
import { usePantallaAncha } from '@/hooks/use-pantalla-ancha'
import { cn } from '@/lib/utils'
import { CLAVE_CRM, haceCuanto } from '../clientes/crm'
import { iniciales, leerFecha } from './formato'

const VENTANA_MS = 24 * 60 * 60 * 1000

const ESTADOS_CHAT: Record<number, { texto: string; color: string }> = {
  1: { texto: 'En atención', color: '#10b981' },
  2: { texto: 'Finalizado', color: '#94a3b8' },
  3: { texto: 'Sin abrir', color: '#f59e0b' },
}

const ESTADOS_PEDIDO: Record<string, { texto: string; clase: string }> = {
  nuevo: { texto: 'Nuevo', clase: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
  atendido: { texto: 'Atendido', clase: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' },
  cerrado: { texto: 'Cerrado', clase: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
}

type Props = {
  idCliente: number
  ajustes: AjustesCrm | undefined
  ultimoMensajeCliente: string | null
  abierto: boolean
  alCerrar: () => void
  alEditarFicha: () => void
}

/** Datos del cliente junto al chat: en pantallas anchas va fijo a la derecha, en las demás como hoja lateral. */
export function PanelCliente(props: Props) {
  const ancha = usePantallaAncha()

  if (ancha) {
    return props.abierto ? (
      <aside className="hidden w-[22rem] shrink-0 flex-col border-l border-[var(--wa-borde)] bg-[var(--wa-panel)] xl:flex">
        <ContenidoPanel {...props} />
      </aside>
    ) : null
  }

  return (
    <Sheet open={props.abierto} onOpenChange={(abrir) => (abrir ? null : props.alCerrar())}>
      <SheetContent className="chat-wa w-full gap-0 bg-[var(--wa-panel)] p-0 sm:max-w-sm" showCloseButton={false}>
        <SheetTitle className="sr-only">Datos del cliente</SheetTitle>
        <SheetDescription className="sr-only">Etapa, etiquetas, notas y pedidos del cliente.</SheetDescription>
        <ContenidoPanel {...props} />
      </SheetContent>
    </Sheet>
  )
}

function ContenidoPanel({ idCliente, ajustes, ultimoMensajeCliente, alCerrar, alEditarFicha }: Props) {
  const consultas = useQueryClient()
  const clave = [...CLAVE_CRM, 'ficha', idCliente]
  const ficha = useQuery({ queryKey: clave, queryFn: () => leerFichaCliente(idCliente) })
  const pedidos = useQuery({
    queryKey: ['catalogo-pedidos', 'cliente', idCliente],
    queryFn: () => leerPedidosCatalogo(idCliente),
    retry: false,
    staleTime: 30_000,
  })

  const guardar = useMutation({
    mutationFn: (cambios: CambiosCliente) => actualizarClienteCrm(idCliente, cambios),
    onMutate: async (cambios) => {
      await consultas.cancelQueries({ queryKey: clave })
      const previo = consultas.getQueryData<FichaCliente>(clave)
      if (previo) {
        consultas.setQueryData<FichaCliente>(clave, {
          ...previo,
          ...('id_etapa' in cambios ? { id_etapa: cambios.id_etapa ?? null } : {}),
          ...('id_tipo' in cambios ? { id_tipo: cambios.id_tipo ?? null } : {}),
          ...('notas' in cambios ? { notas: cambios.notas ?? null } : {}),
          ...(cambios.etiquetas && ajustes
            ? { etiquetas: ajustes.etiquetas.filter((e) => cambios.etiquetas!.includes(e.id)) }
            : {}),
        })
      }
      return { previo }
    },
    onError: (error, _cambios, contexto) => {
      if (contexto?.previo) consultas.setQueryData(clave, contexto.previo)
      avisoError(error, 'No se pudo guardar')
    },
    onSettled: () => {
      consultas.invalidateQueries({ queryKey: CLAVE_CRM })
      consultas.invalidateQueries({ queryKey: ['chats'] })
      consultas.invalidateQueries({ queryKey: ['supervision'] })
    },
  })

  const datos = ficha.data
  const nombre = datos?.nombre || datos?.telefono || 'Cliente'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--wa-borde)] px-4 py-3">
        <p className="text-[15px] font-medium">Datos del cliente</p>
        <button
          type="button"
          onClick={alCerrar}
          className="flex size-8 items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-black/5"
          aria-label="Cerrar panel"
        >
          <X className="size-4" />
        </button>
      </div>

      {!datos ? (
        <div className="space-y-3 p-4">
          <Skeleton className="mx-auto size-16 rounded-full" />
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <section className="rounded-xl bg-white p-4 text-center shadow-sm">
            <Avatar className="mx-auto size-16">
              <AvatarFallback className="bg-[#dfe5e7] text-lg font-medium text-[#54656f] dark:bg-[#2a3942] dark:text-[#aebac1]">
                {iniciales(nombre)}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 truncate text-base font-semibold">{nombre}</p>
            {datos.telefono ? <Telefono numero={datos.telefono} /> : null}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px]">
              <span className="rounded-full bg-[var(--wa-panel)] px-2 py-0.5 text-[var(--wa-muted)]">{ORIGEN[datos.origen] ?? 'WhatsApp'}</span>
              {datos.creado ? (
                <span className="rounded-full bg-[var(--wa-panel)] px-2 py-0.5 text-[var(--wa-muted)]">
                  Cliente desde {fechaCorta(datos.creado)}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={alEditarFicha}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--wa-borde)] px-3 py-1 text-xs font-medium text-[var(--wa-texto)] hover:bg-black/5"
            >
              <PencilLine className="size-3.5" />
              Editar ficha
            </button>
          </section>

          <VentanaWhatsapp ultimoMensaje={ultimoMensajeCliente ?? datos.ultimo_mensaje_cliente} />

          {ajustes?.etapas.length ? (
            <Tarjeta titulo="Etapa del embudo">
              <div className="grid gap-1">
                {ajustes.etapas.map((etapa) => {
                  const activa = datos.id_etapa === etapa.id
                  return (
                    <button
                      key={etapa.id}
                      type="button"
                      onClick={() => !activa && guardar.mutate({ id_etapa: etapa.id })}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors',
                        activa ? 'font-medium text-white' : 'text-[var(--wa-texto)] hover:bg-black/5',
                      )}
                      style={activa ? { backgroundColor: etapa.color } : undefined}
                    >
                      <span
                        className={cn('size-2 shrink-0 rounded-full', activa && 'bg-white')}
                        style={activa ? undefined : { backgroundColor: etapa.color }}
                      />
                      <span className="min-w-0 flex-1 truncate">{etapa.nombre}</span>
                      {activa ? <Check className="size-3.5" /> : null}
                    </button>
                  )
                })}
              </div>
            </Tarjeta>
          ) : null}

          {ajustes?.tipos.length ? (
            <Tarjeta titulo="Tipo de cliente">
              <div className="flex flex-wrap gap-1.5">
                {ajustes.tipos.map((tipo) => {
                  const activo = datos.id_tipo === tipo.id
                  return (
                    <Pastilla
                      key={tipo.id}
                      color={tipo.color}
                      activa={activo}
                      onClick={() => guardar.mutate({ id_tipo: activo ? null : tipo.id })}
                    >
                      {tipo.nombre}
                    </Pastilla>
                  )
                })}
              </div>
            </Tarjeta>
          ) : null}

          {ajustes?.etiquetas.length ? (
            <Tarjeta titulo="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {ajustes.etiquetas.map((etiqueta) => {
                  const ids = datos.etiquetas.map((e) => e.id)
                  const activa = ids.includes(etiqueta.id)
                  return (
                    <Pastilla
                      key={etiqueta.id}
                      color={etiqueta.color}
                      activa={activa}
                      onClick={() =>
                        guardar.mutate({ etiquetas: activa ? ids.filter((id) => id !== etiqueta.id) : [...ids, etiqueta.id] })
                      }
                    >
                      {etiqueta.nombre}
                    </Pastilla>
                  )
                })}
              </div>
            </Tarjeta>
          ) : null}

          <Notas key={datos.id} inicial={datos.notas ?? ''} alGuardar={(notas) => guardar.mutateAsync({ notas })} />

          <Tarjeta titulo="Contacto">
            <ul className="grid gap-2 text-[13px]">
              <Dato icono={<Mail className="size-3.5" />} valor={datos.correo} vacio="Sin correo" />
              <Dato icono={<MapPin className="size-3.5" />} valor={datos.distrito} vacio="Sin ubicación" />
              <Dato icono={<UserRound className="size-3.5" />} valor={datos.asesor_nombre} vacio="Sin responsable" />
            </ul>
          </Tarjeta>

          {pedidos.data?.length ? (
            <Tarjeta titulo="Pedidos" icono={<ShoppingBag className="size-3.5" />} extra={`${pedidos.data.length}`}>
              <ul className="grid gap-2">
                {pedidos.data.slice(0, 5).map((pedido) => {
                  const estado = ESTADOS_PEDIDO[pedido.estado] ?? ESTADOS_PEDIDO.nuevo
                  const unidades = pedido.items.reduce((suma, item) => suma + (Number(item.cantidad) || 0), 0)
                  return (
                    <li key={pedido.id} className="rounded-lg border border-[var(--wa-borde)] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">#{pedido.id}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', estado.clase)}>{estado.texto}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--wa-muted)]">
                        {pedido.items.map((item) => item.nombre).join(', ') || 'Sin productos'}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-[var(--wa-muted)]">
                          {unidades} {unidades === 1 ? 'unidad' : 'unidades'} · {haceCuanto(pedido.created_at).toLowerCase()}
                        </span>
                        {pedido.total != null ? (
                          <span className="font-semibold tabular-nums">
                            {pedido.moneda === 'PEN' ? 'S/' : pedido.moneda} {Number(pedido.total).toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Tarjeta>
          ) : null}

          {datos.conversaciones.length ? (
            <Tarjeta titulo="Historial" icono={<MessagesSquare className="size-3.5" />} extra={`${datos.conversaciones.length}`}>
              <ol className="relative grid gap-3 border-l border-[var(--wa-borde)] pl-4">
                {datos.conversaciones.slice(0, 6).map((conversacion) => {
                  const estado = ESTADOS_CHAT[conversacion.id_estado] ?? { texto: '—', color: '#94a3b8' }
                  return (
                    <li key={conversacion.id} className="relative">
                      <span
                        className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: estado.color }}
                      />
                      <p className="text-[13px] font-medium">{estado.texto}</p>
                      <p className="text-xs text-[var(--wa-muted)]">
                        {conversacion.asesor_nombre || 'Sin asesor'} · {haceCuanto(conversacion.updated_at ?? conversacion.created_at).toLowerCase()}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </Tarjeta>
          ) : null}
        </div>
      )}
    </div>
  )
}

const ORIGEN: Record<string, string> = {
  whatsapp: 'Llegó por WhatsApp',
  catalogo: 'Llegó por el catálogo',
  manual: 'Creado a mano',
  importado: 'Importado',
}

function Tarjeta({ titulo, icono, extra, children }: { titulo: string; icono?: ReactNode; extra?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--wa-muted)] uppercase">
        {icono}
        <span className="flex-1">{titulo}</span>
        {extra ? <span className="rounded-full bg-[var(--wa-panel)] px-1.5 text-[10px] normal-case">{extra}</span> : null}
      </div>
      {children}
    </section>
  )
}

function Pastilla({ color, activa, onClick, children }: { color: string; activa: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
        activa ? 'border-transparent text-white shadow-sm' : 'border-[var(--wa-borde)] text-[var(--wa-texto)] hover:bg-black/5',
      )}
      style={activa ? { backgroundColor: color } : undefined}
    >
      {activa ? <Check className="size-3" /> : <span className="size-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  )
}

function Dato({ icono, valor, vacio }: { icono: ReactNode; valor: string | null; vacio: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--wa-panel)] text-[var(--wa-muted)]">{icono}</span>
      <span className={cn('min-w-0 truncate', !valor && 'text-[var(--wa-muted)]')}>{valor || vacio}</span>
    </li>
  )
}

function Telefono({ numero }: { numero: string }) {
  const [copiado, setCopiado] = useState(false)
  const texto = `+${String(numero).replace(/^\+/, '')}`
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          window.setTimeout(() => setCopiado(false), 1500)
        } catch {
          avisoError(new Error('Tu navegador no dejó copiar.'), 'No se pudo copiar')
        }
      }}
      className="mx-auto mt-0.5 inline-flex items-center gap-1 rounded px-1.5 text-[13px] text-[var(--wa-muted)] tabular-nums hover:text-[var(--wa-texto)]"
      title="Copiar número"
    >
      {texto}
      {copiado ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
    </button>
  )
}

function VentanaWhatsapp({ ultimoMensaje }: { ultimoMensaje: string | null }) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(reloj)
  }, [])

  const fecha = leerFecha(ultimoMensaje)
  const restante = fecha ? VENTANA_MS - (ahora - fecha.getTime()) : 0
  const abierta = restante > 0
  const porcentaje = abierta ? Math.max(2, Math.round((restante / VENTANA_MS) * 100)) : 0
  const horas = Math.floor(restante / 3_600_000)
  const minutos = Math.floor((restante % 3_600_000) / 60_000)
  const poco = abierta && restante < 3 * 3_600_000

  return (
    <section className="rounded-xl bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            abierta ? (poco ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') : 'bg-slate-100 text-slate-500',
          )}
        >
          <Clock3 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">{abierta ? 'Puedes escribir libre' : 'Solo plantillas'}</p>
          <p className="text-xs text-[var(--wa-muted)]">
            {abierta
              ? `Quedan ${horas > 0 ? `${horas} h ` : ''}${minutos} min de las 24 h de WhatsApp`
              : 'Pasaron más de 24 h desde su último mensaje'}
          </p>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--wa-panel)]">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', poco ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </section>
  )
}

function Notas({ inicial, alGuardar }: { inicial: string; alGuardar: (notas: string) => Promise<unknown> }) {
  const [texto, setTexto] = useState(inicial)
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'guardado'>('quieto')
  const ultimo = useRef(inicial)

  async function guardar() {
    const limpio = texto.trim()
    if (limpio === ultimo.current.trim()) return
    setEstado('guardando')
    try {
      await alGuardar(limpio)
      ultimo.current = limpio
      setEstado('guardado')
      window.setTimeout(() => setEstado('quieto'), 1800)
    } catch {
      setEstado('quieto')
    }
  }

  return (
    <Tarjeta titulo="Notas internas" icono={<NotebookPen className="size-3.5" />}>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        maxLength={5000}
        rows={3}
        placeholder="Solo lo ve tu equipo. Ej.: prefiere entregas por la tarde."
        className="w-full resize-none rounded-lg border border-[var(--wa-borde)] bg-[var(--wa-panel)]/50 px-2.5 py-2 text-[13px] outline-none placeholder:text-[var(--wa-muted)] focus:border-[var(--wa-verde)]"
      />
      <p className="mt-1 flex h-4 items-center gap-1 text-[11px] text-[var(--wa-muted)]">
        {estado === 'guardando' ? (
          <>
            <LoaderCircle className="size-3 animate-spin" /> Guardando…
          </>
        ) : estado === 'guardado' ? (
          <>
            <Check className="size-3 text-emerald-600" /> Guardado
          </>
        ) : (
          'Se guarda al salir del campo'
        )}
      </p>
    </Tarjeta>
  )
}

function fechaCorta(valor: string) {
  const fecha = leerFecha(valor)
  return fecha ? fecha.toLocaleDateString('es', { month: 'short', year: 'numeric' }) : '—'
}
