import { createContext, useContext } from 'react'
import type { ProductoPublico, VitrinaPublica } from '@/api'
import { descuento, formatearMoneda, precioLinea } from '@/paginas/catalogo/carrito'

export type Tienda = {
  slug: string
  catalogo: VitrinaPublica
  usaCarrito: boolean
  agregar: (producto: ProductoPublico, variante?: string, cantidad?: number) => void
  irAFamilia: (idFamilia: number | null) => void
}

const ContextoTienda = createContext<Tienda | null>(null)

export const ProveedorTienda = ContextoTienda.Provider

export function useTienda(): Tienda {
  const tienda = useContext(ContextoTienda)
  if (!tienda) throw new Error('useTienda fuera de la tienda')
  return tienda
}

export function rutaProducto(slug: string, id: number): string {
  return `/c/${slug}/p/${id}`
}

export function precioActual(producto: ProductoPublico, mostrar: boolean): string {
  if (!mostrar) return 'Consultar'
  const valor = precioLinea(producto)
  if (valor === null) return 'A consultar'
  return formatearMoneda(valor, producto.moneda)
}

export function precioTachado(producto: ProductoPublico, mostrar: boolean): string | null {
  if (!mostrar || descuento(producto) === null) return null
  return formatearMoneda(Number(producto.precio), producto.moneda)
}

export type Red = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp'

export function enlaceRed(red: Red, valor: string): string {
  const limpio = valor.trim().replace(/^@/, '')
  if (/^https?:\/\//i.test(limpio)) return limpio
  if (red === 'instagram') return `https://instagram.com/${limpio}`
  if (red === 'facebook') return `https://facebook.com/${limpio}`
  if (red === 'tiktok') return `https://tiktok.com/@${limpio}`
  return `https://wa.me/${limpio}`
}
