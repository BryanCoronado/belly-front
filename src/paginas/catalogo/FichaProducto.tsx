import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight, Clock, Minus, Package, Plus, RotateCcw, ShoppingBag, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProductoPublico } from '@/api'
import { IconoRed } from '@/paginas/catalogo/redes'
import { descuento, formatearMoneda, precioLinea } from '@/paginas/catalogo/carrito'
import { BloquesEn } from '@/paginas/catalogo/BloqueHtml'
import { Revelar, TarjetaProducto, TituloSeccion } from '@/paginas/catalogo/piezas'
import { precioActual, precioTachado, useTienda } from '@/paginas/catalogo/tienda'

type Pestana = 'descripcion' | 'detalles' | 'envio'

export function FichaProducto({ producto }: { producto: ProductoPublico }) {
  const { slug, catalogo, usaCarrito, agregar, irAFamilia } = useTienda()
  const fotos = useMemo(
    () => [producto.imagen_url, ...producto.imagenes].filter((url): url is string => Boolean(url)).filter((url, i, lista) => lista.indexOf(url) === i),
    [producto],
  )
  const [foto, setFoto] = useState(0)
  const [elegidas, setElegidas] = useState<Record<string, string>>({})
  const [cantidad, setCantidad] = useState(1)
  const [pestana, setPestana] = useState<Pestana>('descripcion')
  const [agregado, setAgregado] = useState(false)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [producto.id])

  const agotado = producto.disponibilidad === 'agotado'
  const tachado = precioTachado(producto, catalogo.mostrar_precios)
  const menos = catalogo.mostrar_precios ? descuento(producto) : null
  const faltaOpcion = producto.variantes.find((variante) => !elegidas[variante.nombre])
  const textoVariante = producto.variantes.map((variante) => `${variante.nombre}: ${elegidas[variante.nombre]}`).join(', ')
  const relacionados = catalogo.productos
    .filter((item) => item.id !== producto.id && (producto.id_familia === null || item.id_familia === producto.id_familia))
    .slice(0, 4)

  const unitario = precioLinea(producto)
  const mensajeDirecto = [
    `Hola, quiero pedir *${producto.nombre}* de ${catalogo.titulo}.`,
    producto.variantes.length && !faltaOpcion ? `Opción: ${textoVariante}` : '',
    `Cantidad: ${cantidad}`,
    catalogo.mostrar_precios && unitario !== null ? `Total: ${formatearMoneda(unitario * cantidad, producto.moneda)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const directo = catalogo.whatsapp ? `https://wa.me/${catalogo.whatsapp}?text=${encodeURIComponent(mensajeDirecto)}` : null

  function alAgregar() {
    if (faltaOpcion) return
    agregar(producto, textoVariante, cantidad)
    setAgregado(true)
    window.setTimeout(() => setAgregado(false), 1600)
  }

  const pestanas: { id: Pestana; nombre: string; visible: boolean }[] = [
    { id: 'descripcion', nombre: 'Descripción', visible: true },
    { id: 'detalles', nombre: 'Información adicional', visible: producto.detalles.length > 0 },
    { id: 'envio', nombre: 'Envío y cambios', visible: Boolean(catalogo.pagina.entrega || catalogo.pagina.devoluciones) },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-[#0B1026]/50">
        <Link to={`/c/${slug}`} className="hover:text-[#0B1026]">
          Inicio
        </Link>
        {producto.familia ? (
          <>
            <ChevronRight className="size-3.5" />
            <button type="button" onClick={() => irAFamilia(producto.id_familia)} className="hover:text-[#0B1026]">
              {producto.familia}
            </button>
          </>
        ) : null}
        <ChevronRight className="size-3.5" />
        <span className="truncate text-[#0B1026]">{producto.nombre}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col-reverse gap-3 sm:flex-row">
          {fotos.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
              {fotos.map((url, indice) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setFoto(indice)}
                  className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:size-20 ${indice === foto ? '' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={indice === foto ? { borderColor: catalogo.color } : undefined}
                  aria-label={`Foto ${indice + 1}`}
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
          <div
            className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-3xl bg-white"
            onMouseMove={(evento) => {
              const caja = evento.currentTarget.getBoundingClientRect()
              setZoom({ x: ((evento.clientX - caja.left) / caja.width) * 100, y: ((evento.clientY - caja.top) / caja.height) * 100 })
            }}
            onMouseLeave={() => setZoom(null)}
          >
            {menos !== null ? (
              <span className="absolute top-4 left-4 z-10 rounded-full bg-[#E11D48] px-3 py-1 text-xs font-bold text-white">−{menos}%</span>
            ) : null}
            <AnimatePresence mode="wait">
              {fotos[foto] ? (
                <motion.img
                  key={fotos[foto]}
                  src={fotos[foto]}
                  alt={producto.nombre}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: zoom ? 1.8 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: zoom ? 0.2 : 0.4 }}
                  style={{ transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : 'center' }}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[#0B1026]/20">
                  <Package className="size-14" />
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-5">
          <Disponibilidad producto={producto} />
          <div>
            {producto.marca ? <p className="text-sm text-[#0B1026]/50">Marca: <span className="font-semibold text-[#0B1026]">{producto.marca}</span></p> : null}
            <h1 className="font-heading mt-1 text-3xl leading-tight font-bold tracking-[-0.05em] sm:text-4xl">{producto.nombre}</h1>
            {producto.resumen ? <p className="mt-3 leading-relaxed text-[#0B1026]/60">{producto.resumen}</p> : null}
          </div>

          <p className="flex items-baseline gap-3">
            <span className="text-3xl font-bold" style={{ color: catalogo.color }}>
              {precioActual(producto, catalogo.mostrar_precios)}
            </span>
            {tachado ? <span className="text-lg text-[#0B1026]/35 line-through">{tachado}</span> : null}
            {producto.unidad && catalogo.mostrar_precios ? <span className="text-sm text-[#0B1026]/45">/ {producto.unidad}</span> : null}
          </p>

          {producto.variantes.map((variante) => (
            <div key={variante.nombre} className="space-y-2">
              <p className="text-sm font-semibold">
                {variante.nombre}
                {elegidas[variante.nombre] ? <span className="font-normal text-[#0B1026]/55">: {elegidas[variante.nombre]}</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {variante.opciones.map((opcion) => {
                  const activa = elegidas[variante.nombre] === opcion
                  return (
                    <motion.button
                      key={opcion}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setElegidas((actual) => ({ ...actual, [variante.nombre]: opcion }))}
                      className={`min-w-11 rounded-xl border-2 px-3.5 py-2 text-sm font-medium transition ${activa ? 'text-white' : 'border-[#0B1026]/10 bg-white hover:border-[#0B1026]/30'}`}
                      style={activa ? { background: catalogo.color, borderColor: catalogo.color } : undefined}
                    >
                      {opcion}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}

          {!agotado ? (
            <div className="space-y-3 border-t border-[#0B1026]/8 pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 items-center rounded-full border border-[#0B1026]/12 bg-white">
                  <button type="button" onClick={() => setCantidad((actual) => Math.max(1, actual - 1))} className="flex size-12 items-center justify-center" aria-label="Menos">
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center font-semibold tabular-nums">{cantidad}</span>
                  <button type="button" onClick={() => setCantidad((actual) => Math.min(99, actual + 1))} className="flex size-12 items-center justify-center" aria-label="Más">
                    <Plus className="size-4" />
                  </button>
                </div>
                {usaCarrito ? (
                  <motion.button
                    type="button"
                    onClick={alAgregar}
                    disabled={Boolean(faltaOpcion)}
                    whileHover={{ scale: faltaOpcion ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                    style={{ background: catalogo.color }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={agregado ? 'ok' : 'normal'}
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        {agregado ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
                        {agregado ? '¡Agregado!' : faltaOpcion ? `Elige ${faltaOpcion.nombre.toLowerCase()}` : 'Agregar al pedido'}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                ) : null}
              </div>
              {directo ? (
                <a
                  href={faltaOpcion ? undefined : directo}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={Boolean(faltaOpcion)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white transition hover:brightness-95 ${faltaOpcion ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <IconoRed red="whatsapp" className="size-5" />
                  Pedir ahora por WhatsApp
                </a>
              ) : null}
            </div>
          ) : (
            <p className="rounded-2xl bg-[#FFF1F2] px-4 py-3 text-sm text-[#9F1239]">Este producto está agotado por ahora. Escríbenos para avisarte cuando vuelva.</p>
          )}

          <div className="divide-y divide-[#0B1026]/8 rounded-2xl bg-white">
            {catalogo.pagina.entrega ? <FilaInfo icono={Truck} titulo="Entrega" texto={catalogo.pagina.entrega} /> : null}
            {catalogo.pagina.devoluciones ? <FilaInfo icono={RotateCcw} titulo="Cambios y devoluciones" texto={catalogo.pagina.devoluciones} /> : null}
            {catalogo.pagina.horario ? <FilaInfo icono={Clock} titulo="Horario de atención" texto={catalogo.pagina.horario} /> : null}
          </div>
        </motion.div>
      </div>

      <section className="mt-14 rounded-3xl bg-white p-5 sm:p-8">
        <div className="flex gap-1 overflow-x-auto border-b border-[#0B1026]/8">
          {pestanas
            .filter((item) => item.visible)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPestana(item.id)}
                className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition ${pestana === item.id ? '' : 'text-[#0B1026]/45 hover:text-[#0B1026]'}`}
              >
                {item.nombre}
                {pestana === item.id ? (
                  <motion.span layoutId="pestana-producto" className="absolute inset-x-0 -bottom-px h-0.5" style={{ background: catalogo.color }} />
                ) : null}
              </button>
            ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={pestana}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="pt-6 text-[15px] leading-relaxed text-[#0B1026]/70"
          >
            {pestana === 'descripcion' ? (
              <p className="whitespace-pre-line">{producto.descripcion || producto.resumen || 'Escríbenos por WhatsApp y te contamos todo sobre este producto.'}</p>
            ) : null}
            {pestana === 'detalles' ? (
              <dl className="max-w-2xl divide-y divide-[#0B1026]/8 overflow-hidden rounded-2xl border border-[#0B1026]/8">
                {producto.detalles.map((detalle) => (
                  <div key={`${detalle.nombre}-${detalle.valor}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                    <dt className="bg-[#F7F6F2] px-4 py-3 font-medium text-[#0B1026]">{detalle.nombre}</dt>
                    <dd className="px-4 py-3">{detalle.valor}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {pestana === 'envio' ? (
              <div className="space-y-4">
                {catalogo.pagina.entrega ? <p className="whitespace-pre-line"><strong className="text-[#0B1026]">Entrega: </strong>{catalogo.pagina.entrega}</p> : null}
                {catalogo.pagina.devoluciones ? <p className="whitespace-pre-line"><strong className="text-[#0B1026]">Cambios y devoluciones: </strong>{catalogo.pagina.devoluciones}</p> : null}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="mt-14">
        <BloquesEn donde="ficha" />
      </div>

      {relacionados.length > 0 ? (
        <section className="mt-14">
          <Revelar>
            <TituloSeccion titulo="También te puede gustar" />
          </Revelar>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {relacionados.map((item, indice) => (
              <TarjetaProducto key={item.id} producto={item} indice={indice} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Disponibilidad({ producto }: { producto: ProductoPublico }) {
  const estilos = {
    disponible: { texto: 'En stock', clase: 'bg-[#ECFDF5] text-[#047857]', punto: 'bg-[#10B981]' },
    pedido: { texto: 'A pedido', clase: 'bg-[#FFFBEB] text-[#92400E]', punto: 'bg-[#F59E0B]' },
    agotado: { texto: 'Agotado', clase: 'bg-[#FFF1F2] text-[#9F1239]', punto: 'bg-[#E11D48]' },
  }[producto.disponibilidad]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${estilos.clase}`}>
        <span className="relative flex size-2">
          {producto.disponibilidad === 'disponible' ? <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${estilos.punto}`} /> : null}
          <span className={`relative inline-flex size-2 rounded-full ${estilos.punto}`} />
        </span>
        {estilos.texto}
      </span>
      {producto.etiqueta ? <span className="rounded-full bg-[#0B1026] px-3 py-1 text-xs font-semibold text-white">{producto.etiqueta}</span> : null}
    </div>
  )
}

function FilaInfo({ icono: Icono, titulo, texto }: { icono: typeof Truck; titulo: string; texto: string }) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <Icono className="mt-0.5 size-5 shrink-0 text-[#0B1026]/45" />
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="text-sm text-[#0B1026]/55">{texto}</p>
      </div>
    </div>
  )
}
