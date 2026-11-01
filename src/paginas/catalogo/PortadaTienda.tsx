import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle, Package, Truck } from 'lucide-react'
import type { ProductoPublico } from '@/api'
import { BloquesEn } from '@/paginas/catalogo/BloqueHtml'
import { CarruselBanners } from '@/paginas/catalogo/CarruselBanners'
import { descuento } from '@/paginas/catalogo/carrito'
import { Marquesina, Revelar, TarjetaProducto, TituloSeccion } from '@/paginas/catalogo/piezas'
import { useTienda } from '@/paginas/catalogo/tienda'

type Orden = 'relevancia' | 'menor' | 'mayor' | 'nombre'

export function PortadaTienda({
  busqueda,
  familia,
  alLimpiar,
}: {
  busqueda: string
  familia: number | null
  alLimpiar: () => void
}) {
  const { catalogo } = useTienda()
  const pagina = catalogo.pagina
  const filtrando = busqueda.trim() !== '' || familia !== null

  const enOferta = useMemo(
    () => catalogo.productos.filter((producto) => descuento(producto) !== null && producto.disponibilidad !== 'agotado'),
    [catalogo.productos],
  )
  const destacados = useMemo(() => catalogo.productos.filter((producto) => producto.destacado), [catalogo.productos])

  if (filtrando) {
    return (
      <div>
        <Heroe />
        <Marquesina textos={[catalogo.eslogan ?? catalogo.titulo, ...catalogo.familias.slice(0, 6).map((item) => item.nombre), pagina.entrega]} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <BloquesEn donde="despues_carrusel" />
          <div className="mt-8">
            <Listado busqueda={busqueda} familia={familia} alLimpiar={alLimpiar} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Heroe />
      <Marquesina textos={[catalogo.eslogan ?? catalogo.titulo, ...catalogo.familias.slice(0, 6).map((item) => item.nombre), pagina.entrega]} />
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 sm:pb-16">
      <BloquesEn donde="despues_carrusel" />

      {pagina.promos.length > 0 ? (
        <Seccion>
          <Promos />
        </Seccion>
      ) : null}
      <BloquesEn donde="despues_promos" />

      {pagina.secciones.categorias && catalogo.familias.length > 0 ? (
        <Seccion>
          <Categorias />
        </Seccion>
      ) : null}
      <BloquesEn donde="despues_categorias" />

      {pagina.secciones.ofertas && pagina.oferta.activa && enOferta.length > 0 && catalogo.mostrar_precios ? (
        <Seccion>
          <Ofertas productos={enOferta} />
        </Seccion>
      ) : null}
      <BloquesEn donde="despues_ofertas" />

      {pagina.secciones.destacados && destacados.length > 0 ? (
        <Seccion>
          <section id="destacados" className="scroll-mt-28">
            <Revelar>
              <TituloSeccion titulo="Lo más pedido" numero={2} etiqueta="Favoritos" />
            </Revelar>
            <Rejilla productos={destacados.slice(0, 8)} />
          </section>
        </Seccion>
      ) : null}
      <BloquesEn donde="despues_destacados" />

      <Seccion>
        <Listado busqueda="" familia={null} alLimpiar={alLimpiar} />
      </Seccion>
      <BloquesEn donde="despues_productos" />

      <Seccion>
        <Beneficios />
      </Seccion>
      <BloquesEn donde="despues_beneficios" />

      {pagina.secciones.nosotros && pagina.sobre ? (
        <Seccion>
          <Nosotros />
        </Seccion>
      ) : null}
      <BloquesEn donde="despues_nosotros" />
      </div>
    </div>
  )
}

function Seccion({ children }: { children: ReactNode }) {
  return <div className="mt-8 sm:mt-12">{children}</div>
}

function Heroe() {
  const { catalogo, irAFamilia } = useTienda()
  const banners = catalogo.pagina.banners

  if (banners.length === 0) return <PortadaBasica />

  return (
    <CarruselBanners
      banners={banners}
      color={catalogo.color}
      onAccion={(banner) => {
        if (banner.id_familia) irAFamilia(banner.id_familia)
        else document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
      }}
    />
  )
}

function PortadaBasica() {
  const { catalogo } = useTienda()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-[42vh] flex-col justify-center overflow-hidden px-8 py-16 text-white sm:min-h-[48vh] sm:px-16"
      style={{ background: catalogo.color }}
    >
      <motion.div
        className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      {catalogo.logo_url ? <img src={catalogo.logo_url} alt="" className="mb-6 size-16 rounded-2xl object-cover" /> : null}
      <h1 className="font-heading max-w-xl text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{catalogo.titulo}</h1>
      {catalogo.eslogan ? <p className="mt-4 max-w-md text-white/75">{catalogo.eslogan}</p> : null}
      <a href="#productos" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0B1026]">
        Ver productos
        <ArrowRight className="size-4" />
      </a>
    </motion.div>
  )
}

