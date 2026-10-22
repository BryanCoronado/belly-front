import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, LoaderCircle, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  cambiarEstadoProducto,
  eliminarFamilia,
  eliminarProducto,
  guardarFamilia,
  guardarProducto,
  leerFamilias,
  leerProductos,
  subirImagenProducto,
  type DatosFamilia,
  type DatosProducto,
  type FamiliaProducto,
  type Producto,
} from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo, CampoSelect } from '@/components/Campo'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

const CLAVE_FAMILIAS = ['catalogo-familias']
const CLAVE_PRODUCTOS = ['catalogo-productos']
const TODOS = 'todos'
const SIN_FAMILIA = 'sin'
const MAX_DETALLES = 20

const MONEDAS = [
  { valor: 'PEN', nombre: 'Soles (PEN)' },
  { valor: 'USD', nombre: 'Dólares (USD)' },
  { valor: 'EUR', nombre: 'Euros (EUR)' },
  { valor: 'MXN', nombre: 'Pesos mexicanos (MXN)' },
  { valor: 'COP', nombre: 'Pesos colombianos (COP)' },
  { valor: 'CLP', nombre: 'Pesos chilenos (CLP)' },
  { valor: 'ARS', nombre: 'Pesos argentinos (ARS)' },
]

const VACIA_FAMILIA: DatosFamilia = { nombre: '', descripcion: '' }
const VACIO_PRODUCTO: DatosProducto = {
  nombre: '',
  id_familia: null,
  precio: '',
  moneda: 'PEN',
  unidad: '',
  codigo: '',
  descripcion: '',
  imagen_url: '',
  detalles: [],
}

function formatearPrecio(producto: Producto): string {
  if (producto.precio === null || producto.precio === undefined) return 'A consultar'
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: producto.moneda }).format(Number(producto.precio))
  } catch {
    return `${producto.moneda} ${producto.precio}`
  }
}

