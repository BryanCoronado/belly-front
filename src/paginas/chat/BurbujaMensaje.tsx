import { Bot, Clock3, FileText, LayoutTemplate, MapPin, Reply, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MensajeChat } from '@/api'
import { cn } from '@/lib/utils'
import { leerSesion } from '@/sesion'
import { horaCorta } from './formato'
import { IconoTickDoble, IconoTickSimple } from './iconosWa'
import { InteractivoWa } from './InteractivoWa'
import { ReproductorNotaVoz } from './ReproductorNotaVoz'
import { TextoWhatsapp } from './textoWhatsapp'

const ESTADO = {
  inicial: 1,
  entregado: 2,
  recibido: 3,
  leido: 4,
  error: 5,
} as const

const PLACEHOLDER_MEDIA = new RegExp(
  '^\\[(Imagen|Sticker|Documento|Video|Audio)(?:\\s*:\\s*([^\\]]+))?\\](?:\\s*(.*))?$',
  'is',
)

export type CitaMensaje = {
  wamid: string
  texto: string
  de: string
}

export function BurbujaMensaje({
  mensaje,
  agrupada = false,
  alResponder,
}: {
  mensaje: MensajeChat
  agrupada?: boolean
  alResponder?: (cita: CitaMensaje) => void
}) {
  const entrante = mensaje.contesta === 'cliente'
  const miId = leerSesion()?.usuario.id
  const autorAjeno =
    mensaje.contesta === 'usuario' && mensaje.autor && Number(mensaje.autor.id) !== Number(miId)
      ? mensaje.autor.nombre
      : null
  const wamid = mensaje.id_mensaje_whatsapp?.trim() || ''
  const puedeResponder = Boolean(alResponder && wamid && !mensaje.pendiente)
  const soloAudio = mensaje.media_type === 'audio' && Boolean(mensaje.media_url)
  const esSticker = mensaje.media_type === 'sticker' && Boolean(mensaje.media_url)
  const sinPie = interpretarTexto(mensaje.mensaje).caption === ''
  const mediaSola =
    !esSticker &&
    sinPie &&
    Boolean(mensaje.media_url) &&
    (mensaje.media_type === 'image' || mensaje.media_type === 'video')
  const metaEnLinea =
    !soloAudio && !mensaje.media_type && !mensaje.media_url && !mensaje.pendiente && Boolean(mensaje.mensaje?.trim())
  const metaSobreMedia = mediaSola || esSticker

  function responder() {
    if (!alResponder || !wamid) return
    alResponder({
      wamid,
      texto: textoCita(mensaje),
      de: mensaje.contesta === 'cliente' ? 'Cliente' : mensaje.contesta === 'bot' ? 'Automático' : autorAjeno || 'Tú',
    })
  }

  return (
    <div className={cn('group/burbuja flex items-center gap-1', agrupada ? 'mt-0.5' : 'mt-2', entrante ? 'justify-start' : 'justify-end')}>
      {puedeResponder && entrante ? <BotonResponder alClick={responder} /> : null}
      <div className="flex max-w-[min(92%,20rem)] flex-col gap-1 sm:max-w-[65%]">
        <div
          id={`msg-${mensaje.id}`}
          data-mensaje-id={mensaje.id}
          onDoubleClick={puedeResponder ? responder : undefined}
          className={cn(
            'relative text-[14.2px] leading-[19px]',
            esSticker
              ? 'p-0'
              : cn(
                  'chat-wa-burbuja rounded-[7.5px]',
                  mediaSola ? 'p-[3px]' : 'px-1.5 pt-1',
                  soloAudio ? (entrante ? 'pb-[18px]' : 'pb-[7px]') : mediaSola ? '' : 'pb-0.5',
                  entrante ? 'chat-wa-burbuja-in bg-[var(--wa-burbuja-in)]' : 'chat-wa-burbuja-out bg-[var(--wa-verde-claro)]',
                  !agrupada && (entrante ? 'rounded-tl-none' : 'rounded-tr-none'),
                  agrupada && 'chat-wa-agrupada',
                ),
            soloAudio && 'w-[316px] max-w-full',
            mensaje.pendiente && 'opacity-70',
          )}
        >
          {mensaje.contesta === 'bot' ? (
            <span className="mb-1 flex items-center gap-1 px-1 text-[11px] font-medium text-[var(--wa-muted)]">
              <Bot className="size-3" /> Automático
            </span>
          ) : null}
          {autorAjeno ? (
            <span className="mb-1 block truncate px-1 text-[11px] font-medium text-[var(--wa-verde-oscuro)]">{autorAjeno}</span>
          ) : null}
          {mensaje.mensaje_responde_contenido ? (
            <div className="px-1">
              <Cita contenido={mensaje.mensaje_responde_contenido} entrante={entrante} />
            </div>
          ) : null}
          <Contenido
            mensaje={mensaje}
            entrante={entrante}
            espacioHora={metaEnLinea ? (entrante ? 'w-[62px]' : 'w-[84px]') : null}
          />
          <div
            className={cn(
              'flex items-center justify-end gap-1 text-[11px] leading-[15px]',
              metaSobreMedia
                ? cn(
                    'pointer-events-none absolute right-[8px] bottom-[6px] rounded-full px-1.5 py-px text-white',
                    esSticker ? 'bg-black/45' : 'bg-gradient-to-t from-black/40 to-transparent',
                  )
                : 'text-[var(--wa-muted)]',
              !metaSobreMedia && (metaEnLinea || soloAudio ? 'absolute right-[7px] bottom-[4px]' : 'mt-0.5 px-1.5'),
            )}
          >
            {mensaje.pendiente ? <span className="mr-auto italic">Enviando…</span> : null}
            <span>{horaCorta(mensaje.created_at)}</span>
            {entrante ? null : (
              <EstadoEnvio estado={Number(mensaje.id_estado)} pendiente={mensaje.pendiente} claro={metaSobreMedia} />
            )}
          </div>
        </div>
        {mensaje.interactivo ? <InteractivoWa interactivo={mensaje.interactivo} /> : null}
      </div>
      {puedeResponder && !entrante ? <BotonResponder alClick={responder} /> : null}
    </div>
  )
}