function Promos() {
  const { catalogo, irAFamilia } = useTienda()
  const promos = catalogo.pagina.promos
  return (
    <section id="promos" className={`scroll-mt-28 grid gap-4 ${promos.length === 1 ? '' : promos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
      {promos.map((promo, indice) => (
        <Revelar key={indice} retraso={indice * 0.1}>
          <motion.button
            type="button"
            onClick={() => irAFamilia(promo.id_familia)}
            whileHover="encima"
            className="group relative flex h-40 w-full overflow-hidden rounded-2xl text-left sm:h-48"
            style={{ background: promo.fondo }}
          >
            <div className="relative z-10 flex w-3/5 flex-col justify-center gap-1.5 p-6">
              <p className="font-heading text-xl leading-tight font-bold tracking-[-0.04em]">{promo.titulo}</p>
              {promo.texto ? <p className="text-sm text-[#0B1026]/60">{promo.texto}</p> : null}
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: catalogo.color }}>
                Ver más
                <motion.span variants={{ encima: { x: 4 } }}>
                  <ArrowRight className="size-4" />
                </motion.span>
              </span>
            </div>
            {promo.imagen_url ? (
              <motion.img
                src={promo.imagen_url}
                alt=""
                variants={{ encima: { scale: 1.08, rotate: -2 } }}
                transition={{ duration: 0.4 }}
                className="absolute right-0 bottom-0 h-full w-1/2 object-contain object-bottom-right"
              />
            ) : null}
          </motion.button>
        </Revelar>
      ))}
    </section>
  )
}

function Categorias() {
  const { catalogo, irAFamilia } = useTienda()
  const pista = useRef<HTMLDivElement>(null)

  function desplazar(paso: number) {
    pista.current?.scrollBy({ left: paso * 320, behavior: 'smooth' })
  }

  return (
    <section id="categorias" className="scroll-mt-28">
      <Revelar>
        <TituloSeccion
          titulo="Explora por categoría"
          numero={1}
          etiqueta="Colecciones"
          accion={
            catalogo.familias.length > 3 ? (
              <div className="flex gap-1">
                <button type="button" onClick={() => desplazar(-1)} aria-label="Anterior" className="flex size-10 items-center justify-center border border-[#0B1026]/20 transition hover:bg-[#0B1026] hover:text-white">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" onClick={() => desplazar(1)} aria-label="Siguiente" className="flex size-10 items-center justify-center border border-[#0B1026]/20 transition hover:bg-[#0B1026] hover:text-white">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null
          }
        />
      </Revelar>
      <div ref={pista} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:gap-4">
        {catalogo.familias.map((familia, indice) => (
          <motion.button
            key={familia.id}
            type="button"
            onClick={() => irAFamilia(familia.id)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: indice * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative aspect-[3/4] w-[62%] shrink-0 snap-start overflow-hidden rounded-[6px] text-left sm:w-[30%] lg:w-[23%] ${indice % 2 === 1 ? 'sm:mt-10' : ''}`}
            style={{ background: catalogo.color }}
          >
            {familia.imagen_url ? (
              <img src={familia.imagen_url} alt="" className="absolute inset-0 size-full object-cover transition duration-[1200ms] ease-out group-hover:scale-110" />
            ) : (
              <span className="absolute -right-6 -bottom-10 font-display text-[11rem] leading-none text-white/15 italic">{familia.nombre.slice(0, 1)}</span>
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="absolute top-4 left-4 font-display text-sm text-white/80 italic tabular-nums">{String(indice + 1).padStart(2, '0')}</span>
            <span className="absolute inset-x-4 bottom-4 text-white">
              <span className="block font-display text-2xl leading-none font-medium tracking-[-0.02em] sm:text-3xl">{familia.nombre}</span>
              <span className="mt-2 flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                {familia.total} {familia.total === 1 ? 'pieza' : 'piezas'}
                <ArrowRight className="size-4 -translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}

function restante(termina: string): { dias: number; horas: number; minutos: number; segundos: number } | null {
  if (!termina) return null
  const fin = new Date(termina).getTime()
  if (Number.isNaN(fin)) return null
  const diferencia = fin - Date.now()
  if (diferencia <= 0) return null
  const segundosTotales = Math.floor(diferencia / 1000)
  return {
    dias: Math.floor(segundosTotales / 86400),
    horas: Math.floor((segundosTotales % 86400) / 3600),
    minutos: Math.floor((segundosTotales % 3600) / 60),
    segundos: segundosTotales % 60,
  }
}

function Cuenta({ termina }: { termina: string }) {
  const { catalogo } = useTienda()
  const [tiempo, setTiempo] = useState(() => restante(termina))

  useEffect(() => {
    const id = window.setInterval(() => setTiempo(restante(termina)), 1000)
    return () => window.clearInterval(id)
  }, [termina])

  if (!tiempo) return null
  const partes: [number, string][] = [
    [tiempo.dias, 'Días'],
    [tiempo.horas, 'Horas'],
    [tiempo.minutos, 'Min'],
    [tiempo.segundos, 'Seg'],
  ]

  return (
    <div className="flex gap-2">
      {partes.map(([valor, nombre]) => (
        <div key={nombre} className="flex w-14 flex-col items-center rounded-xl py-2 text-white" style={{ background: catalogo.color }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={valor}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-lg leading-none font-bold tabular-nums"
            >
              {String(valor).padStart(2, '0')}
            </motion.span>
          </AnimatePresence>
          <span className="mt-1 text-[10px] text-white/70 uppercase">{nombre}</span>
        </div>
      ))}
    </div>
  )
}

function Ofertas({ productos }: { productos: ProductoPublico[] }) {
  const { catalogo } = useTienda()
  const oferta = catalogo.pagina.oferta
  if (oferta.termina && !restante(oferta.termina)) return null

  return (
    <section id="ofertas" className="relative -mx-4 scroll-mt-28 bg-[#0B1026] px-4 py-10 text-white sm:-mx-6 sm:px-10 sm:py-14">
      <Revelar>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-white/15 pb-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#FB7185] uppercase">
              <span className="size-2 animate-pulse rounded-full bg-[#FB7185]" />
              Por tiempo limitado
            </p>
            <h2 className="mt-3 font-display text-4xl leading-[0.95] font-medium tracking-[-0.035em] sm:text-6xl">
              {oferta.titulo || 'Ofertas de la semana'}
            </h2>
          </div>
          {oferta.termina ? <Cuenta termina={oferta.termina} /> : null}
        </div>
      </Revelar>
      <Rejilla productos={productos.slice(0, 8)} oscuro />
    </section>
  )
}

function Rejilla({ productos, oscuro = false }: { productos: ProductoPublico[]; oscuro?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4">
      {productos.map((producto, indice) => (
        <TarjetaProducto key={producto.id} producto={producto} indice={indice} oscuro={oscuro} />
      ))}
    </div>
  )
}

function Listado({ busqueda, familia, alLimpiar }: { busqueda: string; familia: number | null; alLimpiar: () => void }) {
  const { catalogo, irAFamilia } = useTienda()
  const [orden, setOrden] = useState<Orden>('relevancia')
  const [chip, setChip] = useState<number | null>(null)
  const activa = familia ?? chip

  const productos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const lista = catalogo.productos.filter((producto) => {
      if (activa !== null && producto.id_familia !== activa) return false
      if (!texto) return true
      return [producto.nombre, producto.marca, producto.resumen, producto.descripcion, producto.familia].some((campo) =>
        campo?.toLowerCase().includes(texto),
      )
    })
    const precio = (producto: ProductoPublico) => Number(producto.precio_oferta ?? producto.precio ?? Number.MAX_SAFE_INTEGER)
    if (orden === 'menor') return [...lista].sort((a, b) => precio(a) - precio(b))
    if (orden === 'mayor') return [...lista].sort((a, b) => precio(b) - precio(a))
    if (orden === 'nombre') return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre))
    return lista
  }, [catalogo.productos, busqueda, activa, orden])

  const nombreFamilia = catalogo.familias.find((item) => item.id === activa)?.nombre
  const titulo = busqueda.trim() ? `Resultados para "${busqueda.trim()}"` : (nombreFamilia ?? 'Todos los productos')

  function elegir(id: number | null) {
    if (familia !== null) irAFamilia(id)
    else setChip(id)
  }

  return (
    <section id="productos" className="scroll-mt-28">
      <Revelar>
        <TituloSeccion
          titulo={titulo}
          numero={busqueda.trim() || nombreFamilia ? undefined : 3}
          etiqueta={`${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`}
          accion={
            <select
              value={orden}
              onChange={(evento) => setOrden(evento.target.value as Orden)}
              className="h-10 border-0 border-b-2 border-[#0B1026] bg-transparent pr-6 text-sm font-semibold outline-none"
              aria-label="Ordenar"
            >
              <option value="relevancia">Relevancia</option>
              {catalogo.mostrar_precios ? <option value="menor">Precio: menor a mayor</option> : null}
              {catalogo.mostrar_precios ? <option value="mayor">Precio: mayor a menor</option> : null}
              <option value="nombre">Nombre A-Z</option>
            </select>
          }
        />
      </Revelar>
      {catalogo.familias.length > 0 ? (
        <div className="-mx-4 mb-8 flex gap-6 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip activa={activa === null} alPulsar={() => elegir(null)}>
            Todo
          </Chip>
          {catalogo.familias.map((item) => (
            <Chip key={item.id} activa={activa === item.id} alPulsar={() => elegir(item.id)}>
              {item.nombre}
            </Chip>
          ))}
        </div>
      ) : null}
      {productos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-[#0B1026]/20 px-6 py-16 text-center">
          <Package className="size-10 text-[#0B1026]/20" />
          <p className="text-sm text-[#0B1026]/55">No encontramos productos con ese filtro.</p>
          <button type="button" onClick={alLimpiar} className="text-sm font-semibold" style={{ color: catalogo.color }}>
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {productos.map((producto, indice) => (
            <TarjetaProducto key={producto.id} producto={producto} indice={indice} />
          ))}
        </motion.div>
      )}
    </section>
  )
}

function Chip({ activa, alPulsar, children }: { activa: boolean; alPulsar: () => void; children: string }) {
  const { catalogo } = useTienda()
  return (
    <button
      type="button"
      onClick={alPulsar}
      className={`relative shrink-0 pb-2 font-display text-lg transition ${activa ? 'italic' : 'text-[#0B1026]/45 hover:text-[#0B1026]'}`}
      style={activa ? { color: catalogo.color } : undefined}
    >
      {children}
      {activa ? (
        <motion.span layoutId="chip-activo" className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: catalogo.color }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
      ) : null}
    </button>
  )
}

