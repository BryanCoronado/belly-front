import { useMemo, useState } from 'react'
import { BriefcaseBusiness, Package, Search } from 'lucide-react'
import type { FamiliaProducto, Producto, TipoItemCatalogo } from '@/api'
import { cn } from '@/lib/utils'
import { urlMedia } from '@/lib/media'
import {
  armarEnvioEnlace,
  armarEnvioFamilia,
  armarEnvioProducto,
  enlacePublico,
  precioVisible,
  useCatalogoEmpresa,
  type EnvioCatalogo,
} from '@/paginas/catalogo/mensajeProducto'

type FiltroTipo = 'todos' | TipoItemCatalogo

export function ListaProductosCatalogo({
  alElegir,
  compacto = false,
}: {
  alElegir: (envio: EnvioCatalogo, extra?: { producto?: Producto; familia?: FamiliaProducto }) => void
  compacto?: boolean
}) {
  const { productos, familias, vitrina, cargando } = useCatalogoEmpresa()
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const enlace = enlacePublico(vitrina?.enlace)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return productos.filter((producto) => {
      const tipo = producto.tipo === 'servicio' ? 'servicio' : 'producto'
      if (filtroTipo !== 'todos' && tipo !== filtroTipo) return false
      if (!texto) return true
      return [producto.nombre, producto.marca, producto.familia, producto.resumen, producto.unidad, producto.codigo].some((campo) =>
        campo?.toLowerCase().includes(texto),
      )
    })
  }, [productos, busqueda, filtroTipo])

  if (cargando) {
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">Cargando catálogo…</p>
  }

  if (productos.length === 0 && !vitrina?.enlace) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Aún no hay productos ni servicios. Cárgalos en Productos y servicios.
      </p>
    )
  }

  return (
    <div className="flex max-h-80 flex-col">
      <div className="space-y-2 px-2 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar producto o servicio"
            className="h-9 w-full rounded-lg border bg-background pr-3 pl-8 text-sm outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(
            [
              ['todos', 'Todos'],
              ['producto', 'Productos'],
              ['servicio', 'Servicios'],
            ] as const
          ).map(([id, nombre]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltroTipo(id)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium',
                filtroTipo === id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {nombre}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {vitrina?.publicado && enlace ? (
          <button
            type="button"
            onClick={() => alElegir(armarEnvioEnlace(vitrina.titulo || 'nuestro catálogo', enlace))}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-xs font-bold">URL</span>
            <span>
              <span className="block font-medium">Enlace de la tienda</span>
              <span className="text-xs text-muted-foreground">Se actualiza solo si publicas el catálogo</span>
            </span>
          </button>
        ) : null}
        {!busqueda.trim() && filtroTipo === 'todos'
          ? familias
              .filter((familia) => productos.some((producto) => producto.id_familia === familia.id))
              .map((familia) => (
                <button
                  key={`f-${familia.id}`}
                  type="button"
                  onClick={() => alElegir(armarEnvioFamilia(familia, productos, enlace), { familia })}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  <Mini foto={familia.imagen_url} letra={familia.nombre} />
                  <span>
                    <span className="block font-medium">{familia.nombre}</span>
                    <span className="text-xs text-muted-foreground">Toda la categoría · precio al día</span>
                  </span>
                </button>
              ))
          : null}
        {visibles.map((producto) => {
          const tipo = producto.tipo === 'servicio' ? 'servicio' : 'producto'
          const precio = precioVisible(producto)
          const unidad = producto.unidad ? ` / ${producto.unidad}` : ''
          return (
            <button
              key={producto.id}
              type="button"
              onClick={() =>
                alElegir(armarEnvioProducto(producto, enlace ? `${enlace}/p/${producto.id}` : undefined), { producto })
              }
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <Mini foto={producto.imagen_url} letra={producto.nombre} tipo={tipo} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{producto.nombre}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1 py-px text-[10px] font-medium',
                      tipo === 'servicio' ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700',
                    )}
                  >
                    {tipo === 'servicio' ? 'Servicio' : 'Producto'}
                  </span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[compacto ? null : producto.familia, `${precio}${unidad}`, producto.disponibilidad === 'agotado' ? 'Agotado' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              {!producto.imagen_url ? <span className="text-[10px] text-amber-600">Sin foto</span> : null}
            </button>
          )
        })}
        {visibles.length === 0 ? <p className="px-2 py-4 text-center text-xs text-muted-foreground">Nada coincide.</p> : null}
      </div>
      <p className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">El bot manda siempre el precio y la foto actuales.</p>
    </div>
  )
}

function Mini({ foto, letra, tipo }: { foto: string | null; letra: string; tipo?: TipoItemCatalogo }) {
  const src = urlMedia(foto)
  if (src) {
    return <img src={src} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      {tipo === 'servicio' ? <BriefcaseBusiness className="size-4" /> : tipo === 'producto' ? <Package className="size-4" /> : letra.slice(0, 1).toUpperCase()}
    </span>
  )
}
