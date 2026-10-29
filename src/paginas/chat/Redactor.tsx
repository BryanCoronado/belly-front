import { useQuery } from '@tanstack/react-query'
import { LayoutTemplate, Loader2, Paperclip, SendHorizontal, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { leerRespuestasRapidas } from '@/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TIPOS_ARCHIVO = 'image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
const LIMITE_ARCHIVO_MB = 16

export type CitaRedactor = {
  wamid: string
  texto: string
  de: string
}

type Props = {
  ventanaAbierta: boolean
  enviando: boolean
  cita?: CitaRedactor | null
  alCancelarCita?: () => void
  alEnviar: (texto: string, archivo?: File) => Promise<unknown>
  alUsarPlantilla: () => void
}

export function Redactor({ ventanaAbierta, enviando, cita, alCancelarCita, alEnviar, alUsarPlantilla }: Props) {
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const campo = useRef<HTMLTextAreaElement>(null)
  const selectorArchivo = useRef<HTMLInputElement>(null)
  const respuestas = useQuery({ queryKey: ['respuestas-rapidas'], queryFn: leerRespuestasRapidas, staleTime: 60_000 })

  useEffect(() => {
    if (cita) campo.current?.focus()
  }, [cita])

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

  async function enviar() {
    if (!puedeEnviar) return
    const contenido = texto
    const adjunto = archivo ?? undefined
    setTexto('')
    setArchivo(null)
    try {
      await alEnviar(contenido.trim(), adjunto)
    } catch {
      setTexto(contenido)
      setArchivo(adjunto ?? null)
    }
    campo.current?.focus()
  }

  function alTeclear(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault()
      void enviar()
    }
  }

  function elegirArchivo(elegido: File | undefined) {
    setErrorArchivo('')
    if (!elegido) return
    if (elegido.size > LIMITE_ARCHIVO_MB * 1024 * 1024) {
      setErrorArchivo(`El archivo supera ${LIMITE_ARCHIVO_MB} MB.`)
      return
    }
    setArchivo(elegido)
  }

  function insertar(contenido: string) {
    setTexto((actual) => (actual.trim() ? `${actual} ${contenido}` : contenido))
    campo.current?.focus()
  }

  return (
    <div className="border-t border-[var(--wa-borde)] bg-[var(--wa-panel)] px-2 py-2 sm:px-3" data-tour="redactor">
      {cita ? (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-[3px] border-[var(--wa-verde)] bg-white px-3 py-2 text-sm shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[var(--wa-verde-oscuro)]">{cita.de}</p>
            <p className="line-clamp-2 text-[13px] text-[var(--wa-muted)]">{cita.texto || 'Archivo adjunto'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-[var(--wa-muted)]"
            aria-label="Cancelar respuesta"
            onClick={alCancelarCita}
          >
            <X />
          </Button>
        </div>
      ) : null}
      {archivo ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm shadow-sm">
          <Paperclip className="size-4 shrink-0 text-[var(--wa-muted)]" />
          <span className="truncate">{archivo.name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-[var(--wa-muted)]"
            aria-label="Quitar archivo"
            onClick={() => setArchivo(null)}
          >
            <X />
          </Button>
        </div>
      ) : null}
      {errorArchivo ? <p className="mb-2 text-xs text-destructive">{errorArchivo}</p> : null}

      <div className="flex items-end gap-1.5">
        <input
          ref={selectorArchivo}
          type="file"
          accept={TIPOS_ARCHIVO}
          className="hidden"
          onChange={(evento) => {
            elegirArchivo(evento.target.files?.[0])
            evento.target.value = ''
          }}
        />
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-[var(--wa-muted)] hover:bg-black/5 hover:text-[var(--wa-texto)]"
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
          onClick={() => selectorArchivo.current?.click()}
        >
          <Paperclip />
        </Button>

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
              <DropdownMenuItem disabled>
                {respuestas.isLoading ? 'Cargando…' : 'Aún no tienes respuestas rápidas'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={alUsarPlantilla}>
              <LayoutTemplate /> Enviar plantilla de WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

        <Button
          size="icon-lg"
          className="rounded-full bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)] disabled:bg-[#aebac1] disabled:opacity-100"
          aria-label="Enviar"
          disabled={!puedeEnviar}
          onClick={() => void enviar()}
        >
          {enviando ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </div>
    </div>
  )
}
