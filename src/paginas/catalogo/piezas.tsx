import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Package, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProductoPublico } from '@/api'
import { descuento } from '@/paginas/catalogo/carrito'
import { precioActual, precioTachado, rutaProducto, useTienda } from '@/paginas/catalogo/tienda'

export function Revelar({ children, retraso = 0, className }: { children: ReactNode; retraso?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: retraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function TituloSeccion({ titulo, accion, numero, etiqueta }: { titulo: string; accion?: ReactNode; numero?: number; etiqueta?: string }) {
  const { catalogo } = useTienda()
  const palabras = titulo.trim().split(/\s+/)
  const ultima = palabras.length > 1 ? palabras.pop() : null

  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[#0B1026]/12 pb-4">
      <div className="min-w-0">
        {numero !== undefined || etiqueta ? (
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-[#0B1026]/45 uppercase">
            {numero !== undefined ? <span className="tabular-nums" style={{ color: catalogo.color }}>{String(numero).padStart(2, '0')}</span> : null}
            {numero !== undefined && etiqueta ? <span className="h-px w-6 bg-[#0B1026]/25" /> : null}
            {etiqueta}
          </p>
        ) : null}
        <h2 className="font-display text-[2.1rem] leading-[0.95] font-medium tracking-[-0.035em] sm:text-5xl">
          {palabras.join(' ')}
          {ultima ? (
            <>
              {' '}
              <em className="font-normal italic" style={{ color: catalogo.color }}>
                {ultima}
              </em>
            </>
          ) : null}
        </h2>
      </div>
      {accion}
    </div>
  )
}

export function Insignia({ producto }: { producto: ProductoPublico }) {
  const { catalogo } = useTienda()
  const menos = catalogo.mostrar_precios ? descuento(producto) : null
  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
      {menos !== null ? (
        <span className="-rotate-3 bg-[#E11D48] px-2 py-1 text-[11px] font-black tracking-wide text-white">−{menos}%</span>
      ) : null}
      {producto.etiqueta ? (
        <span className="bg-[#0B1026] px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase" style={{ background: catalogo.color }}>
          {producto.etiqueta}
        </span>
      ) : null}
      {producto.disponibilidad === 'agotado' ? (
        <span className="bg-white px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-[#9F1239] uppercase">Agotado</span>
      ) : null}
    </div>
  )
}

export function TarjetaProducto({ producto, indice = 0, oscuro = false }: { producto: ProductoPublico; indice?: number; oscuro?: boolean }) {
  const { slug, catalogo, usaCarrito, agregar } = useTienda()
  const tachado = precioTachado(producto, catalogo.mostrar_precios)
  const segunda = producto.imagenes[0]
  const agotado = producto.disponibilidad === 'agotado'
  const conOpciones = producto.variantes.length > 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(indice, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col ${oscuro ? 'text-white [&_.tinta-suave]:text-white/45 [&_.linea]:border-white/20' : '[&_.tinta-suave]:text-[#0B1026]/40 [&_.linea]:border-[#0B1026]/15'}`}
    >
      <Link to={rutaProducto(slug, producto.id)} className="relative block aspect-[4/5] overflow-hidden rounded-[6px] bg-[#ECEAE3]">
        <Insignia producto={producto} />
        <span className="absolute top-3 right-3 z-10 font-display text-xs text-[#0B1026]/40 italic tabular-nums">
          {String(indice + 1).padStart(2, '0')}
        </span>
        {producto.imagen_url ? (
          <>
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              loading="lazy"
              className={`size-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.04] ${segunda ? 'group-hover:opacity-0' : ''}`}
            />
            {segunda ? (
              <img src={segunda} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-[900ms] group-hover:opacity-100" />
            ) : null}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-[#0B1026]/20">
            <Package className="size-10" />
          </div>
        )}
        <span className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-between bg-white/95 px-3 py-2 text-xs font-semibold opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver detalle
          <ArrowUpRight className="size-4" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <p className="tinta-suave truncate text-[10px] font-semibold tracking-[0.2em] uppercase">
          {producto.marca || producto.familia || '\u00a0'}
        </p>
        <Link to={rutaProducto(slug, producto.id)} className="mt-1 mb-3 line-clamp-2 font-display text-[1.05rem] leading-tight font-medium tracking-[-0.01em] sm:text-lg">
          {producto.nombre}
        </Link>
        <div className="linea mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5">
          <p className="flex items-baseline gap-2 leading-tight">
            <span className="text-[15px] font-bold tabular-nums">{precioActual(producto, catalogo.mostrar_precios)}</span>
            {tachado ? <span className="tinta-suave text-xs tabular-nums line-through">{tachado}</span> : null}
          </p>
          {usaCarrito && !agotado ? (
            conOpciones ? (
              <Link
                to={rutaProducto(slug, producto.id)}
                className="shrink-0 border-b-2 pb-0.5 text-xs font-bold tracking-wide uppercase transition hover:opacity-70"
                style={{ borderColor: catalogo.color, color: catalogo.color }}
              >
                Elegir
              </Link>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.85, rotate: 90 }}
                onClick={() => agregar(producto)}
                aria-label={`Agregar ${producto.nombre}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-[4px] text-white transition hover:rotate-90"
                style={{ background: catalogo.color }}
              >
                <Plus className="size-4" />
              </motion.button>
            )
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}

export function Marquesina({ textos }: { textos: string[] }) {
  const { catalogo } = useTienda()
  const lista = textos.filter(Boolean)
  if (lista.length === 0) return null
  const fila = [...lista, ...lista, ...lista]

  return (
    <div className="overflow-hidden py-3 text-white" style={{ background: catalogo.color }}>
      <div className="flex w-max animate-marquesina">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0 items-center" aria-hidden={copia === 1}>
            {fila.map((texto, indice) => (
              <span key={`${copia}-${indice}`} className="flex items-center gap-6 px-6 font-display text-xl whitespace-nowrap italic sm:text-2xl">
                {texto}
                <span className="text-base not-italic opacity-60">✺</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
