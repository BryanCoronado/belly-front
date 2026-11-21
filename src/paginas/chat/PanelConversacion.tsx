import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
  Bell,
  BellOff,
  ChevronDown,
  CircleCheckBig,
  FileText,
  Lock,
  MessageCircleMore,
  UserRound,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { abrirChat, enviarMensaje, leerConversacion, leerMensajes, type ConversacionChat, type MensajeChat } from '@/api'
import { FichaCliente } from '../clientes/FichaCliente'
import { useAjustesCrm } from '../clientes/crm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoInfo } from '@/lib/avisos'
import { alternarSilencio, chatSilenciado } from '@/lib/preferencias-aviso'
import { useAvisos } from '@/hooks/use-avisos'
import { cn } from '@/lib/utils'
import { BurbujaMensaje, type CitaMensaje } from './BurbujaMensaje'
import { PanelCliente } from './PanelCliente'
import { DialogoFinalizar, DialogoPlantilla } from './Dialogos'
import { claveDia, etiquetaDia, leerFecha, nombreContacto, ventanaAbierta } from './formato'
import { aFormatoWhatsapp } from './textoWhatsapp'
import { Redactor, type CitaRedactor, type EnvioRedactor } from './Redactor'
import { AvatarWa, IconoBuscar, IconoLista, IconoLlamar, IconoMenu, IconoPlantilla } from './iconosWa'
import { ResumenBot } from './ResumenBot'

const ESTADO_FINALIZADA = 2
const DISTANCIA_PEGADO_ABAJO = 120

type Props = {
  idConversacion: number
  alVolver: () => void
  className?: string
  /** Quien supervisa mira sin marcar como leído: el asesor debe seguir viendo sus pendientes. */
  supervision?: boolean
  acciones?: ReactNode
  aviso?: ReactNode
}

