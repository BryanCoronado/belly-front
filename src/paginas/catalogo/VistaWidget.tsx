import { ArrowRight } from 'lucide-react'
import type { BloqueHtmlVitrina } from '@/api'
import { datosVacios, embedYoutube, resolverEnlace } from '@/paginas/catalogo/bloques'
import { useEdicion } from '@/paginas/catalogo/edicion'
import { useTienda } from '@/paginas/catalogo/tienda'

function BotonWidget({ texto, enlace, color }: { texto: string; enlace: string; color: string }) {
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
        className="group inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 active:translate-y-0"
        style={{ background: color }}
      >
        {texto}
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </a>
    </div>
  )
}

export function VistaWidget({ bloque }: { bloque: BloqueHtmlVitrina }) {
  const d = { ...datosVacios(), ...bloque.datos }
  const color = d.color || '#0B1026'
  const fondo = d.fondo || '#FFFFFF'

  if (bloque.tipo === 'franja') {
    return (
      <div className="px-4 py-3 text-center text-sm font-semibold" style={{ background: fondo, color }}>
        {d.texto || 'Aviso'}
      </div>
    )
  }

  if (bloque.tipo === 'texto') {
    return (
      <section className="rounded-3xl px-6 py-8 text-center" style={{ background: fondo, color }}>
        {d.titulo ? <h2 className="font-heading text-2xl font-bold tracking-[-0.04em]">{d.titulo}</h2> : null}
        {d.texto ? <p className="mt-2 whitespace-pre-line text-sm opacity-70">{d.texto}</p> : null}
      </section>
    )
  }

  if (bloque.tipo === 'imagen') {
    return d.imagen_url ? (
      <img src={d.imagen_url} alt="" className="w-full rounded-3xl object-cover" />
    ) : (
      <div className="grid h-44 place-items-center rounded-3xl bg-[#EEECE5] text-sm text-[#0B1026]/40">Imagen</div>
    )
  }

  if (bloque.tipo === 'boton') {
    return <BotonWidget texto={d.boton || 'Ver más'} enlace={d.enlace} color={color} />
  }

  if (bloque.tipo === 'video') {
    const src = embedYoutube(d.video)
    return src ? (
      <div className="relative overflow-hidden rounded-3xl bg-black pt-[56.25%]">
        <iframe src={src} title="Video" className="absolute inset-0 size-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    ) : (
      <div className="grid h-44 place-items-center rounded-3xl bg-[#111] text-sm text-white/50">Video de YouTube</div>
    )
  }

  if (bloque.tipo === 'columnas') {
    const columnas = d.columnas.length ? d.columnas : datosVacios().columnas
    return (
      <div className={`grid gap-3 ${columnas.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {columnas.map((col, indice) => (
          <article key={`${col.titulo}-${indice}`} className="rounded-2xl p-5" style={{ background: fondo, color }}>
            <p className="text-lg font-bold">{col.titulo}</p>
            <p className="mt-1 text-sm opacity-70">{col.texto}</p>
          </article>
        ))}
      </div>
    )
  }

  if (bloque.tipo === 'espacio') {
    return <div style={{ height: Math.max(8, d.alto || 40) }} />
  }

  return <div className="rounded-2xl bg-[#EEECE5] px-4 py-6 text-center text-sm text-[#0B1026]/45">HTML personalizado</div>
}
