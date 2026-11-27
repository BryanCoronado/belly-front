import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Camera,
  FileText,
  ImagePlus,
  BookImage,
  LayoutTemplate,
  Loader2,
  MapPin,
  Mic,
  Paperclip,
  Pause,
  Plus,
  Sticker,
  Trash2,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { leerRespuestasRapidas, type RespuestaRapida } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { useModoAhorro } from '@/lib/modo-ahorro'
import { FormularioRespuesta } from '@/paginas/plantillas/FormularioRespuesta'
import { ListaProductosCatalogo } from '@/paginas/catalogo/SelectorCatalogo'
import { CapturaCamara } from './CapturaCamara'
import { OndaGrabacion } from './OndaGrabacion'
import { PanelExpresiones } from './PanelExpresiones'
import { cn } from '@/lib/utils'
import { IconoAdjuntar, IconoEnviar, IconoMicrofono, IconoSticker } from './iconosWa'

const LIMITE_ARCHIVO_MB = 16
const CLASE_ICONO =
  'flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--wa-icono)] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]'

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
  tipo?: 'sticker' | 'location' | 'audio'
  latitude?: number
  longitude?: number
  name?: string
  mediaUrl?: string
}

const borradores = new Map<number, string>()

type Props = {
  idConversacion: number
  ventanaAbierta: boolean
  enviando: boolean
  cita?: CitaRedactor | null
  alCancelarCita?: () => void
  alEnviar: (envio: EnvioRedactor) => Promise<unknown>
  alUsarPlantilla: () => void
}

