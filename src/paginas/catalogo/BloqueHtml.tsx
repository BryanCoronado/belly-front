import { Fragment, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { BloqueHtmlVitrina, LugarBloque } from '@/api'
import { cn } from '@/lib/utils'
import { limpiarCss, limpiarHtml, nombreLugar, normalizarBloque } from '@/paginas/catalogo/bloques'
import { leerArrastre, useEdicion } from '@/paginas/catalogo/edicion'
import { VistaWidget } from '@/paginas/catalogo/VistaWidget'
import { useTienda } from '@/paginas/catalogo/tienda'

type Asa = 'e' | 'w' | 's' | 'se' | 'sw'
const IMANES = [25, 33, 50, 66, 75, 100]

export function BloquesEn({ donde, sangrar = true }: { donde: LugarBloque; sangrar?: boolean }) {
  const { catalogo } = useTienda()
  const edicion = useEdicion()
  const todos = (catalogo.pagina.bloques ?? []).map(normalizarBloque).filter((bloque) => bloque.donde === donde)

  if (!edicion) {
    const visibles = todos.filter((bloque) => bloque.activo)
    if (visibles.length === 0) return null
    return (
      <>
        {visibles.map((bloque) => (
          <BloqueHtml key={bloque.id} bloque={bloque} sangrar={sangrar} />
        ))}
      </>
    )
  }

  const vacio = todos.length === 0
  const abierto = edicion.arrastrando || edicion.esperando

  return (
    <div data-editor className={cn(!sangrar && 'px-4 sm:px-6', vacio && !abierto && 'h-0 overflow-visible')}>
      {todos.map((bloque, indice) => {
        const elegido = edicion.elegido === bloque.id
        return (
          <Fragment key={bloque.id}>
            <Hueco donde={donde} antes={bloque.id} />
            <div
              data-bloque-id={bloque.id}
              className={cn('relative scroll-mt-16', elegido && 'z-10', !bloque.activo && 'opacity-45')}
              onClick={(evento) => {
                evento.stopPropagation()
                edicion.alElegir(bloque.id)
              }}
            >
              <BloqueHtml bloque={bloque} sangrar={sangrar} editando elegido={elegido}>
                {elegido ? (
                  <>
                    <BarraBloque bloque={bloque} primero={indice === 0} ultimo={indice === todos.length - 1} />
                    <AsasRedimension bloque={bloque} />
                  </>
                ) : null}
              </BloqueHtml>
            </div>
          </Fragment>
        )
      })}
      <Hueco donde={donde} vacio={todos.length === 0} />
    </div>
  )
}

function BarraBloque({ bloque, primero, ultimo }: { bloque: BloqueHtmlVitrina; primero: boolean; ultimo: boolean }) {
  const edicion = useEdicion()
  if (!edicion) return null
  const boton =
    'flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div
      className="absolute top-0 left-1/2 z-40 flex -translate-x-1/2 -translate-y-[calc(100%+6px)] items-center gap-px rounded-md border bg-background p-0.5 shadow-sm"
      onClick={(evento) => evento.stopPropagation()}
    >
      <span
        draggable
        title="Mover"
        onDragStart={(evento) => {
          evento.dataTransfer.setData('text/plain', `bloque:${bloque.id}`)
          evento.dataTransfer.effectAllowed = 'move'
          edicion.alArrastrar(true)
        }}
        onDragEnd={() => edicion.alArrastrar(false)}
        className="flex h-6 max-w-36 cursor-grab items-center gap-1 truncate rounded px-1.5 text-[11px] font-medium text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{bloque.nombre || 'Bloque'}</span>
      </span>
      <span className="mx-0.5 h-3.5 w-px bg-border" />
      <button type="button" title="Subir" className={boton} disabled={primero} onClick={() => edicion.alMoverBloque(bloque.id, -1)}>
        <ArrowUp className="size-3.5" />
      </button>
      <button type="button" title="Bajar" className={boton} disabled={ultimo} onClick={() => edicion.alMoverBloque(bloque.id, 1)}>
        <ArrowDown className="size-3.5" />
      </button>
      <button
        type="button"
        title={bloque.activo ? 'Ocultar' : 'Mostrar'}
        className={boton}
        onClick={() => edicion.alCambiarBloque(bloque.id, { activo: !bloque.activo })}
      >
        {bloque.activo ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </button>
      <button type="button" title="Duplicar" className={boton} onClick={() => edicion.alDuplicarBloque(bloque.id)}>
        <Copy className="size-3.5" />
      </button>
      <button type="button" title="Borrar" className={cn(boton, 'hover:bg-destructive/10 hover:text-destructive')} onClick={() => edicion.alBorrarBloque(bloque.id)}>
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

function AsasRedimension({ bloque }: { bloque: BloqueHtmlVitrina }) {
  const edicion = useEdicion()
  const [vivo, setVivo] = useState<{ pct: number; alto: number } | null>(null)
  const actual = normalizarBloque(bloque)
  const conAlto = actual.tipo === 'imagen' || actual.tipo === 'espacio'
  const pctBase = actual.datos.ancho_pct > 0 ? actual.datos.ancho_pct : pctDesdePreset(actual.ancho)
  const altoBase = actual.datos.alto > 40 ? actual.datos.alto : actual.tipo === 'espacio' ? actual.datos.alto : 280
  const minAlto = actual.tipo === 'espacio' ? 8 : 80

  function empezar(asa: Asa, evento: ReactPointerEvent<HTMLSpanElement>) {
    if (!edicion) return
    const api = edicion
    evento.preventDefault()
    evento.stopPropagation()
    const hallado = evento.currentTarget.closest('[data-bloque-caja]') as HTMLElement | null
    const padre = hallado?.parentElement
    if (!hallado || !padre) return
    const caja: HTMLElement = hallado

    const rect = caja.getBoundingClientRect()
    const inicio = {
      x: evento.clientX,
      y: evento.clientY,
      pct: pctBase,
      alto: altoBase,
      anchoPx: rect.width,
      anchoPadre: Math.max(1, padre.clientWidth),
      estilo: caja.style.cssText,
    }
    const objetivo = evento.currentTarget
    objetivo.setPointerCapture(evento.pointerId)
    setVivo({ pct: inicio.pct, alto: inicio.alto })

    function mover(ev: PointerEvent) {
      const dx = ev.clientX - inicio.x
      const dy = ev.clientY - inicio.y
      let pct = inicio.pct
      let alto = inicio.alto
      if (asa === 'e' || asa === 'se') pct = Math.round(((inicio.anchoPx + dx) / inicio.anchoPadre) * 100)
      if (asa === 'w' || asa === 'sw') pct = Math.round(((inicio.anchoPx - dx) / inicio.anchoPadre) * 100)
      if ((asa === 's' || asa === 'se' || asa === 'sw') && conAlto) alto = Math.round(inicio.alto + dy)
      pct = Math.max(20, Math.min(100, pct))
      alto = Math.max(minAlto, Math.min(640, alto))
      if (!ev.shiftKey) {
        const cerca = IMANES.find((valor) => Math.abs(valor - pct) <= 2)
        if (cerca) pct = cerca
        if (conAlto) alto = Math.round(alto / 8) * 8
      }
      setVivo({ pct, alto })
      caja.style.width = `${pct}%`
      caja.style.maxWidth = `${pct}%`
      caja.style.marginLeft = 'auto'
      caja.style.marginRight = 'auto'
      if (conAlto) caja.style.setProperty('--belly-alto-bloque', `${alto}px`)
    }

    function soltar() {
      objetivo.releasePointerCapture(evento.pointerId)
      objetivo.removeEventListener('pointermove', mover)
      objetivo.removeEventListener('pointerup', soltar)
      objetivo.removeEventListener('pointercancel', soltar)
      const finalPct = Math.max(20, Math.min(100, Number.parseInt(caja.style.width, 10) || inicio.pct))
      const finalAlto = conAlto
        ? Math.max(minAlto, Math.min(640, Number.parseInt(caja.style.getPropertyValue('--belly-alto-bloque'), 10) || inicio.alto))
        : inicio.alto
      setVivo(null)
      caja.style.cssText = inicio.estilo
      api.alCambiarBloque(
        bloque.id,
        { ancho: finalPct >= 98 ? 'completo' : 'caja' },
        {
          ancho_pct: finalPct >= 98 ? 0 : finalPct,
          ...(conAlto ? { alto: finalAlto } : {}),
        },
      )
    }

    objetivo.addEventListener('pointermove', mover)
    objetivo.addEventListener('pointerup', soltar)
    objetivo.addEventListener('pointercancel', soltar)
  }

  const asas: { id: Asa; clase: string; cursor: string }[] = [
    { id: 'w', clase: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 h-6 w-1.5', cursor: 'ew-resize' },
    { id: 'e', clase: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 h-6 w-1.5', cursor: 'ew-resize' },
    ...(conAlto
      ? [
          { id: 's' as const, clase: 'bottom-0 left-1/2 h-1.5 w-6 -translate-x-1/2 translate-y-1/2', cursor: 'ns-resize' },
          { id: 'sw' as const, clase: 'bottom-0 left-0 size-2 -translate-x-1/2 translate-y-1/2', cursor: 'nesw-resize' },
          { id: 'se' as const, clase: 'right-0 bottom-0 size-2 translate-x-1/2 translate-y-1/2', cursor: 'nwse-resize' },
        ]
      : [
          { id: 'sw' as const, clase: 'bottom-0 left-0 size-2 -translate-x-1/2 translate-y-1/2', cursor: 'ew-resize' },
          { id: 'se' as const, clase: 'right-0 bottom-0 size-2 translate-x-1/2 translate-y-1/2', cursor: 'ew-resize' },
        ]),
  ]

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
      {vivo ? (
        <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded border bg-background px-2 py-0.5 font-mono text-[10px] font-medium shadow-sm">
          {vivo.pct}%{conAlto ? ` · ${vivo.alto}px` : ''}
        </span>
      ) : null}
      {asas.map((asa) => (
        <span
          key={asa.id}
          onPointerDown={(evento) => empezar(asa.id, evento)}
          className={cn('pointer-events-auto absolute rounded-[2px] border border-foreground/70 bg-background', asa.clase)}
          style={{ cursor: asa.cursor }}
        />
      ))}
    </div>
  )
}

function pctDesdePreset(ancho: BloqueHtmlVitrina['ancho']): number {
  if (ancho === 'estrecho') return 40
  if (ancho === 'caja') return 60
  if (ancho === 'amplio') return 85
  return 100
}

function Hueco({ donde, antes, vacio = false }: { donde: LugarBloque; antes?: string; vacio?: boolean }) {
  const edicion = useEdicion()
  const [encima, setEncima] = useState(false)
  if (!edicion) return null
  const visible = edicion.arrastrando || edicion.esperando

  return (
    <div
      onDragOver={(evento) => {
        evento.preventDefault()
        setEncima(true)
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(evento) => {
        evento.preventDefault()
        setEncima(false)
        edicion.alSoltar(donde, antes, leerArrastre(evento))
      }}
      onClick={(evento) => {
        if (!edicion.esperando) return
        evento.stopPropagation()
        edicion.alSoltar(donde, antes, null)
      }}
      className={cn(
        'group/hueco flex items-center justify-center rounded-md text-[11px] font-medium transition-all',
        visible
          ? cn('my-1 border border-dashed', encima ? 'h-10 border-foreground/40 bg-muted text-foreground' : 'h-8 border-border text-muted-foreground')
          : vacio
            ? 'h-0 hover:h-8 hover:border hover:border-dashed hover:border-border'
            : 'h-0',
      )}
    >
      {visible ? (
        <span className="flex items-center gap-1.5">
          <Plus className="size-3.5" />
          {encima ? 'Soltar aquí' : nombreLugar(donde)}
        </span>
      ) : vacio ? (
        <span className="hidden items-center gap-1 text-muted-foreground group-hover/hueco:flex">
          <Plus className="size-3.5" />
          {nombreLugar(donde)}
        </span>
      ) : null}
    </div>
  )
}

export function BloqueHtml({
  bloque,
  sangrar = true,
  editando = false,
  elegido = false,
  children,
}: {
  bloque: BloqueHtmlVitrina
  sangrar?: boolean
  editando?: boolean
  elegido?: boolean
  children?: ReactNode
}) {
  const host = useRef<HTMLDivElement>(null)
  const actual = normalizarBloque(bloque)
  const html = limpiarHtml(actual.html)
  const css = limpiarCss(actual.css)
  const esHtml = actual.tipo === 'html'
  const pct = actual.datos.ancho_pct
  const altoCss =
    (actual.tipo === 'imagen' || actual.tipo === 'espacio') && actual.datos.alto > 0
      ? ({ ['--belly-alto-bloque']: `${actual.datos.alto}px` } as CSSProperties)
      : undefined

  useEffect(() => {
    if (!esHtml) return
    const nodo = host.current
    if (!nodo) return
    const sombra = nodo.shadowRoot ?? nodo.attachShadow({ mode: 'open' })
    sombra.innerHTML = `<style>:host{display:block}*{box-sizing:border-box}img,video{max-width:100%;height:auto}${css}</style>${html}`
  }, [esHtml, html, css])

  const marco = cn(
    'min-w-0',
    pct <= 0 && actual.ancho === 'completo' && sangrar && '-mx-4 sm:-mx-6',
    pct <= 0 && actual.ancho === 'estrecho' && 'mx-auto w-full max-w-sm',
    pct <= 0 && actual.ancho === 'caja' && 'mx-auto w-full max-w-xl',
    pct <= 0 && actual.ancho === 'amplio' && 'mx-auto w-full max-w-4xl',
    pct <= 0 && actual.ancho === 'completo' && 'w-full',
    pct > 0 && 'mx-auto w-full',
    editando && 'relative rounded-sm',
    editando && !elegido && 'hover:ring-1 hover:ring-foreground/15',
    editando && elegido && 'ring-1 ring-foreground/65',
    editando && '[&_iframe]:pointer-events-none',
  )

  const estilo = {
    ...(pct > 0 ? { width: `${pct}%`, maxWidth: `${pct}%` } : null),
    ...altoCss,
  }

  return (
    <div data-bloque-caja className={marco} style={estilo}>
      {esHtml ? <div ref={host} /> : <VistaWidget bloque={actual} />}
      {children}
    </div>
  )
}
