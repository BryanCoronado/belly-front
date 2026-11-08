import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'motion/react'
import { ArrowUp, Clock, MapPin, Package, Search, ShoppingBag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { leerCatalogoPublico, type ProductoPublico, type VitrinaPublica } from '@/api'
import { BloquesEn } from '@/paginas/catalogo/BloqueHtml'
import { CarritoLateral } from '@/paginas/catalogo/CarritoLateral'
import { claveLinea, guardarCarrito, leerCarrito, precioLinea, unidadesCarrito, type LineaCarrito } from '@/paginas/catalogo/carrito'
import { FichaProducto } from '@/paginas/catalogo/FichaProducto'
import { PortadaTienda } from '@/paginas/catalogo/PortadaTienda'
import { enlaceWhatsapp } from '@/paginas/catalogo/origenWeb'
import { IconoRed } from '@/paginas/catalogo/redes'
import { aplicarSeoTienda, restaurarSeoBelly, tarjetaTienda } from '@/paginas/catalogo/seoTienda'
import { ProveedorTienda, enlaceRed, type Red, type Tienda } from '@/paginas/catalogo/tienda'

export type PreviaTienda = { slug: string; catalogo: VitrinaPublica; idProducto?: string }

export function CatalogoPublico({ previa }: { previa?: PreviaTienda }) {
  const parametros = useParams()
  const slug = previa?.slug ?? parametros.slug ?? ''
  const id = previa ? previa.idProducto : parametros.id
  const navegar = useNavigate()
  const Buscador = previa ? 'div' : 'form'
  const consulta = useQuery({
    queryKey: ['catalogo-publico', slug],
    queryFn: () => leerCatalogoPublico(slug),
    enabled: !previa && Boolean(slug),
    retry: false,
  })
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [familia, setFamilia] = useState<number | null>(null)
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => (slug ? leerCarrito(slug) : []))
  const [bajado, setBajado] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (valor) => setBajado(valor > 120))

  const catalogo = previa?.catalogo ?? consulta.data

  useEffect(() => {
    if (!catalogo || previa) return
    const producto = id ? catalogo.productos.find((item) => String(item.id) === id) : null
    aplicarSeoTienda(tarjetaTienda(catalogo, slug, producto))
    return () => restaurarSeoBelly()
  }, [catalogo, id, previa, slug])

  function ponerCarrito(siguiente: LineaCarrito[]) {
    setLineas(siguiente)
    guardarCarrito(slug, siguiente)
  }

  function irAFamilia(idFamilia: number | null) {
    setFamilia(idFamilia)
    setBusqueda('')
    setTexto('')
    if (id) navegar(`/c/${slug}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function buscar(evento: FormEvent) {
    evento.preventDefault()
    setBusqueda(texto)
    if (id) navegar(`/c/${slug}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function limpiar() {
    setFamilia(null)
    setBusqueda('')
    setTexto('')
  }

  const tienda = useMemo<Tienda | null>(() => {
    if (!catalogo) return null
    return {
      slug,
      catalogo,
      usaCarrito: catalogo.pagina.carrito !== false,
      irAFamilia,
      agregar: (producto: ProductoPublico, variante = '', cantidad = 1) => {
        const clave = claveLinea(producto.id, variante)
        const existe = lineas.some((linea) => linea.clave === clave)
        ponerCarrito(
          existe
            ? lineas.map((linea) => (linea.clave === clave ? { ...linea, cantidad: linea.cantidad + cantidad } : linea))
            : [
                ...lineas,
                {
                  clave,
                  id: producto.id,
                  nombre: producto.nombre,
                  variante,
                  cantidad,
                  precio: precioLinea(producto),
                  moneda: producto.moneda,
                  imagen_url: producto.imagen_url,
                },
              ],
        )
        setCarritoAbierto(true)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogo, slug, lineas, id])

  if (!previa && consulta.isPending) {
    return (
      <main className="min-h-svh bg-[#F7F6F2] px-5 py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-14 animate-pulse rounded-2xl bg-black/6" />
          <div className="h-[380px] animate-pulse rounded-3xl bg-black/6" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-black/5" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (consulta.isError || !catalogo || !tienda) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#F7F6F2] px-6 text-center">
        <div className="max-w-sm space-y-3">
          <Package className="mx-auto size-10 text-[#0B1026]/25" />
          <p className="font-heading text-2xl font-bold tracking-[-0.04em] text-[#0B1026]">Este catálogo no está disponible</p>
          <p className="text-sm leading-relaxed text-[#0B1026]/60">
            {consulta.error instanceof Error ? consulta.error.message : 'Revisa el enlace o pide uno nuevo.'}
          </p>
        </div>
      </main>
    )
  }

  const pagina = catalogo.pagina
  const producto = id ? catalogo.productos.find((item) => String(item.id) === id) ?? null : null
  const unidades = unidadesCarrito(lineas)
  const redes = (['instagram', 'facebook', 'tiktok'] as Red[]).filter((red) => pagina[red as 'instagram' | 'facebook' | 'tiktok'])

  return (
    <ProveedorTienda value={tienda}>
      <div className="min-h-svh bg-[#F7F6F2] text-[#0B1026]">
        {pagina.aviso || catalogo.whatsapp || redes.length > 0 ? (
          <div className="text-white" style={{ background: '#0B1026' }}>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6">
              <div className="hidden items-center gap-4 text-white/70 md:flex">
                {pagina.horario ? (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {pagina.horario}
                  </span>
                ) : null}
                {pagina.direccion ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    <span className="max-w-56 truncate">{pagina.direccion}</span>
                  </span>
                ) : null}
              </div>
              <p className="flex-1 truncate text-center font-medium md:flex-none">{pagina.aviso}</p>
              <div className="hidden items-center gap-3 text-white/70 md:flex">
                {redes.map((red) => (
                  <a key={red} href={enlaceRed(red, pagina[red as 'instagram'])} target="_blank" rel="noreferrer" className="transition hover:text-white" aria-label={red}>
                    <IconoRed red={red} className="size-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${bajado ? 'border-[#0B1026]/8 bg-white/85 shadow-[0_10px_30px_-20px_rgba(11,16,38,0.4)] backdrop-blur-xl' : 'border-transparent bg-white'}`}>
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
            <Link to={`/c/${slug}`} onClick={limpiar} className="flex min-w-0 items-center gap-3">
              {catalogo.logo_url ? (
                <motion.img whileHover={{ rotate: -6, scale: 1.05 }} src={catalogo.logo_url} alt="" className="size-10 shrink-0 rounded-xl object-cover sm:size-11" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-white sm:size-11" style={{ background: catalogo.color }}>
                  {catalogo.titulo.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-heading text-lg leading-tight font-bold tracking-[-0.04em]">{catalogo.titulo}</span>
                {catalogo.eslogan ? <span className="hidden truncate text-xs text-[#0B1026]/50 sm:block">{catalogo.eslogan}</span> : null}
              </span>
            </Link>

            <Buscador onSubmit={buscar} className="mx-auto hidden h-11 max-w-xl flex-1 items-center overflow-hidden rounded-full border border-[#0B1026]/12 bg-[#F7F6F2] focus-within:border-[#0B1026]/30 md:flex">
              {catalogo.familias.length > 0 ? (
                <select
                  value={familia ?? ''}
                  onChange={(evento) => irAFamilia(evento.target.value ? Number(evento.target.value) : null)}
                  className="h-full max-w-40 border-r border-[#0B1026]/10 bg-transparent pr-2 pl-4 text-sm outline-none"
                  aria-label="Categoría"
                >
                  <option value="">Todas</option>
                  {catalogo.familias.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              ) : null}
              <input value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Buscar productos…" className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
              <button type={previa ? 'button' : 'submit'} className="m-1 flex size-9 items-center justify-center rounded-full text-white" style={{ background: catalogo.color }} aria-label="Buscar">
                <Search className="size-4" />
              </button>
            </Buscador>

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              {catalogo.whatsapp ? (
                <a
                  href={enlaceWhatsapp(catalogo.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#0B1026]/70 hover:bg-[#F7F6F2] lg:flex"
                >
                  <IconoRed red="whatsapp" className="size-4 text-[#25D366]" />
                  Escríbenos
                </a>
              ) : null}
              {tienda.usaCarrito ? (
                <motion.button
                  type="button"
                  onClick={() => setCarritoAbierto(true)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex size-11 items-center justify-center rounded-full bg-[#F7F6F2] transition hover:bg-[#EEECE5]"
                  aria-label="Abrir pedido"
                >
                  <ShoppingBag className="size-5" />
                  <AnimatePresence>
                    {unidades > 0 ? (
                      <motion.span
                        key={unidades}
                        initial={{ scale: 0 }}
                        animate={{ scale: [1.5, 1] }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                        style={{ background: catalogo.color }}
                      >
                        {unidades}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              ) : null}
            </div>
          </div>

          <Buscador onSubmit={buscar} className="px-4 pb-3 md:hidden">
            <div className="flex h-10 items-center overflow-hidden rounded-full border border-[#0B1026]/12 bg-[#F7F6F2]">
              <Search className="ml-3 size-4 text-[#0B1026]/40" />
              <input value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Buscar productos…" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
            </div>
          </Buscador>

          {catalogo.familias.length > 0 ? (
            <nav className="hidden border-t border-[#0B1026]/6 md:block">
              <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]">
                <EnlaceNav activo={!id && familia === null && !busqueda} alPulsar={() => irAFamilia(null)}>
                  Inicio
                </EnlaceNav>
                {catalogo.familias.slice(0, 8).map((item) => (
                  <EnlaceNav key={item.id} activo={!id && familia === item.id} alPulsar={() => irAFamilia(item.id)}>
                    {item.nombre}
                  </EnlaceNav>
                ))}
              </div>
            </nav>
          ) : null}
        </header>

        <BloquesEn donde="cabecera" sangrar={false} />

        <main className={previa ? 'pb-10' : 'pb-28 sm:pb-20'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={producto ? `p-${producto.id}` : `inicio-${familia}-${busqueda}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {id && !producto ? (
                <div className="mx-auto max-w-md px-6 py-24 text-center">
                  <p className="font-heading text-2xl font-bold tracking-[-0.04em]">Este producto ya no está disponible</p>
                  <Link to={`/c/${slug}`} className="mt-4 inline-block text-sm font-semibold" style={{ color: catalogo.color }}>
                    Ver el catálogo
                  </Link>
                </div>
              ) : producto ? (
                <FichaProducto key={producto.id} producto={producto} />
              ) : (
                <PortadaTienda busqueda={busqueda} familia={familia} alLimpiar={limpiar} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <BloquesEn donde="antes_footer" sangrar={false} />

        <footer className="bg-[#0B1026] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {catalogo.logo_url ? <img src={catalogo.logo_url} alt="" className="size-11 rounded-xl object-cover" /> : null}
                <p className="font-heading text-xl font-bold tracking-[-0.04em]">{catalogo.titulo}</p>
              </div>
              {catalogo.eslogan ? <p className="max-w-sm text-sm leading-relaxed text-white/60">{catalogo.eslogan}</p> : null}
              {redes.length > 0 ? (
                <div className="flex gap-2">
                  {redes.map((red) => (
                    <motion.a
                      key={red}
                      href={enlaceRed(red, pagina[red as 'instagram'])}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ y: -3 }}
                      className="flex size-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white hover:text-[#0B1026]"
                      aria-label={red}
                    >
                      <IconoRed red={red} className="size-4" />
                    </motion.a>
                  ))}
                </div>
              ) : null}
            </div>
            {catalogo.familias.length > 0 ? (
              <div>
                <p className="mb-4 text-sm font-bold">Categorías</p>
                <ul className="space-y-2.5 text-sm text-white/60">
                  {catalogo.familias.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => irAFamilia(item.id)} className="transition hover:text-white">
                        {item.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <p className="mb-4 text-sm font-bold">Contacto</p>
              <ul className="space-y-3 text-sm text-white/60">
                {catalogo.whatsapp ? (
                  <li>
                    <a href={enlaceWhatsapp(catalogo.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-white">
                      <IconoRed red="whatsapp" className="size-4" />+{catalogo.whatsapp}
                    </a>
                  </li>
                ) : null}
                {pagina.direccion ? (
                  <li className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {pagina.direccion}
                  </li>
                ) : null}
                {pagina.horario ? (
                  <li className="flex gap-2">
                    <Clock className="mt-0.5 size-4 shrink-0" />
                    {pagina.horario}
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <BloquesEn donde="pie" sangrar={false} />
          </div>
          <div className="overflow-hidden px-4 sm:px-6">
            <p className="mx-auto max-w-7xl font-display text-[19vw] leading-[0.8] font-medium tracking-[-0.06em] whitespace-nowrap text-white/[0.07] italic select-none sm:text-[13vw]" aria-hidden>
              {catalogo.titulo}
            </p>
          </div>
          <p className="border-t border-white/8 py-5 text-center text-xs text-white/40">
            © {new Date().getFullYear()} {catalogo.titulo}
          </p>
        </footer>

        <AnimatePresence>
          {bajado ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed right-4 bottom-20 z-30 flex size-11 items-center justify-center rounded-full bg-white shadow-lg sm:bottom-6"
              aria-label="Subir"
            >
              <ArrowUp className="size-4" />
            </motion.button>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {tienda.usaCarrito && unidades > 0 && !carritoAbierto ? (
            <motion.button
              type="button"
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              onClick={() => setCarritoAbierto(true)}
              className="fixed inset-x-4 bottom-4 z-30 flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-xl sm:hidden"
              style={{ background: catalogo.color }}
            >
              <ShoppingBag className="size-4" />
              Ver pedido · {unidades}
            </motion.button>
          ) : null}
        </AnimatePresence>

        {tienda.usaCarrito ? (
          <CarritoLateral
            abierto={carritoAbierto}
            lineas={lineas}
            alCerrar={() => setCarritoAbierto(false)}
            alVaciar={() => ponerCarrito([])}
            alCambiar={(clave, cantidad) =>
              ponerCarrito(
                cantidad <= 0
                  ? lineas.filter((linea) => linea.clave !== clave)
                  : lineas.map((linea) => (linea.clave === clave ? { ...linea, cantidad: Math.min(99, cantidad) } : linea)),
              )
            }
          />
        ) : null}
      </div>
    </ProveedorTienda>
  )
}

function EnlaceNav({ activo, alPulsar, children }: { activo: boolean; alPulsar: () => void; children: string }) {
  return (
    <button type="button" onClick={alPulsar} className={`relative shrink-0 px-3 py-3 text-sm font-medium transition ${activo ? '' : 'text-[#0B1026]/55 hover:text-[#0B1026]'}`}>
      {children}
      {activo ? <motion.span layoutId="nav-activo" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0B1026]" /> : null}
    </button>
  )
}
