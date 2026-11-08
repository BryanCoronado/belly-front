import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  Plus,
  QrCode,
  Trash2,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  guardarVitrina,
  leerFamilias,
  leerLogoVitrina,
  leerVitrina,
  subirImagenProducto,
  type BannerVitrina,
  type DatosVitrina,
  type FamiliaProducto,
  type PaginaVitrina,
  type PromoVitrina,
  type Vitrina,
} from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { armarQrConLogo, cargarImagen, logoDesdeArchivo } from '@/lib/qrConLogo'
import { cn } from '@/lib/utils'
import { CarruselBanners } from '@/paginas/catalogo/CarruselBanners'
import { normalizarBloque } from '@/paginas/catalogo/bloques'
import { seoVacio } from '@/paginas/catalogo/seoTienda'
import { esAdministrador, leerSesion } from '@/sesion'

const CLAVE = ['catalogo-vitrina']
const COLORES = ['#0B1026', '#5B46B4', '#0F766E', '#9F1239', '#C2410C', '#2563EB', '#16A34A', '#18181B']
const FONDOS = ['#EEF0E5', '#FDECEA', '#E8F1FB', '#FFF4DB', '#EFE9FB', '#E6F6EF', '#F4F1EA', '#FFFFFF']
const MAX_BANNERS = 6
const MAX_PROMOS = 3

type Paso = 'marca' | 'portada' | 'promos' | 'detalles'

const PASOS: { id: Paso; nombre: string; corto: string }[] = [
  { id: 'marca', nombre: 'Identidad', corto: '1' },
  { id: 'portada', nombre: 'Portada', corto: '2' },
  { id: 'promos', nombre: 'Promos', corto: '3' },
  { id: 'detalles', nombre: 'Detalles', corto: '4' },
]

type Destino = { tipo: 'logo' } | { tipo: 'banner'; indice: number | null } | { tipo: 'promo'; indice: number } | { tipo: 'seo' }