function BotonResponder({ alClick }: { alClick: () => void }) {
  return (
    <button
      type="button"
      onClick={alClick}
      className="hidden size-8 shrink-0 items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-black/5 hover:text-[var(--wa-texto)] sm:flex sm:opacity-0 sm:group-hover/burbuja:opacity-100"
      aria-label="Responder este mensaje"
      title="Responder"
    >
      <Reply className="size-4" />
    </button>
  )
}

function textoCita(mensaje: MensajeChat): string {
  const crudo = mensaje.mensaje?.trim() && mensaje.mensaje !== '[Sin texto]' ? mensaje.mensaje.trim() : ''
  if (crudo) return crudo
  if (mensaje.media_type === 'image' || mensaje.media_type === 'sticker') return 'Imagen'
  if (mensaje.media_type === 'video') return 'Video'
  if (mensaje.media_type === 'audio') return 'Audio'
  if (mensaje.media_type === 'location') return 'Ubicación'
  if (mensaje.media_type) return 'Archivo adjunto'
  return ''
}

function Contenido({ mensaje, entrante, espacioHora }: { mensaje: MensajeChat; entrante: boolean; espacioHora: string | null }) {
  const [ampliada, setAmpliada] = useState<string | null>(null)
  const url = mensaje.media_url ?? ''
  const tipo = mensaje.media_type ?? ''
  const { caption, nombreArchivo, esSoloMarcador } = interpretarTexto(mensaje.mensaje)
  const esImagen =
    tipo === 'image' ||
    tipo === 'sticker' ||
    (tipo === 'document' && esArchivoImagen(url, nombreArchivo, caption))

  return (
    <>
      {url && esImagen ? (
        <button
          type="button"
          onClick={() => setAmpliada(url)}
          className={cn('block overflow-hidden text-left', tipo === 'sticker' ? 'rounded-none' : 'w-[300px] max-w-full rounded-[6px]')}
          aria-label="Ver imagen grande"
        >
          <img
            src={url}
            alt={tipo === 'sticker' ? 'Sticker' : 'Imagen'}
            loading="lazy"
            className={cn(
              'cursor-pointer transition-opacity hover:opacity-95',
              tipo === 'sticker'
                ? 'size-[150px] object-contain'
                : 'max-h-[330px] min-h-24 w-full bg-black/5 object-cover',
            )}
          />
        </button>
      ) : null}

      {url && tipo === 'video' ? (
        <video src={url} controls preload="metadata" className="max-h-[330px] w-[300px] max-w-full rounded-[6px] bg-black" />
      ) : null}
      {url && tipo === 'audio' ? (
        <ReproductorNotaVoz url={url} entrante={entrante} mensajeId={Math.abs(mensaje.id)} />
      ) : null}

      {tipo === 'location' ? <TarjetaUbicacion url={url} texto={mensaje.mensaje} /> : null}

      {url && tipo === 'document' && !esImagen ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mb-0.5 flex w-[280px] max-w-full items-center gap-3 rounded-[6px] bg-black/[0.05] px-3 py-3 hover:bg-black/[0.08] dark:bg-white/[0.06]"
        >
          <span
            className="flex h-10 w-8 shrink-0 items-end justify-center rounded-[3px] pb-1 text-[8px] font-bold text-white"
            style={{ backgroundColor: colorDocumento(extensionDe(nombreArchivo || url)) }}
          >
            {extensionDe(nombreArchivo || url).toUpperCase() || <FileText className="mb-1 size-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] text-[var(--wa-texto)]">{nombreArchivo || 'Documento'}</span>
            <span className="text-[12px] text-[var(--wa-muted)]">{extensionDe(nombreArchivo || url).toUpperCase() || 'Archivo'}</span>
          </span>
        </a>
      ) : null}

      {tipo === 'template' ? (
        <span className="mb-1 flex items-center gap-1 px-1 text-[11px] font-medium text-[var(--wa-muted)]">
          <LayoutTemplate className="size-3" /> Plantilla
        </span>
      ) : null}

      {caption && !esSoloMarcador && tipo !== 'location' && tipo !== 'sticker' ? (
        <p className={cn('break-words whitespace-pre-wrap px-1.5 pt-0.5', espacioHora && 'pb-1')}>
          <TextoWhatsapp texto={caption} />
          {espacioHora ? <span className={cn('inline-block h-3 align-middle', espacioHora)} aria-hidden /> : null}
        </p>
      ) : null}

      {ampliada ? <VisorImagen url={ampliada} alCerrar={() => setAmpliada(null)} /> : null}
    </>
  )
}