function Beneficios() {
  const { catalogo } = useTienda()
  const pagina = catalogo.pagina
  const items = [
    pagina.entrega ? { icono: Truck, titulo: 'Entrega', texto: pagina.entrega } : null,
    pagina.horario ? { icono: Clock, titulo: 'Horario', texto: pagina.horario } : null,
    pagina.direccion ? { icono: MapPin, titulo: 'Dónde estamos', texto: pagina.direccion } : null,
    catalogo.whatsapp ? { icono: MessageCircle, titulo: 'Atención por WhatsApp', texto: 'Escríbenos y te respondemos al toque.' } : null,
  ].filter((item) => item !== null)

  if (items.length === 0) return null

  return (
    <section className="grid border-y border-[#0B1026]/15 lg:grid-cols-4">
      {items.map((item, indice) => (
        <Revelar key={item.titulo} retraso={indice * 0.08} className="border-t border-[#0B1026]/15 py-6 first:border-t-0 lg:border-t-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0">

          <item.icono className="size-5" style={{ color: catalogo.color }} />
          <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-[#0B1026]/45 uppercase">{item.titulo}</p>
          <p className="mt-1.5 font-display text-lg leading-snug">{item.texto}</p>
        </Revelar>
      ))}
    </section>
  )
}

function Nosotros() {
  const { catalogo } = useTienda()
  return (
    <Revelar>
      <section id="nosotros" className="relative grid scroll-mt-28 gap-8 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-14">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#0B1026]/45 uppercase">Quiénes somos</p>
          <p className="mt-3 font-display text-6xl leading-none italic sm:text-8xl" style={{ color: catalogo.color }}>
            “
          </p>
        </div>
        <div>
          <p className="font-display text-2xl leading-[1.25] font-light tracking-[-0.015em] whitespace-pre-line sm:text-[2.1rem]">{catalogo.pagina.sobre}</p>
          <p className="mt-6 flex items-center gap-3 text-sm font-semibold">
            <span className="h-px w-10" style={{ background: catalogo.color }} />
            {catalogo.titulo}
          </p>
        </div>
      </section>
    </Revelar>
  )
}
