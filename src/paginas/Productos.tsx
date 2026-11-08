import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BriefcaseBusiness,
  ImagePlus,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  cambiarEstadoPedidoCatalogo,
  cambiarEstadoProducto,
  eliminarFamilia,
  eliminarProducto,
  guardarFamilia,
  guardarProducto,
  leerFamilias,
  leerPedidosCatalogo,
  leerProductos,
  subirImagenProducto,
  type DatosFamilia,
  type DatosProducto,
  type FamiliaProducto,
  type PedidoCatalogo,
  type Producto,
  type TipoItemCatalogo,
} from '@/api'
import { Campo, CampoSelect } from '@/components/Campo'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { urlMedia } from '@/lib/media'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

const CLAVE_FAMILIAS = ['catalogo-familias']
const CLAVE_PRODUCTOS = ['catalogo-productos']
const TODOS = 'todos'
const SIN_FAMILIA = 'sin'
const MAX_DETALLES = 20
const MAX_FOTOS = 8
const MAX_VARIANTES = 4

const MONEDAS = [
  { valor: 'PEN', nombre: 'PEN' },
  { valor: 'USD', nombre: 'USD' },
  { valor: 'EUR', nombre: 'EUR' },
  { valor: 'MXN', nombre: 'MXN' },
  { valor: 'COP', nombre: 'COP' },
  { valor: 'CLP', nombre: 'CLP' },
  { valor: 'ARS', nombre: 'ARS' },
]

const UNIDADES_PRODUCTO = ['unidad', 'kg', 'g', 'lt', 'ml', 'm', 'm²', 'caja', 'par', 'docena', 'pack', 'rollo']
const UNIDADES_SERVICIO = ['servicio', 'sesión', 'hora', 'día', 'mes', 'visita', 'persona', 'proyecto']
const ETIQUETAS = ['', 'Nuevo', 'Oferta', 'Top', 'Últimos', 'Hot']

const VACIA_FAMILIA: DatosFamilia = { nombre: '', descripcion: '', imagen_url: '' }
const VACIO_PRODUCTO: DatosProducto = {
  nombre: '',
  tipo: 'producto',
  id_familia: null,
  precio: '',
  precio_oferta: '',
  moneda: 'PEN',
  unidad: 'unidad',
  codigo: '',
  marca: '',
  resumen: '',
  descripcion: '',
  imagen_url: '',
  imagenes: [],
  disponibilidad: 'disponible',
  destacado: false,
  visible_catalogo: true,
  detalles: [],
  variantes: [],
  etiqueta: '',
}

type FiltroTipo = 'todos' | TipoItemCatalogo
type FiltroEstado = 'todos' | 'activos' | 'inactivos'

function tipoDe(item: Producto): TipoItemCatalogo {
  return item.tipo === 'servicio' ? 'servicio' : 'producto'
}

function formatearPrecio(producto: Producto, valor: number | null = producto.precio): string {
  if (valor === null || valor === undefined) return 'A consultar'
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: producto.moneda }).format(Number(valor))
  } catch {
    return `${producto.moneda} ${valor}`
  }
}

