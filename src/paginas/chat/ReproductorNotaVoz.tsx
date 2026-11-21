import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { leerSesion, nombreVisible } from '@/sesion'
import { AvatarWa } from './iconosWa'

function formatoDuracion(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00'
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function barrasOnda(semilla: number, cantidad = 34): number[] {
  let x = Math.abs(semilla) % 2147483647 || 1
  const out: number[] = []
  for (let i = 0; i < cantidad; i++) {
    x = (x * 16807) % 2147483647
    const n = (x % 100) / 100
    out.push(0.2 + n * 0.8)
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
  const usuario = leerSesion()?.usuario
  const nombre = usuario ? nombreVisible(usuario) : 'Tú'
  const foto = usuario?.foto ?? null

  const ratio = duracion > 0 ? Math.min(1, actual / duracion) : 0
  const duracionTxt = duracion > 0 ? formatoDuracion(duracion) : reproduciendo ? formatoDuracion(actual) : '0:00'

  useEffect(() => {
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
        'relative flex min-w-[240px] max-w-[min(100%,280px)] items-center gap-2 px-1 pt-0.5',
        entrante ? 'pb-1 pr-0.5' : 'pb-1 pl-0.5',
      )}
    >
      {!entrante ? (
        <AvatarWa nombre={nombre} foto={foto} className="size-[34px] shrink-0 ring-2 ring-[var(--wa-verde-claro)]" />
      ) : null}

      <button
        type="button"
        onClick={alternar}
        className={cn(
          'flex size-[34px] shrink-0 items-center justify-center rounded-full transition-colors',
          entrante
            ? 'bg-[var(--wa-verde)] text-white shadow-sm hover:bg-[var(--wa-verde-oscuro)]'
            : 'bg-[#d1f4cc] text-[#008069] hover:bg-[#c0edd6] dark:bg-[#005c4b] dark:text-[#d9fdd3]',
        )}
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
      >
        {reproduciendo ? (
          <Pause className="size-[15px] fill-current" />
        ) : (
          <Play className="ml-0.5 size-[15px] fill-current" />
        )}
      </button>

      <div className="relative min-w-0 flex-1 pt-0.5">
        {entrante ? (
          <div className="flex h-[30px] items-center">
            <div className="relative h-[3px] w-full rounded-full bg-[#d1d7db] dark:bg-[#3b4a54]">
              <span
                className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-[var(--wa-verde)] shadow-sm"
                style={{ left: `calc(${ratio * 100}% - 5px)` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-[30px] items-end gap-[1.5px]" role="img" aria-label="Forma de onda">
            {barras.map((altura, i) => {
              const activa = i / barras.length <= ratio
              return (
                <span
                  key={i}
                  className={cn('w-[2px] min-h-[3px] rounded-sm', activa ? 'bg-[#3b4a54]/55' : 'bg-[#3b4a54]/28')}
                  style={{ height: `${Math.max(3, Math.round(altura * 26))}px` }}
                />
              )
            })}
          </div>
        )}
        <span
          className="pointer-events-none absolute bottom-0 left-0 text-[11px] leading-none tabular-nums text-[var(--wa-muted)]"
          aria-hidden
        >
          {duracionTxt}
        </span>
      </div>

      {entrante ? <AvatarWa nombre="Cliente" className="size-[34px] shrink-0" /> : null}

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