export function PanelConversacion({ idConversacion, alVolver, className, supervision = false, acciones, aviso }: Props) {
  const consultas = useQueryClient()
  const claveMensajes = ['mensajes', idConversacion]
  const [dialogo, setDialogo] = useState<'plantilla' | 'finalizar' | null>(null)
  const [perfilAbierto, setPerfilAbierto] = useState(false)
  const [cita, setCita] = useState<CitaRedactor | null>(null)
  const prefs = useAvisos()
  const silenciado = prefs.silenciados.includes(idConversacion) || chatSilenciado(idConversacion)
  const ajustes = useAjustesCrm()

  const conversacion = useQuery({
    queryKey: ['conversacion', idConversacion],
    queryFn: () => leerConversacion(idConversacion),
    placeholderData: () => chatEnListas(consultas, idConversacion),
  })
  const mensajes = useQuery({
    queryKey: claveMensajes,
    queryFn: () => leerMensajes(idConversacion),
    refetchInterval: supervision ? 4_000 : false,
  })

  const refrescarListas = () => {
    consultas.invalidateQueries({ queryKey: ['chats'] })
    consultas.invalidateQueries({ queryKey: ['chats-contadores'] })
    consultas.invalidateQueries({ queryKey: ['supervision'] })
  }

  const lectura = useMutation({
    mutationFn: () => abrirChat(idConversacion),
    onSuccess: async () => {
      refrescarListas()
      await consultas.invalidateQueries({ queryKey: claveMensajes })
    },
  })
  const hayNoLeidos = mensajes.data?.some((mensaje) => mensaje.contesta === 'cliente' && Number(mensaje.id_estado) === 3) ?? false
  const ultimoId = mensajes.data?.at(-1)?.id ?? 0
  const { mutate: marcarLeidos, isPending: marcando } = lectura

  useEffect(() => {
    if (!supervision && hayNoLeidos && !marcando) {
      marcarLeidos()
    }
  }, [supervision, hayNoLeidos, ultimoId, marcando, marcarLeidos])

  const envio = useMutation({
    mutationFn: (envio: EnvioRedactor) =>
      enviarMensaje(idConversacion, aFormatoWhatsapp(envio.texto), envio.archivo, {
        idMensajeResponde: cita?.wamid,
        tipo: envio.tipo,
        latitude: envio.latitude,
        longitude: envio.longitude,
        name: envio.name,
        mediaUrl: envio.mediaUrl,
      }),
    onMutate: async (envioDatos) => {
      await consultas.cancelQueries({ queryKey: claveMensajes })
      const archivo = envioDatos.archivo
      const mediaType = tipoMediaEnvio(envioDatos)
      const provisional: MensajeChat = {
        id: -Date.now(),
        id_conversacion: idConversacion,
        id_estado: 1,
        mensaje: aFormatoWhatsapp(envioDatos.texto) || (envioDatos.tipo === 'location' ? 'Ubicación' : ''),
        contesta: 'usuario',
        media_type: mediaType,
        media_url:
          envioDatos.tipo === 'location' && envioDatos.latitude != null
            ? `https://www.google.com/maps/search/?api=1&query=${envioDatos.latitude},${envioDatos.longitude}`
            : envioDatos.mediaUrl
              ? envioDatos.mediaUrl
              : archivo && (mediaType === 'image' || mediaType === 'sticker' || mediaType === 'video')
                ? URL.createObjectURL(archivo)
                : null,
        cod_error: null,
        created_at: new Date().toISOString(),
        pendiente: true,
        mensaje_responde_contenido: cita?.wamid ? { mensaje: cita.texto, contesta: 'cliente', media_type: null } : null,
      }
      consultas.setQueryData<MensajeChat[]>(claveMensajes, (actuales = []) => [...actuales, provisional])
    },
    onError: (error) => avisoError(error, 'No se pudo enviar el mensaje'),
    onSettled: () => {
      consultas.invalidateQueries({ queryKey: claveMensajes })
      refrescarListas()
    },
  })

  const chat = conversacion.data
  const finalizada = chat?.id_estado === ESTADO_FINALIZADA
  const nombre = chat ? nombreContacto(chat) : ''
  const ultimoMensajeCliente = [...(mensajes.data ?? [])].reverse().find((mensaje) => mensaje.contesta === 'cliente')?.created_at ?? null
  const ventana = mensajes.data ? ventanaAbierta(mensajes.data) : null

  const [infoAbierta, setInfoAbierta] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [filtroMensajes, setFiltroMensajes] = useState('')
  const telefono = chat?.telefono ? String(chat.telefono).replace(/^\+/, '') : ''
  const [idPrevio, setIdPrevio] = useState(idConversacion)
  if (idPrevio !== idConversacion) {
    setIdPrevio(idConversacion)
    setCita(null)
    setDialogo(null)
    setInfoAbierta(false)
    setPerfilAbierto(false)
    setBuscando(false)
    setFiltroMensajes('')
  }
  const subtitulo = finalizada ? 'Conversación cerrada' : ventana === false ? 'Solo plantillas · ventana de 24 h cerrada' : null

  return (
    <div className={cn('flex h-full min-h-0 min-w-0', className)}>
    <section className="chat-wa-fondo flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <header
        className="flex h-16 min-w-0 shrink-0 items-center gap-1 border-b border-[var(--wa-borde)] bg-[var(--wa-cabecera)] px-2 sm:px-4"
        data-tour="cabecera-chat"
      >
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06] md:hidden"
          aria-label="Volver a la lista"
          onClick={alVolver}
        >
          <ArrowLeft className="size-6" strokeWidth={1.8} />
        </button>
        {chat ? (
          <>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
              onClick={() => chat.id_cliente && setInfoAbierta(true)}
              title="Info del contacto"
            >
              <AvatarWa nombre={nombre} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] leading-[21px] text-[var(--wa-texto)]">{nombre}</p>
                {subtitulo ? <p className="truncate text-[13px] leading-5 text-[var(--wa-muted)]">{subtitulo}</p> : null}
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              {acciones}
              {chat.id_cliente && !supervision ? (
                <button
                  type="button"
                  onClick={() => setInfoAbierta(true)}
                  className="mr-1 hidden h-9 max-w-48 items-center gap-1.5 rounded-full border border-[var(--wa-chip-borde)] px-3 text-[14px] text-[var(--wa-texto)] hover:bg-black/[0.04] lg:flex"
                  title="Etapa, etiquetas y datos CRM"
                >
                  {chat.etapa_color ? (
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chat.etapa_color }} />
                  ) : (
                    <IconoLista className="size-[18px] shrink-0 text-[var(--wa-icono)]" />
                  )}
                  <span className="truncate">{chat.etapa_nombre || 'Añadir a etapa'}</span>
                  <ChevronDown className="size-4 shrink-0 text-[var(--wa-icono)]" />
                </button>
              ) : null}
              <BotonCabecera titulo="Enviar plantilla" onClick={() => setDialogo('plantilla')}>
                <IconoPlantilla className="size-6" />
              </BotonCabecera>
              {telefono ? (
                <a
                  href={`tel:+${telefono}`}
                  title={`Llamar +${telefono}`}
                  aria-label="Llamar"
                  className="hidden size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06] sm:flex"
                >
                  <IconoLlamar className="size-6" />
                </a>
              ) : null}
              <BotonCabecera
                titulo="Buscar en el chat"
                activo={buscando}
                onClick={() => {
                  setBuscando((v) => !v)
                  setFiltroMensajes('')
                }}
              >
                <IconoBuscar className="size-[22px]" />
              </BotonCabecera>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06] data-[popup-open]:bg-black/[0.08]"
                      aria-label="Menú del chat"
                      title="Menú"
                    />
                  }
                >
                  <IconoMenu className="size-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {chat.id_cliente ? (
                    <DropdownMenuItem onClick={() => setInfoAbierta(true)}>
                      <UserRound />
                      Datos del cliente
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => setDialogo('plantilla')}>
                    <FileText />
                    Enviar plantilla
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const queda = alternarSilencio(idConversacion)
                      avisoInfo(queda ? 'Este chat ya no suena' : 'Volviste a activar los avisos de este chat')
                    }}
                  >
                    {silenciado ? <Bell /> : <BellOff />}
                    {silenciado ? 'Activar avisos' : 'Silenciar chat'}
                  </DropdownMenuItem>
                  {!finalizada ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDialogo('finalizar')} data-tour="finalizar-chat">
                        <CircleCheckBig />
                        Finalizar conversación
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}
      </header>

      {buscando ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--wa-borde)] bg-[var(--wa-cabecera)] px-4 py-2">
          <div className="relative flex-1">
            <IconoBuscar className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--wa-muted)]" />
            <input
              autoFocus
              value={filtroMensajes}
              onChange={(evento) => setFiltroMensajes(evento.target.value)}
              onKeyDown={(evento) => evento.key === 'Escape' && setBuscando(false)}
              placeholder="Buscar mensajes"
              className="h-10 w-full rounded-full border border-transparent bg-[var(--wa-buscar)] pr-4 pl-12 text-[15px] text-[var(--wa-texto)] outline-none placeholder:text-[var(--wa-muted)] focus:border-[var(--wa-verde)]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setBuscando(false)
              setFiltroMensajes('')
            }}
            className="flex size-9 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06]"
            aria-label="Cerrar búsqueda"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}

      {chat ? <ResumenBot key={idConversacion} idConversacion={idConversacion} totalMensajes={mensajes.data?.length ?? 0} /> : null}

      <ListaMensajes
        key={idConversacion}
        mensajes={
          filtroMensajes.trim()
            ? mensajes.data?.filter((mensaje) => (mensaje.mensaje ?? '').toLowerCase().includes(filtroMensajes.trim().toLowerCase()))
            : mensajes.data
        }
        cargando={mensajes.isLoading}
        error={mensajes.error?.message}
        alResponder={setCita}
        ocultarAvisoWhatsapp={supervision}
      />

      {aviso}

      {finalizada ? (
        <p className="border-t border-[var(--wa-borde)] bg-[var(--wa-panel)] px-4 py-3 text-center text-sm text-[var(--wa-muted)]">
          Conversación finalizada
        </p>
      ) : chat ? (
        <Redactor
          idConversacion={idConversacion}
          ventanaAbierta={ventana ?? true}
          enviando={envio.isPending}
          cita={cita}
          alCancelarCita={() => setCita(null)}
          alEnviar={async (datos) => {
            await envio.mutateAsync(datos)
            setCita(null)
          }}
          alUsarPlantilla={() => setDialogo('plantilla')}
        />
      ) : null}

      {chat ? (
        <>
          <DialogoPlantilla
            abierto={dialogo === 'plantilla'}
            idConversacion={idConversacion}
            idApp={chat.id_app}
            alCerrar={() => setDialogo(null)}
            alEnviar={() => {
              setDialogo(null)
              consultas.invalidateQueries({ queryKey: claveMensajes })
              refrescarListas()
            }}
          />
          <DialogoFinalizar
            abierto={dialogo === 'finalizar'}
            idConversacion={idConversacion}
            alCerrar={() => setDialogo(null)}
            alFinalizar={() => {
              setDialogo(null)
              consultas.invalidateQueries({ queryKey: ['conversacion', idConversacion] })
              refrescarListas()
            }}
          />
          <FichaCliente
            id={perfilAbierto && chat.id_cliente ? Number(chat.id_cliente) : null}
            ajustes={ajustes.data}
            alCerrar={() => setPerfilAbierto(false)}
            desdeChat
          />
        </>
      ) : null}
    </section>
    {chat?.id_cliente ? (
      <PanelCliente
        idCliente={Number(chat.id_cliente)}
        ajustes={ajustes.data}
        ultimoMensajeCliente={ultimoMensajeCliente}
        abierto={infoAbierta}
        alCerrar={() => setInfoAbierta(false)}
        alEditarFicha={() => setPerfilAbierto(true)}
      />
    ) : null}
    </div>
  )
}

