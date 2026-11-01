import { useRef, useState, type MouseEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  BetweenHorizontalStart,
  Code2,
  Columns3,
  Image as IconoImagen,
  MousePointerClick,
  PanelTop,
  Trash2,
  Type,
  Video,
  X,
} from 'lucide-react'
import {
  leerCatalogoPublico,
  subirImagenProducto,
  type BloqueHtmlVitrina,
  type DatosVitrina,
  type DatosWidget,
  type LugarBloque,
  type TipoWidget,
  type VitrinaPublica,
} from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { avisoError } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { armarBloque, bloqueNuevo, DESTINOS_BOTON, MAX_BLOQUES, normalizarBloque, WIDGETS } from '@/paginas/catalogo/bloques'
import { CatalogoPublico } from '@/paginas/catalogo/CatalogoPublico'
import { ProveedorEdicion, type Arrastre } from '@/paginas/catalogo/edicion'

const ICONO: Record<TipoWidget, typeof Type> = {
  texto: Type,
  imagen: IconoImagen,
  boton: MousePointerClick,
  video: Video,
  franja: PanelTop,
  columnas: Columns3,
  espacio: BetweenHorizontalStart,
  html: Code2,
}

type Pagina = 'portada' | 'ficha'

export function EditorHtmlCatalogo({
  datos,
  slugGuardado,
  alCambiar,
}: {
  datos: DatosVitrina
  slugGuardado: string | null
  alCambiar: (bloques: BloqueHtmlVitrina[]) => void
}) {
  const lista = (datos.pagina.bloques ?? []).map(normalizarBloque)
  const [elegido, setElegido] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<TipoWidget | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [pagina, setPagina] = useState<Pagina>('portada')
  const actual = lista.find((bloque) => bloque.id === elegido) ?? null

  const publico = useQuery({
    queryKey: ['catalogo-publico', slugGuardado],
    queryFn: () => leerCatalogoPublico(slugGuardado ?? ''),
    enabled: Boolean(slugGuardado),
    retry: false,
  })

  const catalogo: VitrinaPublica = {
    familias: publico.data?.familias ?? [],
    productos: publico.data?.productos ?? [],
    titulo: datos.titulo || 'Mi tienda',
    eslogan: datos.eslogan || null,
    color: datos.color,
    logo_url: datos.logo_url || null,
    whatsapp: datos.whatsapp || null,
    mostrar_precios: datos.mostrar_precios,
    pagina: datos.pagina,
  }
  const primerProducto = catalogo.productos[0]
  const idProducto = pagina === 'ficha' && primerProducto ? String(primerProducto.id) : undefined

  function guardar(siguiente: BloqueHtmlVitrina[]) {
    alCambiar(siguiente.map(armarBloque))
  }

  function soltar(donde: LugarBloque, antes: string | undefined, arrastre: Arrastre | null) {
    setArrastrando(false)
    const tipo = arrastre && 'widget' in arrastre ? arrastre.widget : arrastre ? null : pendiente
    if (tipo) {
      if (lista.length >= MAX_BLOQUES) return
      const nuevo = bloqueNuevo(tipo, donde, datos.color)
      guardar(insertar(lista, nuevo, donde, antes))
      setElegido(nuevo.id)
      setPendiente(null)
      return
    }
    if (!arrastre || !('bloque' in arrastre) || arrastre.bloque === antes) return
    const movido = lista.find((bloque) => bloque.id === arrastre.bloque)
    if (!movido) return
    guardar(insertar(lista.filter((bloque) => bloque.id !== movido.id), { ...movido, donde }, donde, antes))
    setElegido(movido.id)
  }

  function cambiar(id: string, cambio: Partial<BloqueHtmlVitrina>, datosWidget?: Partial<DatosWidget>) {
    guardar(lista.map((bloque) => (bloque.id === id ? { ...bloque, ...cambio, datos: { ...bloque.datos, ...datosWidget } } : bloque)))
  }

  function bloquearNavegacion(evento: MouseEvent<HTMLDivElement>) {
    evento.preventDefault()
    const destino = evento.target as HTMLElement
    if (!destino.closest('[data-editor]')) evento.stopPropagation()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Arrastra una pieza a tu tienda, o tócala y luego toca dónde ponerla. Haz clic en un bloque para editarlo.
        </p>
        <div className="flex rounded-lg border p-0.5 text-xs font-medium">
          {(
            [
              ['portada', 'Portada'],
              ['ficha', 'Ficha de producto'],
            ] as const
          ).map(([id, nombre]) => (
            <button
              key={id}
              type="button"
              disabled={id === 'ficha' && !primerProducto}
              onClick={() => setPagina(id)}
              className={cn('rounded-md px-3 py-1.5 disabled:opacity-40', pagina === id ? 'bg-foreground text-background' : 'text-muted-foreground')}
            >
              {nombre}
            </button>
          ))}
        </div>
      </div>

      {pendiente ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm text-white">
          <span>Toca un recuadro azul en la tienda para poner: {WIDGETS.find((item) => item.tipo === pendiente)?.nombre}.</span>
          <button type="button" className="flex items-center gap-1 underline" onClick={() => setPendiente(null)}>
            <X className="size-4" />
            Cancelar
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[8.5rem_minmax(0,1fr)_19rem]">
        <aside className="rounded-xl border bg-muted/30 p-2 xl:sticky xl:top-4 xl:self-start">
          <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Piezas</p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8 xl:grid-cols-1">
            {WIDGETS.map((widget) => {
              const Icono = ICONO[widget.tipo]
              return (
                <button
                  key={widget.tipo}
                  type="button"
                  draggable
                  onDragStart={(evento) => {
                    evento.dataTransfer.setData('text/plain', `widget:${widget.tipo}`)
                    evento.dataTransfer.effectAllowed = 'copy'
                    setArrastrando(true)
                  }}
                  onDragEnd={() => setArrastrando(false)}
                  onClick={() => setPendiente((actualPendiente) => (actualPendiente === widget.tipo ? null : widget.tipo))}
                  className={cn(
                    'flex cursor-grab flex-col items-center gap-1 rounded-lg border bg-background px-2 py-2.5 text-xs font-medium hover:border-[#2563EB]/50 active:cursor-grabbing xl:flex-row xl:justify-start',
                    pendiente === widget.tipo && 'border-[#2563EB] bg-[#2563EB] text-white',
                  )}
                >
                  <Icono className="size-4" />
                  {widget.nombre}
                </button>
              )
            })}
          </div>
        </aside>

        <div className="overflow-hidden rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
            <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="size-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 truncate rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
              {window.location.host}/c/{datos.slug || 'tu-tienda'}
            </span>
          </div>
          <div className="relative h-[calc(100vh-12rem)] min-h-[560px] overflow-y-auto [transform:translateZ(0)]" onClickCapture={bloquearNavegacion}
            onKeyDownCapture={(evento) => {
              if (evento.key === 'Enter') evento.preventDefault()
            }}
          >
            <ProveedorEdicion
              value={{
                elegido,
                esperando: pendiente !== null,
                arrastrando,
                alElegir: setElegido,
                alArrastrar: setArrastrando,
                alSoltar: soltar,
              }}
            >
              <CatalogoPublico key={pagina} previa={{ slug: datos.slug || slugGuardado || 'vista', catalogo, idProducto }} />
            </ProveedorEdicion>
          </div>
        </div>

        <aside className="rounded-xl border bg-background p-4 xl:sticky xl:top-4 xl:self-start">
          {actual ? (
            <Inspector
              key={actual.id}
              bloque={actual}
              familias={catalogo.familias}
              alCambiar={(cambio, datosWidget) => cambiar(actual.id, cambio, datosWidget)}
              alCerrar={() => setElegido(null)}
              alBorrar={() => {
                guardar(lista.filter((bloque) => bloque.id !== actual.id))
                setElegido(null)
              }}
            />
          ) : (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Nada elegido</p>
              <p>Haz clic en un bloque de la tienda para cambiar su texto, foto, color o enlace.</p>
              <p>Los cambios se ven al instante. Pulsa Guardar para publicarlos.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function insertar(lista: BloqueHtmlVitrina[], bloque: BloqueHtmlVitrina, donde: LugarBloque, antes?: string): BloqueHtmlVitrina[] {
  const siguiente = [...lista]
  const indice = antes ? siguiente.findIndex((item) => item.id === antes) : -1
  if (indice >= 0) {
    siguiente.splice(indice, 0, { ...bloque, donde })
    return siguiente
  }
  let ultimo = -1
  for (let i = siguiente.length - 1; i >= 0; i -= 1) {
    if (siguiente[i].donde === donde) {
      ultimo = i
      break
    }
  }
  siguiente.splice(ultimo >= 0 ? ultimo + 1 : siguiente.length, 0, { ...bloque, donde })
  return siguiente
}

function DestinoBoton({
  enlace,
  familias,
  alCambiar,
}: {
  enlace: string
  familias: VitrinaPublica['familias']
  alCambiar: (enlace: string) => void
}) {
  const opciones = [
    ...DESTINOS_BOTON,
    ...familias.map((familia) => ({ valor: `familia:${familia.id}`, nombre: `Categoría: ${familia.nombre}` })),
  ]
  const conocido = opciones.some((opcion) => opcion.valor === enlace)
  const [otro, setOtro] = useState(!conocido && enlace.trim() !== '')
  const seleccion = otro ? 'otro' : conocido ? enlace : '#productos'

  return (
    <div className="grid gap-2">
      <Label htmlFor="destino-boton">A dónde lleva</Label>
      <select
        id="destino-boton"
        value={seleccion}
        onChange={(evento) => {
          const valor = evento.target.value
          if (valor === 'otro') {
            setOtro(true)
            alCambiar('https://')
            return
          }
          setOtro(false)
          alCambiar(valor)
        }}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.nombre}
          </option>
        ))}
        <option value="otro">Otra página (enlace)</option>
      </select>
      {otro ? <Input value={enlace} onChange={(evento) => alCambiar(evento.target.value)} placeholder="https://..." autoComplete="off" /> : null}
    </div>
  )
}

function Inspector({
  bloque,
  familias,
  alCambiar,
  alCerrar,
  alBorrar,
}: {
  bloque: BloqueHtmlVitrina
  familias: VitrinaPublica['familias']
  alCambiar: (cambio: Partial<BloqueHtmlVitrina>, datos?: Partial<DatosWidget>) => void
  alCerrar: () => void
  alBorrar: () => void
}) {
  const d = bloque.datos
  const selector = useRef<HTMLInputElement>(null)
  const subir = useMutation({
    mutationFn: subirImagenProducto,
    onSuccess: (url) => alCambiar({}, { imagen_url: url }),
    onError: (error) => avisoError(error, 'No se pudo subir la imagen'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input value={bloque.nombre} onChange={(evento) => alCambiar({ nombre: evento.target.value })} className="h-8 font-semibold" maxLength={40} aria-label="Nombre del bloque" />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar" onClick={alBorrar}>
          <Trash2 />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={alCerrar}>
          <X />
        </Button>
      </div>
      <label className="flex items-center justify-between gap-2 text-sm">
        Visible en la tienda
        <Switch checked={bloque.activo} onCheckedChange={(activo) => alCambiar({ activo })} />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm">
        Ancho de pantalla
        <Switch checked={bloque.ancho === 'completo'} onCheckedChange={(completo) => alCambiar({ ancho: completo ? 'completo' : 'caja' })} />
      </label>

      {bloque.tipo === 'texto' ? <Campo etiqueta="Título" valor={d.titulo} alCambiar={(titulo) => alCambiar({}, { titulo })} /> : null}
      {bloque.tipo === 'texto' || bloque.tipo === 'franja' ? (
        <Area etiqueta={bloque.tipo === 'franja' ? 'Aviso' : 'Texto'} valor={d.texto} alCambiar={(texto) => alCambiar({}, { texto })} />
      ) : null}
      {bloque.tipo === 'boton' ? (
        <>
          <Campo etiqueta="Texto del botón" valor={d.boton} alCambiar={(boton) => alCambiar({}, { boton })} />
          <DestinoBoton enlace={d.enlace} familias={familias} alCambiar={(enlace) => alCambiar({}, { enlace })} />
        </>
      ) : null}
      {bloque.tipo === 'imagen' ? (
        <div className="grid gap-2">
          <Label>Imagen</Label>
          {d.imagen_url ? <img src={d.imagen_url} alt="" className="h-28 w-full rounded-lg object-cover" /> : null}
          <Button type="button" variant="outline" size="sm" disabled={subir.isPending} onClick={() => selector.current?.click()}>
            {subir.isPending ? 'Subiendo…' : d.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
          </Button>
          <input
            ref={selector}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0]
              if (archivo) subir.mutate(archivo)
              evento.target.value = ''
            }}
          />
        </div>
      ) : null}
      {bloque.tipo === 'video' ? <Campo etiqueta="Enlace de YouTube" valor={d.video} alCambiar={(video) => alCambiar({}, { video })} /> : null}
      {bloque.tipo === 'espacio' ? (
        <div className="grid gap-1.5">
          <Label>Alto: {d.alto}px</Label>
          <input type="range" min={8} max={240} value={d.alto} onChange={(evento) => alCambiar({}, { alto: Number(evento.target.value) })} />
        </div>
      ) : null}
      {bloque.tipo === 'columnas' ? (
        <div className="space-y-3">
          {d.columnas.map((col, indice) => (
            <div key={indice} className="grid gap-2 rounded-lg border p-2">
              <Campo etiqueta={`Columna ${indice + 1}`} valor={col.titulo} alCambiar={(titulo) => alCambiar({}, { columnas: d.columnas.map((item, i) => (i === indice ? { ...item, titulo } : item)) })} />
              <Area etiqueta="Texto" valor={col.texto} alCambiar={(texto) => alCambiar({}, { columnas: d.columnas.map((item, i) => (i === indice ? { ...item, texto } : item)) })} />
            </div>
          ))}
          <div className="flex gap-2">
            {d.columnas.length < 4 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => alCambiar({}, { columnas: [...d.columnas, { titulo: `${d.columnas.length + 1}.`, texto: 'Texto' }] })}>
                Agregar columna
              </Button>
            ) : null}
            {d.columnas.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => alCambiar({}, { columnas: d.columnas.slice(0, -1) })}>
                Quitar una
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {bloque.tipo === 'html' ? (
        <>
          <Area etiqueta="HTML" valor={bloque.html} alCambiar={(html) => alCambiar({ html })} mono />
          <Area etiqueta="CSS" valor={bloque.css} alCambiar={(css) => alCambiar({ css })} mono />
        </>
      ) : null}
      {bloque.tipo === 'texto' || bloque.tipo === 'boton' || bloque.tipo === 'franja' || bloque.tipo === 'columnas' ? (
        <div className="grid grid-cols-2 gap-3">
          <Color etiqueta={bloque.tipo === 'boton' ? 'Color del botón' : 'Letra'} valor={d.color} alCambiar={(color) => alCambiar({}, { color })} />
          {bloque.tipo !== 'boton' ? <Color etiqueta="Fondo" valor={d.fondo} alCambiar={(fondo) => alCambiar({}, { fondo })} /> : null}
        </div>
      ) : null}
    </div>
  )
}

function Campo({ etiqueta, valor, alCambiar, ayuda }: { etiqueta: string; valor: string; alCambiar: (valor: string) => void; ayuda?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{etiqueta}</Label>
      <Input value={valor} onChange={(evento) => alCambiar(evento.target.value)} autoComplete="off" />
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}

function Area({ etiqueta, valor, alCambiar, mono }: { etiqueta: string; valor: string; alCambiar: (valor: string) => void; mono?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label>{etiqueta}</Label>
      <textarea
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        spellCheck={!mono}
        className={cn(
          'min-h-24 w-full resize-y rounded-lg border border-input px-3 py-2 text-sm outline-none',
          mono && 'bg-[#0B1026] font-mono text-[12px] text-[#E8EDF5]',
        )}
      />
    </div>
  )
}

function Color({ etiqueta, valor, alCambiar }: { etiqueta: string; valor: string; alCambiar: (valor: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label>{etiqueta}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={valor || '#0B1026'} onChange={(evento) => alCambiar(evento.target.value)} className="size-9 shrink-0 cursor-pointer rounded border bg-transparent p-1" />
        <Input value={valor} onChange={(evento) => alCambiar(evento.target.value)} className="font-mono uppercase" />
      </div>
    </div>
  )
}
