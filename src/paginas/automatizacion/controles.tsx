import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, Loader2, Upload, X } from 'lucide-react'
import { subirArchivoFlujo, type DatosPaso, type TipoArchivoFlujo } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { avisoError } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { DIAS, type Horario } from '@/lib/editorPasos'
import { MAX_PAUSA, minutosSinRespuesta } from './tipos'

/** Piezas de formulario que comparten el panel de cada paso y la configuración del flujo. */

export function SelectorHorario({ datos, alCambiar }: { datos: Horario; alCambiar: (h: Horario) => void }) {
  const dias = Array.isArray(datos.dias) ? datos.dias : []

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <Label>Días</Label>
        <div className="flex flex-wrap gap-1">
          {DIAS.map((dia) => {
            const activo = dias.includes(dia.valor)
            return (
              <button
                key={dia.valor}
                type="button"
                title={dia.largo}
                aria-pressed={activo}
                onClick={() => alCambiar({ ...datos, dias: activo ? dias.filter((d) => d !== dia.valor) : [...dias, dia.valor].sort() })}
                className={cn(
                  'flex size-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                  activo ? 'border-foreground/20 bg-foreground text-background' : 'border-input bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {dia.corto}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Desde</Label>
          <Input type="time" value={datos.desde ?? ''} onChange={(e) => alCambiar({ ...datos, desde: e.target.value })} className="h-9" />
        </div>
        <div className="grid gap-2">
          <Label>Hasta</Label>
          <Input type="time" value={datos.hasta ?? ''} onChange={(e) => alCambiar({ ...datos, hasta: e.target.value })} className="h-9" />
        </div>
      </div>
    </div>
  )
}

/** Sección plegable para configuraciones que casi nunca se tocan. */
export function Avanzado({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium"
      >
        Ajustes avanzados
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', abierto && 'rotate-180')} />
      </button>
      {abierto ? <div className="space-y-5 border-t p-3">{children}</div> : null}
    </div>
  )
}

export function Pausa({ datos, poner }: { datos: DatosPaso; poner: (parcial: DatosPaso) => void }) {
  return (
    <Numero
      etiqueta="Esperar antes de enviarlo (segundos)"
      valor={Number(datos.pausa ?? 0)}
      min={0}
      max={MAX_PAUSA}
      alCambiar={(v) => poner({ pausa: v })}
      ayuda="Hace que el bot parezca más humano: escribe con un pequeño retraso en vez de responder al instante. Máximo 10 segundos."
    />
  )
}

/** Tiempo que espera el bot a que el cliente responda antes de seguir por otro camino. */
export function SinRespuesta({ datos, poner }: { datos: DatosPaso; poner: (parcial: DatosPaso) => void }) {
  const minutos = minutosSinRespuesta(datos)
  const guardada = Number(datos.timeout_unidad)
  const unidad =
    [1, 60, 1440].includes(guardada) && minutos % guardada === 0 ? guardada : minutos % 1440 === 0 ? 1440 : minutos % 60 === 0 ? 60 : 1
  const cantidad = minutos > 0 ? minutos / unidad : 0

  return (
    <div className="space-y-3">
      <Interruptor
        etiqueta="Seguir si el cliente no responde"
        ayuda="Crea una salida extra «Sin respuesta» para, por ejemplo, recordarle o cerrar la conversación."
        valor={minutos > 0}
        alCambiar={(v) => poner({ timeout_min: v ? 30 : 0 })}
      />
      {minutos > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <Numero
            etiqueta="Esperar"
            valor={cantidad}
            min={1}
            max={43200}
            alCambiar={(v) => poner({ timeout_min: v * unidad, timeout_unidad: unidad })}
          />
          <Seleccion
            etiqueta="Unidad"
            valor={String(unidad)}
            alCambiar={(v) => poner({ timeout_min: Math.max(1, cantidad) * Number(v), timeout_unidad: Number(v) })}
            opciones={[
              { valor: '1', etiqueta: 'minutos' },
              { valor: '60', etiqueta: 'horas' },
              { valor: '1440', etiqueta: 'días' },
            ]}
          />
        </div>
      ) : null}
    </div>
  )
}

export function Numero({
  etiqueta,
  valor,
  min,
  max,
  alCambiar,
  ayuda,
}: {
  etiqueta: string
  valor: number
  min: number
  max: number
  alCambiar: (v: number) => void
  ayuda?: string
}) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(valor) ? valor : min}
        onChange={(e) => alCambiar(Math.min(max, Math.max(min, Math.floor(Number(e.target.value) || min))))}
        className="h-9"
      />
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}

const ACEPTA: Record<TipoArchivoFlujo, string> = {
  imagen: 'image/jpeg,image/png',
  video: 'video/mp4,video/3gpp',
  audio: 'audio/mpeg,audio/mp4,audio/aac,audio/amr,audio/ogg,.mp3,.m4a,.aac,.ogg',
  documento: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
}

const AYUDA_ARCHIVO: Record<TipoArchivoFlujo, string> = {
  imagen: 'JPG o PNG, hasta 5 MB.',
  video: 'MP4 o 3GP, hasta 16 MB.',
  audio: 'MP3, M4A, AAC, AMR u OGG, hasta 16 MB.',
  documento: 'PDF, Word, Excel, PowerPoint o TXT, hasta 20 MB.',
}

/** Subir un archivo desde la computadora o pegar un enlace. */
export function SubirArchivo({
  tipo,
  url,
  nombre,
  alCambiar,
}: {
  tipo: TipoArchivoFlujo
  url: string
  nombre: string
  alCambiar: (url: string, nombre: string) => void
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  const elegir = async (archivo: File | undefined) => {
    if (!archivo) {
      return
    }
    setSubiendo(true)
    try {
      const subido = await subirArchivoFlujo(archivo, tipo)
      alCambiar(subido.url, subido.nombre)
    } catch (error) {
      avisoError(error, 'No se pudo subir el archivo')
    } finally {
      setSubiendo(false)
      if (entrada.current) {
        entrada.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-3">
      {tipo === 'imagen' && url ? <img src={url} alt="" className="max-h-40 w-full rounded-lg bg-zinc-100 object-contain" /> : null}
      {tipo === 'video' && url ? <video src={url} controls className="max-h-40 w-full rounded-lg bg-black" /> : null}
      {tipo === 'audio' && url ? <audio src={url} controls className="w-full" /> : null}
      {tipo === 'documento' && url ? <p className="truncate rounded-lg bg-zinc-100 px-3 py-2 text-sm">📄 {nombre || 'Documento'}</p> : null}

      <input ref={entrada} type="file" accept={ACEPTA[tipo]} hidden onChange={(e) => void elegir(e.target.files?.[0])} />
      <Button variant="outline" className="w-full" disabled={subiendo} onClick={() => entrada.current?.click()}>
        {subiendo ? <Loader2 className="animate-spin" /> : <Upload />}
        {subiendo ? 'Subiendo…' : url ? 'Cambiar archivo' : 'Subir desde mi computadora'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{AYUDA_ARCHIVO[tipo]}</p>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">¿Ya lo tienes en internet? Pega el enlace</summary>
        <Input
          value={url}
          onChange={(e) => alCambiar(e.target.value, nombre)}
          placeholder="https://…"
          className="mt-2 h-9"
          aria-label="Enlace del archivo"
        />
      </details>
    </div>
  )
}

export function Nota({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-zinc-100 p-3 text-xs leading-relaxed text-zinc-600">{children}</p>
}

export function Texto({
  etiqueta,
  valor,
  alCambiar,
  marcador,
  ayuda,
  max,
}: {
  etiqueta: string
  valor: string
  alCambiar: (v: string) => void
  marcador?: string
  ayuda?: string
  max?: number
}) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{etiqueta}</Label>
        {max ? <Contador valor={valor} max={max} /> : null}
      </div>
      <Input id={id} value={valor} onChange={(e) => alCambiar(e.target.value)} placeholder={marcador} className="h-9" />
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}

function Contador({ valor, max }: { valor: string; max: number }) {
  const largo = Array.from(valor).length
  return <span className={cn('text-xs tabular-nums', largo > max ? 'font-semibold text-rose-600' : 'text-muted-foreground')}>{largo}/{max}</span>
}

export function Area({
  etiqueta,
  valor,
  alCambiar,
  variables,
  max,
  ayuda,
  opcional,
}: {
  etiqueta: string
  valor: string
  alCambiar: (v: string) => void
  variables: string[]
  max: number
  ayuda?: string
  opcional?: boolean
}) {
  const id = useId()
  const referencia = useRef<HTMLTextAreaElement>(null)

  const insertar = (nombre: string) => {
    const campo = referencia.current
    const marca = `{{${nombre}}}`
    const inicio = campo?.selectionStart ?? valor.length
    const fin = campo?.selectionEnd ?? valor.length
    alCambiar(valor.slice(0, inicio) + marca + valor.slice(fin))
    requestAnimationFrame(() => {
      campo?.focus()
      campo?.setSelectionRange(inicio + marca.length, inicio + marca.length)
    })
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {etiqueta}
          {opcional ? <span className="font-normal text-muted-foreground">(opcional)</span> : null}
        </Label>
        <Contador valor={valor} max={max} />
      </div>
      <textarea
        ref={referencia}
        id={id}
        value={valor}
        rows={4}
        onChange={(e) => alCambiar(e.target.value)}
        className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {variables.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Insertar:</span>
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertar(v)}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              {v}
            </button>
          ))}
        </div>
      ) : null}
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}

export function Seleccion({
  etiqueta,
  valor,
  alCambiar,
  opciones,
  ayuda,
}: {
  etiqueta: string
  valor: string
  alCambiar: (v: string) => void
  opciones: { valor: string; etiqueta: string }[]
  ayuda?: string
}) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <select
        id={id}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}

export function Interruptor({ etiqueta, ayuda, valor, alCambiar }: { etiqueta: string; ayuda?: string; valor: boolean; alCambiar: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{etiqueta}</p>
        {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
      </div>
      <Switch checked={valor} onCheckedChange={alCambiar} />
    </div>
  )
}

export function FilaOpcion({
  valor,
  max,
  marcador,
  puedeQuitar,
  alCambiar,
  alQuitar,
}: {
  valor: string
  max: number
  marcador: string
  puedeQuitar: boolean
  alCambiar: (v: string) => void
  alQuitar: () => void
}) {
  const largo = Array.from(valor).length
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-1">
        <Input value={valor} placeholder={marcador} onChange={(e) => alCambiar(e.target.value)} className="h-9 pr-12" aria-invalid={largo > max} />
        <span className={cn('pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] tabular-nums', largo > max ? 'text-rose-600' : 'text-muted-foreground')}>
          {largo}/{max}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={alQuitar} disabled={!puedeQuitar} aria-label="Quitar" className="text-muted-foreground">
        <X />
      </Button>
    </div>
  )
}

export function Palabras({
  etiqueta,
  valores,
  alCambiar,
  ayuda,
  ejemplo,
  maximo = 50,
  largo = 60,
}: {
  etiqueta: string
  valores: string[]
  alCambiar: (v: string[]) => void
  ayuda?: string
  ejemplo?: string
  /** Cuántas palabras como máximo. */
  maximo?: number
  /** Letras por palabra como máximo. */
  largo?: number
}) {
  const [borrador, setBorrador] = useState('')
  const id = useId()
  const lleno = valores.length >= maximo

  const agregar = () => {
    const limpio = borrador.trim().replace(/\s+/g, ' ').slice(0, largo)
    if (limpio && !lleno && !valores.some((v) => v.toLowerCase() === limpio.toLowerCase())) {
      alCambiar([...valores, limpio])
    }
    setBorrador('')
  }
  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      agregar()
    } else if (e.key === 'Backspace' && borrador === '' && valores.length) {
      alCambiar(valores.slice(0, -1))
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-white px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {valores.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            {v}
            <button type="button" onClick={() => alCambiar(valores.filter((x) => x !== v))} aria-label={`Quitar ${v}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={alTeclear}
          onBlur={agregar}
          maxLength={largo}
          disabled={lleno}
          placeholder={lleno ? `Máximo ${maximo}` : valores.length ? '' : ejemplo}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}
