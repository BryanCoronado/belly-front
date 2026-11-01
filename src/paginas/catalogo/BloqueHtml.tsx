import { Fragment, useEffect, useRef, useState } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import type { BloqueHtmlVitrina, LugarBloque } from '@/api'
import { cn } from '@/lib/utils'
import { limpiarCss, limpiarHtml, nombreLugar, normalizarBloque } from '@/paginas/catalogo/bloques'
import { leerArrastre, useEdicion } from '@/paginas/catalogo/edicion'
import { VistaWidget } from '@/paginas/catalogo/VistaWidget'
import { useTienda } from '@/paginas/catalogo/tienda'

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
      {todos.map((bloque) => (
        <Fragment key={bloque.id}>
          <Hueco donde={donde} antes={bloque.id} />
          <div
            className={cn(
              'group/bloque relative cursor-pointer rounded-xl outline-offset-4',
              edicion.elegido === bloque.id ? 'outline-2 outline-[#2563EB]' : 'hover:outline-2 hover:outline-[#2563EB]/40',
              !bloque.activo && 'opacity-40',
            )}
            onClick={() => edicion.alElegir(bloque.id)}
          >
            <span
              draggable
              onDragStart={(evento) => {
                evento.dataTransfer.setData('text/plain', `bloque:${bloque.id}`)
                evento.dataTransfer.effectAllowed = 'move'
                edicion.alArrastrar(true)
              }}
              onDragEnd={() => edicion.alArrastrar(false)}
              className={cn(
                'absolute -top-3 left-3 z-20 flex h-6 cursor-grab items-center gap-1 rounded-md bg-[#2563EB] px-1.5 text-[11px] font-semibold text-white shadow active:cursor-grabbing',
                edicion.elegido === bloque.id ? 'flex' : 'hidden group-hover/bloque:flex',
              )}
            >
              <GripVertical className="size-3.5" />
              {bloque.nombre}
            </span>
            <BloqueHtml bloque={bloque} sangrar={sangrar} />
          </div>
        </Fragment>
      ))}
      <Hueco donde={donde} vacio={todos.length === 0} />
    </div>
  )
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
        'group/hueco flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all',
        visible
          ? cn('my-1.5 h-10 border-2 border-dashed', encima ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]' : 'border-[#2563EB]/40 bg-white/70 text-[#2563EB]/70')
          : vacio
            ? 'h-0 hover:h-8 hover:border hover:border-dashed hover:border-[#2563EB]/35'
            : 'h-0 hover:h-6',
      )}
    >
      {visible ? (
        <span className="flex items-center gap-1.5">
          <Plus className="size-3.5" />
          {encima ? 'Soltar aquí' : nombreLugar(donde)}
        </span>
      ) : vacio ? (
        <span className="hidden items-center gap-1 text-[#2563EB]/60 group-hover/hueco:flex">
          <Plus className="size-3.5" />
          {nombreLugar(donde)}
        </span>
      ) : null}
    </div>
  )
}

export function BloqueHtml({ bloque, sangrar = true }: { bloque: BloqueHtmlVitrina; sangrar?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const actual = normalizarBloque(bloque)
  const html = limpiarHtml(actual.html)
  const css = limpiarCss(actual.css)
  const esHtml = actual.tipo === 'html'

  useEffect(() => {
    if (!esHtml) return
    const nodo = host.current
    if (!nodo) return
    const sombra = nodo.shadowRoot ?? nodo.attachShadow({ mode: 'open' })
    sombra.innerHTML = `<style>:host{display:block}*{box-sizing:border-box}img,video{max-width:100%;height:auto}${css}</style>${html}`
  }, [esHtml, html, css])

  const caja = sangrar && actual.ancho === 'completo' ? '-mx-4 sm:-mx-6' : undefined

  if (esHtml) return <div ref={host} className={caja} />

  return (
    <div className={caja}>
      <VistaWidget bloque={actual} />
    </div>
  )
}
