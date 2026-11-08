import type { AnchoBloque, BloqueHtmlVitrina, DatosWidget, LugarBloque, TamanoBloque, TipoWidget } from '@/api'

export const ANCHOS_BLOQUE: { id: AnchoBloque; nombre: string }[] = [
  { id: 'estrecho', nombre: 'Chico' },
  { id: 'caja', nombre: 'Medio' },
  { id: 'amplio', nombre: 'Ancho' },
  { id: 'completo', nombre: 'Pantalla' },
]

export const TAMANOS_BLOQUE: { id: TamanoBloque; nombre: string }[] = [
  { id: 's', nombre: 'Pequeño' },
  { id: 'm', nombre: 'Normal' },
  { id: 'l', nombre: 'Grande' },
]

export function normalizarAncho(valor: unknown): AnchoBloque {
  if (valor === 'estrecho' || valor === 'amplio' || valor === 'completo' || valor === 'caja') return valor
  return 'caja'
}

export function normalizarTamano(valor: unknown): TamanoBloque {
  if (valor === 's' || valor === 'l' || valor === 'm') return valor
  return 'm'
}

export const MAX_BLOQUES = 16

export const LUGARES_BLOQUE: { id: LugarBloque; nombre: string }[] = [
  { id: 'cabecera', nombre: 'Debajo del menú' },
  { id: 'despues_carrusel', nombre: 'Después del carrusel' },
  { id: 'despues_promos', nombre: 'Después de las promos' },
  { id: 'despues_categorias', nombre: 'Después de categorías' },
  { id: 'despues_ofertas', nombre: 'Después de ofertas' },
  { id: 'despues_destacados', nombre: 'Después de destacados' },
  { id: 'despues_productos', nombre: 'Después de productos' },
  { id: 'despues_beneficios', nombre: 'Después de entrega y horario' },
  { id: 'despues_nosotros', nombre: 'Después de quiénes somos' },
  { id: 'antes_footer', nombre: 'Antes del pie' },
  { id: 'pie', nombre: 'Dentro del pie' },
  { id: 'ficha', nombre: 'En la ficha del producto' },
]

export function nombreLugar(donde: LugarBloque): string {
  return LUGARES_BLOQUE.find((item) => item.id === donde)?.nombre ?? donde
}

export const LIENZO: { fijo?: string; donde?: LugarBloque }[] = [
  { fijo: 'Menú de la tienda' },
  { donde: 'cabecera' },
  { fijo: 'Carrusel de banners' },
  { donde: 'despues_carrusel' },
  { fijo: 'Promos' },
  { donde: 'despues_promos' },
  { fijo: 'Categorías' },
  { donde: 'despues_categorias' },
  { fijo: 'Ofertas' },
  { donde: 'despues_ofertas' },
  { fijo: 'Destacados' },
  { donde: 'despues_destacados' },
  { fijo: 'Todos los productos' },
  { donde: 'despues_productos' },
  { fijo: 'Entrega y horario' },
  { donde: 'despues_beneficios' },
  { fijo: 'Quiénes somos' },
  { donde: 'despues_nosotros' },
  { donde: 'antes_footer' },
  { fijo: 'Pie de página' },
  { donde: 'pie' },
  { fijo: 'Ficha de un producto' },
  { donde: 'ficha' },
]

export const WIDGETS: { tipo: TipoWidget; nombre: string }[] = [
  { tipo: 'texto', nombre: 'Texto' },
  { tipo: 'imagen', nombre: 'Imagen' },
  { tipo: 'boton', nombre: 'Botón' },
  { tipo: 'franja', nombre: 'Franja' },
  { tipo: 'columnas', nombre: 'Columnas' },
  { tipo: 'video', nombre: 'Video' },
  { tipo: 'espacio', nombre: 'Espacio' },
  { tipo: 'html', nombre: 'HTML' },
]

