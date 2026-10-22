import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { FastForward, FileText, Headset, LoaderCircle, MapPin, Mic, RotateCcw, Send, Thermometer, Timer, Video, type LucideIcon } from 'lucide-react'
import { simularFlujo, type DefinicionFlujo, type EstadoBot, type MensajeBot, type ResultadoSimulacion } from '@/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InteractivoWa } from '../chat/InteractivoWa'

type Item = { id: number; de: 'bot' | 'yo' | 'aviso'; texto?: string; mensaje?: MensajeBot; icono?: LucideIcon }

const NOMBRE_EN_PRUEBA = 'tu asesor'
const MARCA_ASESOR = '[[asesor]]'

const TEXTO_ASIGNACION: Record<Extract<MensajeBot, { tipo: 'asignar' }>['modo'], string> = {
  mantener: 'El chat sigue con el asesor que asignó Reparto de chats.',
  elegir: 'El chat pasa al asesor que elegiste.',
}

const NIVELES: Record<Extract<MensajeBot, { tipo: 'temperatura' }>['valor'], string> = { frio: 'frío 🧊', tibio: 'tibio 🌤', caliente: 'caliente 🔥' }

const VARIABLES_INTERNAS = new Set(['fecha', 'hora', 'ultimo_mensaje', 'nombre_completo', 'telefono', 'nombre'])
/** En la prueba las pausas se acortan para no hacerte esperar. */
const MAX_PAUSA_PRUEBA_MS = 1400

const dormir = (ms: number) => new Promise<void>((resolver) => window.setTimeout(resolver, ms))

