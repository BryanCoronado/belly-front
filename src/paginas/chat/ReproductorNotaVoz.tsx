import { Mic, Pause, Play } from 'lucide-react'
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

function barrasOnda(semilla: number, cantidad = 40): number[] {
  let x = Math.abs(semilla) % 2147483647 || 1
  const out: number[] = []
  for (let i = 0; i < cantidad; i++) {
    x = (x * 16807) % 2147483647
    out.push(0.15 + ((x % 100) / 100) * 0.85)
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
  const [roto, setRoto] = useState(false)
  const barras = useMemo(() => barrasOnda(mensajeId), [mensajeId])
  const usuario = leerSesion()?.usuario
  const nombre = usuario ? nombreVisible(usuario) : 'Tú'

  const ratio = duracion > 0 ? Math.min(1, actual / duracion) : 0
  const tiempo = reproduciendo || actual > 0 ? formatoDuracion(actual) : formatoDuracion(duracion)

  useEffect(() => {
    setReproduciendo(false)
    setActual(0)
    setDuracion(0)
    setRoto(false)
  }, [url])

  function alCargar() {
    const el = audio.current
    if (!el) return
    // Las notas WebM de Chrome no traen duración hasta que se recorre el archivo.
    if (!Number.isFinite(el.duration)) {
      const alMedir = () => {
        el.removeEventListener('timeupdate', alMedir)
        setDuracion(Number.isFinite(el.duration) ? el.duration : 0)
        el.currentTime = 0
      }
      el.addEventListener('timeupdate', alMedir)
      el.currentTime = 1e7
      return
    }
    setDuracion(el.duration)
  }

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

  function saltar(evento: React.MouseEvent<HTMLDivElement>) {
    const el = audio.current
    if (!el || duracion <= 0) return
    const caja = evento.currentTarget.getBoundingClientRect()
    const nuevo = Math.min(1, Math.max(0, (evento.clientX - caja.left) / caja.width)) * duracion
    el.currentTime = nuevo
    setActual(nuevo)
  }

  const avatar = (
    <span className="relative shrink-0">
      <AvatarWa nombre={entrante ? 'Cliente' : nombre} foto={entrante ? null : usuario?.foto} className="size-[46px]" />
      <Mic
        className={cn(
          'absolute -bottom-0.5 size-[18px]',
          entrante ? '-left-1 text-[var(--wa-verde)]' : '-right-1 text-[#53bdeb]',
        )}
        strokeWidth={2.4}
      />
    </span>
  )

  return (
    <div className="flex w-[300px] max-w-full items-center gap-2.5 px-1 pt-1">
      {entrante ? null : avatar}

      <button
        type="button"
        onClick={alternar}
        className="flex size-8 shrink-0 items-center justify-center text-[#54656f] hover:text-[var(--wa-texto)] dark:text-[#8696a0]"
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
      >
        {reproduciendo ? <Pause className="size-6 fill-current" strokeWidth={0} /> : <Play className="size-6 fill-current" strokeWidth={0} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="relative flex h-[30px] cursor-pointer items-center gap-[2px]" onClick={saltar} role="slider" aria-valuenow={Math.round(ratio * 100)}>
          {barras.map((altura, i) => (
            <span
              key={i}
              className={cn(
                'w-[2.5px] flex-1 rounded-full',
                i / barras.length < ratio
                  ? entrante
                    ? 'bg-[var(--wa-verde)]'
                    : 'bg-[#53bdeb]'
                  : 'bg-[#8696a0]/60 dark:bg-[#8696a0]/50',
              )}
              style={{ height: `${Math.max(3, Math.round(altura * 24))}px` }}
            />
          ))}
          <span
            className={cn(
              'absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full',
              entrante ? 'bg-[var(--wa-verde)]' : 'bg-[#53bdeb]',
            )}
            style={{ left: `${ratio * 100}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] leading-none tabular-nums text-[var(--wa-muted)]">
          {roto ? 'Audio no disponible' : tiempo}
        </p>
      </div>

      {entrante ? avatar : null}

      <audio
        ref={audio}
        src={url}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={alCargar}
        onError={() => setRoto(true)}
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
