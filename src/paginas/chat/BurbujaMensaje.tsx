import { AlertCircle, Bot, Check, CheckCheck, Clock3, FileText, LayoutTemplate, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MensajeChat } from '@/api'
import { cn } from '@/lib/utils'
import { horaCorta } from './formato'
import { InteractivoWa } from './InteractivoWa'

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

export function BurbujaMensaje({ mensaje }: { mensaje: MensajeChat }) {
  const entrante = mensaje.contesta === 'cliente'
  const fallido = Number(mensaje.id_estado) === ESTADO.error

  return (
    <div className={cn('flex', entrante ? 'justify-start' : 'justify-end')}>
      <div className="flex max-w-[85%] flex-col gap-1 sm:max-w-[65%]">
        <div
          className={cn(
            'relative overflow-hidden px-1.5 pt-1.5 pb-1 text-[14.2px] leading-[19px] shadow-sm',
            entrante
              ? 'rounded-lg rounded-tl-none bg-white'
              : 'rounded-lg rounded-tr-none bg-[var(--wa-verde-claro)]',
            fallido && 'bg-red-50 ring-1 ring-red-200',
            mensaje.pendiente && 'opacity-70',
          )}
        >
          {mensaje.contesta === 'bot' ? (
            <span className="mb-1 flex items-center gap-1 px-1 text-[11px] font-medium text-[var(--wa-muted)]">
              <Bot className="size-3" /> Automático
            </span>
          ) : null}
          {mensaje.mensaje_responde_contenido ? (
            <div className="px-1">
              <Cita contenido={mensaje.mensaje_responde_contenido} entrante={entrante} />
            </div>
          ) : null}
          <Contenido mensaje={mensaje} />
          <div className="mt-0.5 flex items-center justify-end gap-1 px-1.5 text-[11px] text-[var(--wa-muted)]">
            <span>{horaCorta(mensaje.created_at)}</span>
            {entrante ? null : <EstadoEnvio estado={Number(mensaje.id_estado)} pendiente={mensaje.pendiente} />}
          </div>
        </div>
        {mensaje.interactivo ? <InteractivoWa interactivo={mensaje.interactivo} /> : null}
      </div>
    </div>
  )
}

function Contenido({ mensaje }: { mensaje: MensajeChat }) {
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
          className="mb-0.5 block w-full overflow-hidden rounded-md text-left"
          aria-label="Ver imagen grande"
        >
          <img
            src={url}
            alt={tipo === 'sticker' ? 'Sticker' : 'Imagen'}
            loading="lazy"
            className={cn(
              'max-h-72 w-full cursor-pointer bg-black/5 object-cover transition-opacity hover:opacity-95',
              tipo === 'sticker' && 'max-h-40 object-contain bg-transparent',
            )}
          />
        </button>
      ) : null}

      {url && tipo === 'video' ? <video src={url} controls className="mb-0.5 max-h-72 w-full rounded-md" /> : null}
      {url && tipo === 'audio' ? <audio src={url} controls className="mb-1 w-64 max-w-full px-1" /> : null}

      {url && tipo === 'document' && !esImagen ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mb-0.5 flex items-center gap-3 rounded-md bg-black/5 px-3 py-2.5 hover:bg-black/10"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: '#53bdeb' }}
          >
            <FileText className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{nombreArchivo || 'Documento'}</span>
            <span className="text-[11px] text-[var(--wa-muted)]">Abrir</span>
          </span>
        </a>
      ) : null}

      {tipo === 'template' ? (
        <span className="mb-1 flex items-center gap-1 px-1 text-[11px] font-medium text-[var(--wa-muted)]">
          <LayoutTemplate className="size-3" /> Plantilla
        </span>
      ) : null}

      {caption && !esSoloMarcador ? (
        <p className="break-words whitespace-pre-wrap px-1.5 pt-0.5">{caption}</p>
      ) : null}

      {ampliada ? <VisorImagen url={ampliada} alCerrar={() => setAmpliada(null)} /> : null}
    </>
  )
}

/** Quita marcadores tipo [Documento: x.png] y deja solo el pie de foto real, si lo hay. */
function interpretarTexto(mensaje: string | null | undefined) {
  const crudo = mensaje?.trim() && mensaje !== '[Sin texto]' ? mensaje.trim() : ''
  if (!crudo) {
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
  return (
    <div
      className={cn(
        'mb-1.5 rounded border-l-[3px] px-2 py-1 text-[12px]',
        entrante ? 'border-[var(--wa-verde)] bg-black/5' : 'border-[var(--wa-verde-oscuro)] bg-black/10',
      )}
    >
      <span className="font-medium text-[var(--wa-verde-oscuro)]">
        {contenido.contesta === 'cliente' ? 'Cliente' : 'Tú'}
      </span>
      <p className="line-clamp-2 text-[var(--wa-muted)]">{contenido.mensaje || 'Archivo adjunto'}</p>
    </div>
  )
}

function EstadoEnvio({ estado, pendiente }: { estado: number; pendiente?: boolean }) {
  if (pendiente || estado === ESTADO.inicial) {
    return <Clock3 className="size-3.5" aria-label="Enviando" />
  }
  if (estado === ESTADO.error) {
    return <AlertCircle className="size-3.5 text-red-600" aria-label="No se envió" />
  }
  if (estado === ESTADO.leido) {
    return <CheckCheck className="size-3.5 text-sky-400" aria-label="Leído" />
  }
  if (estado === ESTADO.recibido) {
    return <CheckCheck className="size-3.5" aria-label="Entregado" />
  }
  return <Check className="size-3.5" aria-label="Enviado" />
}