function formatearSegundos(segundos: number): string {
  if (segundos < 60) {
    return `${segundos} s`
  }
  if (segundos < 3600) {
    return `${Math.round(segundos / 60)} min`
  }
  if (segundos < 86400) {
    const horas = Math.round((segundos / 3600) * 10) / 10
    return `${horas} h`
  }
  const dias = Math.round((segundos / 86400) * 10) / 10
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

export function Simulador({ definicion }: { definicion: DefinicionFlujo }) {
  const [chat, setChat] = useState<Item[]>([])
  const [estado, setEstado] = useState<EstadoBot | null>(null)
  const [cargando, setCargando] = useState(true)
  const [escribiendo, setEscribiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [borrador, setBorrador] = useState('')
  const contador = useRef(0)
  const turno = useRef(0)
  const fondo = useRef<HTMLDivElement>(null)

  const agregar = useCallback((items: Omit<Item, 'id'>[]) => {
    setChat((actual) => [...actual, ...items.map((i) => ({ ...i, id: ++contador.current }))])
  }, [])

  /** Muestra los mensajes uno a uno, con «escribiendo…» donde el flujo tiene una pausa. */
  const reproducir = useCallback(
    async (mensajes: MensajeBot[], miTurno: number) => {
      for (const mensaje of mensajes) {
        if (turno.current !== miTurno) {
          return
        }
        if (mensaje.tipo === 'pausa') {
          setEscribiendo(true)
          await dormir(Math.min(mensaje.segundos * 1000, MAX_PAUSA_PRUEBA_MS))
          setEscribiendo(false)
        } else if (mensaje.tipo === 'espera') {
          agregar([{ de: 'aviso', texto: `El bot espera ${formatearSegundos(mensaje.segundos)} y luego sigue solo.` }])
        } else if (mensaje.tipo === 'asignar') {
          agregar([{ de: 'aviso', icono: Headset, texto: TEXTO_ASIGNACION[mensaje.modo] ?? TEXTO_ASIGNACION.mantener }])
        } else if (mensaje.tipo === 'temperatura') {
          agregar([{ de: 'aviso', icono: Thermometer, texto: `Contacto marcado como ${NIVELES[mensaje.valor] ?? mensaje.valor}.` }])
        } else {
          setEscribiendo(true)
          await dormir(350)
          if (turno.current !== miTurno) {
            return
          }
          setEscribiendo(false)
          agregar([{ de: 'bot', mensaje: mensaje.tipo === 'texto' ? { ...mensaje, texto: mensaje.texto.replaceAll(MARCA_ASESOR, NOMBRE_EN_PRUEBA) } : mensaje }])
        }
      }
    },
    [agregar],
  )

  const ejecutar = useCallback(
    async (tarea: () => Promise<ResultadoSimulacion>, reinicia = false) => {
      const miTurno = reinicia ? ++turno.current : turno.current
      setCargando(true)
      setError(null)
      try {
        const resultado = await tarea()
        if (turno.current !== miTurno) {
          return
        }
        setEstado(resultado.estado)
        await reproducir(resultado.mensajes, miTurno)
      } catch (e) {
        if (turno.current === miTurno) {
          setError(e instanceof Error ? e.message : 'No se pudo probar el flujo.')
        }
      } finally {
        if (turno.current === miTurno) {
          setEscribiendo(false)
          setCargando(false)
        }
      }
    },
    [reproducir],
  )

  const empezar = useCallback(() => {
    setChat([])
    setEstado(null)
    void ejecutar(() => simularFlujo({ definicion, nombre: 'Cliente de prueba' }), true)
  }, [definicion, ejecutar])

  const cancelarTurno = useCallback(() => {
    turno.current += 1
  }, [])

  const definicionInicial = useRef(definicion)
  useEffect(() => {
    // Arranca una sola vez al abrir la pestaña; después se reinicia con el botón.
    const miTurno = ++turno.current
    simularFlujo({ definicion: definicionInicial.current, nombre: 'Cliente de prueba' })
      .then(async (resultado) => {
        if (turno.current !== miTurno) {
          return
        }
        setEstado(resultado.estado)
        await reproducir(resultado.mensajes, miTurno)
      })
      .catch((e) => turno.current === miTurno && setError(e instanceof Error ? e.message : 'No se pudo probar el flujo.'))
      .finally(() => {
        if (turno.current === miTurno) {
          setEscribiendo(false)
          setCargando(false)
        }
      })
    return () => {
      // Al cerrar la pestaña se cancela cualquier reproducción en curso.
      cancelarTurno()
    }
  }, [reproducir, cancelarTurno])

  useEffect(() => {
    fondo.current?.scrollTo({ top: fondo.current.scrollHeight, behavior: 'smooth' })
  }, [chat, cargando, escribiendo])

  const activa = estado?.estado === 'activa'
  const esperando = estado?.estado === 'esperando'
  const puedeSaltar = !cargando && (esperando || (activa && Boolean(estado?.reanudar_en)))

  const responder = (texto: string, respuestaId?: string) => {
    if (!estado || !activa || cargando || texto.trim() === '') {
      return
    }
    agregar([{ de: 'yo', texto }])
    void ejecutar(() => simularFlujo({ definicion, estado, entrada: { texto, respuesta_id: respuestaId } }))
  }

  const saltarTiempo = () => {
    if (!estado || !puedeSaltar) {
      return
    }
    agregar([
      {
        de: 'aviso',
        texto: esperando ? `Pasó el tiempo de espera (${formatearSegundos(estado.reanudar_en ?? 0)}).` : 'El cliente no respondió a tiempo.',
      },
    ])
    void ejecutar(() => simularFlujo({ definicion, estado, entrada: { reanudar: true } }))
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    responder(borrador)
    setBorrador('')
  }

  const ultimoDelBot = [...chat].reverse().find((i) => i.de === 'bot')?.id
  const datos = Object.entries(estado?.variables ?? {}).filter(([k, v]) => !VARIABLES_INTERNAS.has(k) && !k.startsWith('_') && v !== '')

  return (
    <div className="chat-wa flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-4 py-2.5">
        <p className="text-sm text-muted-foreground">Prueba tu flujo sin enviar nada a clientes.</p>
        <Button variant="outline" size="sm" onClick={empezar} disabled={cargando && !error}>
          <RotateCcw />
          Reiniciar
        </Button>
      </div>

      <div ref={fondo} className="chat-wa-fondo flex-1 space-y-2 overflow-y-auto p-3">
        {chat.map((item) =>
          item.de === 'yo' ? (
            <div key={item.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-none bg-[var(--wa-verde-claro)] px-3 py-1.5 text-sm shadow-sm">{item.texto}</div>
            </div>
          ) : item.de === 'aviso' ? (
            <p key={item.id} className="mx-auto flex w-fit max-w-[90%] items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-center text-xs text-zinc-600 shadow-sm">
              {item.icono ? <item.icono className="size-3 shrink-0" /> : <Timer className="size-3 shrink-0" />}
              {item.texto}
            </p>
          ) : item.mensaje ? (
            <Burbuja key={item.id} mensaje={item.mensaje} habilitado={activa && !cargando && item.id === ultimoDelBot} alElegir={responder} />
          ) : null,
        )}
        {escribiendo || (cargando && chat.length === 0) ? (
          <div className="flex">
            <div className="flex items-center gap-1 rounded-lg rounded-tl-none bg-white px-3 py-2.5 shadow-sm" aria-label="Escribiendo">
              {[0, 150, 300].map((retraso) => (
                <span key={retraso} className="size-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: `${retraso}ms` }} />
              ))}
            </div>
          </div>
        ) : cargando ? (
          <LoaderCircle className="mx-auto size-4 animate-spin text-muted-foreground" />
        ) : null}
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {estado && !activa && !esperando && !cargando ? (
          <p className="mx-auto w-fit rounded-full bg-white/90 px-3 py-1 text-center text-xs text-zinc-600 shadow-sm">
            {estado.estado === 'derivada' ? 'Aquí el bot se detiene y lo atiende una persona.' : 'El flujo terminó.'}
          </p>
        ) : null}
      </div>

      {puedeSaltar ? (
        <div className="flex items-center gap-2 border-t bg-white px-3 py-2">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {esperando
              ? `El flujo está en pausa (${formatearSegundos(estado?.reanudar_en ?? 0)}).`
              : `Si no responde en ${formatearSegundos(estado?.reanudar_en ?? 0)}, el flujo sigue solo.`}
          </p>
          <Button variant="outline" size="sm" onClick={saltarTiempo}>
            <FastForward />
            {esperando ? 'Saltar la espera' : 'Simular que no responde'}
          </Button>
        </div>
      ) : null}

      {datos.length ? (
        <div className="border-t bg-white px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Datos guardados: </span>
          {datos.map(([k, v]) => `${k} = ${v}`).join(' · ')}
        </div>
      ) : null}

      <form onSubmit={enviar} className="flex items-center gap-2 border-t bg-[var(--wa-panel)] p-2.5">
        <input
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          disabled={!activa || cargando}
          placeholder={activa ? 'Escribe como si fueras el cliente…' : esperando ? 'El bot está esperando…' : 'La prueba terminó'}
          className="h-10 flex-1 rounded-full bg-white px-4 text-sm outline-none disabled:opacity-60"
        />
        <Button type="submit" size="icon-lg" disabled={!activa || cargando || borrador.trim() === ''} className="rounded-full bg-[var(--wa-verde)] hover:bg-[var(--wa-verde-oscuro)]" aria-label="Enviar">
          <Send />
        </Button>
      </form>
    </div>
  )
}

function Burbuja({ mensaje, habilitado, alElegir }: { mensaje: MensajeBot; habilitado: boolean; alElegir: (texto: string, id?: string) => void }) {
  const base = 'max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm shadow-sm'

  if (mensaje.tipo === 'texto') {
    return <div className={cn(base, 'whitespace-pre-wrap')}>{mensaje.texto}</div>
  }

  if (mensaje.tipo === 'imagen') {
    return (
      <div className={cn(base, 'space-y-2')}>
        <img src={mensaje.url} alt="" className="max-h-48 w-full rounded-md bg-zinc-100 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
        {mensaje.texto ? <p className="whitespace-pre-wrap">{mensaje.texto}</p> : null}
      </div>
    )
  }

  if (mensaje.tipo === 'audio') {
    return (
      <div className={cn(base, 'flex w-56 items-center gap-2')}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--wa-verde)] text-white">
          <Mic className="size-4" />
        </span>
        <span className="h-1 flex-1 rounded-full bg-zinc-300" />
        <span className="text-[11px] text-muted-foreground">Audio</span>
      </div>
    )
  }

  if (mensaje.tipo === 'ubicacion') {
    return (
      <div className={cn(base, 'w-60 space-y-2 p-1.5')}>
        <div className="flex h-24 items-center justify-center rounded-md bg-gradient-to-br from-emerald-100 to-sky-100">
          <MapPin className="size-8 text-rose-500" />
        </div>
        <div className="px-1.5 pb-1">
          <p className="font-medium">{mensaje.nombre || 'Ubicación'}</p>
          {mensaje.direccion ? <p className="text-xs text-muted-foreground">{mensaje.direccion}</p> : null}
        </div>
      </div>
    )
  }

  if (mensaje.tipo === 'video' || mensaje.tipo === 'documento') {
    const Icono = mensaje.tipo === 'video' ? Video : FileText
    return (
      <div className={cn(base, 'space-y-1')}>
        <p className="flex items-center gap-2 rounded-md bg-zinc-100 p-2 text-zinc-700">
          <Icono className="size-5 shrink-0" />
          <span className="truncate">{mensaje.tipo === 'video' ? 'Video' : mensaje.nombre}</span>
        </p>
        {mensaje.tipo === 'video' && mensaje.texto ? <p className="whitespace-pre-wrap">{mensaje.texto}</p> : null}
      </div>
    )
  }

  if (mensaje.tipo === 'botones' || mensaje.tipo === 'lista') {
    const opciones = mensaje.tipo === 'botones' ? mensaje.botones : mensaje.opciones
    const elegir = (indice: number) => alElegir(opciones[indice].titulo, opciones[indice].id)

    return (
      <div className="flex max-w-[85%] flex-col gap-1">
        <div className={cn(base, 'max-w-full whitespace-pre-wrap')}>{mensaje.texto}</div>
        <InteractivoWa
          interactivo={{
            tipo: mensaje.tipo,
            boton: mensaje.tipo === 'lista' ? mensaje.boton : undefined,
            opciones: opciones.map((o) => ({ titulo: o.titulo, descripcion: (o as { descripcion?: string }).descripcion || undefined })),
          }}
          habilitado={habilitado}
          alElegir={elegir}
        />
      </div>
    )
  }

  return null
}
