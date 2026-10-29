import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  MapPin,
  Mic,
  Paperclip,
  SendHorizontal,
  Smile,
  Sticker,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { leerRespuestasRapidas } from '@/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type StickerTienda } from '@/api'
import { avisoError } from '@/lib/avisos'
import { PanelExpresiones } from './PanelExpresiones'

const LIMITE_ARCHIVO_MB = 16

async function archivoComoJpeg(origen: Blob, nombre: string): Promise<File> {
  const bitmap = await createImageBitmap(origen)
  const tope = 1600
  const escala = Math.min(1, tope / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.max(1, Math.round(bitmap.width * escala))
  const alto = Math.max(1, Math.round(bitmap.height * escala))
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Sin canvas')
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close()
  const jpeg = await new Promise<Blob>((resolver, rechazar) => {
    lienzo.toBlob((archivo) => (archivo ? resolver(archivo) : rechazar(new Error('JPEG'))), 'image/jpeg', 0.86)
  })
  return new File([jpeg], `${nombre}.jpg`, { type: 'image/jpeg' })
}

export type CitaRedactor = {
  wamid: string
  texto: string
  de: string
}

export type EnvioRedactor = {
  texto: string
  archivo?: File
  tipo?: 'sticker' | 'location'
  latitude?: number
  longitude?: number
  name?: string
}

type Props = {
  ventanaAbierta: boolean
  enviando: boolean
  cita?: CitaRedactor | null
  alCancelarCita?: () => void
  alEnviar: (envio: EnvioRedactor) => Promise<unknown>
  alUsarPlantilla: () => void
}

export function Redactor({ ventanaAbierta, enviando, cita, alCancelarCita, alEnviar, alUsarPlantilla }: Props) {
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [tipoArchivo, setTipoArchivo] = useState<'sticker' | undefined>()
  const [errorArchivo, setErrorArchivo] = useState('')
  const [emojisAbiertos, setEmojisAbiertos] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const campo = useRef<HTMLTextAreaElement>(null)
  const selector = useRef<HTMLInputElement>(null)
  const acepta = useRef('image/*')
  const grabacion = useRef<MediaRecorder | null>(null)
  const trozos = useRef<Blob[]>([])
  const reloj = useRef<number>(0)
  const respuestas = useQuery({ queryKey: ['respuestas-rapidas'], queryFn: leerRespuestasRapidas, staleTime: 60_000 })

  useEffect(() => {
    if (cita) campo.current?.focus()
  }, [cita])

  useEffect(() => () => detenerGrabacion(true), [])

  if (!ventanaAbierta) {
    return (
      <div
        className="flex items-center justify-between gap-3 border-t border-[var(--wa-borde)] bg-[#fff4ce] px-4 py-2.5 dark:bg-[#2f2a1a]"
        data-tour="redactor"
      >
        <p className="text-sm text-[#5c4b1f] dark:text-[#e5d28a]">Pasaron 24 h: solo puedes enviar una plantilla.</p>
        <Button size="sm" className="bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)]" onClick={alUsarPlantilla}>
          <LayoutTemplate /> Plantilla
        </Button>
      </div>
    )
  }

  const puedeEnviar = !enviando && (texto.trim() !== '' || archivo !== null)

  async function enviar(extra?: EnvioRedactor) {
    if (extra) {
      try {
        await alEnviar(extra)
      } catch {
        /* el panel muestra el error */
      }
      return
    }
    if (!puedeEnviar) return
    const contenido = texto
    const adjunto = archivo ?? undefined
    const tipo = tipoArchivo
    setTexto('')
    setArchivo(null)
    setTipoArchivo(undefined)
    try {
      await alEnviar({ texto: contenido.trim(), archivo: adjunto, tipo })
    } catch {
      setTexto(contenido)
      setArchivo(adjunto ?? null)
      setTipoArchivo(tipo)
    }
    campo.current?.focus()
  }

  function alTeclear(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      alCancelarCita?.()
      setEmojisAbiertos(false)
      return
    }
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault()
      void enviar()
    }
  }

  function elegirArchivo(elegido: File | undefined, como?: 'sticker') {
    setErrorArchivo('')
    if (!elegido) return
    if (elegido.size > LIMITE_ARCHIVO_MB * 1024 * 1024) {
      setErrorArchivo(`El archivo supera ${LIMITE_ARCHIVO_MB} MB.`)
      return
    }
    setTipoArchivo(como)
    setArchivo(elegido)
  }

  function abrirSelector(filtro: string, como?: 'sticker') {
    acepta.current = filtro
    setTipoArchivo(como)
    requestAnimationFrame(() => selector.current?.click())
  }

  function insertar(contenido: string) {
    setTexto((actual) => (actual.trim() ? `${actual}${contenido}` : contenido))
    campo.current?.focus()
  }

  async function enviarSticker(sticker: StickerTienda) {
    try {
      const respuesta = await fetch(sticker.url)
      if (!respuesta.ok) throw new Error('Giphy no entregó el archivo')
      const blob = await respuesta.blob()
      const jpeg = await archivoComoJpeg(blob, sticker.id)
      setEmojisAbiertos(false)
      await enviar({ texto: '', archivo: jpeg })
    } catch {
      avisoError(new Error('No se pudo enviar el sticker.'), 'Stickers')
    }
  }

  async function enviarUbicacion() {
    if (!navigator.geolocation) {
      avisoError(new Error('Este navegador no comparte ubicación.'), 'No se pudo enviar')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void enviar({
          texto: '',
          tipo: 'location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: 'Mi ubicación',
        })
      },
      () => avisoError(new Error('No autorizaste la ubicación.'), 'No se pudo enviar'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function empezarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const tipo = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((opcion) =>
        MediaRecorder.isTypeSupported(opcion),
      )
      const recorder = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined)
      trozos.current = []
      recorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) trozos.current.push(evento.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((pista) => pista.stop())
        const blob = new Blob(trozos.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size < 800) return
        const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm'
        const nota = new File([blob], `nota-de-voz.${extension}`, { type: blob.type })
        void enviar({ texto: '', archivo: nota })
      }
      grabacion.current = recorder
      recorder.start()
      setGrabando(true)
      setSegundos(0)
      reloj.current = window.setInterval(() => setSegundos((n) => n + 1), 1000)
    } catch {
      avisoError(new Error('No se pudo usar el micrófono.'), 'Audio')
    }
  }

  function detenerGrabacion(cancelar = false) {
    window.clearInterval(reloj.current)
    setGrabando(false)
    setSegundos(0)
    const recorder = grabacion.current
    grabacion.current = null
    if (!recorder || recorder.state === 'inactive') return
    if (cancelar) {
      recorder.ondataavailable = null
      recorder.onstop = () => recorder.stream.getTracks().forEach((pista) => pista.stop())
    }
    recorder.stop()
  }

  return (
    <div className="border-t border-[var(--wa-borde)] bg-[var(--wa-panel)] px-2 py-2 sm:px-3" data-tour="redactor">
      {cita ? (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-[3px] border-[var(--wa-verde)] bg-white px-3 py-2 text-sm shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[var(--wa-verde-oscuro)]">{cita.de}</p>
            <p className="line-clamp-2 text-[13px] text-[var(--wa-muted)]">{cita.texto || 'Archivo adjunto'}</p>
          </div>
          <Button variant="ghost" size="icon-xs" className="text-[var(--wa-muted)]" aria-label="Cancelar respuesta" onClick={alCancelarCita}>
            <X />
          </Button>
        </div>
      ) : null}

      {archivo ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm shadow-sm">
          {archivo.type.startsWith('image/') ? (
            <img src={URL.createObjectURL(archivo)} alt="" className="size-10 rounded object-cover" />
          ) : (
            <Paperclip className="size-4 shrink-0 text-[var(--wa-muted)]" />
          )}
          <span className="truncate">{tipoArchivo === 'sticker' ? 'Sticker' : archivo.name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-[var(--wa-muted)]"
            aria-label="Quitar archivo"
            onClick={() => {
              setArchivo(null)
              setTipoArchivo(undefined)
            }}
          >
            <X />
          </Button>
        </div>
      ) : null}
      {errorArchivo ? <p className="mb-2 text-xs text-destructive">{errorArchivo}</p> : null}

      {emojisAbiertos ? (
        <PanelExpresiones
          alEmoji={(emoji) => {
            insertar(emoji)
          }}
          alSticker={(sticker) => void enviarSticker(sticker)}
        />
      ) : null}

      {grabando ? (
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
          <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="tabular-nums text-[var(--wa-texto)]">{formatoTiempo(segundos)}</span>
          <span className="text-[var(--wa-muted)]">Soltar para enviar</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => detenerGrabacion(true)}>
            Cancelar
          </Button>
          <Button size="sm" className="bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)]" onClick={() => detenerGrabacion(false)}>
            Enviar audio
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-1">
        <input
          ref={selector}
          type="file"
          accept={acepta.current}
          className="hidden"
          onChange={(evento) => {
            elegirArchivo(evento.target.files?.[0], tipoArchivo)
            evento.target.value = ''
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="text-[var(--wa-muted)] hover:bg-black/5 hover:text-[var(--wa-texto)]"
                aria-label="Adjuntar"
                title="Adjuntar"
              />
            }
          >
            <Paperclip />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem onClick={() => abrirSelector('image/*')}>
              <ImagePlus /> Foto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirSelector('video/*')}>
              <Video /> Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirSelector('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')}>
              <FileText /> Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirSelector('image/webp,.webp', 'sticker')}>
              <Sticker /> Sticker (WebP)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirSelector('audio/*')}>
              <Mic /> Audio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void enviarUbicacion()}>
              <MapPin /> Ubicación actual
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="text-[var(--wa-muted)] hover:bg-black/5 hover:text-[var(--wa-texto)]"
                aria-label="Respuestas rápidas"
                title="Respuestas rápidas"
                data-tour="respuestas-rapidas"
              />
            }
          >
            <Zap />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-80 w-72 overflow-y-auto" align="start" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Respuestas rápidas</DropdownMenuLabel>
            </DropdownMenuGroup>
            {respuestas.data?.length ? (
              respuestas.data.map((respuesta) => (
                <DropdownMenuItem key={respuesta.id} onClick={() => insertar(respuesta.contenido)} className="flex-col items-start gap-0.5">
                  <span className="font-medium">{respuesta.nombre}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{respuesta.contenido}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>{respuestas.isLoading ? 'Cargando…' : 'Aún no tienes respuestas rápidas'}</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={alUsarPlantilla}>
              <LayoutTemplate /> Enviar plantilla de WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-lg"
          className="text-[var(--wa-muted)] hover:bg-black/5 hover:text-[var(--wa-texto)]"
          aria-label="Emojis y stickers"
          title="Emojis y stickers"
          onClick={() => setEmojisAbiertos((v) => !v)}
        >
          <Smile />
        </Button>

        <textarea
          ref={campo}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={alTeclear}
          rows={1}
          placeholder={archivo ? 'Añade un comentario (opcional)' : 'Escribe un mensaje'}
          aria-label="Mensaje"
          className="field-sizing-content max-h-36 min-h-11 flex-1 resize-none rounded-[24px] border-0 bg-white px-4 py-2.5 text-[15px] text-[var(--wa-texto)] shadow-sm outline-none placeholder:text-[var(--wa-muted)] focus-visible:ring-0"
        />

        {puedeEnviar ? (
          <Button
            size="icon-lg"
            className="rounded-full bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)] disabled:bg-[#aebac1] disabled:opacity-100"
            aria-label="Enviar"
            disabled={enviando}
            onClick={() => void enviar()}
          >
            {enviando ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
          </Button>
        ) : (
          <Button
            size="icon-lg"
            className="rounded-full bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)]"
            aria-label={grabando ? 'Detener audio' : 'Grabar audio'}
            disabled={enviando}
            onClick={() => (grabando ? detenerGrabacion(false) : void empezarGrabacion())}
          >
            {enviando ? <Loader2 className="animate-spin" /> : <Mic />}
          </Button>
        )}
      </div>
    </div>
  )
}

function formatoTiempo(segundos: number): string {
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}
