import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bell, BellOff, CircleCheckBig, MessageCircleMore } from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { abrirChat, enviarMensaje, leerConversacion, leerMensajes, type MensajeChat } from '@/api'
import { FichaCliente } from '../clientes/FichaCliente'
import { useAjustesCrm } from '../clientes/crm'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoInfo } from '@/lib/avisos'
import { alternarSilencio, chatSilenciado } from '@/lib/preferencias-aviso'
import { useAvisos } from '@/hooks/use-avisos'
import { cn } from '@/lib/utils'
import { BurbujaMensaje, type CitaMensaje } from './BurbujaMensaje'
import { DialogoFinalizar, DialogoPlantilla } from './Dialogos'
import { claveDia, etiquetaDia, iniciales, leerFecha, nombreContacto, ventanaAbierta } from './formato'
import { Redactor, type CitaRedactor, type EnvioRedactor } from './Redactor'
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

  const conversacion = useQuery({ queryKey: ['conversacion', idConversacion], queryFn: () => leerConversacion(idConversacion) })
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
      enviarMensaje(idConversacion, envio.texto, envio.archivo, {
        idMensajeResponde: cita?.wamid,
        tipo: envio.tipo,
        latitude: envio.latitude,
        longitude: envio.longitude,
        name: envio.name,
      }),
    onMutate: async (envioDatos) => {
      await consultas.cancelQueries({ queryKey: claveMensajes })
      const provisional: MensajeChat = {
        id: -Date.now(),
        id_conversacion: idConversacion,
        id_estado: 1,
        mensaje: envioDatos.texto || envioDatos.archivo?.name || (envioDatos.tipo === 'location' ? 'Ubicación' : ''),
        contesta: 'usuario',
        media_type: envioDatos.tipo === 'location' ? 'location' : envioDatos.tipo === 'sticker' ? 'sticker' : envioDatos.archivo?.type.startsWith('audio/') ? 'audio' : null,
        media_url: envioDatos.tipo === 'location' && envioDatos.latitude != null ? `https://www.google.com/maps/search/?api=1&query=${envioDatos.latitude},${envioDatos.longitude}` : null,
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

  return (
    <section className={cn('flex min-h-0 flex-col', className)}>
      <header
        className="flex items-center gap-3 border-b border-[var(--wa-borde)] bg-[var(--wa-panel)] px-3 py-2.5"
        data-tour="cabecera-chat"
      >
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--wa-muted)] hover:bg-black/5 md:hidden"
          aria-label="Volver a la lista"
          onClick={alVolver}
        >
          <ArrowLeft />
        </Button>
        {chat ? (
          <>
            <button
              type="button"
              className="-ml-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 text-left hover:bg-black/5"
              onClick={() => chat.id_cliente && setPerfilAbierto(true)}
              title="Ver perfil del cliente"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-[#dfe5e7] text-sm font-medium text-[#54656f] dark:bg-[#2a3942] dark:text-[#aebac1]">{iniciales(nombre)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{nombre}</p>
                <p className="truncate text-[13px] text-[var(--wa-muted)]">
                  {chat.telefono ? `+${String(chat.telefono).replace(/^\+/, '')}` : chat.nombre_app || 'WhatsApp'}
                </p>
              </div>
            </button>
            {acciones}
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--wa-muted)] hover:bg-black/5"
              aria-label={silenciado ? 'Activar avisos de este chat' : 'Silenciar este chat'}
              title={silenciado ? 'Avisos de este chat: apagados' : 'Silenciar este chat'}
              onClick={() => {
                const queda = alternarSilencio(idConversacion)
                avisoInfo(queda ? 'Este chat ya no suena' : 'Volviste a activar los avisos de este chat')
              }}
            >
              {silenciado ? <BellOff /> : <Bell />}
            </Button>
            {finalizada ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--wa-muted)]">
                Finalizada
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--wa-borde)] bg-white text-[var(--wa-texto)] hover:bg-white/80"
                onClick={() => setDialogo('finalizar')}
                data-tour="finalizar-chat"
              >
                <CircleCheckBig /> <span className="hidden sm:inline">Finalizar</span>
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}
      </header>

      {chat ? <ResumenBot idConversacion={idConversacion} totalMensajes={mensajes.data?.length ?? 0} /> : null}

      <ListaMensajes
        mensajes={mensajes.data}
        cargando={mensajes.isLoading}
        error={mensajes.error?.message}
        alResponder={setCita}
      />

      {aviso}

      {finalizada ? (
        <p className="border-t border-[var(--wa-borde)] bg-[var(--wa-panel)] px-4 py-3 text-center text-sm text-[var(--wa-muted)]">
          Conversación finalizada
        </p>
      ) : chat && mensajes.data ? (
        <Redactor
          ventanaAbierta={ventanaAbierta(mensajes.data)}
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
  )
}

type PropsLista = {
  mensajes?: MensajeChat[]
  cargando: boolean
  error?: string
  alResponder?: (cita: CitaMensaje) => void
}

function ListaMensajes({ mensajes, cargando, error, alResponder }: PropsLista) {
  const contenedor = useRef<HTMLDivElement>(null)
  const pegadoAbajo = useRef(true)
  const total = mensajes?.length ?? 0

  useLayoutEffect(() => {
    const elemento = contenedor.current
    if (elemento && pegadoAbajo.current) {
      elemento.scrollTop = elemento.scrollHeight
    }
  }, [total])

  return (
    <div
      ref={contenedor}
      onScroll={(evento) => {
        const elemento = evento.currentTarget
        pegadoAbajo.current = elemento.scrollHeight - elemento.scrollTop - elemento.clientHeight < DISTANCIA_PEGADO_ABAJO
      }}
      className="chat-wa-fondo min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-16"
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
        <p className="mx-auto my-3 max-w-sm rounded-[7.5px] bg-[var(--wa-dia)] px-3 py-1.5 text-center text-[12px] text-[var(--wa-dia-texto)] shadow-sm">
          Los mensajes de este chat salen por tu WhatsApp Business.
        </p>
        {mensajes!.map((mensaje, indice) => {
          const dia = claveDia(mensaje.created_at)
          const nuevoDia = indice === 0 || dia !== claveDia(mensajes![indice - 1].created_at)
          const fecha = leerFecha(mensaje.created_at)
          return (
            <Fragment key={mensaje.id}>
              {nuevoDia && fecha ? (
                <div className="flex justify-center py-2.5">
                  <span className="rounded-[7.5px] bg-[var(--wa-dia)] px-3 py-1 text-[12.5px] font-medium text-[var(--wa-dia-texto)] capitalize shadow-sm">
                    {etiquetaDia(fecha)}
                  </span>
                </div>
              ) : null}
              <BurbujaMensaje
                mensaje={mensaje}
                agrupada={!nuevoDia && indice > 0 && mensajes![indice - 1].contesta === mensaje.contesta}
                alResponder={alResponder}
              />
            </Fragment>
          )
        })}
        </>
      )}
    </div>
  )
}
