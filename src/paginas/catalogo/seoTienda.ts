import type { ProductoPublico, SeoVitrina, VitrinaPublica } from '@/api'

const ICONO_BELLY = '/logo_belly.png'
const MARCA = 'data-seo-tienda'

export type TarjetaTienda = {
  titulo: string
  descripcion: string
  imagen: string
  logo: string
  url: string
  color: string
}

export function seoVacio(): SeoVitrina {
  return { descripcion: '', imagen_url: '' }
}

export function tarjetaTienda(catalogo: VitrinaPublica, slug: string, producto?: ProductoPublico | null): TarjetaTienda {
  const seo = catalogo.pagina.seo ?? seoVacio()
  const titulo = producto ? `${producto.nombre} · ${catalogo.titulo}` : catalogo.titulo
  const descripcion = (
    (producto ? producto.resumen || producto.descripcion : '') ||
    seo.descripcion ||
    catalogo.eslogan ||
    catalogo.pagina.sobre ||
    catalogo.pagina.aviso ||
    `Catálogo de ${catalogo.titulo}`
  ).slice(0, 180)
  const imagen = producto?.imagen_url || seo.imagen_url || catalogo.logo_url || catalogo.pagina.banners[0]?.imagen_url || ''
  const logo = catalogo.logo_url || ICONO_BELLY
  const url = `${window.location.origin}/c/${slug}${producto ? `/p/${producto.id}` : ''}`

  return { titulo, descripcion, imagen, logo, url, color: catalogo.color }
}

export function aplicarSeoTienda(tarjeta: TarjetaTienda) {
  document.title = tarjeta.titulo
  document.documentElement.lang = 'es'
  ponerIcono('icon', tarjeta.logo)
  ponerIcono('apple-touch-icon', tarjeta.logo)
  ponerMeta('description', tarjeta.descripcion)
  ponerMeta('theme-color', tarjeta.color)
  ponerMeta('og:type', 'website', 'property')
  ponerMeta('og:locale', 'es_PE', 'property')
  ponerMeta('og:title', tarjeta.titulo, 'property')
  ponerMeta('og:description', tarjeta.descripcion, 'property')
  ponerMeta('og:url', tarjeta.url, 'property')
  if (tarjeta.imagen) ponerMeta('og:image', tarjeta.imagen, 'property')
  ponerMeta('twitter:card', 'summary_large_image')
  ponerMeta('twitter:title', tarjeta.titulo)
  ponerMeta('twitter:description', tarjeta.descripcion)
  if (tarjeta.imagen) ponerMeta('twitter:image', tarjeta.imagen)
  ponerEnlace('canonical', tarjeta.url)
  ponerJson({
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: tarjeta.titulo,
    description: tarjeta.descripcion,
    url: tarjeta.url,
    image: tarjeta.imagen || undefined,
    logo: tarjeta.logo,
  })
}

export function restaurarSeoBelly() {
  document.title = 'Belly'
  ponerIcono('icon', ICONO_BELLY, false)
  ponerIcono('apple-touch-icon', ICONO_BELLY, false)
  document.head.querySelectorAll(`[${MARCA}]`).forEach((nodo) => nodo.remove())
}

function ponerIcono(rel: string, href: string, marcar = true) {
  let nodo = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!nodo) {
    nodo = document.createElement('link')
    nodo.rel = rel
    document.head.appendChild(nodo)
  }
  nodo.href = href
  if (marcar) nodo.setAttribute(MARCA, '')
}

function ponerMeta(nombre: string, contenido: string, atributo: 'name' | 'property' = 'name') {
  let nodo = document.head.querySelector<HTMLMetaElement>(`meta[${atributo}="${nombre}"]`)
  if (!nodo) {
    nodo = document.createElement('meta')
    nodo.setAttribute(atributo, nombre)
    document.head.appendChild(nodo)
  }
  nodo.content = contenido
  nodo.setAttribute(MARCA, '')
}

function ponerEnlace(rel: string, href: string) {
  let nodo = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!nodo) {
    nodo = document.createElement('link')
    nodo.rel = rel
    document.head.appendChild(nodo)
  }
  nodo.href = href
  nodo.setAttribute(MARCA, '')
}

function ponerJson(datos: Record<string, unknown>) {
  let nodo = document.head.querySelector<HTMLScriptElement>(`script#seo-tienda`)
  if (!nodo) {
    nodo = document.createElement('script')
    nodo.id = 'seo-tienda'
    nodo.type = 'application/ld+json'
    document.head.appendChild(nodo)
  }
  nodo.textContent = JSON.stringify(datos)
  nodo.setAttribute(MARCA, '')
}