export function Redactor({ idConversacion, ventanaAbierta, enviando, cita, alCancelarCita, alEnviar, alUsarPlantilla }: Props) {
  const [texto, setTexto] = useState(() => borradores.get(idConversacion) ?? '')
  const [idPrevio, setIdPrevio] = useState(idConversacion)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [tipoArchivo, setTipoArchivo] = useState<'sticker' | undefined>()
  const [errorArchivo, setErrorArchivo] = useState('')
  const [emojisAbiertos, setEmojisAbiertos] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [camara, setCamara] = useState<'foto' | 'video' | null>(null)
  const [crearRespuesta, setCrearRespuesta] = useState(false)
  const [catalogoAbierto, setCatalogoAbierto] = useState(false)
  const consultas = useQueryClient()
  const { ahorro } = useModoAhorro()
  const campo = useRef<HTMLTextAreaElement>(null)
  const selector = useRef<HTMLInputElement>(null)
  const acepta = useRef('image/*')
  const grabacion = useRef<MediaRecorder | null>(null)
  const trozos = useRef<Blob[]>([])
  const reloj = useRef<number>(0)
  const respuestas = useQuery({ queryKey: ['respuestas-rapidas'], queryFn: leerRespuestasRapidas, staleTime: 60_000 })

  if (idPrevio !== idConversacion) {
    setIdPrevio(idConversacion)
    setTexto(borradores.get(idConversacion) ?? '')
    setArchivo(null)
    setTipoArchivo(undefined)
    setErrorArchivo('')
    setEmojisAbiertos(false)
  }

  useEffect(() => {
    if (texto) borradores.set(idConversacion, texto)
    else borradores.delete(idConversacion)
  }, [idConversacion, texto])

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) campo.current?.focus()
    return () => detenerGrabacion(true)
  }, [idConversacion])

  useEffect(() => {
    if (cita) campo.current?.focus()
  }, [cita])

  if (!ventanaAbierta) {
    return (
      <div
        className="flex items-center justify-between gap-3 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
        data-tour="redactor"
      >
        <p className="min-w-0 text-[13px] leading-snug text-[var(--wa-muted)]">
          Ventana de 24 h cerrada · solo plantillas de WhatsApp
        </p>
        <Button
          size="sm"
          className="h-9 shrink-0 rounded-full bg-[var(--wa-verde)] px-4 text-white hover:bg-[var(--wa-verde-oscuro)]"
          onClick={alUsarPlantilla}
        >
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

  function envolver(marca: string) {
    const el = campo.current
    if (!el) return
    const a = el.selectionStart
    const b = el.selectionEnd
    const seleccionado = texto.slice(a, b) || 'texto'
    const nuevo = `${texto.slice(0, a)}${marca}${seleccionado}${marca}${texto.slice(b)}`
    setTexto(nuevo)
    requestAnimationFrame(() => {
      el.focus()
      const desde = a + marca.length
      el.setSelectionRange(desde, desde + seleccionado.length)
    })
  }

  function alTeclear(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      alCancelarCita?.()
      setEmojisAbiertos(false)
      return
    }
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'b') {
      evento.preventDefault()
      envolver('*')
      return
    }
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'i') {
      evento.preventDefault()
      envolver('_')
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

  async function usarRespuesta(respuesta: RespuestaRapida) {
    if (respuesta.contenido) insertar(respuesta.contenido)
    if (!respuesta.imagen_url) return
    try {
      const archivoImg = await fetch(respuesta.imagen_url)
      if (!archivoImg.ok) return
      const blob = await archivoImg.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      elegirArchivo(new File([blob], `${respuesta.nombre}.${ext}`, { type: blob.type || 'image/jpeg' }))
    } catch {
      /* el texto ya quedó */
    }
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
        const mimeGrabado = recorder.mimeType || 'audio/webm'
        const mime = mimeGrabado.includes('ogg')
          ? 'audio/ogg'
          : mimeGrabado.includes('mp4')
            ? 'audio/mp4'
            : 'audio/webm'
        const blob = new Blob(trozos.current, { type: mime })
        if (blob.size < 800) return
        const extension = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'
        const nota = new File([blob], `nota-de-voz.${extension}`, { type: mime })
        void enviar({ texto: '', archivo: nota, tipo: 'audio' })
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
    <div className="shrink-0 bg-transparent px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4" data-tour="redactor">
      {ahorro ? (
        <p className="mb-2 rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] text-primary">
          Modo ahorro · este envío consume el cupo de WhatsApp. Si podés, contestá desde el celular.
        </p>
      ) : null}
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
          ) : archivo.type.startsWith('video/') ? (
            <Video className="size-4 shrink-0 text-[var(--wa-muted)]" />
          ) : (
            <Paperclip className="size-4 shrink-0 text-[var(--wa-muted)]" />
          )}
          <span className="truncate">{tipoArchivo === 'sticker' ? 'Sticker' : etiquetaArchivo(archivo)}</span>
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
      {enviando ? (
        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--wa-muted)]">
          <Loader2 className="size-4 animate-spin" /> Enviando…
        </div>
      ) : null}

      {emojisAbiertos ? (
        <PanelExpresiones
          alEmoji={(emoji) => {
            insertar(emoji)
          }}
          alSticker={(sticker) => void enviarSticker(sticker)}
        />
      ) : null}

      {grabando ? (
        <div className="flex min-w-0 items-center gap-1 rounded-[26px] bg-[var(--wa-composer)] px-2 py-2 shadow-[0_1px_2px_rgba(11,20,26,0.12)]">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-black/[0.06]"
            aria-label="Descartar grabación"
            onClick={() => detenerGrabacion(true)}
          >
            <Trash2 className="size-5" />
          </button>
          <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden />
          <span className="shrink-0 text-[15px] font-normal tabular-nums text-[var(--wa-texto)]">{formatoTiempo(segundos)}</span>
          <OndaGrabacion activo />
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
            aria-label="Detener y enviar"
            onClick={() => detenerGrabacion(false)}
          >
            <Pause className="size-5 fill-current" />
          </button>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#111b21] text-white hover:bg-[#2a3942] dark:bg-[#00a884] dark:hover:bg-[#008069]"
            aria-label="Enviar nota de voz"
            onClick={() => detenerGrabacion(false)}
          >
            <IconoEnviar className="size-5" />
          </button>
        </div>
      ) : (
      <div className="flex min-w-0 items-end gap-0.5 rounded-[26px] bg-[var(--wa-composer)] px-1.5 py-[5px] shadow-[0_1px_2px_rgba(11,20,26,0.12)]">
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
              <button type="button" className={CLASE_ICONO} aria-label="Adjuntar" title="Adjuntar" />
            }
          >
            <IconoAdjuntar className="size-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem onClick={() => abrirSelector('image/*')}>
              <ImagePlus /> Foto de galería
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCamara('foto')}>
              <Camera /> Tomar foto
            </DropdownMenuItem>
            {ahorro ? null : (
              <DropdownMenuItem onClick={() => abrirSelector('video/*')}>
                <Video /> Video de galería
              </DropdownMenuItem>
            )}
            {ahorro ? null : (
              <DropdownMenuItem onClick={() => setCamara('video')}>
                <Video /> Grabar video
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => abrirSelector('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')}>
              <FileText /> Documento
            </DropdownMenuItem>
            {ahorro ? null : (
              <DropdownMenuItem onClick={() => abrirSelector('image/webp,.webp', 'sticker')}>
                <Sticker /> Sticker (WebP)
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => abrirSelector('audio/*')}>
              <Mic /> Audio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void enviarUbicacion()}>
              <MapPin /> Ubicación actual
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCatalogoAbierto(true)}>
              <BookImage /> Producto del catálogo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className={cn(CLASE_ICONO, emojisAbiertos && 'text-[var(--wa-verde)]')}
          aria-label="Emojis y stickers"
          title="Emojis y stickers"
          onClick={() => setEmojisAbiertos((v) => !v)}
        >
          <IconoSticker className="size-6" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={CLASE_ICONO}
                aria-label="Respuestas rápidas"
                title="Respuestas rápidas"
                data-tour="respuestas-rapidas"
              />
            }
          >
            <Zap className="size-[22px]" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-80 w-72 overflow-y-auto" align="start" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Respuestas rápidas</DropdownMenuLabel>
            </DropdownMenuGroup>
            {respuestas.data?.length ? (
              respuestas.data.map((respuesta) => (
                <DropdownMenuItem key={respuesta.id} onClick={() => void usarRespuesta(respuesta)} className="flex-col items-start gap-0.5">
                  <span className="font-medium">{respuesta.nombre}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{respuesta.contenido || 'Imagen'}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>{respuestas.isLoading ? 'Cargando…' : 'Aún no tienes respuestas rápidas'}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCrearRespuesta(true)}>
              <Plus /> Nueva respuesta rápida
            </DropdownMenuItem>
            <DropdownMenuItem onClick={alUsarPlantilla}>
              <LayoutTemplate /> Enviar plantilla de WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="min-w-0 flex-1 overflow-hidden">
          <textarea
            ref={campo}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={alTeclear}
            rows={1}
            placeholder={archivo ? 'Añade un comentario (opcional)' : 'Escribe un mensaje'}
            title="Negrita Ctrl+B · Cursiva Ctrl+I"
            aria-label="Mensaje"
            className="field-sizing-content block max-h-36 min-h-10 w-full min-w-0 max-w-full resize-none border-0 bg-transparent px-2 py-[9px] text-[15px] leading-[22px] text-[var(--wa-texto)] outline-none placeholder:text-[var(--wa-muted)] focus-visible:ring-0"
          />
        </div>

        {puedeEnviar ? (
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)] disabled:bg-[#aebac1]"
            aria-label="Enviar"
            disabled={enviando}
            onClick={() => void enviar()}
          >
            {enviando ? <Loader2 className="size-5 animate-spin" /> : <IconoEnviar className="size-5" />}
          </button>
        ) : (
          <button
            type="button"
            className={cn(CLASE_ICONO, grabando && 'bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)]')}
            aria-label={grabando ? 'Detener audio' : 'Grabar audio'}
            title={grabando ? 'Detener y enviar' : 'Mensaje de voz'}
            disabled={enviando}
            onClick={() => (grabando ? detenerGrabacion(false) : void empezarGrabacion())}
          >
            {enviando ? <Loader2 className="size-5 animate-spin" /> : <IconoMicrofono className="size-6" />}
          </button>
        )}
      </div>
      )}

      <CapturaCamara
        modo={camara}
        alCerrar={() => setCamara(null)}
        alCapturar={(archivo) => elegirArchivo(archivo)}
      />

      <Dialog open={catalogoAbierto} onOpenChange={setCatalogoAbierto}>
        <DialogContent className="p-0 sm:max-w-md">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>Enviar del catálogo</DialogTitle>
            <DialogDescription>Va con foto, nombre, precio y descripción, listo para WhatsApp.</DialogDescription>
          </DialogHeader>
          <ListaProductosCatalogo
            alElegir={(envio) => {
              setCatalogoAbierto(false)
              void enviar({ texto: envio.texto, mediaUrl: envio.imagen_url ?? undefined })
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={crearRespuesta} onOpenChange={(abrir) => !abrir && setCrearRespuesta(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva respuesta rápida</DialogTitle>
            <DialogDescription>Queda en el rayo para usarla en cualquier chat.</DialogDescription>
          </DialogHeader>
          <FormularioRespuesta
            respuesta={null}
            alCerrar={() => setCrearRespuesta(false)}
            alGuardar={() => void consultas.invalidateQueries({ queryKey: ['respuestas-rapidas'] })}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatoTiempo(segundos: number): string {
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}

function etiquetaArchivo(archivo: File): string {
  if (archivo.type.startsWith('image/')) return 'Foto'
  if (archivo.type.startsWith('video/')) return 'Video'
  if (archivo.type.startsWith('audio/')) return 'Audio'
  return archivo.name
}