export function idBloque(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function datosVacios(): DatosWidget {
  return {
    titulo: '',
    texto: '',
    imagen_url: '',
    boton: '',
    enlace: '',
    color: '#0B1026',
    fondo: '#FFFFFF',
    video: '',
    alto: 40,
    ancho_pct: 0,
    tamano: 'm',
    columnas: [
      { titulo: '1.', texto: 'Elige tus productos' },
      { titulo: '2.', texto: 'Arma el pedido' },
      { titulo: '3.', texto: 'Te lo enviamos' },
    ],
  }
}

export function bloqueNuevo(tipo: TipoWidget, donde: LugarBloque = 'despues_carrusel', color = '#0B1026'): BloqueHtmlVitrina {
  const datos = datosVacios()
  datos.color = color
  if (tipo === 'texto') {
    datos.titulo = 'Título'
    datos.texto = 'Escribe aquí lo que quieras mostrar.'
  }
  if (tipo === 'boton') {
    datos.boton = 'Ver productos'
    datos.enlace = '#productos'
  }
  if (tipo === 'franja') {
    datos.texto = 'Envío gratis desde S/ 80 · Lima y Callao'
    datos.fondo = color
    datos.color = '#FFFFFF'
  }
  if (tipo === 'html') {
    datos.titulo = 'HTML'
  }
  const base: BloqueHtmlVitrina = {
    id: idBloque(),
    nombre: WIDGETS.find((item) => item.tipo === tipo)?.nombre ?? 'Bloque',
    tipo,
    html: '',
    css: '',
    donde,
    ancho: tipo === 'franja' ? 'completo' : 'caja',
    activo: true,
    datos,
  }
  return armarBloque(base)
}

export function normalizarBloque(bloque: Partial<BloqueHtmlVitrina>): BloqueHtmlVitrina {
  const tipo = bloque.tipo ?? (bloque.html ? 'html' : 'texto')
  const pct = Number(bloque.datos?.ancho_pct ?? 0)
  const datos = {
    ...datosVacios(),
    ...bloque.datos,
    tamano: normalizarTamano(bloque.datos?.tamano),
    ancho_pct: Number.isFinite(pct) ? Math.max(0, Math.min(100, Math.round(pct))) : 0,
  }
  const actual: BloqueHtmlVitrina = {
    ...bloqueNuevo(tipo, bloque.donde ?? 'despues_carrusel'),
    ...bloque,
    id: bloque.id || idBloque(),
    tipo,
    datos,
    activo: bloque.activo !== false,
    ancho: normalizarAncho(bloque.ancho),
  }
  return armarBloque(actual)
}

export function armarBloque(bloque: BloqueHtmlVitrina): BloqueHtmlVitrina {
  if (bloque.tipo === 'html') return bloque
  const { html, css } = compilarWidget(bloque)
  return { ...bloque, html, css, nombre: bloque.nombre || WIDGETS.find((item) => item.tipo === bloque.tipo)?.nombre || 'Bloque' }
}

export const DESTINOS_BOTON: { valor: string; nombre: string }[] = [
  { valor: '#productos', nombre: 'Lista de productos' },
  { valor: '#categorias', nombre: 'Categorías' },
  { valor: '#ofertas', nombre: 'Ofertas' },
  { valor: '#destacados', nombre: 'Destacados' },
  { valor: '#promos', nombre: 'Promos' },
  { valor: '#nosotros', nombre: 'Quiénes somos' },
  { valor: 'whatsapp', nombre: 'WhatsApp de la tienda' },
]

export type DestinoBoton =
  | { tipo: 'ancla'; id: string; href: string }
  | { tipo: 'familia'; id: number; href: string }
  | { tipo: 'externo'; href: string }

export function resolverEnlace(enlace: string, whatsapp: string | null): DestinoBoton {
  const valor = enlace.trim()
  const minuscula = valor.toLowerCase()
  if (!valor || minuscula === 'productos' || minuscula === '# productos') return { tipo: 'ancla', id: 'productos', href: '#productos' }
  if (minuscula.startsWith('familia:')) {
    const id = Number(valor.slice(8))
    if (id > 0) return { tipo: 'familia', id, href: '#productos' }
  }
  if (minuscula === 'whatsapp') {
    return whatsapp
      ? { tipo: 'externo', href: `https://wa.me/${whatsapp.replace(/\D+/g, '')}?text=${encodeURIComponent('[Belly·Web]')}` }
      : { tipo: 'ancla', id: 'productos', href: '#productos' }
  }
  if (valor.startsWith('#')) {
    const id = valor.slice(1).trim().toLowerCase().replace(/\s+/g, '-') || 'productos'
    return { tipo: 'ancla', id, href: `#${id}` }
  }
  if (/^https?:\/\//i.test(valor)) return { tipo: 'externo', href: valor }
  if (/^(wa\.me|www\.)/i.test(valor) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(valor)) return { tipo: 'externo', href: `https://${valor}` }
  return { tipo: 'ancla', id: minuscula.replace(/\s+/g, '-'), href: `#${minuscula.replace(/\s+/g, '-')}` }
}

export function embedYoutube(url: string): string {
  const encontrado = url.trim().match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  return encontrado ? `https://www.youtube.com/embed/${encontrado[1]}` : ''
}

export function limpiarHtml(valor: string): string {
  return valor
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(?:html|head|body|link|meta|base|object|embed)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
}

export function limpiarCss(valor: string): string {
  return valor
    .replace(/@import[^;{}]*;?/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/-moz-binding/gi, '')
    .replace(/behavior\s*:/gi, '')
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escalaTamano(tamano: TamanoBloque) {
  if (tamano === 's') return { pad: '14px 16px', titulo: '20px', texto: '13px', boton: '10px 16px', radio: '16px', foto: '160px' }
  if (tamano === 'l') return { pad: '40px 32px', titulo: '36px', texto: '16px', boton: '16px 28px', radio: '28px', foto: '420px' }
  return { pad: '28px 24px', titulo: '28px', texto: '14px', boton: '12px 22px', radio: '24px', foto: '280px' }
}

export function compilarWidget(bloque: BloqueHtmlVitrina): { html: string; css: string } {
  const d = { ...datosVacios(), ...bloque.datos, tamano: normalizarTamano(bloque.datos?.tamano) }
  const color = d.color || '#0B1026'
  const fondo = d.fondo || '#FFFFFF'
  const e = escalaTamano(d.tamano)
  if (bloque.tipo === 'franja') {
    return {
      html: `<div class="franja">${escapar(d.texto || 'Aviso')}</div>`,
      css: `.franja{background:${fondo};color:${color};text-align:center;padding:${e.pad};font-weight:600;font-size:${e.texto}}`,
    }
  }
  if (bloque.tipo === 'texto') {
    return {
      html: `<section class="texto">${d.titulo ? `<h2>${escapar(d.titulo)}</h2>` : ''}${d.texto ? `<p>${escapar(d.texto)}</p>` : ''}</section>`,
      css: `.texto{background:${fondo};border-radius:${e.radio};padding:${e.pad};text-align:center;color:${color}}.texto h2{margin:0 0 8px;font-size:${e.titulo}}.texto p{margin:0;color:${color};opacity:.7;white-space:pre-line;font-size:${e.texto}}`,
    }
  }
  if (bloque.tipo === 'imagen') {
    const alto = d.alto > 40 ? Math.max(80, Math.min(640, d.alto)) : Number.parseInt(e.foto, 10)
    return {
      html: d.imagen_url ? `<img class="foto" src="${escapar(d.imagen_url)}" alt="">` : '<div class="foto vacia">Imagen</div>',
      css: `.foto{display:block;width:100%;max-height:${alto}px;border-radius:${e.radio};object-fit:cover}.vacia{background:#eee;min-height:${Math.min(alto, 180)}px;display:grid;place-items:center;color:#888}`,
    }
  }
  if (bloque.tipo === 'boton') {
    return {
      html: `<div class="wrap"><a class="boton" href="${escapar(d.enlace || '#productos')}">${escapar(d.boton || 'Ver más')}</a></div>`,
      css: `.wrap{display:flex;justify-content:center;padding:8px}.boton{background:${color};color:#fff;padding:${e.boton};border-radius:999px;text-decoration:none;font-weight:600;font-size:${e.texto}}`,
    }
  }
  if (bloque.tipo === 'video') {
    const src = embedYoutube(d.video)
    return {
      html: src ? `<div class="video"><iframe src="${escapar(src)}" title="Video" allowfullscreen></iframe></div>` : '<div class="video vacia">Video</div>',
      css: `.video{position:relative;padding-top:56.25%;border-radius:${e.radio};overflow:hidden;background:#111}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.vacia{padding-top:0;min-height:180px;display:grid;place-items:center;color:#aaa}`,
    }
  }
  if (bloque.tipo === 'columnas') {
    const celdas = (d.columnas.length ? d.columnas : datosVacios().columnas)
      .map((col) => `<article><strong>${escapar(col.titulo)}</strong><p>${escapar(col.texto)}</p></article>`)
      .join('')
    return {
      html: `<div class="grid">${celdas}</div>`,
      css: `.grid{display:grid;gap:12px;grid-template-columns:repeat(${Math.min(4, Math.max(1, d.columnas.length || 3))},minmax(0,1fr))}@media(max-width:640px){.grid{grid-template-columns:1fr}}article{background:${fondo};border-radius:${e.radio};padding:${e.pad};color:${color};font-size:${e.texto}}article p{margin:8px 0 0;opacity:.7}`,
    }
  }
  if (bloque.tipo === 'espacio') {
    return { html: '<div class="espacio"></div>', css: `.espacio{height:${Math.max(8, d.alto || 40)}px}` }
  }
  return { html: bloque.html, css: bloque.css }
}
