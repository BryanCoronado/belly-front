import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Check, Copy, Download, ExternalLink, ImagePlus, LoaderCircle, Plus, QrCode, Trash2 } from 'lucide-react'
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
import { EditorHtmlCatalogo } from '@/paginas/catalogo/EditorHtmlCatalogo'
import { normalizarBloque } from '@/paginas/catalogo/bloques'
import { seoVacio } from '@/paginas/catalogo/seoTienda'
import { esAdministrador, leerSesion } from '@/sesion'

const CLAVE = ['catalogo-vitrina']
const COLORES = ['#0B1026', '#5B46B4', '#0F766E', '#9F1239', '#C2410C', '#2563EB', '#16A34A', '#18181B']
const FONDOS = ['#EEF0E5', '#FDECEA', '#E8F1FB', '#FFF4DB', '#EFE9FB', '#E6F6EF', '#F4F1EA', '#FFFFFF']
const MAX_BANNERS = 6
const MAX_PROMOS = 3

type Pestana = 'marca' | 'portada' | 'promos' | 'secciones' | 'html'

const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'marca', nombre: 'Marca' },
  { id: 'portada', nombre: 'Carrusel' },
  { id: 'promos', nombre: 'Promos y ofertas' },
  { id: 'secciones', nombre: 'Secciones e info' },
  { id: 'html', nombre: 'Constructor' },
]

type Destino = { tipo: 'logo' } | { tipo: 'banner'; indice: number | null } | { tipo: 'promo'; indice: number } | { tipo: 'seo' }

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
  return { imagen_url, estilo: 'dividido', etiqueta: '', titulo: '', texto: '', boton: 'Comprar ahora', id_familia: null, fondo: FONDOS[0], burbuja: '' }
}

function promoNueva(): PromoVitrina {
  return { titulo: '', texto: '', imagen_url: '', fondo: FONDOS[1], id_familia: null }
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
      banners: (pagina.banners ?? []).map((banner) => ({ ...bannerNuevo(banner.imagen_url), ...banner })),
      promos: pagina.promos ?? [],
      oferta: { ...PAGINA_VACIA.oferta, ...pagina.oferta },
      secciones: { ...PAGINA_VACIA.secciones, ...pagina.secciones },
      bloques: (pagina.bloques ?? []).map(normalizarBloque),
      seo: { ...seoVacio(), ...pagina.seo },
    },
  }
}

