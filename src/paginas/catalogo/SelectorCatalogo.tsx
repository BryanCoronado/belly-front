import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { FamiliaProducto, Producto } from '@/api'
import {
  armarEnvioEnlace,
  armarEnvioFamilia,
  armarEnvioProducto,
  enlacePublico,
  useCatalogoEmpresa,
  type EnvioCatalogo,
} from '@/paginas/catalogo/mensajeProducto'

export function ListaProductosCatalogo({
  alElegir,
  compacto = false,
}: {
  alElegir: (envio: EnvioCatalogo, extra?: { producto?: Producto; familia?: FamiliaProducto }) => void
  compacto?: boolean
}) {
  const { productos, familias, vitrina, cargando } = useCatalogoEmpresa()
  const [busqueda, setBusqueda] = useState('')
  const enlace = enlacePublico(vitrina?.enlace)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return productos
    return productos.filter((producto) =>
      [producto.nombre, producto.marca, producto.familia, producto.resumen].some((campo) => campo?.toLowerCase().includes(texto)),
    )
  }, [productos, busqueda])

  if (cargando) {
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">Cargando catálogo…</p>
  }

  if (productos.length === 0 && !vitrina?.enlace) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Aún no hay productos en el catálogo. Cárgalos en Productos.
      </p>
    )
  }

  return (
    <div className="flex max-h-80 flex-col">
      <div className="relative px-2 pt-2">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar producto"
          className="h-9 w-full rounded-lg border bg-background pr-3 pl-8 text-sm outline-none"
        />
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
              <span className="text-xs text-muted-foreground">Mira nuestro catálogo…</span>
            </span>
          </button>
        ) : null}
        {!busqueda.trim()
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
                    <span className="text-xs text-muted-foreground">Toda la categoría</span>
                  </span>
                </button>
              ))
          : null}
        {visibles.map((producto) => (
          <button
            key={producto.id}
            type="button"
            onClick={() =>
              alElegir(armarEnvioProducto(producto, enlace ? `${enlace}/p/${producto.id}` : undefined), { producto })
            }
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
          >
            <Mini foto={producto.imagen_url} letra={producto.nombre} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{producto.nombre}</span>
              <span className="text-xs text-muted-foreground">
                {compacto ? producto.familia : [producto.marca, producto.familia].filter(Boolean).join(' · ')}
              </span>
            </span>
          </button>
        ))}
        {visibles.length === 0 ? <p className="px-2 py-4 text-center text-xs text-muted-foreground">Nada coincide.</p> : null}
      </div>
    </div>
  )
}

function Mini({ foto, letra }: { foto: string | null; letra: string }) {
  return foto ? (
    <img src={foto} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
  ) : (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
      {letra.slice(0, 1).toUpperCase()}
    </span>
  )
}
