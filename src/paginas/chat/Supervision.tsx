import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, Eye, Hand, Loader2, Search, UserRound } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  leerAsesores,
  leerSupervision,
  transferirChat,
  type ConversacionSupervision,
  type EstadoSupervision,
} from '@/api'
import { CampoSelect } from '@/components/Campo'
import { AvisoMeta } from '@/components/layout/AvisoMeta'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'
import { CargandoLista, ItemChat } from './ListaChats'
import { PanelConversacion } from './PanelConversacion'

const ESTADOS: { id: EstadoSupervision; titulo: string }[] = [
  { id: 'activos', titulo: 'En curso' },
  { id: 'sin_responder', titulo: 'Esperando respuesta' },
  { id: 'finalizados', titulo: 'Finalizados' },
]

const ESTADO_FINALIZADA = 2

function quienAtiende(chat: ConversacionSupervision): string {
  if (Number(chat.usuario_es_bot) === 1) {
    return 'Respuestas automáticas'
  }
  return chat.asesor_nombre || chat.asesor_usuario || 'Sin asignar'
}

function inicialesAsesor(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function FotoAsesor({ chat, mio }: { chat: ConversacionSupervision; mio: boolean }) {
  const nombre = mio ? 'Tú' : quienAtiende(chat)
  return (
    <Avatar className="size-5 shrink-0">
      {chat.asesor_foto && !mio ? <AvatarImage src={chat.asesor_foto} alt={nombre} /> : null}
      <AvatarFallback className="bg-[#dfe5e7] text-[9px] font-medium text-[#54656f] dark:bg-[#2a3942] dark:text-[#aebac1]">
        {mio ? 'Tú' : inicialesAsesor(nombre) || <UserRound className="size-3" />}
      </AvatarFallback>
    </Avatar>
  )
}

export function Supervision() {
  const usuario = leerSesion()?.usuario
  const [parametros, setParametros] = useSearchParams()
  const seleccionado = Number(parametros.get('c')) || null
  const [estado, setEstado] = useState<EstadoSupervision>('activos')
  const [idAsesor, setIdAsesor] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const busquedaDiferida = useDeferredValue(busqueda)
  const [transfiriendo, setTransfiriendo] = useState(false)
  const consultas = useQueryClient()

  const admin = esAdministrador(usuario)
  const chats = useQuery({
    queryKey: ['supervision', estado, idAsesor, busquedaDiferida],
    queryFn: () => leerSupervision({ estado, idUsuario: idAsesor, busqueda: busquedaDiferida }),
    enabled: admin,
    refetchInterval: 4_000,
  })
  const asesores = useQuery({ queryKey: ['asesores'], queryFn: leerAsesores, enabled: admin })

  const chat = chats.data?.find((item) => item.id === seleccionado)
  const esMio = chat ? Number(chat.id_usuario) === usuario?.id : false
  const abierto = chat ? Number(chat.id_estado) !== ESTADO_FINALIZADA : false

  const refrescar = () => {
    consultas.invalidateQueries({ queryKey: ['supervision'] })
    consultas.invalidateQueries({ queryKey: ['chats'] })
    if (seleccionado) {
      consultas.invalidateQueries({ queryKey: ['conversacion', seleccionado] })
    }
  }

  const tomar = useMutation({
    mutationFn: () => transferirChat(seleccionado!, usuario!.id),
    onSuccess: () => {
      avisoExito('Ahora el chat es tuyo')
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo tomar el chat'),
  })

  if (!admin) {
    return <Navigate to="/chats" replace />
  }

  return (
    <div className="chat-wa flex min-h-0 flex-1 overflow-hidden bg-white">
      <aside
        className={cn(
          'flex min-h-0 w-full flex-col border-r border-[var(--wa-borde)] bg-white md:w-80 md:shrink-0 lg:w-96',
          seleccionado && 'hidden md:flex',
        )}
      >
        <div className="space-y-2.5 bg-[var(--wa-panel)] px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-1">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <p className="px-1 text-[19px] font-medium">Supervisión</p>
            <AvisoMeta compacto className="ml-auto md:hidden" />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--wa-muted)]" />
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar cliente o teléfono"
              className="h-9 w-full rounded-full bg-white pr-3 pl-9 text-sm text-[var(--wa-texto)] outline-none placeholder:text-[var(--wa-muted)]"
              aria-label="Buscar conversación"
            />
          </div>
          <select
            value={idAsesor ?? 0}
            onChange={(evento) => setIdAsesor(Number(evento.target.value) || null)}
            className="h-9 w-full rounded-lg bg-white px-3 text-sm text-[var(--wa-texto)] outline-none"
            aria-label="Filtrar por asesor"
          >
            <option value={0}>Todo el equipo</option>
            {usuario ? <option value={usuario.id}>Yo</option> : null}
            {asesores.data
              ?.filter((asesor) => asesor.id !== usuario?.id)
              .map((asesor) => (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.nombre || asesor.usuario}
                </option>
              ))}
          </select>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {ESTADOS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setEstado(opcion.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  estado === opcion.id ? 'bg-[var(--wa-verde)] text-white' : 'bg-white text-[var(--wa-muted)] hover:bg-white/80',
                )}
              >
                {opcion.titulo}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {chats.isLoading ? (
            <CargandoLista />
          ) : chats.isError ? (
            <p className="p-6 text-center text-sm text-destructive">{chats.error.message}</p>
          ) : chats.data?.length ? (
            <ul>
              {chats.data.map((item) => (
                <ItemChat
                  key={item.id}
                  chat={item}
                  activo={item.id === seleccionado}
                  alElegir={() => setParametros({ c: String(item.id) })}
                  detalle={
                    <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[var(--wa-muted)]">
                      <FotoAsesor chat={item} mio={Number(item.id_usuario) === usuario?.id} />
                      <span className="truncate">
                        {Number(item.id_usuario) === usuario?.id ? 'Lo atiendes tú' : quienAtiende(item)}
                      </span>
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-14 text-center text-sm text-[var(--wa-muted)]">
              {busquedaDiferida.trim() !== '' ? 'Sin resultados' : 'No hay conversaciones con este filtro'}
            </p>
          )}
        </div>
      </aside>

      {seleccionado ? (
        <PanelConversacion
          key={seleccionado}
          idConversacion={seleccionado}
          alVolver={() => setParametros({})}
          className="min-h-0 flex-1"
          supervision
          acciones={
            chat && abierto ? (
              <>
                {!esMio ? (
                  <Button
                    size="icon"
                    className="bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde)]/90 sm:h-7 sm:w-auto sm:px-2.5"
                    disabled={tomar.isPending}
                    onClick={() => tomar.mutate()}
                  >
                    {tomar.isPending ? <Loader2 className="animate-spin" /> : <Hand />}
                    <span className="hidden sm:inline">Tomar chat</span>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[var(--wa-borde)] bg-white text-[var(--wa-texto)] hover:bg-white/80 sm:h-7 sm:w-auto sm:px-2.5"
                  onClick={() => setTransfiriendo(true)}
                >
                  <ArrowRightLeft /> <span className="hidden sm:inline">Pasar a…</span>
                </Button>
              </>
            ) : null
          }
          aviso={
            chat && abierto && !esMio ? (
              <p className="flex min-w-0 items-start gap-2 border-t border-[var(--wa-borde)] bg-[#fff8e6] px-3 py-2 text-[12px] leading-snug text-[#7a5b00] dark:bg-[#2a2614] dark:text-[#e6cf8a]">
                <FotoAsesor chat={chat} mio={false} />
                <span className="min-w-0 flex-1">
                  Lo atiende <strong className="font-medium">{quienAtiende(chat)}</strong>.
                  <span className="hidden sm:inline"> Si escribes aquí, el cliente recibe tu mensaje.</span>
                </span>
              </p>
            ) : null
          }
        />
      ) : (
        <div className="chat-wa-fondo hidden flex-1 flex-col items-center justify-center gap-3 px-8 text-center md:flex">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/80 text-[var(--wa-verde)] shadow-sm">
            <Eye className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-[var(--wa-texto)]">Supervisión</p>
            <p className="max-w-sm text-sm text-[var(--wa-muted)]">
              Abre un chat para leerlo sin marcarlo como leído. Puedes responder, tomarlo o pasarlo a otra persona.
            </p>
          </div>
        </div>
      )}

      {chat ? (
        <DialogoTransferir
          abierto={transfiriendo}
          chat={chat}
          alCerrar={() => setTransfiriendo(false)}
          alTransferir={() => {
            setTransfiriendo(false)
            refrescar()
          }}
        />
      ) : null}
    </div>
  )
}

type PropsTransferir = {
  abierto: boolean
  chat: ConversacionSupervision
  alCerrar: () => void
  alTransferir: () => void
}

function DialogoTransferir({ abierto, chat, alCerrar, alTransferir }: PropsTransferir) {
  const [destino, setDestino] = useState(0)
  const asesores = useQuery({ queryKey: ['asesores'], queryFn: leerAsesores, enabled: abierto })
  const opciones = asesores.data?.filter((asesor) => asesor.activo && asesor.id !== Number(chat.id_usuario)) ?? []

  const envio = useMutation({
    mutationFn: () => transferirChat(chat.id, destino),
    onSuccess: () => {
      avisoExito('Chat transferido')
      setDestino(0)
      alTransferir()
    },
    onError: (error) => avisoError(error, 'No se pudo transferir'),
  })

  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pasar chat a otra persona</DialogTitle>
          <DialogDescription>Ahora lo atiende {quienAtiende(chat)}.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            envio.mutate()
          }}
        >
          <CampoSelect etiqueta="Asesor" value={destino} onChange={(evento) => setDestino(Number(evento.target.value))} required>
            <option value={0} disabled>
              {asesores.isLoading ? 'Cargando…' : opciones.length ? 'Elige a quién' : 'No hay otros asesores activos'}
            </option>
            {opciones.map((asesor) => (
              <option key={asesor.id} value={asesor.id}>
                {asesor.nombre || asesor.usuario}
                {asesor.chats_abiertos ? ` · ${asesor.chats_abiertos} abiertos` : ''}
              </option>
            ))}
          </CampoSelect>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={envio.isPending || destino === 0}>
              {envio.isPending ? <Loader2 className="animate-spin" /> : null}
              Transferir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
