import { ArrowRight } from 'lucide-react'
import type { BloqueHtmlVitrina, TamanoBloque } from '@/api'
import { cn } from '@/lib/utils'
import { datosVacios, embedYoutube, normalizarTamano, resolverEnlace } from '@/paginas/catalogo/bloques'
import { useEdicion } from '@/paginas/catalogo/edicion'
import { useTienda } from '@/paginas/catalogo/tienda'

function BotonWidget({ texto, enlace, color, tamano }: { texto: string; enlace: string; color: string; tamano: TamanoBloque }) {
  const { catalogo, irAFamilia } = useTienda()
  const edicion = useEdicion()
  const destino = resolverEnlace(enlace, catalogo.whatsapp)
  const externo = destino.tipo === 'externo'

  return (
    <div className="flex justify-center py-2">
      <a
        href={destino.href}
        target={externo ? '_blank' : undefined}
        rel={externo ? 'noreferrer' : undefined}
        onClick={(evento) => {
          if (edicion || externo) return
          evento.preventDefault()
          if (destino.tipo === 'familia') {
            irAFamilia(destino.id)
            return
          }
          const seccion = document.getElementById(destino.id)
          if (seccion) seccion.scrollIntoView({ behavior: 'smooth', block: 'start' })
          else irAFamilia(null)
        }}
        className={cn(
          'group inline-flex cursor-pointer items-center gap-2 rounded-full font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 active:translate-y-0',
          tamano === 's' && 'px-4 py-2 text-xs',
          tamano === 'm' && 'px-6 py-3 text-sm',
          tamano === 'l' && 'px-8 py-3.5 text-base',
        )}
        style={{ background: color }}
      >
        {texto}
        <ArrowRight className={cn('transition group-hover:translate-x-1', tamano === 's' ? 'size-3.5' : 'size-4')} />
      </a>
    </div>
  )
}

export function VistaWidget({ bloque }: { bloque: BloqueHtmlVitrina }) {
  const d = { ...datosVacios(), ...bloque.datos, tamano: normalizarTamano(bloque.datos?.tamano) }
  const color = d.color || '#0B1026'
  const fondo = d.fondo || '#FFFFFF'
  const tamano = d.tamano

  if (bloque.tipo === 'franja') {
    return (
      <div
        className={cn('text-center font-semibold', tamano === 's' && 'px-3 py-2 text-xs', tamano === 'm' && 'px-4 py-3 text-sm', tamano === 'l' && 'px-6 py-4 text-base')}
        style={{ background: fondo, color }}
      >
        {d.texto || 'Aviso'}
      </div>
    )
  }

  if (bloque.tipo === 'texto') {
    return (
      <section
        className={cn(
          'text-center',
          tamano === 's' && 'rounded-2xl px-4 py-4',
          tamano === 'm' && 'rounded-3xl px-6 py-8',
          tamano === 'l' && 'rounded-[2rem] px-8 py-12',
        )}
        style={{ background: fondo, color }}
      >
        {d.titulo ? (
          <h2
            className={cn(
              'font-heading font-bold tracking-[-0.04em]',
              tamano === 's' && 'text-lg',
              tamano === 'm' && 'text-2xl',
              tamano === 'l' && 'text-4xl',
            )}
          >
            {d.titulo}
          </h2>
        ) : null}
        {d.texto ? (
          <p className={cn('mt-2 whitespace-pre-line opacity-70', tamano === 's' && 'text-xs', tamano === 'm' && 'text-sm', tamano === 'l' && 'text-base')}>
            {d.texto}
          </p>
        ) : null}
      </section>
    )
  }

  if (bloque.tipo === 'imagen') {
    const alto =
      d.alto > 40
        ? Math.max(80, Math.min(640, d.alto))
        : tamano === 's'
          ? 160
          : tamano === 'l'
            ? 420
            : 280
    return d.imagen_url ? (
      <img
        src={d.imagen_url}
        alt=""
        className={cn('w-full object-cover', tamano === 's' ? 'rounded-2xl' : 'rounded-3xl')}
        style={{ maxHeight: 'var(--belly-alto-bloque, ' + alto + 'px)', height: d.alto > 40 ? 'var(--belly-alto-bloque, ' + alto + 'px)' : undefined, objectFit: 'cover' }}
      />
    ) : (
      <div
        className={cn('grid place-items-center bg-[#EEECE5] text-sm text-[#0B1026]/40', tamano === 's' ? 'rounded-2xl' : 'rounded-3xl')}
        style={{ height: 'var(--belly-alto-bloque, ' + Math.min(alto, 180) + 'px)' }}
      >
        Imagen
      </div>
    )
  }

  if (bloque.tipo === 'boton') {
    return <BotonWidget texto={d.boton || 'Ver más'} enlace={d.enlace} color={color} tamano={tamano} />
  }

  if (bloque.tipo === 'video') {
    const src = embedYoutube(d.video)
    return src ? (
      <div className={cn('relative overflow-hidden bg-black pt-[56.25%]', tamano === 's' ? 'rounded-2xl' : 'rounded-3xl')}>
        <iframe src={src} title="Video" className="absolute inset-0 size-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    ) : (
      <div className={cn('grid h-44 place-items-center bg-[#111] text-sm text-white/50', tamano === 's' ? 'rounded-2xl' : 'rounded-3xl')}>
        Video de YouTube
      </div>
    )
  }

  if (bloque.tipo === 'columnas') {
    const columnas = d.columnas.length ? d.columnas : datosVacios().columnas
    return (
      <div className={`grid gap-3 ${columnas.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {columnas.map((col, indice) => (
          <article
            key={`${col.titulo}-${indice}`}
            className={cn(tamano === 's' && 'rounded-xl p-3', tamano === 'm' && 'rounded-2xl p-5', tamano === 'l' && 'rounded-3xl p-7')}
            style={{ background: fondo, color }}
          >
            <p className={cn('font-bold', tamano === 's' && 'text-sm', tamano === 'm' && 'text-lg', tamano === 'l' && 'text-xl')}>{col.titulo}</p>
            <p className={cn('mt-1 opacity-70', tamano === 's' ? 'text-xs' : 'text-sm')}>{col.texto}</p>
          </article>
        ))}
      </div>
    )
  }

  if (bloque.tipo === 'espacio') {
    return <div style={{ height: `var(--belly-alto-bloque, ${Math.max(8, d.alto || 40)}px)` }} />
  }

  return <div className="rounded-2xl bg-[#EEECE5] px-4 py-6 text-center text-sm text-[#0B1026]/45">HTML personalizado</div>
}