/** Quita marcadores tipo [Documento: x.png] y deja solo el pie de foto real, si lo hay. */
function interpretarTexto(mensaje: string | null | undefined) {
  const crudo = mensaje?.trim() && mensaje !== '[Sin texto]' ? mensaje.trim() : ''
  if (!crudo || /^(\[Sticker\]|Se envió sticker)$/i.test(crudo)) {
    return { caption: '', nombreArchivo: '', esSoloMarcador: true }
  }

  const match = crudo.match(PLACEHOLDER_MEDIA)
  if (!match) {
    return { caption: crudo, nombreArchivo: '', esSoloMarcador: false }
  }

  const tipo = match[1].toLowerCase()
  const nombreArchivo = (match[2] ?? '').trim()
  let resto = (match[3] ?? '').trim()
  if (resto === '[Sin descripción]' || resto === 'Mensaje de voz') {
    resto = ''
  }

  return {
    caption: resto,
    nombreArchivo: nombreArchivo || (tipo === 'documento' ? 'Documento' : ''),
    esSoloMarcador: resto === '',
  }
}

function TarjetaUbicacion({ url, texto }: { url: string; texto: string | null }) {
  const mapa = url || mapaDesdeTexto(texto)
  const titulo = texto?.replace(/^Ubicación recibida:\s*/i, '').replace(/^Se envió ubicación:\s*/i, '') || 'Ubicación'
  if (!mapa) {
    return <p className="px-1.5 pt-0.5">{texto || 'Ubicación'}</p>
  }
  return (
    <a href={mapa} target="_blank" rel="noreferrer" className="mb-0.5 flex items-center gap-3 rounded-md bg-black/5 px-3 py-2.5 hover:bg-black/10">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#25d366] text-white">
        <MapPin className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{titulo}</span>
        <span className="text-[11px] text-[var(--wa-muted)]">Abrir en el mapa</span>
      </span>
    </a>
  )
}