function etiquetaDisponibilidad(valor: Producto['disponibilidad']) {
  if (valor === 'agotado') return { texto: 'Agotado', clase: 'bg-rose-50 text-rose-700 border-rose-200' }
  if (valor === 'pedido') return { texto: 'A pedido', clase: 'bg-amber-50 text-amber-800 border-amber-200' }
  return { texto: 'Disponible', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export function Productos() {
  const cliente = useQueryClient()
  const admin = esAdministrador(leerSesion()?.usuario)
  const [filtro, setFiltro] = useState<string>(TODOS)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [productoAbierto, setProductoAbierto] = useState<Producto | 'nuevo-producto' | 'nuevo-servicio' | null>(null)
  const [familiaAbierta, setFamiliaAbierta] = useState<FamiliaProducto | 'nueva' | null>(null)
  const [productoBorrar, setProductoBorrar] = useState<Producto | null>(null)
  const [familiaBorrar, setFamiliaBorrar] = useState<FamiliaProducto | null>(null)

  const familias = useQuery({ queryKey: CLAVE_FAMILIAS, queryFn: leerFamilias })
  const productos = useQuery({ queryKey: CLAVE_PRODUCTOS, queryFn: leerProductos })
  const pedidos = useQuery({ queryKey: ['catalogo-pedidos'], queryFn: () => leerPedidosCatalogo() })

  const lista = productos.data
  const total = lista?.length ?? 0
  const totalProductos = lista?.filter((item) => tipoDe(item) === 'producto').length ?? 0
  const totalServicios = lista?.filter((item) => tipoDe(item) === 'servicio').length ?? 0
  const activos = lista?.filter((item) => item.activo).length ?? 0
  const sinFamilia = lista?.filter((item) => !item.id_familia).length ?? 0
  const familiaActual = familias.data?.find((familia) => String(familia.id) === filtro)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (lista ?? []).filter((item) => {
      if (filtro === SIN_FAMILIA && item.id_familia) return false
      if (filtro !== TODOS && filtro !== SIN_FAMILIA && String(item.id_familia) !== filtro) return false
      if (filtroTipo !== 'todos' && tipoDe(item) !== filtroTipo) return false
      if (filtroEstado === 'activos' && !item.activo) return false
      if (filtroEstado === 'inactivos' && item.activo) return false
      if (!texto) return true
      return [item.nombre, item.codigo, item.marca, item.descripcion, item.unidad, item.familia].some((campo) =>
        campo?.toLowerCase().includes(texto),
      )
    })
  }, [lista, filtro, filtroTipo, filtroEstado, busqueda])

  function refrescar() {
    void cliente.invalidateQueries({ queryKey: CLAVE_FAMILIAS })
    void cliente.invalidateQueries({ queryKey: CLAVE_PRODUCTOS })
  }

  const borrarProducto = useMutation({
    mutationFn: (producto: Producto) => eliminarProducto(producto.id).then(() => producto),
    onSuccess: (producto) => {
      avisoExito(tipoDe(producto) === 'servicio' ? 'Servicio eliminado' : 'Producto eliminado')
      setProductoBorrar(null)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  const borrarFamilia = useMutation({
    mutationFn: (familia: FamiliaProducto) => eliminarFamilia(familia.id),
    onSuccess: () => {
      avisoExito('Familia eliminada', 'Los ítems quedaron sin familia.')
      setFamiliaBorrar(null)
      setFiltro(TODOS)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar la familia'),
  })

  const tipoInicial: TipoItemCatalogo =
    productoAbierto === 'nuevo-servicio' ? 'servicio' : productoAbierto === 'nuevo-producto' ? 'producto' : 'producto'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.03em]">Productos y servicios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todo lo que vendes u ofreces para tu catálogo y WhatsApp.</p>
        </div>
        {admin ? (
          <div className="flex flex-wrap gap-2">
            <Link to="/catalogo" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')}>
              Mi Catálogo
            </Link>
            <Button size="sm" variant="outline" className="h-9" onClick={() => setProductoAbierto('nuevo-servicio')}>
              <BriefcaseBusiness />
              Nuevo servicio
            </Button>
            <Button size="sm" className="h-9" onClick={() => setProductoAbierto('nuevo-producto')}>
              <Plus />
              Nuevo producto
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <TarjetaResumen etiqueta="Total" valor={total} />
        <TarjetaResumen etiqueta="Productos" valor={totalProductos} />
        <TarjetaResumen etiqueta="Servicios" valor={totalServicios} />
        <TarjetaResumen etiqueta="Activos" valor={activos} />
      </div>

      <PanelPedidos
        pedidos={pedidos.data ?? []}
        cargando={pedidos.isLoading}
        alCambiar={() => void cliente.invalidateQueries({ queryKey: ['catalogo-pedidos'] })}
        admin={admin}
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="border-b bg-muted/20 p-3 lg:border-r lg:border-b-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Familias</p>
              {admin ? (
                <button type="button" className="text-xs font-medium text-foreground hover:underline" onClick={() => setFamiliaAbierta('nueva')}>
                  + Nueva
                </button>
              ) : null}
            </div>
            <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              <OpcionFamilia activa={filtro === TODOS} nombre="Todos" cantidad={total} alElegir={() => setFiltro(TODOS)} />
              {familias.data?.map((familia) => (
                <OpcionFamilia
                  key={familia.id}
                  activa={filtro === String(familia.id)}
                  nombre={familia.nombre}
                  cantidad={familia.total_productos}
                  alElegir={() => setFiltro(String(familia.id))}
                />
              ))}
              {sinFamilia > 0 ? (
                <OpcionFamilia activa={filtro === SIN_FAMILIA} nombre="Sin familia" cantidad={sinFamilia} alElegir={() => setFiltro(SIN_FAMILIA)} />
              ) : null}
            </nav>
            {admin && familiaActual ? (
              <div className="mt-3 flex gap-1.5">
                <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => setFamiliaAbierta(familiaActual)}>
                  <Pencil />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setFamiliaBorrar(familiaActual)} aria-label="Eliminar familia">
                  <Trash2 />
                </Button>
              </div>
            ) : null}
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Buscar nombre, código, marca o unidad…"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
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
                      'rounded-md px-2.5 py-1.5 text-xs font-medium',
                      filtroTipo === id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {nombre}
                  </button>
                ))}
                <select
                  value={filtroEstado}
                  onChange={(evento) => setFiltroEstado(evento.target.value as FiltroEstado)}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="todos">Estado: todos</option>
                  <option value="activos">Solo activos</option>
                  <option value="inactivos">Solo inactivos</option>
                </select>
              </div>
            </div>

            {productos.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Cargando…
              </div>
            ) : visibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/50">
                  <Package className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{total === 0 ? 'Aún no hay ítems' : 'Sin resultados'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {total === 0
                      ? admin
                        ? 'Crea tu primer producto o servicio.'
                        : 'Un administrador aún no ha cargado el catálogo.'
                      : 'Prueba otra búsqueda o filtro.'}
                  </p>
                </div>
                {admin && total === 0 ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setProductoAbierto('nuevo-servicio')}>
                      Servicio
                    </Button>
                    <Button size="sm" onClick={() => setProductoAbierto('nuevo-producto')}>
                      Producto
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b bg-muted/30 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Ítem</th>
                      <th className="px-3 py-2.5 font-semibold">Tipo</th>
                      <th className="px-3 py-2.5 font-semibold">Familia</th>
                      <th className="px-3 py-2.5 font-semibold">Precio</th>
                      <th className="px-3 py-2.5 font-semibold">Unidad</th>
                      <th className="px-3 py-2.5 font-semibold">Estado</th>
                      <th className="px-3 py-2.5 font-semibold">Activo</th>
                      {admin ? <th className="px-3 py-2.5 text-right font-semibold"> </th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((fila) => {
                      const tipo = tipoDe(fila)
                      const dispon = etiquetaDisponibilidad(fila.disponibilidad)
                      return (
                        <tr key={fila.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <MiniaturaProducto url={fila.imagen_url} tipo={tipo} />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{fila.nombre}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {[fila.codigo ? `Cód. ${fila.codigo}` : null, fila.marca, fila.destacado ? 'Destacado' : null]
                                    .filter(Boolean)
                                    .join(' · ') || (tipo === 'servicio' ? 'Servicio' : 'Producto')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="secondary" className="font-normal">
                              {tipo === 'servicio' ? 'Servicio' : 'Producto'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{fila.familia || '—'}</td>
                          <td className="px-3 py-2.5">
                            {fila.precio_oferta !== null && fila.precio !== null ? (
                              <span className="mr-1.5 text-xs text-muted-foreground line-through">{formatearPrecio(fila)}</span>
                            ) : null}
                            <span className="font-medium tabular-nums">
                              {fila.precio_oferta !== null ? formatearPrecio(fila, fila.precio_oferta) : formatearPrecio(fila)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{fila.unidad || '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium', dispon.clase)}>
                              {dispon.texto}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <InterruptorProducto producto={fila} editable={admin} alCambiar={refrescar} />
                          </td>
                          {admin ? (
                            <td className="px-3 py-2.5">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon-sm" onClick={() => setProductoAbierto(fila)} aria-label="Editar">
                                  <Pencil />
                                </Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => setProductoBorrar(fila)} aria-label="Eliminar">
                                  <Trash2 />
                                </Button>
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {visibles.length > 0 ? (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                {visibles.length} de {total}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <Dialog open={productoAbierto !== null} onOpenChange={(valor) => (valor ? null : setProductoAbierto(null))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {productoAbierto && typeof productoAbierto === 'object'
                ? tipoDe(productoAbierto) === 'servicio'
                  ? 'Editar servicio'
                  : 'Editar producto'
                : productoAbierto === 'nuevo-servicio'
                  ? 'Nuevo servicio'
                  : 'Nuevo producto'}
            </DialogTitle>
            <DialogDescription>Define tipo, unidad, precio y lo que verá el cliente.</DialogDescription>
          </DialogHeader>
          {productoAbierto ? (
            <FormularioProducto
              key={typeof productoAbierto === 'object' ? productoAbierto.id : productoAbierto}
              producto={typeof productoAbierto === 'object' ? productoAbierto : null}
              tipoInicial={typeof productoAbierto === 'object' ? tipoDe(productoAbierto) : tipoInicial}
              familias={familias.data ?? []}
              familiaInicial={familiaActual?.id ?? null}
              alCerrar={() => setProductoAbierto(null)}
              alGuardar={refrescar}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={familiaAbierta !== null} onOpenChange={(valor) => (valor ? null : setFamiliaAbierta(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{familiaAbierta && familiaAbierta !== 'nueva' ? 'Editar familia' : 'Nueva familia'}</DialogTitle>
            <DialogDescription>Agrupa productos o servicios parecidos.</DialogDescription>
          </DialogHeader>
          {familiaAbierta ? (
            <FormularioFamilia
              key={familiaAbierta === 'nueva' ? 'nueva' : familiaAbierta.id}
              familia={familiaAbierta === 'nueva' ? null : familiaAbierta}
              alCerrar={() => setFamiliaAbierta(null)}
              alGuardar={refrescar}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmarAccion
        abierto={productoBorrar !== null}
        titulo={productoBorrar && tipoDe(productoBorrar) === 'servicio' ? '¿Eliminar este servicio?' : '¿Eliminar este producto?'}
        texto={productoBorrar ? `“${productoBorrar.nombre}” dejará de aparecer en tu catálogo.` : ''}
        etiqueta="Eliminar"
        cargando={borrarProducto.isPending}
        alCerrar={() => setProductoBorrar(null)}
        alConfirmar={() => productoBorrar && borrarProducto.mutate(productoBorrar)}
      />
      <ConfirmarAccion
        abierto={familiaBorrar !== null}
        titulo="¿Eliminar esta familia?"
        texto={familiaBorrar ? `Los ítems de “${familiaBorrar.nombre}” no se borran: quedarán sin familia.` : ''}
        etiqueta="Eliminar"
        cargando={borrarFamilia.isPending}
        alCerrar={() => setFamiliaBorrar(null)}
        alConfirmar={() => familiaBorrar && borrarFamilia.mutate(familiaBorrar)}
      />
    </div>
  )
}

function TarjetaResumen({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{valor}</p>
    </div>
  )
}

function PanelPedidos({
  pedidos,
  cargando,
  alCambiar,
  admin,
}: {
  pedidos: PedidoCatalogo[]
  cargando: boolean
  alCambiar: () => void
  admin: boolean
}) {
  const nuevos = pedidos.filter((pedido) => pedido.estado === 'nuevo').length
  const estado = useMutation({
    mutationFn: ({ id, valor }: { id: number; valor: string }) => cambiarEstadoPedidoCatalogo(id, valor),
    onSuccess: () => {
      avisoExito('Pedido actualizado')
      alCambiar()
    },
    onError: (error) => avisoError(error, 'No se pudo actualizar el pedido'),
  })

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Pedidos del catálogo web</p>
            <p className="text-xs text-muted-foreground">Llegan solos cuando el cliente envía el carrito por WhatsApp</p>
          </div>
        </div>
        {nuevos > 0 ? <Badge variant="secondary">{nuevos} nuevos</Badge> : null}
      </div>
      {cargando ? (
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Cargando pedidos…
        </div>
      ) : pedidos.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aún no hay pedidos desde la tienda.</p>
      ) : (
        <div className="divide-y">
          {pedidos.slice(0, 8).map((pedido) => (
            <div key={pedido.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{pedido.cliente_nombre || 'Cliente WhatsApp'}</p>
                  <span
                    className={cn(
                      'rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                      pedido.estado === 'nuevo'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : pedido.estado === 'atendido'
                          ? 'border-sky-200 bg-sky-50 text-sky-800'
                          : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[pedido.tienda, pedido.created_at ? new Date(pedido.created_at).toLocaleString('es-PE') : null].filter(Boolean).join(' · ')}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {(pedido.items ?? []).slice(0, 4).map((item, indice) => (
                    <li key={indice}>
                      {item.cantidad} × {item.nombre}
                      {item.variante ? ` (${item.variante})` : ''}
                    </li>
                  ))}
                  {(pedido.items?.length ?? 0) > 4 ? <li>…</li> : null}
                </ul>
                {pedido.total !== null ? (
                  <p className="mt-1 text-sm font-medium tabular-nums">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: pedido.moneda || 'PEN' }).format(pedido.total)}
                  </p>
                ) : null}
              </div>
              {admin ? (
                <div className="flex shrink-0 gap-1">
                  {pedido.estado === 'nuevo' ? (
                    <Button size="sm" variant="outline" className="h-8" disabled={estado.isPending} onClick={() => estado.mutate({ id: pedido.id, valor: 'atendido' })}>
                      Atender
                    </Button>
                  ) : null}
                  {pedido.estado !== 'cerrado' ? (
                    <Button size="sm" variant="ghost" className="h-8" disabled={estado.isPending} onClick={() => estado.mutate({ id: pedido.id, valor: 'cerrado' })}>
                      Cerrar
                    </Button>
                  ) : null}
                  {pedido.id_conversacion ? (
                    <Link to={`/chats?c=${pedido.id_conversacion}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8')}>
                      Chat
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OpcionFamilia({ activa, nombre, cantidad, alElegir }: { activa: boolean; nombre: string; cantidad: number; alElegir: () => void }) {
  return (
    <button
      type="button"
      onClick={alElegir}
      className={cn(
        'flex w-full shrink-0 items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
        activa ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
      )}
    >
      <span className="truncate">{nombre}</span>
      <span className="text-xs tabular-nums text-muted-foreground">{cantidad}</span>
    </button>
  )
}

function MiniaturaProducto({ url, tipo }: { url: string | null; tipo: TipoItemCatalogo }) {
  const foto = urlMedia(url)
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
      {foto ? (
        <img
          src={foto}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={(evento) => {
            evento.currentTarget.style.display = 'none'
          }}
        />
      ) : tipo === 'servicio' ? (
        <BriefcaseBusiness className="size-4 text-muted-foreground" />
      ) : (
        <Package className="size-4 text-muted-foreground" />
      )}
    </div>
  )
}

function InterruptorProducto({ producto, editable, alCambiar }: { producto: Producto; editable: boolean; alCambiar: () => void }) {
  const estado = useMutation({
    mutationFn: (activo: boolean) => cambiarEstadoProducto(producto.id, activo),
    onSuccess: alCambiar,
    onError: (error) => avisoError(error, 'No se pudo cambiar el estado'),
  })

  return (
    <Switch
      checked={producto.activo}
      disabled={!editable || estado.isPending}
      onCheckedChange={(valor) => estado.mutate(valor)}
      aria-label={producto.activo ? 'Desactivar' : 'Activar'}
    />
  )
}

function FormularioFamilia({ familia, alCerrar, alGuardar }: { familia: FamiliaProducto | null; alCerrar: () => void; alGuardar: () => void }) {
  const [datos, setDatos] = useState<DatosFamilia>(
    familia ? { nombre: familia.nombre, descripcion: familia.descripcion ?? '', imagen_url: familia.imagen_url ?? '' } : VACIA_FAMILIA,
  )
  const selector = useRef<HTMLInputElement>(null)
  const subir = useMutation({
    mutationFn: subirImagenProducto,
    onSuccess: (url) => setDatos((actual) => ({ ...actual, imagen_url: url })),
    onError: (error) => avisoError(error, 'No se pudo subir la imagen'),
  })

  const guardar = useMutation({
    mutationFn: () => guardarFamilia(datos, familia?.id),
    onSuccess: () => {
      avisoExito(familia ? 'Familia actualizada' : 'Familia creada')
      alCerrar()
      alGuardar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar la familia'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((actual) => ({ ...actual, [name]: value }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
          {datos.imagen_url ? <img src={urlMedia(datos.imagen_url)} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-muted-foreground" />}
        </div>
        <div className="space-y-1.5">
          <input
            ref={selector}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0]
              evento.target.value = ''
              if (archivo) subir.mutate(archivo)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={subir.isPending} onClick={() => selector.current?.click()}>
              {subir.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
              {datos.imagen_url ? 'Cambiar' : 'Imagen'}
            </Button>
            {datos.imagen_url ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setDatos((actual) => ({ ...actual, imagen_url: '' }))}>
                Quitar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <Campo etiqueta="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} maxLength={80} autoComplete="off" required />
      <Campo etiqueta="Descripción" name="descripcion" value={datos.descripcion} onChange={cambiar} maxLength={255} autoComplete="off" opcional />
      <PieFormulario cargando={guardar.isPending} etiqueta={familia ? 'Guardar' : 'Crear familia'} alCerrar={alCerrar} />
    </form>
  )
}

function FormularioProducto({
  producto,
  tipoInicial,
  familias,
  familiaInicial,
  alCerrar,
  alGuardar,
}: {
  producto: Producto | null
  tipoInicial: TipoItemCatalogo
  familias: FamiliaProducto[]
  familiaInicial: number | null
  alCerrar: () => void
  alGuardar: () => void
}) {
  const [datos, setDatos] = useState<DatosProducto>(() => {
    if (producto) {
      return {
        nombre: producto.nombre,
        tipo: tipoDe(producto),
        id_familia: producto.id_familia,
        precio: producto.precio === null ? '' : String(producto.precio),
        precio_oferta: producto.precio_oferta === null ? '' : String(producto.precio_oferta),
        moneda: producto.moneda || 'PEN',
        unidad: producto.unidad ?? (tipoDe(producto) === 'servicio' ? 'servicio' : 'unidad'),
        codigo: producto.codigo ?? '',
        marca: producto.marca ?? '',
        resumen: producto.resumen ?? '',
        descripcion: producto.descripcion ?? '',
        imagen_url: producto.imagen_url ?? '',
        imagenes: producto.imagenes ?? [],
        disponibilidad: producto.disponibilidad ?? 'disponible',
        destacado: producto.destacado,
        visible_catalogo: producto.visible_catalogo,
        detalles: producto.detalles ?? [],
        variantes: (producto.variantes ?? []).map((variante) => ({ ...variante })),
        etiqueta: producto.etiqueta ?? '',
      }
    }
    return {
      ...VACIO_PRODUCTO,
      tipo: tipoInicial,
      unidad: tipoInicial === 'servicio' ? 'servicio' : 'unidad',
      id_familia: familiaInicial,
    }
  })
  const selector = useRef<HTMLInputElement>(null)
  const selectorGaleria = useRef<HTMLInputElement>(null)
  const [textoOpciones, setTextoOpciones] = useState<string[]>(() => (producto?.variantes ?? []).map((variante) => variante.opciones.join(', ')))
  const [unidadLibre, setUnidadLibre] = useState(() => {
    const lista = tipoInicial === 'servicio' || (producto && tipoDe(producto) === 'servicio') ? UNIDADES_SERVICIO : UNIDADES_PRODUCTO
    const actual = producto?.unidad || (tipoInicial === 'servicio' ? 'servicio' : 'unidad')
    return !lista.includes(actual)
  })

  const unidades = datos.tipo === 'servicio' ? UNIDADES_SERVICIO : UNIDADES_PRODUCTO
  const esServicio = datos.tipo === 'servicio'

  const guardar = useMutation({
    mutationFn: () =>
      guardarProducto(
        {
          ...datos,
          detalles: datos.detalles.filter((detalle) => detalle.nombre.trim() !== ''),
          variantes: datos.variantes
            .map((variante, indice) => ({
              nombre: variante.nombre.trim(),
              opciones: (textoOpciones[indice] ?? '')
                .split(',')
                .map((opcion) => opcion.trim())
                .filter(Boolean),
            }))
            .filter((variante) => variante.nombre && variante.opciones.length > 0),
        },
        producto?.id,
      ),
    onSuccess: () => {
      avisoExito(producto ? (esServicio ? 'Servicio actualizado' : 'Producto actualizado') : esServicio ? 'Servicio creado' : 'Producto creado')
      alCerrar()
      alGuardar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const subir = useMutation({
    mutationFn: subirImagenProducto,
    onSuccess: (url) => setDatos((actual) => ({ ...actual, imagen_url: url })),
    onError: (error) => avisoError(error, 'No se pudo subir la imagen'),
  })

  const subirFoto = useMutation({
    mutationFn: subirImagenProducto,
    onSuccess: (url) => setDatos((actual) => (actual.imagenes.length < MAX_FOTOS ? { ...actual, imagenes: [...actual.imagenes, url] } : actual)),
    onError: (error) => avisoError(error, 'No se pudo subir la foto'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = evento.target
    setDatos((actual) => ({ ...actual, [name]: name === 'id_familia' ? (value ? Number(value) : null) : value }))
  }

  function cambiarTipo(tipo: TipoItemCatalogo) {
    setDatos((actual) => {
      const sugeridas = tipo === 'servicio' ? UNIDADES_SERVICIO : UNIDADES_PRODUCTO
      const unidad = sugeridas.includes(actual.unidad) ? actual.unidad : sugeridas[0]
      return { ...actual, tipo, unidad }
    })
    setUnidadLibre(false)
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  return (
    <form className="grid gap-5" onSubmit={enviar}>
      <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
        {(
          [
            ['producto', 'Producto', Package],
            ['servicio', 'Servicio', BriefcaseBusiness],
          ] as const
        ).map(([id, nombre, Icono]) => (
          <button
            key={id}
            type="button"
            onClick={() => cambiarTipo(id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              datos.tipo === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icono className="size-4" />
            {nombre}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {datos.imagen_url ? (
            <img src={urlMedia(datos.imagen_url)} alt="" className="size-full object-cover" />
          ) : esServicio ? (
            <BriefcaseBusiness className="size-6 text-muted-foreground" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1.5">
          <input
            ref={selector}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0]
              evento.target.value = ''
              if (archivo) subir.mutate(archivo)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={subir.isPending} onClick={() => selector.current?.click()}>
              {subir.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
              {datos.imagen_url ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {datos.imagen_url ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setDatos((actual) => ({ ...actual, imagen_url: '' }))}>
                Quitar
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 5 MB</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Galería</p>
        <input
          ref={selectorGaleria}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(evento) => {
            const archivo = evento.target.files?.[0]
            evento.target.value = ''
            if (archivo) subirFoto.mutate(archivo)
          }}
        />
        <div className="flex flex-wrap gap-2">
          {datos.imagenes.map((url, indice) => (
            <div key={url} className="relative size-14 overflow-hidden rounded-lg border bg-muted">
              <img src={urlMedia(url)} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() => setDatos((actual) => ({ ...actual, imagenes: actual.imagenes.filter((_, posicion) => posicion !== indice) }))}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {datos.imagenes.length < MAX_FOTOS ? (
            <button
              type="button"
              disabled={subirFoto.isPending}
              onClick={() => selectorGaleria.current?.click()}
              className="flex size-14 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted"
              aria-label="Agregar foto"
            >
              {subirFoto.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo etiqueta="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} maxLength={150} autoComplete="off" required />
        </div>
        <CampoSelect etiqueta="Familia" name="id_familia" value={datos.id_familia ?? ''} onChange={cambiar}>
          <option value="">Sin familia</option>
          {familias.map((familia) => (
            <option key={familia.id} value={familia.id}>
              {familia.nombre}
            </option>
          ))}
        </CampoSelect>
        <Campo
          etiqueta={esServicio ? 'Código / referencia' : 'Código SKU'}
          name="codigo"
          value={datos.codigo}
          onChange={cambiar}
          maxLength={60}
          autoComplete="off"
          opcional
        />
        {!esServicio ? (
          <Campo etiqueta="Marca" name="marca" value={datos.marca} onChange={cambiar} maxLength={80} autoComplete="off" opcional />
        ) : null}
        <Campo
          etiqueta="Precio"
          name="precio"
          value={datos.precio}
          onChange={cambiar}
          inputMode="decimal"
          autoComplete="off"
          ayuda="Vacío = a consultar"
          opcional
        />
        <Campo etiqueta="Precio oferta" name="precio_oferta" value={datos.precio_oferta} onChange={cambiar} inputMode="decimal" autoComplete="off" opcional />
        <CampoSelect etiqueta="Moneda" name="moneda" value={datos.moneda} onChange={cambiar}>
          {MONEDAS.map((moneda) => (
            <option key={moneda.valor} value={moneda.valor}>
              {moneda.nombre}
            </option>
          ))}
        </CampoSelect>

        <div className="grid gap-1.5">
          <Label htmlFor="unidad-item">Unidad de medida</Label>
          {unidadLibre ? (
            <div className="flex gap-2">
              <Input
                id="unidad-item"
                name="unidad"
                value={datos.unidad}
                onChange={cambiar}
                maxLength={30}
                placeholder={esServicio ? 'ej. sesión' : 'ej. kg'}
                autoComplete="off"
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setUnidadLibre(false)}>
                Lista
              </Button>
            </div>
          ) : (
            <select
              id="unidad-item"
              value={unidades.includes(datos.unidad) ? datos.unidad : unidades[0]}
              onChange={(evento) => {
                if (evento.target.value === '__otra') {
                  setUnidadLibre(true)
                  return
                }
                setDatos((actual) => ({ ...actual, unidad: evento.target.value }))
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              {unidades.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
              <option value="__otra">Otra…</option>
            </select>
          )}
          <p className="text-xs text-muted-foreground">Se muestra junto al precio: S/ 50 / {datos.unidad || 'unidad'}</p>
        </div>

        <CampoSelect etiqueta="Disponibilidad" name="disponibilidad" value={datos.disponibilidad} onChange={cambiar}>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
          <option value="pedido">A pedido</option>
        </CampoSelect>
        <CampoSelect etiqueta="Etiqueta" name="etiqueta" value={datos.etiqueta} onChange={cambiar}>
          {ETIQUETAS.map((etiqueta) => (
            <option key={etiqueta} value={etiqueta}>
              {etiqueta || 'Ninguna'}
            </option>
          ))}
        </CampoSelect>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="resumen-producto">Resumen</Label>
          <Input id="resumen-producto" name="resumen" value={datos.resumen} onChange={cambiar} maxLength={180} autoComplete="off" />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="descripcion-producto">Descripción</Label>
          <textarea
            id="descripcion-producto"
            name="descripcion"
            rows={3}
            value={datos.descripcion}
            onChange={cambiar}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <span className="text-sm">Visible en catálogo</span>
          <Switch checked={datos.visible_catalogo} onCheckedChange={(valor) => setDatos((actual) => ({ ...actual, visible_catalogo: valor }))} />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-sm">
            <Sparkles className="size-3.5 text-muted-foreground" />
            Destacado
          </span>
          <Switch checked={datos.destacado} onCheckedChange={(valor) => setDatos((actual) => ({ ...actual, destacado: valor }))} />
        </label>
      </div>

      {!esServicio ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Variantes</p>
            <p className="text-xs text-muted-foreground">Ej. Talla → S, M, L</p>
          </div>
          {datos.variantes.map((variante, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <Input
                className="h-10 sm:w-40"
                placeholder="Nombre"
                value={variante.nombre}
                maxLength={40}
                onChange={(evento) =>
                  setDatos((actual) => ({
                    ...actual,
                    variantes: actual.variantes.map((item, posicion) => (posicion === indice ? { ...item, nombre: evento.target.value } : item)),
                  }))
                }
              />
              <Input
                className="h-10"
                placeholder="Opciones separadas por coma"
                value={textoOpciones[indice] ?? ''}
                onChange={(evento) =>
                  setTextoOpciones((actual) => {
                    const copia = [...actual]
                    copia[indice] = evento.target.value
                    return copia
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar"
                onClick={() => {
                  setDatos((actual) => ({ ...actual, variantes: actual.variantes.filter((_, posicion) => posicion !== indice) }))
                  setTextoOpciones((actual) => actual.filter((_, posicion) => posicion !== indice))
                }}
              >
                <X />
              </Button>
            </div>
          ))}
          {datos.variantes.length < MAX_VARIANTES ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDatos((actual) => ({ ...actual, variantes: [...actual.variantes, { nombre: '', opciones: [] }] }))
                setTextoOpciones((actual) => [...actual, ''])
              }}
            >
              <Plus />
              Agregar variante
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Datos extra</p>
          <p className="text-xs text-muted-foreground">{esServicio ? 'Duración, modalidad, cobertura…' : 'Color, material, garantía…'}</p>
        </div>
        {datos.detalles.map((detalle, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <Input
              className="h-10"
              placeholder="Nombre"
              value={detalle.nombre}
              onChange={(evento) =>
                setDatos((actual) => ({
                  ...actual,
                  detalles: actual.detalles.map((item, posicion) => (posicion === indice ? { ...item, nombre: evento.target.value } : item)),
                }))
              }
              maxLength={60}
            />
            <Input
              className="h-10"
              placeholder="Valor"
              value={detalle.valor}
              onChange={(evento) =>
                setDatos((actual) => ({
                  ...actual,
                  detalles: actual.detalles.map((item, posicion) => (posicion === indice ? { ...item, valor: evento.target.value } : item)),
                }))
              }
              maxLength={200}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar"
              onClick={() => setDatos((actual) => ({ ...actual, detalles: actual.detalles.filter((_, posicion) => posicion !== indice) }))}
            >
              <X />
            </Button>
          </div>
        ))}
        {datos.detalles.length < MAX_DETALLES ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDatos((actual) => ({ ...actual, detalles: [...actual.detalles, { nombre: '', valor: '' }] }))}
          >
            <Plus />
            Agregar dato
          </Button>
        ) : null}
      </div>

      <PieFormulario cargando={guardar.isPending} etiqueta={producto ? 'Guardar' : esServicio ? 'Crear servicio' : 'Crear producto'} alCerrar={alCerrar} />
    </form>
  )
}

function PieFormulario({ cargando, etiqueta, alCerrar }: { cargando: boolean; etiqueta: string; alCerrar: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={alCerrar}>
        Cancelar
      </Button>
      <Button type="submit" disabled={cargando}>
        {cargando ? <LoaderCircle className="animate-spin" /> : null}
        {etiqueta}
      </Button>
    </div>
  )
}
