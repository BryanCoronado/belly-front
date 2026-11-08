import { useQuery } from '@tanstack/react-query'
import { leerFamilias, leerProductos, leerVitrina, type FamiliaProducto, type Producto, type ProductoPublico } from '@/api'
import { formatearMoneda, precioLinea } from '@/paginas/catalogo/carrito'

export type EnvioCatalogo = {
  texto: string
  imagen_url: string | null
  modo: 'producto' | 'familia' | 'enlace'
}

export function enlacePublico(ruta: string | null | undefined): string {
  if (!ruta) return ''
  return `${window.location.origin}${ruta}`
}

export function useCatalogoEmpresa() {
  const productos = useQuery({ queryKey: ['catalogo-productos'], queryFn: leerProductos, staleTime: 30_000 })
  const familias = useQuery({ queryKey: ['catalogo-familias'], queryFn: leerFamilias, staleTime: 30_000 })
  const vitrina = useQuery({ queryKey: ['catalogo-vitrina'], queryFn: leerVitrina, staleTime: 60_000, retry: false })

  return {
    productos: (productos.data ?? []).filter((item) => item.activo && item.visible_catalogo !== false),
    familias: familias.data ?? [],
    vitrina: vitrina.data,
    cargando: productos.isLoading || familias.isLoading,
  }
}

export function armarEnvioProducto(producto: Producto, enlace?: string): EnvioCatalogo {
  return {
    modo: 'producto',
    imagen_url: producto.imagen_url,
    texto: captionProducto(producto, { enlace, mostrarPrecios: true }),
  }
}

export function armarEnvioFamilia(familia: FamiliaProducto, productos: Producto[], enlace?: string): EnvioCatalogo {
  const deFamilia = productos.filter((item) => item.id_familia === familia.id)
  return {
    modo: 'familia',
    imagen_url: familia.imagen_url || deFamilia[0]?.imagen_url || null,
    texto: captionFamilia(familia.nombre, deFamilia, { enlace, mostrarPrecios: true }),
  }
}

export function armarEnvioEnlace(titulo: string, enlace: string): EnvioCatalogo {
  return { modo: 'enlace', imagen_url: null, texto: captionEnlaceCatalogo(titulo, enlace) }
}

export type ProductoMensaje = Pick<
  Producto | ProductoPublico,
  'nombre' | 'resumen' | 'descripcion' | 'marca' | 'precio' | 'precio_oferta' | 'moneda' | 'unidad' | 'imagen_url'
> & { disponibilidad?: string; familia?: string | null; tipo?: 'producto' | 'servicio' }

export function precioVisible(producto: ProductoMensaje, mostrar = true): string {
  if (!mostrar) return 'Consultar'
  const oferta = producto.precio_oferta !== null && producto.precio_oferta !== undefined ? Number(producto.precio_oferta) : null
  const normal = producto.precio !== null && producto.precio !== undefined ? Number(producto.precio) : null
  if (oferta !== null && normal !== null && oferta < normal) {
    return `${formatearMoneda(oferta, producto.moneda)}  ~${formatearMoneda(normal, producto.moneda)}~`
  }
  const valor = precioLinea(producto)
  if (valor === null) return 'A consultar'
  return formatearMoneda(valor, producto.moneda)
}

export function captionProducto(
  producto: ProductoMensaje,
  extras?: { enlace?: string; nota?: string; mostrarPrecios?: boolean },
): string {
  const mostrar = extras?.mostrarPrecios !== false
  const precio = precioVisible(producto, mostrar)
  const unidad = producto.unidad ? ` / ${producto.unidad}` : ''
  const esServicio = producto.tipo === 'servicio'
  const lineas = [
    `*${producto.nombre}*`,
    esServicio ? '_Servicio_' : '',
    producto.marca ? `Marca: ${producto.marca}` : '',
    `${precio}${unidad}`,
    producto.disponibilidad === 'agotado' ? '_Agotado por ahora_' : producto.disponibilidad === 'pedido' ? '_Se pide a pedido_' : '',
    producto.resumen || recortar(producto.descripcion, 220),
    extras?.enlace ? `Ver más: ${extras.enlace}` : '',
    extras?.nota?.trim() ?? '',
  ]
  return lineas.filter((linea) => linea.trim() !== '').join('\n')
}

export function captionFamilia(
  nombre: string,
  productos: ProductoMensaje[],
  extras?: { enlace?: string; mostrarPrecios?: boolean },
): string {
  const mostrar = extras?.mostrarPrecios !== false
  const filas = productos.slice(0, 8).map((producto, indice) => {
    const unidad = producto.unidad ? ` / ${producto.unidad}` : ''
    return `*${indice + 1}.* ${producto.nombre} — ${precioVisible(producto, mostrar)}${unidad}`
  })
  return [`*${nombre}*`, '', ...filas, extras?.enlace ? `\nVer todo: ${extras.enlace}` : ''].filter(Boolean).join('\n')
}

export function captionEnlaceCatalogo(titulo: string, enlace: string): string {
  return `Mira nuestro catálogo *${titulo}* 👇\n${enlace}`
}

function recortar(texto: string | null | undefined, largo: number): string {
  const limpio = (texto ?? '').replace(/\s+/g, ' ').trim()
  if (limpio === '') return ''
  return limpio.length > largo ? `${limpio.slice(0, largo - 1)}…` : limpio
}
