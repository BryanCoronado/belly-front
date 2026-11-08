import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import {
  BetweenHorizontalStart,
  Code2,
  Columns3,
  Eye,
  EyeOff,
  Image as IconoImagen,
  Layers,
  LayoutGrid,
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
import {
  ANCHOS_BLOQUE,
  armarBloque,
  bloqueNuevo,
  DESTINOS_BOTON,
  idBloque,
  LUGARES_BLOQUE,
  MAX_BLOQUES,
  normalizarBloque,
  normalizarTamano,
  TAMANOS_BLOQUE,
  WIDGETS,
} from '@/paginas/catalogo/bloques'
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
type Panel = 'piezas' | 'capas'

function escribiendo(destino: EventTarget | null): boolean {
  const nodo = destino as HTMLElement | null
  if (!nodo) return false
  return nodo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(nodo.tagName)
}

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
  const [panel, setPanel] = useState<Panel>('piezas')
  const lienzo = useRef<HTMLDivElement>(null)
  const actual = lista.find((bloque) => bloque.id === elegido) ?? null
  const lleno = lista.length >= MAX_BLOQUES

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

  function mover(id: string, paso: -1 | 1) {
    const bloque = lista.find((item) => item.id === id)
    if (!bloque) return
    const hermanos = lista.map((item, indice) => ({ item, indice })).filter(({ item }) => item.donde === bloque.donde)
    const posicion = hermanos.findIndex(({ item }) => item.id === id)
    const vecino = hermanos[posicion + paso]
    if (!vecino) return
    const siguiente = [...lista]
    siguiente[hermanos[posicion].indice] = vecino.item
    siguiente[vecino.indice] = bloque
    guardar(siguiente)
  }

  function duplicar(id: string) {
    const indice = lista.findIndex((item) => item.id === id)
    if (indice < 0 || lleno) return
    const copia = { ...lista[indice], id: idBloque(), nombre: `${lista[indice].nombre} copia`.slice(0, 40) }
    const siguiente = [...lista]
    siguiente.splice(indice + 1, 0, copia)
    guardar(siguiente)
    setElegido(copia.id)
  }

  function borrar(id: string) {
    guardar(lista.filter((item) => item.id !== id))
    setElegido((previo) => (previo === id ? null : previo))
  }

  function enfocar(id: string) {
    setElegido(id)
    const nodo = lienzo.current?.querySelector(`[data-bloque-id="${id}"]`)
    nodo?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const atajos = useRef({ elegido, borrar, duplicar })
  useEffect(() => {
    atajos.current = { elegido, borrar, duplicar }
  })

  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (escribiendo(evento.target)) return
      const { elegido: id, borrar: quitar, duplicar: copiar } = atajos.current
      if (evento.key === 'Escape') {
        setElegido(null)
        setPendiente(null)
        return
      }
      if (!id) return
      if (evento.key === 'Delete' || evento.key === 'Backspace') {
        evento.preventDefault()
        quitar(id)
      } else if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'd') {
        evento.preventDefault()
        copiar(id)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  function bloquearNavegacion(evento: MouseEvent<HTMLDivElement>) {
    evento.preventDefault()
    const destino = evento.target as HTMLElement
    if (!destino.closest('[data-editor]')) {
      evento.stopPropagation()
      setElegido(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="flex max-h-64 shrink-0 flex-col border-b bg-background lg:max-h-none lg:w-64 lg:border-r lg:border-b-0">
        <div className="flex gap-1 border-b p-2">
          {(
            [
              ['piezas', 'Piezas', LayoutGrid],
              ['capas', 'Capas', Layers],
            ] as const
          ).map(([id, nombre, Icono]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanel(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
                panel === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icono className="size-3.5" />
              {nombre}
              {id === 'capas' ? <span className="text-[10px] text-muted-foreground">{lista.length}</span> : null}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {panel === 'piezas' ? (
            <>
              <div className="grid grid-cols-4 gap-1 sm:grid-cols-8 lg:grid-cols-2">
                {WIDGETS.map((widget) => {
                  const Icono = ICONO[widget.tipo]
                  return (
                    <button
                      key={widget.tipo}
                      type="button"
                      draggable={!lleno}
                      disabled={lleno}
                      onDragStart={(evento) => {
                        evento.dataTransfer.setData('text/plain', `widget:${widget.tipo}`)
                        evento.dataTransfer.effectAllowed = 'copy'
                        setArrastrando(true)
                      }}
                      onDragEnd={() => setArrastrando(false)}
                      onClick={() => setPendiente((previo) => (previo === widget.tipo ? null : widget.tipo))}
                      className={cn(
                        'flex cursor-grab flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent bg-transparent px-1 py-2.5 text-[11px] font-medium text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40',
                        pendiente === widget.tipo && 'border-foreground/20 bg-muted text-foreground',
                      )}
                    >
                      <Icono className="size-4" />
                      {widget.nombre}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                {lleno ? `Límite de ${MAX_BLOQUES} bloques` : 'Arrastra al lienzo o toca y elige lugar'}
              </p>
            </>
          ) : lista.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Aún no hay bloques</p>
          ) : (
            <div className="space-y-3">
              {LUGARES_BLOQUE.filter((lugar) => lista.some((bloque) => bloque.donde === lugar.id)).map((lugar) => (
                <div key={lugar.id}>
                  <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{lugar.nombre}</p>
                  <div className="space-y-0.5">
                    {lista
                      .filter((bloque) => bloque.donde === lugar.id)
                      .map((bloque) => {
                        const Icono = ICONO[bloque.tipo]
                        return (
                          <div
                            key={bloque.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => enfocar(bloque.id)}
                            onKeyDown={(evento) => {
                              if (evento.key === 'Enter') enfocar(bloque.id)
                            }}
                            className={cn(
                              'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                              elegido === bloque.id ? 'bg-muted text-foreground' : 'hover:bg-muted/70',
                              !bloque.activo && elegido !== bloque.id && 'text-muted-foreground',
                            )}
                          >
                            <Icono className="size-3.5 shrink-0 opacity-70" />
                            <span className="min-w-0 flex-1 truncate">{bloque.nombre}</span>
                            <button
                              type="button"
                              title={bloque.activo ? 'Ocultar' : 'Mostrar'}
                              onClick={(evento) => {
                                evento.stopPropagation()
                                cambiar(bloque.id, { activo: !bloque.activo })
                              }}
                              className={cn('opacity-0 group-hover:opacity-100', !bloque.activo && 'opacity-100')}
                            >
                              {bloque.activo ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                            </button>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/30">
        <div className="flex h-10 shrink-0 items-center justify-center gap-3 border-b px-3">
          <div className="flex gap-1 text-xs font-medium">
            {(
              [
                ['portada', 'Portada'],
                ['ficha', 'Ficha'],
              ] as const
            ).map(([id, nombre]) => (
              <button
                key={id}
                type="button"
                disabled={id === 'ficha' && !primerProducto}
                onClick={() => setPagina(id)}
                className={cn(
                  'rounded-md px-3 py-1 transition-colors disabled:opacity-40',
                  pagina === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {nombre}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {pendiente ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3 border-b bg-muted px-4 py-2 text-xs text-foreground">
                <span>Toca dónde poner {WIDGETS.find((item) => item.tipo === pendiente)?.nombre?.toLowerCase()}</span>
                <button type="button" className="underline-offset-2 hover:underline" onClick={() => setPendiente(null)}>
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="min-h-[480px] flex-1 overflow-hidden">
          <div className="flex h-full flex-col overflow-hidden border-x bg-background">
            <div
              ref={lienzo}
              className="relative min-h-0 flex-1 overflow-y-auto"
              onClickCapture={bloquearNavegacion}
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
                  alCambiarBloque: (id, cambio, datosWidget) => cambiar(id, cambio, datosWidget),
                  alMoverBloque: mover,
                  alDuplicarBloque: duplicar,
                  alBorrarBloque: borrar,
                }}
              >
                <CatalogoPublico key={pagina} previa={{ slug: datos.slug || slugGuardado || 'vista', catalogo, idProducto }} />
              </ProveedorEdicion>
            </div>
          </div>
        </div>
      </main>

        <aside className="shrink-0 overflow-y-auto border-t bg-background p-4 lg:w-80 lg:border-t-0 lg:border-l">
          {actual ? (
            <Inspector
              key={actual.id}
              bloque={actual}
              familias={catalogo.familias}
              alCambiar={(cambio, datosWidget) => cambiar(actual.id, cambio, datosWidget)}
              alCerrar={() => setElegido(null)}
              alBorrar={() => borrar(actual.id)}
            />
          ) : (
            <div className="space-y-4 py-2 text-sm text-muted-foreground">
              <p className="text-foreground">Nada seleccionado</p>
              <p className="text-xs leading-relaxed">Haz clic en un bloque de la tienda o en Capas para editarlo.</p>
              <div className="space-y-1.5 border-t pt-3 text-xs">
                {(
                  [
                    ['Deshacer', 'Ctrl Z'],
                    ['Duplicar', 'Ctrl D'],
                    ['Borrar', 'Supr'],
                    ['Guardar', 'Ctrl S'],
                  ] as const
                ).map(([accion, tecla]) => (
                  <div key={accion} className="flex items-center justify-between gap-2">
                    {accion}
                    <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">{tecla}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
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

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label>Ancho{d.ancho_pct > 0 ? ` · ${d.ancho_pct}%` : ''}</Label>
          {d.ancho_pct > 0 ? (
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => alCambiar({}, { ancho_pct: 0 })}>
              Reset
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
          {ANCHOS_BLOQUE.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => alCambiar({ ancho: opcion.id }, { ancho_pct: 0 })}
              className={cn(
                'rounded-md px-1 py-1.5 text-[11px] font-medium',
                d.ancho_pct <= 0 && bloque.ancho === opcion.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opcion.nombre}
            </button>
          ))}
        </div>
      </div>

      {bloque.tipo !== 'espacio' && bloque.tipo !== 'html' ? (
        <div className="grid gap-1.5">
          <Label>Tamaño</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {TAMANOS_BLOQUE.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => alCambiar({}, { tamano: opcion.id })}
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-medium',
                  normalizarTamano(d.tamano) === opcion.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
          <div className="grid gap-1.5">
            <Label>Alto: {d.alto > 40 ? `${d.alto}px` : 'según tamaño'}</Label>
            <input
              type="range"
              min={40}
              max={640}
              step={10}
              value={d.alto > 40 ? d.alto : 40}
              onChange={(evento) => alCambiar({}, { alto: Number(evento.target.value) })}
            />
            {d.alto > 40 ? (
              <button type="button" className="text-left text-xs text-muted-foreground hover:text-foreground" onClick={() => alCambiar({}, { alto: 40 })}>
                Usar tamaño automático
              </button>
            ) : null}
          </div>
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
