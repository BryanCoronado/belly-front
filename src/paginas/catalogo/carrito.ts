import type { ProductoPublico } from '@/api'
import { conOrigenWeb } from '@/paginas/catalogo/origenWeb'

export type LineaCarrito = {
  clave: string
  id: number
  nombre: string
  variante: string
  cantidad: number
  precio: number | null
  moneda: string
  imagen_url: string | null
}

function claveAlmacen(slug: string): string {
  return `belly.carrito.${slug}`
}

export function claveLinea(id: number, variante: string): string {
  return `${id}|${variante}`
}

export function leerCarrito(slug: string): LineaCarrito[] {
  try {
    const crudo = localStorage.getItem(claveAlmacen(slug))
    if (!crudo) return []
    const lista = JSON.parse(crudo) as Partial<LineaCarrito>[]
    if (!Array.isArray(lista)) return []
    return lista
      .filter((linea) => linea.id && (linea.cantidad ?? 0) > 0)
      .map((linea) => ({
        clave: linea.clave ?? claveLinea(Number(linea.id), linea.variante ?? ''),
        id: Number(linea.id),
        nombre: String(linea.nombre ?? ''),
        variante: linea.variante ?? '',
        cantidad: Number(linea.cantidad),
        precio: linea.precio ?? null,
        moneda: linea.moneda ?? 'PEN',
        imagen_url: linea.imagen_url ?? null,
      }))
  } catch {
    return []
  }
}

export function guardarCarrito(slug: string, lineas: LineaCarrito[]) {
  localStorage.setItem(claveAlmacen(slug), JSON.stringify(lineas))
}

export function precioLinea(producto: Pick<ProductoPublico, 'precio' | 'precio_oferta'>): number | null {
  if (producto.precio_oferta !== null && producto.precio_oferta !== undefined) return Number(producto.precio_oferta)
  if (producto.precio !== null && producto.precio !== undefined) return Number(producto.precio)
  return null
}

export function descuento(producto: Pick<ProductoPublico, 'precio' | 'precio_oferta'>): number | null {
  if (producto.precio === null || producto.precio_oferta === null) return null
  const antes = Number(producto.precio)
  const ahora = Number(producto.precio_oferta)
  if (!(antes > 0) || ahora >= antes) return null
  return Math.round(((antes - ahora) / antes) * 100)
}

export function totalCarrito(lineas: LineaCarrito[]): number | null {
  if (lineas.some((linea) => linea.precio === null)) return null
  return lineas.reduce((suma, linea) => suma + Number(linea.precio) * linea.cantidad, 0)
}

export function unidadesCarrito(lineas: LineaCarrito[]): number {
  return lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
}

export function mensajePedido(
  titulo: string,
  lineas: LineaCarrito[],
  mostrarPrecios: boolean,
  cliente: { nombre: string; nota: string },
): string {
  const moneda = lineas[0]?.moneda || 'PEN'
  const filas = lineas.map((linea) => {
    const opcion = linea.variante ? ` (${linea.variante})` : ''
    const extra =
      mostrarPrecios && linea.precio !== null ? ` — ${formatearMoneda(linea.precio * linea.cantidad, linea.moneda || moneda)}` : ''
    return `• ${linea.cantidad} × ${linea.nombre}${opcion}${extra}`
  })
  const total = totalCarrito(lineas)
  const partes = [`Hola, quiero hacer un pedido en *${titulo}*:`, '', ...filas]
  if (mostrarPrecios && total !== null) partes.push('', `*Total: ${formatearMoneda(total, moneda)}*`)
  if (cliente.nombre.trim()) partes.push('', `Nombre: ${cliente.nombre.trim()}`)
  if (cliente.nota.trim()) partes.push(`Nota: ${cliente.nota.trim()}`)
  return conOrigenWeb(partes.join('\n'))
}

export function formatearMoneda(valor: number, moneda: string): string {
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda || 'PEN' }).format(valor)
  } catch {
    return `${moneda} ${valor.toFixed(2)}`
  }
}