type PropsLista = {
  mensajes?: MensajeChat[]
  cargando: boolean
  error?: string
  alResponder?: (cita: CitaMensaje) => void
  ocultarAvisoWhatsapp?: boolean
}

function sinBotsRepetidos(lista: MensajeChat[]): MensajeChat[] {
  const salida: MensajeChat[] = []
  for (const mensaje of lista) {
    const anterior = salida[salida.length - 1]
    if (
      anterior &&
      mensaje.contesta === 'bot' &&
      anterior.contesta === 'bot' &&
      (mensaje.mensaje ?? '').trim() === (anterior.mensaje ?? '').trim()
    ) {
      continue
    }
    salida.push(mensaje)
  }
  return salida
}

function ListaMensajes({ mensajes, cargando, error, alResponder, ocultarAvisoWhatsapp = false }: PropsLista) {
  const contenedor = useRef<HTMLDivElement>(null)
  const pegadoAbajo = useRef(true)
  const visibles = mensajes ? sinBotsRepetidos(mensajes) : undefined
  const total = visibles?.length ?? 0
  const [lejos, setLejos] = useState(false)
  const [nuevos, setNuevos] = useState(0)
  const totalPrevio = useRef(total)

  useLayoutEffect(() => {
    const elemento = contenedor.current
    if (elemento && pegadoAbajo.current) {
      elemento.scrollTop = elemento.scrollHeight
    } else if (total > totalPrevio.current) {
      setNuevos((n) => n + total - totalPrevio.current)
    }
    totalPrevio.current = total
  }, [total])

  const irAbajo = () => {
    const elemento = contenedor.current
    elemento?.scrollTo({ top: elemento.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
    <div
      ref={contenedor}
      onScroll={(evento) => {
        const elemento = evento.currentTarget
        const cerca = elemento.scrollHeight - elemento.scrollTop - elemento.clientHeight < DISTANCIA_PEGADO_ABAJO
        pegadoAbajo.current = cerca
        setLejos(!cerca)
        if (cerca) setNuevos(0)
      }}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-[6%] xl:px-[8%]"
      data-tour="mensajes-chat"
    >
      {cargando ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="ml-auto h-10 w-1/2 rounded-lg" />
          <Skeleton className="h-14 w-3/5 rounded-lg" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : total === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[var(--wa-muted)]">
          <MessageCircleMore className="size-6" />
          Sin mensajes
        </div>
      ) : (
        <>
        {ocultarAvisoWhatsapp ? null : (
          <p className="mx-auto my-2 hidden max-w-md items-center justify-center gap-1.5 rounded-[7.5px] bg-[var(--wa-aviso)] px-3 py-[5px] text-center text-[11px] leading-[15px] text-[var(--wa-dia-texto)] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] sm:flex">
            <Lock className="size-3 shrink-0 opacity-70" />
            Mensajes vía WhatsApp Business · nombre del contacto = datos CRM
          </p>
        )}
        {visibles!.map((mensaje, indice) => {
          const dia = claveDia(mensaje.created_at)
          const nuevoDia = indice === 0 || dia !== claveDia(visibles![indice - 1].created_at)
          const fecha = leerFecha(mensaje.created_at)
          return (
            <Fragment key={mensaje.id}>
              {nuevoDia && fecha ? (
                <div className="sticky top-1 z-[1] flex justify-center py-2.5">
                  <span className="rounded-[7.5px] bg-[var(--wa-dia)] px-3 py-[5px] text-[12.5px] leading-[15px] text-[var(--wa-dia-texto)] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                    {etiquetaDia(fecha)}
                  </span>
                </div>
              ) : null}
              <BurbujaMensaje
                mensaje={mensaje}
                agrupada={!nuevoDia && indice > 0 && visibles![indice - 1].contesta === mensaje.contesta}
                alResponder={alResponder}
              />
            </Fragment>
          )
        })}
        </>
      )}
    </div>
    {lejos ? (
      <button
        type="button"
        onClick={irAbajo}
        className="absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full bg-white text-[var(--wa-muted)] shadow-md ring-1 ring-black/5 transition-transform hover:scale-105"
        aria-label="Ir al último mensaje"
      >
        <ArrowDown className="size-5" />
        {nuevos > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--wa-badge)] px-1 text-[11px] font-semibold text-white">
            {nuevos > 99 ? '99+' : nuevos}
          </span>
        ) : null}
      </button>
    ) : null}
    </div>
  )
}

function chatEnListas(consultas: QueryClient, id: number): ConversacionChat | undefined {
  for (const [, lista] of consultas.getQueriesData<ConversacionChat[]>({ queryKey: ['chats'] })) {
    const encontrado = Array.isArray(lista) ? lista.find((chat) => chat.id === id) : undefined
    if (encontrado) return encontrado
  }
  return undefined
}

function BotonCabecera({
  titulo,
  activo,
  onClick,
  children,
}: {
  titulo: string
  activo?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className={cn(
        'flex size-10 items-center justify-center rounded-full text-[var(--wa-icono)] hover:bg-black/[0.06]',
        activo && 'bg-black/[0.08]',
      )}
    >
      {children}
    </button>
  )
}

function tipoMediaEnvio(envio: EnvioRedactor): MensajeChat['media_type'] {
  if (envio.tipo === 'location') return 'location'
  if (envio.tipo === 'sticker') return 'sticker'
  if (envio.mediaUrl) return 'image'
  if (envio.tipo === 'audio' || envio.archivo?.type.startsWith('audio/')) return 'audio'
  if (envio.archivo?.type.startsWith('image/')) return 'image'
  if (envio.archivo?.type.startsWith('video/')) return 'video'
  if (envio.archivo) return 'document'
  return null
}