function mapaDesdeTexto(texto: string | null): string {
  const match = texto?.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (!match) return ''
  return `https://www.google.com/maps/search/?api=1&query=${match[1]},${match[2]}`
}

function extensionDe(nombre: string): string {
  const limpio = nombre.split('?')[0]
  const punto = limpio.lastIndexOf('.')
  return punto > -1 ? limpio.slice(punto + 1).slice(0, 4).toLowerCase() : ''
}

function colorDocumento(extension: string): string {
  if (extension === 'pdf') return '#e5252a'
  if (['doc', 'docx'].includes(extension)) return '#2b579a'
  if (['xls', 'xlsx', 'csv'].includes(extension)) return '#217346'
  if (['ppt', 'pptx'].includes(extension)) return '#d24726'
  return '#8696a0'
}

function esArchivoImagen(url: string, nombreArchivo: string, caption: string) {
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(`${url} ${nombreArchivo} ${caption}`)
}

function VisorImagen({ url, alCerrar }: { url: string; alCerrar: () => void }) {
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar()
    }
    window.addEventListener('keydown', alTecla)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', alTecla)
    }
  }, [alCerrar])

  return createPortal(
    <div
      className="tema-fijo fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      onClick={alCerrar}
    >
      <button
        type="button"
        onClick={alCerrar}
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X className="size-5" />
      </button>
      <img
        src={url}
        alt="Imagen ampliada"
        className="max-h-[90dvh] max-w-[95vw] object-contain"
        onClick={(evento) => evento.stopPropagation()}
      />
    </div>,
    document.body,
  )
}

function Cita({
  contenido,
  entrante,
}: {
  contenido: NonNullable<MensajeChat['mensaje_responde_contenido']>
  entrante: boolean
}) {
  const idCitado = Number(contenido.id || 0)

  function irAlCitado() {
    if (!idCitado) return
    const destino = document.getElementById(`msg-${idCitado}`)
    if (!destino) return
    destino.scrollIntoView({ behavior: 'smooth', block: 'center' })
    destino.classList.add('ring-2', 'ring-[var(--wa-verde)]')
    window.setTimeout(() => destino.classList.remove('ring-2', 'ring-[var(--wa-verde)]'), 1_200)
  }

  return (
    <button
      type="button"
      onClick={idCitado ? irAlCitado : undefined}
      className={cn(
        'mb-1.5 w-full rounded border-l-[3px] px-2 py-1 text-left text-[12px]',
        entrante ? 'border-[var(--wa-verde)] bg-black/5' : 'border-[var(--wa-verde-oscuro)] bg-black/10',
        idCitado && 'cursor-pointer hover:bg-black/10',
      )}
    >
      <span className="font-medium text-[var(--wa-verde-oscuro)]">
        {contenido.contesta === 'cliente' ? 'Cliente' : contenido.contesta === 'bot' ? 'Automático' : 'Tú'}
      </span>
      <p className="line-clamp-2 text-[var(--wa-muted)]">{contenido.mensaje || 'Archivo adjunto'}</p>
    </button>
  )
}

function EstadoEnvio({ estado, pendiente, claro = false }: { estado: number; pendiente?: boolean; claro?: boolean }) {
  if (pendiente || estado === ESTADO.inicial) {
    return <Clock3 className="size-3.5" aria-label="Enviando" />
  }
  if (estado === ESTADO.error) {
    return (
      <span className="flex size-[15px] items-center justify-center rounded-full bg-[#ea0038] text-[10px] font-bold text-white" title="No se envió">
        !
      </span>
    )
  }
  if (estado === ESTADO.leido) {
    return <IconoTickDoble className="h-[11px] w-4 text-[#53bdeb]" aria-label="Leído" />
  }
  if (estado === ESTADO.recibido) {
    return <IconoTickDoble className={cn('h-[11px] w-4', claro && 'text-white')} aria-label="Entregado" />
  }
  return <IconoTickSimple className={cn('h-[11px] w-3', claro && 'text-white')} aria-label="Enviado" />
}