export function Productos() {
  const cliente = useQueryClient()
  const admin = esAdministrador(leerSesion()?.usuario)
  const [filtro, setFiltro] = useState<string>(TODOS)
  const [busqueda, setBusqueda] = useState('')
  const [productoAbierto, setProductoAbierto] = useState<Producto | 'nuevo' | null>(null)
  const [familiaAbierta, setFamiliaAbierta] = useState<FamiliaProducto | 'nueva' | null>(null)
  const [productoBorrar, setProductoBorrar] = useState<Producto | null>(null)
  const [familiaBorrar, setFamiliaBorrar] = useState<FamiliaProducto | null>(null)

  const familias = useQuery({ queryKey: CLAVE_FAMILIAS, queryFn: leerFamilias })
  const productos = useQuery({ queryKey: CLAVE_PRODUCTOS, queryFn: leerProductos })

  const total = productos.data?.length ?? 0
  const sinFamilia = productos.data?.filter((producto) => !producto.id_familia).length ?? 0
  const familiaActual = familias.data?.find((familia) => String(familia.id) === filtro)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (productos.data ?? []).filter((producto) => {
      if (filtro === SIN_FAMILIA && producto.id_familia) return false
      if (filtro !== TODOS && filtro !== SIN_FAMILIA && String(producto.id_familia) !== filtro) return false
      if (!texto) return true
      return [producto.nombre, producto.codigo, producto.descripcion].some((campo) => campo?.toLowerCase().includes(texto))
    })
  }, [productos.data, filtro, busqueda])

  function refrescar() {
    cliente.invalidateQueries({ queryKey: CLAVE_FAMILIAS })
    cliente.invalidateQueries({ queryKey: CLAVE_PRODUCTOS })
  }

  const borrarProducto = useMutation({
    mutationFn: (producto: Producto) => eliminarProducto(producto.id),
    onSuccess: () => {
      avisoExito('Producto eliminado')
      setProductoBorrar(null)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar el producto'),
  })

  const borrarFamilia = useMutation({
    mutationFn: (familia: FamiliaProducto) => eliminarFamilia(familia.id),
    onSuccess: () => {
      avisoExito('Familia eliminada', 'Sus productos quedaron sin familia.')
      setFamiliaBorrar(null)
      setFiltro(TODOS)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar la familia'),
  })

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Productos"
        descripcion="Lo que vendes u ofreces, ordenado por familias. Sirve para cualquier tipo de negocio."
        acciones={
          admin ? (
            <Button size="lg" className="h-10 w-full sm:w-auto" onClick={() => setProductoAbierto('nuevo')}>
              <Plus />
              Nuevo producto
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Familias</h2>
            {admin ? (
              <Button variant="ghost" size="sm" onClick={() => setFamiliaAbierta('nueva')}>
                <Plus />
                Nueva
              </Button>
            ) : null}
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setFamiliaAbierta(familiaActual)}>
                <Pencil />
                Editar familia
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFamiliaBorrar(familiaActual)} aria-label="Eliminar familia">
                <Trash2 />
              </Button>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Buscar por nombre o código"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>

          <TablaResponsiva<Producto>
            filas={visibles}
            cargando={productos.isLoading}
            clave={(fila) => String(fila.id)}
            columnas={[
              {
                titulo: 'Producto',
                principal: true,
                celda: (fila) => (
                  <div className="flex items-center gap-3">
                    <MiniaturaProducto url={fila.imagen_url} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{fila.nombre}</p>
                      {fila.codigo ? <p className="truncate text-xs text-muted-foreground">Código {fila.codigo}</p> : null}
                    </div>
                  </div>
                ),
              },
              {
                titulo: 'Familia',
                celda: (fila) => (fila.familia ? <Badge variant="secondary">{fila.familia}</Badge> : <span className="text-muted-foreground">—</span>),
              },
              {
                titulo: 'Precio',
                celda: (fila) => (
                  <span>
                    {formatearPrecio(fila)}
                    {fila.unidad && fila.precio !== null ? <span className="text-xs text-muted-foreground"> / {fila.unidad}</span> : null}
                  </span>
                ),
              },
              {
                titulo: 'Disponible',
                celda: (fila) => <InterruptorProducto producto={fila} editable={admin} alCambiar={refrescar} />,
              },
            ]}
            acciones={
              admin
                ? (fila) => (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setProductoAbierto(fila)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setProductoBorrar(fila)} aria-label="Eliminar producto">
                        <Trash2 />
                      </Button>
                    </>
                  )
                : undefined
            }
            vacio={{
              icono: Package,
              titulo: total === 0 ? 'Aún no hay productos' : 'No encontramos productos',
              texto:
                total === 0
                  ? admin
                    ? 'Crea una familia y agrega tu primer producto.'
                    : 'Un administrador aún no ha cargado productos.'
                  : 'Prueba con otra búsqueda o familia.',
            }}
          />
        </section>
      </div>

      <Dialog open={productoAbierto !== null} onOpenChange={(valor) => (valor ? null : setProductoAbierto(null))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{productoAbierto && productoAbierto !== 'nuevo' ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>Solo el nombre es obligatorio. Agrega lo que tu negocio necesite mostrar.</DialogDescription>
          </DialogHeader>
          {productoAbierto ? (
            <FormularioProducto
              key={productoAbierto === 'nuevo' ? 'nuevo' : productoAbierto.id}
              producto={productoAbierto === 'nuevo' ? null : productoAbierto}
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
            <DialogDescription>Una familia agrupa productos parecidos, por ejemplo “Bebidas” o “Servicios”.</DialogDescription>
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
        titulo="¿Eliminar este producto?"
        texto={productoBorrar ? `“${productoBorrar.nombre}” dejará de aparecer en tu catálogo.` : ''}
        etiqueta="Eliminar"
        cargando={borrarProducto.isPending}
        alCerrar={() => setProductoBorrar(null)}
        alConfirmar={() => productoBorrar && borrarProducto.mutate(productoBorrar)}
      />
      <ConfirmarAccion
        abierto={familiaBorrar !== null}
        titulo="¿Eliminar esta familia?"
        texto={familiaBorrar ? `Los productos de “${familiaBorrar.nombre}” no se borran: quedarán sin familia.` : ''}
        etiqueta="Eliminar"
        cargando={borrarFamilia.isPending}
        alCerrar={() => setFamiliaBorrar(null)}
        alConfirmar={() => familiaBorrar && borrarFamilia.mutate(familiaBorrar)}
      />
    </div>
  )
}

function OpcionFamilia({ activa, nombre, cantidad, alElegir }: { activa: boolean; nombre: string; cantidad: number; alElegir: () => void }) {
  return (
    <button
      type="button"
      onClick={alElegir}
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
        activa ? 'border-primary bg-primary/10 font-medium text-foreground' : 'bg-card text-muted-foreground hover:bg-muted',
      )}
    >
      <span className="truncate">{nombre}</span>
      <span className="text-xs tabular-nums">{cantidad}</span>
    </button>
  )
}

function MiniaturaProducto({ url }: { url: string | null }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
      {url ? <img src={url} alt="" className="size-full object-cover" loading="lazy" /> : <Package className="size-4 text-muted-foreground" />}
    </div>
  )
}

function InterruptorProducto({ producto, editable, alCambiar }: { producto: Producto; editable: boolean; alCambiar: () => void }) {
  const estado = useMutation({
    mutationFn: (activo: boolean) => cambiarEstadoProducto(producto.id, activo),
    onSuccess: alCambiar,
    onError: (error) => avisoError(error, 'No se pudo cambiar la disponibilidad'),
  })

  return (
    <Switch
      checked={producto.activo}
      disabled={!editable || estado.isPending}
      onCheckedChange={(valor) => estado.mutate(valor)}
      aria-label={producto.activo ? 'Marcar como no disponible' : 'Marcar como disponible'}
    />
  )
}

