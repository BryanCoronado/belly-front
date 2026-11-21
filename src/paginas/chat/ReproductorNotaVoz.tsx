import { Mic, Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

function formatoDuracion(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00'
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Barras pseudo-aleatorias estables por mensaje (visual tipo WhatsApp Web). */
function barrasOnda(semilla: number, cantidad = 28): number[] {
  let x = Math.abs(semilla) % 2147483647 || 1
  const out: number[] = []
  for (let i = 0; i < cantidad; i++) {
    x = (x * 16807) % 2147483647
    const n = (x % 100) / 100
    out.push(0.25 + n * 0.75)
  }
  return out
}

type Props = {
  url: string
  entrante: boolean
  mensajeId: number
}

export function ReproductorNotaVoz({ url, entrante, mensajeId }: Props) {
  const audio = useRef<HTMLAudioElement>(null)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [duracion, setDuracion] = useState(0)
  const [actual, setActual] = useState(0)
  const barras = useMemo(() => barrasOnda(mensajeId), [mensajeId])

  const ratio = duracion > 0 ? Math.min(1, actual / duracion) : 0
  const mostrar = duracion > 0 ? formatoDuracion(duracion) : formatoDuracion(actual)

  useEffect(() => {
    const el = audio.current
    if (!el) return
    setReproduciendo(false)
    setActual(0)
    setDuracion(0)
  }, [url])

  function alternar() {
    const el = audio.current
    if (!el) return
    if (reproduciendo) {
      el.pause()
      setReproduciendo(false)
      return
    }
    void el.play().then(() => setReproduciendo(true)).catch(() => setReproduciendo(false))
  }

  return (
    <div
      className={cn(
        'mb-0.5 flex min-w-[248px] max-w-[min(100%,300px)] items-center gap-2 py-0.5',
        entrante ? 'pr-1' : 'pl-0.5',
      )}
    >
      {!entrante ? (
        <span
          className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[var(--wa-muted)] dark:bg-[#2a3942]"
          aria-hidden
        >
          <Mic className="size-4" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--wa-verde)] text-white ring-2 ring-[var(--wa-verde-claro)] dark:ring-[#005c4b]">
            <Mic className="size-2.5" />
          </span>
        </span>
      ) : null}

      <button
        type="button"
        onClick={alternar}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
          entrante
            ? 'bg-[var(--wa-verde)] text-white hover:bg-[var(--wa-verde-oscuro)]'
            : 'bg-[#53bdeb] text-white hover:bg-[#4aa8d4]',
        )}
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
      >
        {reproduciendo ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex h-[26px] items-end gap-[2px]" role="img" aria-label="Forma de onda del audio">
          {barras.map((altura, i) => {
            const activa = i / barras.length <= ratio
            return (
              <span
                key={i}
                className={cn(
                  'w-[3px] min-h-[4px] rounded-full transition-colors',
                  entrante
                    ? activa
                      ? 'bg-[var(--wa-verde)]'
                      : 'bg-[var(--wa-chip-borde)]'
                    : activa
                      ? 'bg-[#53bdeb]'
                      : 'bg-[#b8d9ee]',
                )}
                style={{ height: `${Math.round(altura * 22)}px` }}
              />
            )
          })}
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums leading-none text-[var(--wa-muted)]">{mostrar}</p>
      </div>

      {entrante ? (
        <span className="size-9 shrink-0 rounded-full bg-[#dfe5e7] dark:bg-[#2a3942]" aria-hidden />
      ) : null}

      <audio
        ref={audio}
        src={url}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={() => setDuracion(audio.current?.duration ?? 0)}
        onTimeUpdate={() => setActual(audio.current?.currentTime ?? 0)}
        onEnded={() => {
          setReproduciendo(false)
          setActual(0)
          if (audio.current) audio.current.currentTime = 0
        }}
      />
    </div>
  )
}