const variantes = {
  entrar: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  centro: { opacity: 1, x: 0 },
  salir: (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}

function slugDe(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function enlaceCompleto(vitrina: Vitrina | undefined): string {
  if (!vitrina?.enlace) return ''
  return `${window.location.origin}${vitrina.enlace}`
}

const PAGINA_VACIA: PaginaVitrina = {
  banners: [],
  promos: [],
  oferta: { activa: false, titulo: 'Ofertas de la semana', termina: '' },
  secciones: { categorias: true, ofertas: true, destacados: true, nosotros: true },
  aviso: '',
  sobre: '',
  horario: '',
  direccion: '',
  entrega: '',
  devoluciones: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  carrito: true,
  bloques: [],
  seo: { descripcion: '', imagen_url: '' },
}

function fotoSeo(datos: DatosVitrina): string {
  return datos.pagina.seo.imagen_url || datos.logo_url || datos.pagina.banners[0]?.imagen_url || ''
}

function bannerNuevo(imagen_url: string): BannerVitrina {
  return { imagen_url, estilo: 'completo', etiqueta: '', titulo: '', texto: '', boton: 'Comprar ahora', id_familia: null, fondo: '#0B1026', burbuja: '' }
}

function promoNueva(): PromoVitrina {
  return { titulo: '', texto: '', imagen_url: '', fondo: FONDOS[1], id_familia: null }
}

function conNombreEmpresa(base: DatosVitrina, nombre: string): DatosVitrina {
  if (base.titulo.trim() || !nombre) return base
  return { ...base, titulo: nombre, slug: base.slug || slugDe(nombre) }
}

function desdeVitrina(vitrina: Vitrina): DatosVitrina {
  const pagina = vitrina.pagina ?? PAGINA_VACIA
  return {
    slug: vitrina.slug,
    titulo: vitrina.titulo,
    eslogan: vitrina.eslogan,
    color: vitrina.color || '#0B1026',
    logo_url: vitrina.logo_url ?? '',
    whatsapp: vitrina.whatsapp ?? '',
    mostrar_precios: vitrina.mostrar_precios,
    publicado: vitrina.publicado,
    pagina: {
      ...PAGINA_VACIA,
      ...pagina,
      banners: (pagina.banners ?? []).map((banner) => ({ ...bannerNuevo(banner.imagen_url), ...banner, estilo: 'completo' as const })),
      promos: pagina.promos ?? [],
      oferta: { ...PAGINA_VACIA.oferta, ...pagina.oferta },
      secciones: { ...PAGINA_VACIA.secciones, ...pagina.secciones },
      bloques: (pagina.bloques ?? []).map(normalizarBloque),
      seo: { ...seoVacio(), ...pagina.seo },
    },
  }
}

export function MiCatalogo() {
  const sesion = leerSesion()?.usuario
  const admin = esAdministrador(sesion)
  const nombreEmpresa = sesion?.empresa_nombre || sesion?.empresa || ''
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: CLAVE, queryFn: leerVitrina })
  const familias = useQuery({ queryKey: ['familias-producto'], queryFn: leerFamilias })
  const [params] = useSearchParams()
  const [editado, setEditado] = useState<DatosVitrina | null>(null)
  const [paso, setPaso] = useState<Paso>(() => {
    const pedida = params.get('pestana') || params.get('paso')
    if (pedida === 'html' || pedida === 'constructor') return 'detalles'
    if (pedida === 'secciones') return 'detalles'
    return PASOS.some((item) => item.id === pedida) ? (pedida as Paso) : 'marca'
  })
  const [direccion, setDireccion] = useState(1)
  const [slugTocado, setSlugEditado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [qr, setQr] = useState<string>('')
  const [logoArchivo, setLogoArchivo] = useState<File | null>(null)
  const selector = useRef<HTMLInputElement>(null)
  const destino = useRef<Destino>({ tipo: 'logo' })

  const datos = editado ?? (consulta.data ? conNombreEmpresa(desdeVitrina(consulta.data), nombreEmpresa) : null)
  const slugEditado = slugTocado || Boolean(consulta.data?.existe)
  const indicePaso = PASOS.findIndex((item) => item.id === paso)

  function irA(siguiente: Paso) {
    const nuevo = PASOS.findIndex((item) => item.id === siguiente)
    setDireccion(nuevo >= indicePaso ? 1 : -1)
    setPaso(siguiente)
  }

  function setDatos(cambio: (actual: DatosVitrina | null) => DatosVitrina | null) {
    setEditado((previo) => cambio(previo ?? (consulta.data ? desdeVitrina(consulta.data) : null)))
  }

  const guardar = useMutation({
    mutationFn: (publicar: boolean) => {
      if (!datos) throw new Error('Completa el catálogo.')
      const titulo = datos.titulo.trim() || nombreEmpresa
      return guardarVitrina({ ...datos, titulo, publicado: publicar })
    },
    onSuccess: (vitrina) => {
      setEditado(desdeVitrina(vitrina))
      setSlugEditado(true)
      setLogoArchivo(null)
      void cliente.invalidateQueries({ queryKey: CLAVE })
      const sinTitulo = (datos?.pagina.promos ?? []).some((promo) => !promo.titulo.trim())
      avisoExito(vitrina.publicado ? 'Catálogo publicado' : 'Catálogo en borrador', sinTitulo ? 'Las promos sin título no se guardan.' : undefined)
    },
    onError: (error) => avisoError(error, 'No se pudo guardar el catálogo'),
  })

  const subir = useMutation({
    mutationFn: ({ archivo }: { archivo: File; destino: Destino }) => subirImagenProducto(archivo),
    onSuccess: (url, { destino: lugar }) =>
      setDatos((actual) => {
        if (!actual) return actual
        if (lugar.tipo === 'logo') return { ...actual, logo_url: url }
        if (lugar.tipo === 'seo') return { ...actual, pagina: { ...actual.pagina, seo: { ...actual.pagina.seo, imagen_url: url } } }
        if (lugar.tipo === 'banner') {
          const banners =
            lugar.indice === null
              ? [...actual.pagina.banners, bannerNuevo(url)].slice(0, MAX_BANNERS)
              : actual.pagina.banners.map((banner, posicion) => (posicion === lugar.indice ? { ...banner, imagen_url: url } : banner))
          return { ...actual, pagina: { ...actual.pagina, banners } }
        }
        return {
          ...actual,
          pagina: {
            ...actual.pagina,
            promos: actual.pagina.promos.map((promo, posicion) => (posicion === lugar.indice ? { ...promo, imagen_url: url } : promo)),
          },
        }
      }),
    onError: (error) => avisoError(error, 'No se pudo subir la imagen'),
  })

  const vitrina = consulta.data
  const url = enlaceCompleto(guardar.data ?? vitrina)

  useEffect(() => {
    if (!url) return
    let cancelado = false
    void (async () => {
      try {
        let marca: HTMLImageElement | null = null
        if (logoArchivo) {
          marca = await logoDesdeArchivo(logoArchivo)
        } else if (datos?.logo_url) {
          const local = await leerLogoVitrina()
          if (local) {
            try {
              marca = await cargarImagen(local)
            } finally {
              URL.revokeObjectURL(local)
            }
          }
        }
        const imagen = await armarQrConLogo(url, marca)
        if (!cancelado) setQr(imagen)
      } catch {
        if (!cancelado) setQr('')
      }
    })()
    return () => {
      cancelado = true
    }
  }, [url, logoArchivo, datos?.logo_url])

  function elegirImagen(lugar: Destino) {
    destino.current = lugar
    selector.current?.click()
  }

  function ponerPagina<K extends keyof PaginaVitrina>(campo: K, valor: PaginaVitrina[K]) {
    setDatos((actual) => (actual ? { ...actual, pagina: { ...actual.pagina, [campo]: valor } } : actual))
  }

  function cambiarBanner<K extends keyof BannerVitrina>(indice: number, campo: K, valor: BannerVitrina[K]) {
    setDatos((actual) => {
      if (!actual) return actual
      return {
        ...actual,
        pagina: {
          ...actual.pagina,
          banners: actual.pagina.banners.map((banner, posicion) => (posicion === indice ? { ...banner, [campo]: valor } : banner)),
        },
      }
    })
  }

  function moverBanner(indice: number, salto: number) {
    setDatos((actual) => {
      if (!actual) return actual
      const destinoIndice = indice + salto
      if (destinoIndice < 0 || destinoIndice >= actual.pagina.banners.length) return actual
      const banners = [...actual.pagina.banners]
      const [item] = banners.splice(indice, 1)
      banners.splice(destinoIndice, 0, item)
      return { ...actual, pagina: { ...actual.pagina, banners } }
    })
  }

  function cambiarPromo<K extends keyof PromoVitrina>(indice: number, campo: K, valor: PromoVitrina[K]) {
    setDatos((actual) => {
      if (!actual) return actual
      return {
        ...actual,
        pagina: {
          ...actual.pagina,
          promos: actual.pagina.promos.map((promo, posicion) => (posicion === indice ? { ...promo, [campo]: valor } : promo)),
        },
      }
    })
  }

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((actual) => {
      if (!actual) return actual
      if (name === 'slug') {
        setSlugEditado(true)
        return { ...actual, slug: slugDe(value) }
      }
      if (name === 'titulo') {
        const titulo = value
        return slugEditado ? { ...actual, titulo } : { ...actual, titulo, slug: slugDe(titulo) }
      }
      return { ...actual, [name]: value }
    })
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate(true)
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1600)
    } catch {
      avisoError(new Error('No se pudo copiar'), 'Copia el enlace a mano')
    }
  }

  function bajarQr(nombre: string) {
    if (!qr) return
    const ancla = document.createElement('a')
    ancla.href = qr
    ancla.download = `catalogo-${nombre || 'belly'}.png`
    ancla.click()
  }

  const listaFamilias = familias.data ?? []
  const subiendo = (lugar: Destino) =>
    subir.isPending && JSON.stringify(subir.variables?.destino) === JSON.stringify(lugar)

  if (!admin) {
    return (
      <div className="space-y-6">
        <CabeceraPagina titulo="Mi Catálogo" descripcion="Solo el administrador puede armar la tienda." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Mi Catálogo"
        descripcion="Tu tienda online, paso a paso."
        acciones={
          (datos?.publicado || vitrina?.publicado) && url ? (
            <a href={url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: 'outline' }), 'h-10')}>
              Ver tienda
              <ExternalLink />
            </a>
          ) : null
        }
      />

      <input
        ref={selector}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0]
          evento.target.value = ''
          if (!archivo) return
          if (destino.current.tipo === 'logo') setLogoArchivo(archivo)
          subir.mutate({ archivo, destino: destino.current })
        }}
      />

      {datos === null ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="superficie h-96 animate-pulse" />
          <div className="superficie h-72 animate-pulse" />
        </div>
      ) : (
        <form className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]" onSubmit={enviar}>
          <section className="superficie overflow-hidden">
            <nav className="border-b px-4 pt-4 pb-3 sm:px-5">
              <ol className="flex items-center gap-1 overflow-x-auto">
                {PASOS.map((item, indice) => {
                  const activo = item.id === paso
                  const hecho = indice < indicePaso
                  return (
                    <li key={item.id} className="flex min-w-0 items-center gap-1">
                      {indice > 0 ? <span className="mx-0.5 hidden h-px w-4 bg-border sm:block sm:w-6" aria-hidden /> : null}
                      <button
                        type="button"
                        onClick={() => irA(item.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-full px-2.5 py-1.5 text-left transition-colors',
                          activo ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                            hecho ? 'bg-emerald-500 text-white' : activo ? 'bg-primary text-primary-foreground' : 'bg-muted',
                          )}
                        >
                          {hecho ? <Check className="size-3" strokeWidth={3} /> : item.corto}
                        </span>
                        <span className={cn('hidden text-sm font-medium sm:inline', !activo && 'sm:hidden md:inline')}>{item.nombre}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${((indicePaso + 1) / PASOS.length) * 100}%` }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </nav>

            <div className="relative overflow-hidden p-5 sm:p-6">
              <AnimatePresence mode="wait" custom={direccion}>
                <motion.div
                  key={paso}
                  custom={direccion}
                  variants={variantes}
                  initial="entrar"
                  animate="centro"
                  exit="salir"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  {paso === 'marca' ? (
                    <>
                      <CabeceraPaso titulo="Identidad" texto="Logo, color y enlace." />
                      <div className="flex items-center gap-4">
                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                          {datos.logo_url ? (
                            <img src={datos.logo_url} alt="" className="size-full object-cover" />
                          ) : (
                            <ImagePlus className="size-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={subiendo({ tipo: 'logo' })} onClick={() => elegirImagen({ tipo: 'logo' })}>
                            {subiendo({ tipo: 'logo' }) ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
                            {datos.logo_url ? 'Cambiar logo' : 'Subir logo'}
                          </Button>
                          {datos.logo_url ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLogoArchivo(null)
                                setDatos((actual) => (actual ? { ...actual, logo_url: '' } : actual))
                              }}
                            >
                              Quitar
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Campo
                            etiqueta="Frase corta"
                            name="eslogan"
                            value={datos.eslogan}
                            onChange={cambiar}
                            maxLength={160}
                            autoComplete="off"
                            placeholder="Lo que ves debajo del logo"
                            opcional
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Campo
                            etiqueta="Enlace"
                            name="slug"
                            value={datos.slug}
                            onChange={cambiar}
                            maxLength={60}
                            autoComplete="off"
                            required
                            ayuda={`${window.location.origin}/c/${datos.slug || 'tu-tienda'}`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          {consulta.data?.whatsapp_meta && datos.whatsapp ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                              <span>
                                Pedidos a <span className="font-medium">+{datos.whatsapp}</span>
                              </span>
                              <Badge className="border-emerald-200 bg-white text-emerald-700">Meta</Badge>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                              <span>Conecta WhatsApp de Meta para recibir pedidos.</span>
                              <Link to="/integraciones/whatsapp" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit bg-white')}>
                                Conectar
                              </Link>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                          <Label>Color</Label>
                          <div className="flex flex-wrap items-center gap-2">
                            {COLORES.map((color) => (
                              <button
                                key={color}
                                type="button"
                                aria-label={`Color ${color}`}
                                onClick={() => setDatos((actual) => (actual ? { ...actual, color } : actual))}
                                className={cn(
                                  'size-8 rounded-full border-2 transition-transform',
                                  datos.color.toLowerCase() === color.toLowerCase() ? 'scale-110 border-foreground' : 'border-transparent',
                                )}
                                style={{ background: color }}
                              />
                            ))}
                            <label className="relative size-8 cursor-pointer overflow-hidden rounded-full border" title="Otro color">
                              <input
                                type="color"
                                value={datos.color}
                                onChange={(evento) => setDatos((actual) => (actual ? { ...actual, color: evento.target.value.toUpperCase() } : actual))}
                                className="absolute inset-0 size-full cursor-pointer opacity-0"
                              />
                              <span className="block size-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {paso === 'portada' ? (
                    <div className="space-y-4">
                      <CabeceraPaso titulo="Portada" texto={`Hasta ${MAX_BANNERS} fotos. Se mueven solas.`} />
                      {datos.pagina.banners.length > 0 ? (
                        <CarruselBanners banners={datos.pagina.banners} color={datos.color} compacto />
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                          Sube la primera foto
                        </div>
                      )}
                      {datos.pagina.banners.map((banner, indice) => (
                        <div key={indice} className="space-y-3 rounded-2xl border p-4">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => elegirImagen({ tipo: 'banner', indice })}
                              className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border"
                              title="Cambiar imagen"
                            >
                              <img src={banner.imagen_url} alt="" className="size-full object-cover" />
                              {subiendo({ tipo: 'banner', indice }) ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                  <LoaderCircle className="size-4 animate-spin" />
                                </span>
                              ) : null}
                            </button>
                            <div className="flex flex-1 flex-col gap-2">
                              <p className="text-xs text-muted-foreground">Banner a pantalla completa</p>
                            </div>
                            <div className="flex flex-col">
                              <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir" disabled={indice === 0} onClick={() => moverBanner(indice, -1)}>
                                <ArrowUp />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" aria-label="Bajar" disabled={indice === datos.pagina.banners.length - 1} onClick={() => moverBanner(indice, 1)}>
                                <ArrowDown />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Quitar banner"
                                onClick={() => ponerPagina('banners', datos.pagina.banners.filter((_, posicion) => posicion !== indice))}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input className="h-9" placeholder="Etiqueta" value={banner.etiqueta} maxLength={40} onChange={(evento) => cambiarBanner(indice, 'etiqueta', evento.target.value)} />
                            <Input className="h-9" placeholder="Burbuja" value={banner.burbuja} maxLength={20} onChange={(evento) => cambiarBanner(indice, 'burbuja', evento.target.value)} />
                            <Input className="h-9 sm:col-span-2" placeholder="Título" value={banner.titulo} maxLength={80} onChange={(evento) => cambiarBanner(indice, 'titulo', evento.target.value)} />
                            <Input className="h-9 sm:col-span-2" placeholder="Texto corto" value={banner.texto} maxLength={160} onChange={(evento) => cambiarBanner(indice, 'texto', evento.target.value)} />
                            <Input className="h-9" placeholder="Botón" value={banner.boton} maxLength={30} onChange={(evento) => cambiarBanner(indice, 'boton', evento.target.value)} />
                            <SelectorFamilia familias={listaFamilias} valor={banner.id_familia} alCambiar={(id) => cambiarBanner(indice, 'id_familia', id)} />
                          </div>
                        </div>
                      ))}
                      {datos.pagina.banners.length < MAX_BANNERS ? (
                        <Button type="button" variant="outline" size="sm" disabled={subiendo({ tipo: 'banner', indice: null })} onClick={() => elegirImagen({ tipo: 'banner', indice: null })}>
                          {subiendo({ tipo: 'banner', indice: null }) ? <LoaderCircle className="animate-spin" /> : <Plus />}
                          Agregar banner
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {paso === 'promos' ? (
                    <>
                      <CabeceraPaso titulo="Promos" texto={`Hasta ${MAX_PROMOS} tarjetas y ofertas.`} />
                      <div className="space-y-3">
                        {datos.pagina.promos.map((promo, indice) => (
                          <div key={indice} className="flex gap-3 rounded-2xl border p-4">
                            <button
                              type="button"
                              onClick={() => elegirImagen({ tipo: 'promo', indice })}
                              className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                              style={{ background: promo.fondo }}
                              title="Imagen"
                            >
                              {promo.imagen_url ? <img src={promo.imagen_url} alt="" className="size-full object-contain" /> : <ImagePlus className="size-5 text-muted-foreground" />}
                              {subiendo({ tipo: 'promo', indice }) ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                  <LoaderCircle className="size-4 animate-spin" />
                                </span>
                              ) : null}
                            </button>
                            <div className="grid flex-1 gap-2">
                              <Input className="h-9" placeholder="Título" value={promo.titulo} maxLength={50} onChange={(evento) => cambiarPromo(indice, 'titulo', evento.target.value)} />
                              <Input className="h-9" placeholder="Texto" value={promo.texto} maxLength={80} onChange={(evento) => cambiarPromo(indice, 'texto', evento.target.value)} />
                              <div className="grid gap-2 sm:grid-cols-2">
                                <SelectorFamilia familias={listaFamilias} valor={promo.id_familia} alCambiar={(id) => cambiarPromo(indice, 'id_familia', id)} />
                                <SelectorFondo valor={promo.fondo} alCambiar={(fondo) => cambiarPromo(indice, 'fondo', fondo)} />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Quitar promo"
                              onClick={() => ponerPagina('promos', datos.pagina.promos.filter((_, posicion) => posicion !== indice))}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        ))}
                        {datos.pagina.promos.length < MAX_PROMOS ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => ponerPagina('promos', [...datos.pagina.promos, promoNueva()])}>
                            <Plus />
                            Agregar
                          </Button>
                        ) : null}
                      </div>

                      <div className="space-y-3 border-t pt-5">
                        <Interruptor etiqueta="Ofertas con cuenta regresiva" valor={datos.pagina.oferta.activa} alCambiar={(activa) => ponerPagina('oferta', { ...datos.pagina.oferta, activa })} />
                        {datos.pagina.oferta.activa ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Campo
                              etiqueta="Título"
                              name="oferta-titulo"
                              value={datos.pagina.oferta.titulo}
                              onChange={(evento) => ponerPagina('oferta', { ...datos.pagina.oferta, titulo: evento.target.value })}
                              maxLength={60}
                              autoComplete="off"
                            />
                            <div className="grid gap-2">
                              <Label htmlFor="oferta-termina">Termina</Label>
                              <input
                                id="oferta-termina"
                                type="datetime-local"
                                value={datos.pagina.oferta.termina}
                                onChange={(evento) => ponerPagina('oferta', { ...datos.pagina.oferta, termina: evento.target.value.slice(0, 16) })}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {paso === 'detalles' ? (
                    <>
                      <CabeceraPaso titulo="Detalles" texto="Qué se ve y cómo se comparte." />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Interruptor etiqueta="Categorías" valor={datos.pagina.secciones.categorias} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, categorias: valor })} />
                        <Interruptor etiqueta="Ofertas" valor={datos.pagina.secciones.ofertas} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, ofertas: valor })} />
                        <Interruptor etiqueta="Destacados" valor={datos.pagina.secciones.destacados} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, destacados: valor })} />
                        <Interruptor etiqueta="Quiénes somos" valor={datos.pagina.secciones.nosotros} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, nosotros: valor })} />
                        <Interruptor etiqueta="Mostrar precios" valor={datos.mostrar_precios} alCambiar={(valor) => setDatos((actual) => (actual ? { ...actual, mostrar_precios: valor } : actual))} />
                        <Interruptor etiqueta="Carrito" valor={datos.pagina.carrito} alCambiar={(valor) => ponerPagina('carrito', valor)} />
                      </div>

                      <div className="space-y-4 border-t pt-5">
                        <Campo etiqueta="Aviso superior" name="aviso" value={datos.pagina.aviso} onChange={(evento) => ponerPagina('aviso', evento.target.value)} maxLength={180} autoComplete="off" placeholder="Envío gratis desde S/ 80" opcional />
                        <AreaTexto etiqueta="Quiénes somos" valor={datos.pagina.sobre} maximo={600} alCambiar={(valor) => ponerPagina('sobre', valor)} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Campo etiqueta="Horario" name="horario" value={datos.pagina.horario} onChange={(evento) => ponerPagina('horario', evento.target.value)} maxLength={160} autoComplete="off" opcional />
                          <Campo etiqueta="Dirección" name="direccion" value={datos.pagina.direccion} onChange={(evento) => ponerPagina('direccion', evento.target.value)} maxLength={180} autoComplete="off" opcional />
                          <div className="sm:col-span-2">
                            <Campo etiqueta="Entrega" name="entrega" value={datos.pagina.entrega} onChange={(evento) => ponerPagina('entrega', evento.target.value)} maxLength={180} autoComplete="off" opcional />
                          </div>
                        </div>
                        <AreaTexto etiqueta="Cambios y devoluciones" valor={datos.pagina.devoluciones} maximo={300} alCambiar={(valor) => ponerPagina('devoluciones', valor)} />
                      </div>

                      <div className="grid gap-4 border-t pt-5 sm:grid-cols-3">
                        <Campo etiqueta="Instagram" name="instagram" value={datos.pagina.instagram} onChange={(evento) => ponerPagina('instagram', evento.target.value)} maxLength={80} autoComplete="off" placeholder="@mitienda" opcional />
                        <Campo etiqueta="Facebook" name="facebook" value={datos.pagina.facebook} onChange={(evento) => ponerPagina('facebook', evento.target.value)} maxLength={120} autoComplete="off" opcional />
                        <Campo etiqueta="TikTok" name="tiktok" value={datos.pagina.tiktok} onChange={(evento) => ponerPagina('tiktok', evento.target.value)} maxLength={80} autoComplete="off" opcional />
                      </div>

                      <div className="space-y-3 rounded-2xl border p-4">
                        <p className="text-sm font-medium">Al compartir</p>
                        <AreaTexto etiqueta="Texto" valor={datos.pagina.seo.descripcion} maximo={180} alCambiar={(descripcion) => ponerPagina('seo', { ...datos.pagina.seo, descripcion })} />
                        <div className="flex items-center gap-3">
                          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                            {fotoSeo(datos) ? <img src={fotoSeo(datos)} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-muted-foreground" />}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" disabled={subiendo({ tipo: 'seo' })} onClick={() => elegirImagen({ tipo: 'seo' })}>
                              {subiendo({ tipo: 'seo' }) ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
                              Foto
                            </Button>
                            {datos.pagina.seo.imagen_url ? (
                              <Button type="button" variant="ghost" size="sm" onClick={() => ponerPagina('seo', { ...datos.pagina.seo, imagen_url: '' })}>
                                Quitar
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}

                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
                {indicePaso > 0 ? (
                  <Button type="button" variant="outline" className="h-10" onClick={() => irA(PASOS[indicePaso - 1].id)}>
                    <ArrowLeft />
                    Atrás
                  </Button>
                ) : null}
                {indicePaso < PASOS.length - 1 ? (
                  <Button type="button" className="h-10" onClick={() => irA(PASOS[indicePaso + 1].id)}>
                    Continuar
                    <ArrowRight />
                  </Button>
                ) : null}
                <Button type="submit" variant={indicePaso === PASOS.length - 1 ? 'default' : 'outline'} className="h-10" disabled={guardar.isPending}>
                  {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
                  Guardar y publicar
                </Button>
                {datos.publicado || vitrina?.publicado ? (
                  <Button type="button" variant="ghost" className="h-10" disabled={guardar.isPending} onClick={() => guardar.mutate(false)}>
                    Borrador
                  </Button>
                ) : null}
                <Link to="/productos" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
                  Productos
                </Link>
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-4">
            {vitrina?.existe ? (
              <Link
                to="/catalogo/lab"
                className="superficie group flex items-center gap-4 p-5 transition-colors hover:bg-primary/5 sm:p-6"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <LayoutTemplate className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-base font-bold tracking-[-0.03em]">Constructor</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">Bloques y diseño libre</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : null}
            <div className="superficie space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Enlace y QR</p>
                {datos.publicado || vitrina?.publicado ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Publicado</Badge>
                ) : (
                  <Badge variant="secondary">Borrador</Badge>
                )}
              </div>

              {url ? (
                <>
                  <div className="flex justify-center rounded-2xl bg-muted/60 p-4">
                    {qr ? (
                      <img src={qr} alt="Código QR del catálogo" className="size-40 rounded-lg bg-white p-2" />
                    ) : (
                      <div className="flex size-40 items-center justify-center rounded-lg bg-white text-muted-foreground">
                        <LoaderCircle className="size-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="break-all text-xs text-muted-foreground">{url}</p>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void copiar(url)}>
                      {copiado ? <Check /> : <Copy />}
                      {copiado ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!qr} onClick={() => bajarQr(datos.slug)}>
                      <Download />
                      QR
                    </Button>
                    {datos.publicado || vitrina?.publicado ? (
                      <a href={url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-center')}>
                        <QrCode />
                        Abrir
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Publica para activar el enlace.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Guarda para crear el enlace.</p>
              )}
            </div>
          </aside>
        </form>
      )}
    </div>
  )
}

function CabeceraPaso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">{titulo}</h2>
      <p className="text-sm text-muted-foreground">{texto}</p>
    </div>
  )
}

function Interruptor({ etiqueta, valor, alCambiar }: { etiqueta: string; valor: boolean; alCambiar: (valor: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3">
      <span className="text-sm">{etiqueta}</span>
      <Switch checked={valor} onCheckedChange={alCambiar} />
    </label>
  )
}

function AreaTexto({ etiqueta, valor, maximo, alCambiar }: { etiqueta: string; valor: string; maximo: number; alCambiar: (valor: string) => void }) {
  const id = `area-${etiqueta.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {etiqueta} <span className="font-normal text-muted-foreground">(opcional)</span>
      </Label>
      <textarea
        id={id}
        rows={3}
        value={valor}
        maxLength={maximo}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}

function SelectorFamilia({ familias, valor, alCambiar }: { familias: FamiliaProducto[]; valor: number | null; alCambiar: (id: number | null) => void }) {
  return (
    <select
      value={valor ?? ''}
      onChange={(evento) => alCambiar(evento.target.value ? Number(evento.target.value) : null)}
      className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none"
      aria-label="Lleva a"
    >
      <option value="">Todos los productos</option>
      {familias.map((familia) => (
        <option key={familia.id} value={familia.id}>
          {familia.nombre}
        </option>
      ))}
    </select>
  )
}

function SelectorFondo({ valor, alCambiar }: { valor: string; alCambiar: (valor: string) => void }): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FONDOS.map((fondo) => (
        <button
          key={fondo}
          type="button"
          aria-label={`Fondo ${fondo}`}
          onClick={() => alCambiar(fondo)}
          className={cn('size-6 rounded-full border', valor.toUpperCase() === fondo ? 'ring-2 ring-foreground ring-offset-1' : '')}
          style={{ background: fondo }}
        />
      ))}
      <label className="relative size-6 cursor-pointer overflow-hidden rounded-full border" title="Otro fondo">
        <input type="color" value={valor} onChange={(evento) => alCambiar(evento.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" />
        <span className="block size-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]" />
      </label>
    </div>
  )
}