function FormularioFamilia({ familia, alCerrar, alGuardar }: { familia: FamiliaProducto | null; alCerrar: () => void; alGuardar: () => void }) {
  const [datos, setDatos] = useState<DatosFamilia>(
    familia ? { nombre: familia.nombre, descripcion: familia.descripcion ?? '' } : VACIA_FAMILIA,
  )

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
      <Campo etiqueta="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} maxLength={80} autoComplete="off" required />
      <Campo etiqueta="Descripción" name="descripcion" value={datos.descripcion} onChange={cambiar} maxLength={255} autoComplete="off" opcional />
      <PieFormulario cargando={guardar.isPending} etiqueta={familia ? 'Guardar cambios' : 'Crear familia'} alCerrar={alCerrar} />
    </form>
  )
}

function FormularioProducto({
  producto,
  familias,
  familiaInicial,
  alCerrar,
  alGuardar,
}: {
  producto: Producto | null
  familias: FamiliaProducto[]
  familiaInicial: number | null
  alCerrar: () => void
  alGuardar: () => void
}) {
  const [datos, setDatos] = useState<DatosProducto>(
    producto
      ? {
          nombre: producto.nombre,
          id_familia: producto.id_familia,
          precio: producto.precio === null ? '' : String(producto.precio),
          moneda: producto.moneda || 'PEN',
          unidad: producto.unidad ?? '',
          codigo: producto.codigo ?? '',
          descripcion: producto.descripcion ?? '',
          imagen_url: producto.imagen_url ?? '',
          detalles: producto.detalles ?? [],
        }
      : { ...VACIO_PRODUCTO, id_familia: familiaInicial },
  )
  const selector = useRef<HTMLInputElement>(null)

  const guardar = useMutation({
    mutationFn: () => guardarProducto({ ...datos, detalles: datos.detalles.filter((detalle) => detalle.nombre.trim() !== '') }, producto?.id),
    onSuccess: () => {
      avisoExito(producto ? 'Producto actualizado' : 'Producto creado')
      alCerrar()
      alGuardar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar el producto'),
  })

  const subir = useMutation({
    mutationFn: subirImagenProducto,
    onSuccess: (url) => setDatos((actual) => ({ ...actual, imagen_url: url })),
    onError: (error) => avisoError(error, 'No se pudo subir la imagen'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = evento.target
    setDatos((actual) => ({ ...actual, [name]: name === 'id_familia' ? (value ? Number(value) : null) : value }))
  }

  function elegirImagen(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (archivo) subir.mutate(archivo)
  }

  function cambiarDetalle(indice: number, campo: 'nombre' | 'valor', valor: string) {
    setDatos((actual) => ({
      ...actual,
      detalles: actual.detalles.map((detalle, posicion) => (posicion === indice ? { ...detalle, [campo]: valor } : detalle)),
    }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  return (
    <form className="grid gap-5" onSubmit={enviar}>
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {datos.imagen_url ? <img src={datos.imagen_url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted-foreground" />}
        </div>
        <div className="space-y-1.5">
          <input ref={selector} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={elegirImagen} />
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
          <p className="text-xs text-muted-foreground">JPG, PNG o WEBP de hasta 5 MB.</p>
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
        <Campo etiqueta="Código" name="codigo" value={datos.codigo} onChange={cambiar} maxLength={60} autoComplete="off" opcional />
        <Campo
          etiqueta="Precio"
          name="precio"
          value={datos.precio}
          onChange={cambiar}
          inputMode="decimal"
          autoComplete="off"
          ayuda="Déjalo vacío si el precio es “a consultar”."
          opcional
        />
        <CampoSelect etiqueta="Moneda" name="moneda" value={datos.moneda} onChange={cambiar}>
          {MONEDAS.map((moneda) => (
            <option key={moneda.valor} value={moneda.valor}>
              {moneda.nombre}
            </option>
          ))}
        </CampoSelect>
        <Campo
          etiqueta="Se vende por"
          name="unidad"
          value={datos.unidad}
          onChange={cambiar}
          maxLength={30}
          autoComplete="off"
          ayuda="Ejemplo: unidad, kg, hora, mes."
          opcional
        />
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="descripcion-producto">
            Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <textarea
            id="descripcion-producto"
            name="descripcion"
            rows={3}
            value={datos.descripcion}
            onChange={cambiar}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Datos extra</p>
          <p className="text-xs text-muted-foreground">Agrega lo que tu negocio necesite: talla, color, duración, garantía…</p>
        </div>
        {datos.detalles.map((detalle, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <Input className="h-10" placeholder="Nombre (ej. Color)" value={detalle.nombre} onChange={(evento) => cambiarDetalle(indice, 'nombre', evento.target.value)} maxLength={60} />
            <Input className="h-10" placeholder="Valor (ej. Rojo)" value={detalle.valor} onChange={(evento) => cambiarDetalle(indice, 'valor', evento.target.value)} maxLength={200} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar dato"
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

      <PieFormulario cargando={guardar.isPending} etiqueta={producto ? 'Guardar cambios' : 'Crear producto'} alCerrar={alCerrar} />
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