export function MiCatalogo() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: CLAVE, queryFn: leerVitrina })
  const familias = useQuery({ queryKey: ['familias-producto'], queryFn: leerFamilias })
  const [params] = useSearchParams()
  const [editado, setEditado] = useState<DatosVitrina | null>(null)
  const [pestana, setPestana] = useState<Pestana>(() => {
    const pedida = params.get('pestana')
    return PESTANAS.some((item) => item.id === pedida) ? (pedida as Pestana) : 'marca'
  })
  const [slugTocado, setSlugEditado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [qr, setQr] = useState<string>('')
  const [logoArchivo, setLogoArchivo] = useState<File | null>(null)
  const selector = useRef<HTMLInputElement>(null)
  const destino = useRef<Destino>({ tipo: 'logo' })

  const datos = editado ?? (consulta.data ? desdeVitrina(consulta.data) : null)
  const slugEditado = slugTocado || Boolean(consulta.data?.existe)

  function setDatos(cambio: (actual: DatosVitrina | null) => DatosVitrina | null) {
    setEditado((previo) => cambio(previo ?? (consulta.data ? desdeVitrina(consulta.data) : null)))
  }

  const guardar = useMutation({
    mutationFn: () => {
      if (!datos) throw new Error('Completa el catálogo.')
      return guardarVitrina(datos)
    },
    onSuccess: (vitrina) => {
      setEditado(desdeVitrina(vitrina))
      setSlugEditado(true)
      setLogoArchivo(null)
      void cliente.invalidateQueries({ queryKey: CLAVE })
      const sinTitulo = (datos?.pagina.promos ?? []).some((promo) => !promo.titulo.trim())
      avisoExito(vitrina.publicado ? 'Catálogo publicado' : 'Catálogo guardado', sinTitulo ? 'Las promos sin título no se guardan.' : undefined)
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

  if (!admin) {
    return (
      <div className="space-y-6">
        <CabeceraPagina titulo="Mi Catálogo" descripcion="Tu vitrina pública de productos." />
        <p className="superficie p-6 text-sm text-muted-foreground">Solo el administrador puede configurarlo.</p>
      </div>
    )
  }

  function elegirImagen(lugar: Destino) {
    destino.current = lugar
    selector.current?.click()
  }

  function ponerPagina<K extends keyof PaginaVitrina>(campo: K, valor: PaginaVitrina[K]) {
    setDatos((actual) => (actual ? { ...actual, pagina: { ...actual.pagina, [campo]: valor } } : actual))
  }

  function cambiarBanner<K extends keyof BannerVitrina>(indice: number, campo: K, valor: BannerVitrina[K]) {
    setDatos((actual) =>
      actual
        ? {
            ...actual,
            pagina: {
              ...actual.pagina,
              banners: actual.pagina.banners.map((banner, posicion) => (posicion === indice ? { ...banner, [campo]: valor } : banner)),
            },
          }
        : actual,
    )
  }

  function moverBanner(indice: number, paso: number) {
    setDatos((actual) => {
      if (!actual) return actual
      const banners = [...actual.pagina.banners]
      const destinoIndice = indice + paso
      if (destinoIndice < 0 || destinoIndice >= banners.length) return actual
      ;[banners[indice], banners[destinoIndice]] = [banners[destinoIndice], banners[indice]]
      return { ...actual, pagina: { ...actual.pagina, banners } }
    })
  }

  function cambiarPromo<K extends keyof PromoVitrina>(indice: number, campo: K, valor: PromoVitrina[K]) {
    setDatos((actual) =>
      actual
        ? {
            ...actual,
            pagina: {
              ...actual.pagina,
              promos: actual.pagina.promos.map((promo, posicion) => (posicion === indice ? { ...promo, [campo]: valor } : promo)),
            },
          }
        : actual,
    )
  }

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((actual) => {
      if (!actual) return actual
      if (name === 'titulo' && !slugEditado) {
        return { ...actual, titulo: value, slug: slugDe(value) }
      }
      if (name === 'slug') {
        setSlugEditado(true)
        return { ...actual, slug: slugDe(value) }
      }
      return { ...actual, [name]: value }
    })
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1600)
    } catch {
      avisoError(new Error('No se pudo copiar'), 'Copia el enlace a mano.')
    }
  }

  function bajarQr(nombre: string) {
    if (!qr) {
      avisoError(new Error('El QR aún no está listo'), 'Espera un segundo.')
      return
    }
    const ancla = document.createElement('a')
    ancla.href = qr
    ancla.download = `catalogo-${nombre || 'belly'}.png`
    ancla.click()
  }

  const listaFamilias = familias.data ?? []
  const subiendo = (lugar: Destino) =>
    subir.isPending && JSON.stringify(subir.variables?.destino) === JSON.stringify(lugar)

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Mi Catálogo"
        descripcion="Arma tu tienda online: banners, promos, ofertas con cuenta regresiva, carrito y QR. Los productos salen de tu catálogo."
        acciones={
          vitrina?.publicado && url ? (
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="superficie h-96 animate-pulse" />
          <div className="superficie h-96 animate-pulse" />
        </div>
      ) : (
        <form className={cn('grid items-start gap-4', pestana !== 'html' && 'lg:grid-cols-[minmax(0,1fr)_20rem]')} onSubmit={enviar}>
          <section className="superficie overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b px-3 pt-2">
              {PESTANAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPestana(item.id)}
                  className={cn(
                    '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition',
                    pestana === item.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.nombre}
                </button>
              ))}
            </div>

            <div className={cn(pestana === 'html' ? 'space-y-3 p-2 sm:p-3' : 'space-y-6 p-5 sm:p-6')}>
              {pestana === 'marca' ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                      {datos.logo_url ? <img src={datos.logo_url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted-foreground" />}
                    </div>
                    <div className="space-y-1.5">
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
                      <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Va en la cabecera, el QR y el ícono de la pestaña.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Campo etiqueta="Nombre de la tienda" name="titulo" value={datos.titulo} onChange={cambiar} maxLength={80} autoComplete="off" required />
                    </div>
                    <div className="sm:col-span-2">
                      <Campo etiqueta="Frase corta" name="eslogan" value={datos.eslogan} onChange={cambiar} maxLength={160} autoComplete="off" ayuda="Sale debajo del nombre." opcional />
                    </div>
                    <div className="sm:col-span-2">
                      <Campo
                        etiqueta="Nombre del enlace"
                        name="slug"
                        value={datos.slug}
                        onChange={cambiar}
                        maxLength={60}
                        autoComplete="off"
                        required
                        ayuda={`Quedará ${window.location.origin}/c/${datos.slug || 'tu-nombre'}`}
                      />
                    </div>
                    <Campo
                      etiqueta="WhatsApp para pedidos"
                      name="whatsapp"
                      value={datos.whatsapp}
                      onChange={cambiar}
                      inputMode="tel"
                      autoComplete="off"
                      ayuda="Con código de país. Ejemplo: 51987654321."
                      opcional
                    />
                    <div className="grid gap-2">
                      <Label>Color principal</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        {COLORES.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={`Color ${color}`}
                            onClick={() => setDatos((actual) => (actual ? { ...actual, color } : actual))}
                            className={cn('size-8 rounded-full border-2', datos.color.toLowerCase() === color.toLowerCase() ? 'border-foreground' : 'border-transparent')}
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

                  <div className="space-y-3 rounded-2xl border p-4">
                    <Ayuda
                      titulo="Al compartir el enlace"
                      texto="WhatsApp, Facebook y Google muestran este texto y esta foto. Si no eliges foto, se usa el logo o el primer banner."
                    />
                    <AreaTexto
                      etiqueta="Texto al compartir"
                      valor={datos.pagina.seo.descripcion}
                      maximo={180}
                      alCambiar={(descripcion) => ponerPagina('seo', { ...datos.pagina.seo, descripcion })}
                    />
                    <div className="grid gap-2">
                      <Label>Foto al compartir</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                          {fotoSeo(datos) ? (
                            <img src={fotoSeo(datos)} alt="" className="size-full object-cover" />
                          ) : (
                            <ImagePlus className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={subiendo({ tipo: 'seo' })} onClick={() => elegirImagen({ tipo: 'seo' })}>
                            {subiendo({ tipo: 'seo' }) ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
                            {datos.pagina.seo.imagen_url ? 'Cambiar foto' : 'Subir foto'}
                          </Button>
                          {datos.logo_url ? (
                            <Button type="button" variant="ghost" size="sm" onClick={() => ponerPagina('seo', { ...datos.pagina.seo, imagen_url: datos.logo_url })}>
                              Usar logo
                            </Button>
                          ) : null}
                          {datos.pagina.banners[0]?.imagen_url ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => ponerPagina('seo', { ...datos.pagina.seo, imagen_url: datos.pagina.banners[0].imagen_url })}
                            >
                              Usar banner
                            </Button>
                          ) : null}
                          {datos.pagina.seo.imagen_url ? (
                            <Button type="button" variant="ghost" size="sm" onClick={() => ponerPagina('seo', { ...datos.pagina.seo, imagen_url: '' })}>
                              Quitar
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Mejor 1200 × 630 px. En un producto se usa la foto de ese producto.</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Interruptor etiqueta="Mostrar precios" valor={datos.mostrar_precios} alCambiar={(valor) => setDatos((actual) => (actual ? { ...actual, mostrar_precios: valor } : actual))} />
                    <Interruptor etiqueta="Carrito de pedidos" valor={datos.pagina.carrito} alCambiar={(valor) => ponerPagina('carrito', valor)} />
                    <div className="sm:col-span-2">
                      <Interruptor etiqueta="Publicar tienda" valor={datos.publicado} alCambiar={(valor) => setDatos((actual) => (actual ? { ...actual, publicado: valor } : actual))} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPestana('portada')}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-dashed px-4 py-3 text-left hover:bg-muted/50"
                  >
                    <span>
                      <span className="block text-sm font-medium">Carrusel de la portada</span>
                      <span className="text-xs text-muted-foreground">
                        {datos.pagina.banners.length === 0
                          ? 'Ahí se configuran las fotos que se mueven solas y con el mouse, arriba de la tienda.'
                          : `${datos.pagina.banners.length} banner${datos.pagina.banners.length === 1 ? '' : 's'} listos. Toca para editarlos.`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium">{datos.pagina.banners.length === 0 ? 'Agregar' : 'Editar'}</span>
                  </button>
                </>
              ) : null}

              {pestana === 'portada' ? (
                <div className="space-y-4">
                  <Ayuda
                    titulo="Carrusel de la portada"
                    texto={`Sale arriba de la tienda y se adapta al celular. Si subes 2 o más fotos, se deslizan solas cada 5 segundos y también se arrastran con el mouse. Hasta ${MAX_BANNERS}.`}
                  />
                  <div className="grid gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      <span className="font-medium text-foreground">Banner dividido:</span> foto del producto 1000 × 1000 px (PNG sin fondo queda mejor). El texto va a la izquierda.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Banner completo:</span> 1600 × 700 px (JPG). Se ve entero, de lado a lado, en celular y computadora.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Tarjeta promo:</span> 800 × 800 px, PNG sin fondo.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Categoría y producto:</span> 800 × 800 px (cuadrado). Logo: 400 × 400 px.
                    </p>
                  </div>
                  {datos.pagina.banners.length > 0 ? (
                    <CarruselBanners banners={datos.pagina.banners} color={datos.color} compacto />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                      Sube la primera foto para ver el carrusel aquí.
                    </div>
                  )}
                  {datos.pagina.banners.map((banner, indice) => (
                    <div key={indice} className="space-y-3 rounded-2xl border p-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => elegirImagen({ tipo: 'banner', indice })}
                          className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border"
                          style={{ background: banner.estilo === 'dividido' ? banner.fondo : undefined }}
                          title="Cambiar imagen"
                        >
                          <img src={banner.imagen_url} alt="" className={cn('size-full', banner.estilo === 'dividido' ? 'object-contain' : 'object-cover')} />
                          {subiendo({ tipo: 'banner', indice }) ? (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                              <LoaderCircle className="size-4 animate-spin" />
                            </span>
                          ) : null}
                        </button>
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex rounded-lg bg-muted p-0.5 text-xs">
                            {(['dividido', 'completo'] as const).map((estilo) => (
                              <button
                                key={estilo}
                                type="button"
                                onClick={() => cambiarBanner(indice, 'estilo', estilo)}
                                className={cn('flex-1 rounded-md px-2 py-1.5 font-medium', banner.estilo === estilo ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                              >
                                {estilo === 'dividido' ? 'Dividido' : 'Completo'}
                              </button>
                            ))}
                          </div>
                          {banner.estilo === 'dividido' ? <SelectorFondo valor={banner.fondo} alCambiar={(fondo) => cambiarBanner(indice, 'fondo', fondo)} /> : null}
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
                        <Input className="h-9" placeholder="Etiqueta (ej. NUEVA COLECCIÓN)" value={banner.etiqueta} maxLength={40} onChange={(evento) => cambiarBanner(indice, 'etiqueta', evento.target.value)} />
                        <Input className="h-9" placeholder="Burbuja (ej. Desde S/ 49)" value={banner.burbuja} maxLength={20} onChange={(evento) => cambiarBanner(indice, 'burbuja', evento.target.value)} />
                        <Input className="h-9 sm:col-span-2" placeholder="Título grande" value={banner.titulo} maxLength={80} onChange={(evento) => cambiarBanner(indice, 'titulo', evento.target.value)} />
                        <Input className="h-9 sm:col-span-2" placeholder="Texto corto" value={banner.texto} maxLength={160} onChange={(evento) => cambiarBanner(indice, 'texto', evento.target.value)} />
                        <Input className="h-9" placeholder="Texto del botón (vacío = sin botón)" value={banner.boton} maxLength={30} onChange={(evento) => cambiarBanner(indice, 'boton', evento.target.value)} />
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

              {pestana === 'promos' ? (
                <>
                  <div className="space-y-4">
                    <Ayuda titulo="Tarjetas de promoción" texto={`Hasta ${MAX_PROMOS}, debajo del carrusel. Foto recomendada: 800 × 800 px, PNG sin fondo. Al tocarlas llevan a la categoría que elijas.`} />
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
                          <Input className="h-9" placeholder="Título (obligatorio)" value={promo.titulo} maxLength={50} onChange={(evento) => cambiarPromo(indice, 'titulo', evento.target.value)} />
                          <Input className="h-9" placeholder="Texto (ej. Hasta 30% menos)" value={promo.texto} maxLength={80} onChange={(evento) => cambiarPromo(indice, 'texto', evento.target.value)} />
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
                        Agregar tarjeta
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-3 border-t pt-6">
                    <Ayuda titulo="Ofertas con cuenta regresiva" texto="Muestra los productos que tengan precio de oferta, con un reloj hasta la fecha que pongas. Si no pones fecha, se muestra sin reloj." />
                    <Interruptor etiqueta="Mostrar sección de ofertas" valor={datos.pagina.oferta.activa} alCambiar={(activa) => ponerPagina('oferta', { ...datos.pagina.oferta, activa })} />
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

              {pestana === 'secciones' ? (
                <>
                  <div className="space-y-3">
                    <Ayuda titulo="Qué se ve en la portada" texto="Apaga lo que no quieras mostrar." />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Interruptor etiqueta="Categorías populares" valor={datos.pagina.secciones.categorias} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, categorias: valor })} />
                      <Interruptor etiqueta="Ofertas" valor={datos.pagina.secciones.ofertas} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, ofertas: valor })} />
                      <Interruptor etiqueta="Destacados" valor={datos.pagina.secciones.destacados} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, destacados: valor })} />
                      <Interruptor etiqueta="Quiénes somos" valor={datos.pagina.secciones.nosotros} alCambiar={(valor) => ponerPagina('secciones', { ...datos.pagina.secciones, nosotros: valor })} />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <Campo
                      etiqueta="Aviso de la franja superior"
                      name="aviso"
                      value={datos.pagina.aviso}
                      onChange={(evento) => ponerPagina('aviso', evento.target.value)}
                      maxLength={180}
                      autoComplete="off"
                      ayuda="Ejemplo: Envío gratis desde S/ 80."
                      opcional
                    />
                    <AreaTexto etiqueta="Quiénes somos" valor={datos.pagina.sobre} maximo={600} alCambiar={(valor) => ponerPagina('sobre', valor)} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo etiqueta="Horario" name="horario" value={datos.pagina.horario} onChange={(evento) => ponerPagina('horario', evento.target.value)} maxLength={160} autoComplete="off" opcional />
                      <Campo etiqueta="Dirección" name="direccion" value={datos.pagina.direccion} onChange={(evento) => ponerPagina('direccion', evento.target.value)} maxLength={180} autoComplete="off" opcional />
                      <div className="sm:col-span-2">
                        <Campo etiqueta="Entrega" name="entrega" value={datos.pagina.entrega} onChange={(evento) => ponerPagina('entrega', evento.target.value)} maxLength={180} autoComplete="off" ayuda="Ejemplo: Delivery el mismo día en Lima." opcional />
                      </div>
                    </div>
                    <AreaTexto etiqueta="Cambios y devoluciones" valor={datos.pagina.devoluciones} maximo={300} alCambiar={(valor) => ponerPagina('devoluciones', valor)} />
                  </div>

                  <div className="space-y-3 border-t pt-6">
                    <Ayuda titulo="Redes sociales" texto="Solo el usuario o el enlace. Salen en la franja superior y en el pie." />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Campo etiqueta="Instagram" name="instagram" value={datos.pagina.instagram} onChange={(evento) => ponerPagina('instagram', evento.target.value)} maxLength={80} autoComplete="off" placeholder="mitienda" opcional />
                      <Campo etiqueta="Facebook" name="facebook" value={datos.pagina.facebook} onChange={(evento) => ponerPagina('facebook', evento.target.value)} maxLength={120} autoComplete="off" placeholder="mitienda" opcional />
                      <Campo etiqueta="TikTok" name="tiktok" value={datos.pagina.tiktok} onChange={(evento) => ponerPagina('tiktok', evento.target.value)} maxLength={80} autoComplete="off" placeholder="mitienda" opcional />
                    </div>
                  </div>
                </>
              ) : null}

              {pestana === 'html' ? (
                <EditorHtmlCatalogo datos={datos} slugGuardado={vitrina?.existe ? vitrina.slug : null} alCambiar={(bloques) => ponerPagina('bloques', bloques)} />
              ) : null}

              <div className="flex flex-wrap items-center gap-3 border-t pt-5">
                <Button type="submit" className="h-10" disabled={guardar.isPending}>
                  {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
                  Guardar
                </Button>
                <Link to="/productos" className="text-sm text-muted-foreground hover:text-foreground">
                  Ir a productos
                </Link>
              </div>
            </div>
          </section>

          {pestana === 'html' ? null : <aside className="superficie space-y-5 p-5 sm:p-6 lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Enlace y QR</p>
              {vitrina?.publicado ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Publicado</Badge> : <Badge variant="secondary">Borrador</Badge>}
            </div>

            {url ? (
              <>
                <div className="flex justify-center rounded-2xl bg-[#F6F4EF] p-4">
                  {qr ? (
                    <img src={qr} alt="Código QR del catálogo" className="size-44 rounded-lg bg-white p-2" />
                  ) : (
                    <div className="flex size-44 items-center justify-center rounded-lg bg-white text-muted-foreground">
                      <LoaderCircle className="size-5 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="break-all text-sm">{url}</p>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" onClick={() => void copiar(url)}>
                    {copiado ? <Check /> : <Copy />}
                    {copiado ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                  <Button type="button" variant="outline" disabled={!qr} onClick={() => bajarQr(datos.slug)}>
                    <Download />
                    Bajar QR
                  </Button>
                  {datos.logo_url || logoArchivo ? (
                    <p className="text-xs text-muted-foreground">El logo va al centro. El QR se sigue leyendo.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sube un logo para que aparezca en el QR.</p>
                  )}
                  {vitrina?.publicado ? (
                    <a href={url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: 'outline' }), 'justify-center')}>
                      <QrCode />
                      Abrir tienda
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">Publícala para que el enlace y el QR funcionen.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Guarda para crear el enlace y el QR.</p>
            )}
          </aside>}
        </form>
      )}
    </div>
  )
}

function Ayuda({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="text-xs text-muted-foreground">{texto}</p>
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
      <option value="">Lleva a: todos los productos</option>
      {familias.map((familia) => (
        <option key={familia.id} value={familia.id}>
          Lleva a: {familia.nombre}
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
