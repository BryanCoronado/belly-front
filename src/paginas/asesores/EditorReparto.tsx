import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, FlaskConical, LoaderCircle, MousePointerClick, Plus, Save, ShieldCheck, TriangleAlert } from 'lucide-react'
import {
  guardarReparto,
  leerReparto,
  revisarReparto,
  type RepartoCompleto,
  type ResultadoPrueba,
  type RevisionReparto,
  type TipoNodoReparto,
  type TramoHorario,
} from '@/api'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito } from '@/lib/avisos'
import { useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { CLAVE_REPARTO, ContextoReparto, type Resaltado } from './contextoReparto'
import { aDefinicion, aFlechas, aNodos, estiloFlecha, type NodoRepartoRF } from './conversionReparto'
import { NodoReparto } from './NodoReparto'
import { PanelPasoReparto } from './PanelPasoReparto'
import { PruebaReparto } from './PruebaReparto'
import { nuevoId } from '@/lib/editorPasos'
import { GRUPOS_PASOS, META, PASOS_AGREGABLES, datosIniciales, salidasDe } from './tiposReparto'
import {
  fusionarReparto,
  guardarBorradorReparto,
  leerBorradorReparto,
  marcarRepartoGuardadoEnServidor,
  quitarBorradorReparto,
} from './borradorReparto'
import { MAX_PASOS, validarReparto } from './validarReparto'

const TIPOS_NODO = { paso: NodoReparto }
const FORMATO_ARRASTRE = 'application/x-belly-reparto'

/** Si desde `desde` se puede llegar a `hasta` siguiendo las flechas (unirlos al revés haría un círculo). */
function llegaA(desde: string, hasta: string, flechas: { source: string; target: string }[]): boolean {
  const vistos = new Set([desde])
  const pendientes = [desde]
  while (pendientes.length) {
    const actual = pendientes.pop()!
    if (actual === hasta) return true
    for (const f of flechas) {
      if (f.source === actual && !vistos.has(f.target)) {
        vistos.add(f.target)
        pendientes.push(f.target)
      }
    }
  }
  return false
}

export function EditorReparto({ alIrAGrupos }: { alIrAGrupos: () => void }) {
  const consulta = useQuery({ queryKey: CLAVE_REPARTO, queryFn: leerReparto, refetchOnWindowFocus: false })

  if (consulta.isError) {
    return <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">No pudimos cargar el reparto. Recarga la página.</p>
  }
  if (!consulta.data) {
    return <Skeleton className="h-[70vh] w-full rounded-xl" />
  }

  const borrador = leerBorradorReparto()
  const definicion = fusionarReparto(consulta.data.definicion, borrador)
  const recuperado =
    borrador !== null && JSON.stringify(definicion) !== JSON.stringify(consulta.data.definicion)
  const datos = { ...consulta.data, definicion }
  const firmaServidor = JSON.stringify(consulta.data.definicion)

  return (
    <ReactFlowProvider>
      <Lienzo datos={datos} firmaServidor={firmaServidor} recuperado={recuperado} alIrAGrupos={alIrAGrupos} />
    </ReactFlowProvider>
  )
}

/** El lienzo se arma una sola vez con lo guardado; después solo se refrescan los nombres (grupos, personas, asistentes). */
function Lienzo({
  datos: catalogo,
  firmaServidor,
  recuperado,
  alIrAGrupos,
}: {
  datos: RepartoCompleto
  firmaServidor: string
  recuperado: boolean
  alIrAGrupos: () => void
}) {
  const [inicial] = useState(catalogo)
  const consultas = useQueryClient()
  const { oscuro } = useTema()
  const { screenToFlowPosition, fitView, deleteElements } = useReactFlow<NodoRepartoRF>()
  const contenedor = useRef<HTMLDivElement>(null)

  const [nodos, setNodos, alCambiarNodos] = useNodesState<NodoRepartoRF>(aNodos(inicial.definicion))
  const [flechas, setFlechas, alCambiarFlechas] = useEdgesState(aFlechas(inicial.definicion))
  const [panel, setPanel] = useState<'paso' | 'probar'>('paso')
  const [probado, setProbado] = useState<{ camino: string; resultado: ResultadoPrueba } | null>(null)

  const definicion = useMemo(() => aDefinicion(nodos, flechas), [nodos, flechas])
  const firma = useMemo(() => JSON.stringify(definicion), [definicion])
  const camino = useMemo(
    () => JSON.stringify([definicion.nodos.map((n) => [n.id, n.tipo, n.datos]), definicion.conexiones.map((c) => [c.desde, c.salida, c.hacia])]),
    [definicion],
  )
  const resultado = probado && probado.camino === camino ? probado.resultado : null
  const [guardada, setGuardada] = useState(firmaServidor)
  const [avisoRecuperado, setAvisoRecuperado] = useState(recuperado)
  const [revision, setRevision] = useState<{ firma: string; datos: RevisionReparto } | null>({ firma, datos: inicial.revision })
  const sinGuardar = firma !== guardada

  const seleccionados = nodos.filter((n) => n.selected)
  const seleccionado = seleccionados.length === 1 ? seleccionados[0] : null

  const revisionLocal = useMemo(() => validarReparto(definicion, catalogo), [definicion, catalogo])
  const revisionVigente = revision && revision.firma === firma ? revision.datos : revisionLocal
  const problemasPorNodo = useMemo(() => {
    const mapa: Record<string, string[]> = {}
    for (const p of revisionVigente.errores) {
      if (p.nodo) mapa[p.nodo] = [...(mapa[p.nodo] ?? []), p.mensaje]
    }
    return mapa
  }, [revisionVigente])

  const resaltado = useMemo<Resaltado | null>(
    () => (resultado ? { nodos: new Set(resultado.ruta), pasos: new Set(resultado.pasos) } : null),
    [resultado],
  )

  const nodosVisibles = useMemo(
    () => nodos.map((n) => (problemasPorNodo[n.id] || n.data.problemas ? { ...n, data: { ...n.data, problemas: problemasPorNodo[n.id] } } : n)),
    [nodos, problemasPorNodo],
  )
  const flechasVisibles = useMemo(
    () => (resaltado ? flechas.map((f) => ({ ...f, ...estiloFlecha(resaltado.pasos.has(`${f.source}:${f.sourceHandle ?? 'siguiente'}`)) })) : flechas),
    [flechas, resaltado],
  )

  const contexto = useMemo(() => ({ catalogo, resaltado }), [catalogo, resaltado])

  // ───────────── acciones sobre el lienzo ─────────────

  const alConectar = useCallback(
    (conexion: Connection) => {
      const salida = conexion.sourceHandle ?? 'siguiente'
      const { source, target } = conexion
      if (!source || !target || source === target) return
      const restantes = flechas.filter((f) => !(f.source === source && (f.sourceHandle ?? 'siguiente') === salida))
      if (llegaA(target, source, restantes)) {
        avisoError(new Error('Esa flecha volvería a un paso anterior y el cliente daría vueltas sin llegar a nadie.'), 'No se puede unir así')
        return
      }
      setFlechas(addEdge({ ...conexion, sourceHandle: salida, id: nuevoId('c'), ...estiloFlecha() }, restantes))
      const idGrupo = /^g_(\d+)$/.exec(salida)?.[1]
      if (idGrupo) {
        setNodos((actuales) =>
          actuales.map((n) =>
            n.id === target && n.data.tipo === 'repartir'
              ? { ...n, data: { ...n.data, datos: { ...n.data.datos, id_grupo: Number(idGrupo) } } }
              : n,
          ),
        )
      }
    },
    [flechas, setFlechas, setNodos],
  )

  const agregarPaso = useCallback(
    (tipo: TipoNodoReparto, posicion?: { x: number; y: number }) => {
      if (nodos.length >= MAX_PASOS) {
        avisoError(new Error(`El camino puede tener hasta ${MAX_PASOS} pasos. Borra alguno que no uses.`), 'No se agregó el paso')
        return
      }
      const caja = contenedor.current?.getBoundingClientRect()
      const centro = caja ? screenToFlowPosition({ x: caja.left + caja.width / 2 - 144, y: caja.top + caja.height / 2 - 60 }) : { x: 0, y: 0 }
      const desvio = Math.round(Math.random() * 60)
      const nuevo: NodoRepartoRF = {
        id: nuevoId('n'),
        type: 'paso',
        position: posicion ?? { x: centro.x + desvio, y: centro.y + desvio },
        data: { tipo, datos: datosIniciales(tipo) },
        selected: true,
      }
      setNodos((actuales) => [...actuales.map((n) => ({ ...n, selected: false })), nuevo])
      setPanel('paso')
    },
    [nodos.length, screenToFlowPosition, setNodos],
  )

  const cambiarDatos = useCallback(
    (idNodo: string, datos: Record<string, unknown>) => {
      const tipo = nodos.find((n) => n.id === idNodo)?.data.tipo
      if (!tipo) return
      setNodos((actuales) => actuales.map((n) => (n.id === idNodo ? { ...n, data: { ...n.data, datos } } : n)))
      const vigentes = new Set(salidasDe(tipo, datos, catalogo).map((s) => s.id))
      setFlechas((actuales) => actuales.filter((f) => f.source !== idNodo || vigentes.has(f.sourceHandle ?? 'siguiente')))
    },
    [catalogo, nodos, setNodos, setFlechas],
  )

  const duplicar = (nodo: NodoRepartoRF) => {
    if (nodos.length >= MAX_PASOS) {
      avisoError(new Error(`El camino puede tener hasta ${MAX_PASOS} pasos. Borra alguno que no uses.`), 'No se duplicó el paso')
      return
    }
    const datos = structuredClone(nodo.data.datos)
    if (Array.isArray(datos.tramos)) {
      datos.tramos = (datos.tramos as TramoHorario[]).map((t) => ({ ...t, id: nuevoId('t') }))
    }
    const copia: NodoRepartoRF = {
      id: nuevoId('n'),
      type: 'paso',
      position: { x: nodo.position.x + 40, y: nodo.position.y + 60 },
      data: { tipo: nodo.data.tipo, datos },
      selected: true,
    }
    setNodos((actuales) => [...actuales.map((n) => ({ ...n, selected: false })), copia])
  }

  /** Sin paso, muestra el resumen con la lista de problemas. */
  const enfocar = (idNodo: string | null) => {
    setNodos((actuales) => actuales.map((n) => ({ ...n, selected: n.id === idNodo })))
    setPanel('paso')
    if (!idNodo) return
    void fitView({ nodes: [{ id: idNodo }], duration: 400, maxZoom: 1, padding: 0.6 })
  }

  const alSoltar = (e: DragEvent) => {
    e.preventDefault()
    const tipo = e.dataTransfer.getData(FORMATO_ARRASTRE) as TipoNodoReparto
    if (PASOS_AGREGABLES.includes(tipo)) {
      agregarPaso(tipo, screenToFlowPosition({ x: e.clientX - 144, y: e.clientY - 24 }))
    }
  }

  // ───────────── revisar y guardar ─────────────

  const revisar = useMutation({
    mutationFn: async (firmaActual: string) => {
      const datos = await revisarReparto(definicion)
      setRevision({ firma: firmaActual, datos })
      return datos
    },
    onError: (error) => avisoError(error, 'No se pudo revisar'),
  })

  const guardar = useMutation({
    mutationFn: () => guardarReparto(definicion),
    onSuccess: (respuesta) => {
      setGuardada(firma)
      setRevision({ firma, datos: respuesta.revision })
      setAvisoRecuperado(false)
      quitarBorradorReparto()
      marcarRepartoGuardadoEnServidor()
      void consultas.invalidateQueries({ queryKey: CLAVE_REPARTO })
      avisoExito('Reparto guardado', 'Los próximos clientes que escriban seguirán este camino.')
    },
    onError: (error) => {
      avisoError(error, 'No se pudo guardar')
      void revisar.mutateAsync(firma).catch(() => undefined)
    },
  })

  const intentarGuardar = () => {
    if (!sinGuardar || guardar.isPending) return
    const primero = revisionLocal.errores[0]
    if (primero) {
      avisoError(new Error(primero.mensaje), 'Antes de guardar, corrige esto')
      enfocar(primero.nodo)
      return
    }
    guardar.mutate()
  }

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        intentarGuardar()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sinGuardar])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (sinGuardar) guardarBorradorReparto(definicion)
    }, 400)
    return () => window.clearTimeout(t)
  }, [definicion, sinGuardar])

  return (
    <ContextoReparto.Provider value={contexto}>
      <div className="flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="lg:hidden" />}>
              <Plus />
              Agregar paso
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {GRUPOS_PASOS.map((grupo) => (
                <DropdownMenuGroup key={grupo.titulo}>
                  <DropdownMenuLabel>{grupo.titulo}</DropdownMenuLabel>
                  {grupo.pasos.map((tipo) => {
                    const Icono = META[tipo].icono
                    return (
                      <DropdownMenuItem key={tipo} onClick={() => agregarPaso(tipo)}>
                        <Icono /> {META[tipo].titulo}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="hidden text-sm text-muted-foreground sm:block">Arma el camino que sigue cada cliente nuevo hasta llegar a quien lo atiende.</p>
          {sinGuardar ? (
            <span className="text-xs font-medium text-amber-600" title="Pulsa Guardar para que todo tu equipo vea el mismo diseño">
              Cambios sin guardar · recuerda pulsar Guardar
            </span>
          ) : null}
          {avisoRecuperado && sinGuardar ? (
            <span className="text-xs text-sky-700">Recuperamos tu último diseño en este navegador</span>
          ) : null}
          {revisionVigente.errores.length ? (
            <button type="button" onClick={() => enfocar(revisionVigente.errores[0].nodo)} className="text-xs font-medium text-rose-600 hover:underline">
              {revisionVigente.errores.length === 1 ? '1 cosa por corregir' : `${revisionVigente.errores.length} cosas por corregir`}
            </button>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => revisar.mutate(firma)} disabled={revisar.isPending}>
              {revisar.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
              Revisar
            </Button>
            <Button variant={panel === 'probar' ? 'secondary' : 'outline'} onClick={() => setPanel(panel === 'probar' ? 'paso' : 'probar')}>
              <FlaskConical />
              Probar
            </Button>
            <Button onClick={intentarGuardar} disabled={!sinGuardar || guardar.isPending}>
              {guardar.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
              Guardar
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100dvh-15rem)] min-h-[560px] flex-col md:flex-row">
          <aside className="hidden w-[17.5rem] shrink-0 space-y-1 overflow-y-auto border-r p-3 lg:block xl:w-72">
            {GRUPOS_PASOS.map((grupo) => (
              <div key={grupo.titulo} className="space-y-1 pb-2">
                <p className="px-1 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{grupo.titulo}</p>
                {grupo.pasos.map((tipo) => {
                  const meta = META[tipo]
                  const Icono = meta.icono
                  return (
                    <button
                      key={tipo}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(FORMATO_ARRASTRE, tipo)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => agregarPaso(tipo)}
                      title={meta.descripcion}
                      className="flex w-full cursor-grab items-start gap-2.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 active:cursor-grabbing dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md', meta.suave)}>
                        <Icono className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug font-medium">{meta.titulo}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{meta.descripcion}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
            <p className="px-1 pt-1 text-[11px] leading-relaxed text-muted-foreground">
              Arrastra un paso al lienzo o haz clic para agregarlo. Para unir, jala desde el punto de color de una salida hasta el siguiente paso.
            </p>
          </aside>

          <div
            ref={contenedor}
            className="relative min-h-[50vh] min-w-0 flex-1 bg-zinc-50 dark:bg-zinc-900"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={alSoltar}
          >
            <ReactFlow
              nodes={nodosVisibles}
              edges={flechasVisibles}
              nodeTypes={TIPOS_NODO}
              onNodesChange={alCambiarNodos}
              onEdgesChange={alCambiarFlechas}
              onConnect={alConectar}
              isValidConnection={(c) => c.source !== c.target && nodos.find((n) => n.id === c.target)?.data.tipo !== 'inicio'}
              fitView
              fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
              minZoom={0.2}
              maxZoom={1.6}
              deleteKeyCode={['Backspace', 'Delete']}
              selectionOnDrag={false}
              snapToGrid
              snapGrid={[10, 10]}
              colorMode={oscuro ? 'dark' : 'light'}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} color={oscuro ? '#3b4148' : '#cbd5e1'} />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable nodeColor={(n) => META[(n.data as NodoRepartoRF['data']).tipo]?.color ?? '#94a3b8'} className="!hidden rounded-lg !border !border-zinc-200 xl:!block" />
            </ReactFlow>
          </div>

          <aside className="flex max-h-[70vh] shrink-0 flex-col border-t md:max-h-none md:w-[22rem] md:border-t-0 md:border-l">
            <div className="flex shrink-0 gap-1 border-b p-2">
              {(['paso', 'probar'] as const).map((pestana) => (
                <button
                  key={pestana}
                  type="button"
                  onClick={() => setPanel(pestana)}
                  className={cn(
                    'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    panel === pestana ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  {pestana === 'paso' ? 'Paso' : 'Probar'}
                </button>
              ))}
            </div>
            <div className={cn('min-h-0 flex-1', panel !== 'paso' && 'hidden')}>
              {seleccionado ? (
                <PanelPasoReparto
                  key={seleccionado.id}
                  nodo={seleccionado}
                  alCambiar={(datos) => cambiarDatos(seleccionado.id, datos)}
                  alDuplicar={() => duplicar(seleccionado)}
                  alEliminar={() => void deleteElements({ nodes: [{ id: seleccionado.id }] })}
                  alIrAGrupos={alIrAGrupos}
                />
              ) : (
                <Resumen revision={revisionVigente} cargando={revisar.isPending} alElegir={enfocar} />
              )}
            </div>
            <div className={cn('min-h-0 flex-1', panel !== 'probar' && 'hidden')}>
              <PruebaReparto definicion={definicion} camino={camino} alResultado={(r) => setProbado(r ? { camino, resultado: r } : null)} />
            </div>
          </aside>
        </div>
      </div>
    </ContextoReparto.Provider>
  )
}

function Resumen({ revision, cargando, alElegir }: { revision: RevisionReparto; cargando: boolean; alElegir: (id: string | null) => void }) {
  const sinProblemas = revision.errores.length === 0 && revision.avisos.length === 0

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 font-semibold">
          <MousePointerClick className="size-4 text-emerald-600" />
          Elige un paso para editarlo
        </p>
        <p className="text-sm text-muted-foreground">
          Todo empieza en «El cliente escribe». Cada salida es una flecha: únela al paso que quieras. Los pasos de «Quién atiende» son los que entregan el chat.
        </p>
      </div>

      <ul className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <li>• Arma grupos (turno mañana, ventas, soporte…) en la pestaña «Grupos».</li>
        <li>• Usa «Según el horario» para mandar cada turno a su grupo.</li>
        <li>• Pon un «Asistente IA» fuera de horario para que nadie quede sin respuesta.</li>
        <li>• Pulsa «Probar» para ver en verde el camino de un cliente.</li>
      </ul>

      {cargando ? <p className="text-sm text-muted-foreground">Revisando…</p> : null}

      {sinProblemas ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CircleCheck className="size-4 shrink-0" />
          Todo se ve bien.
        </p>
      ) : null}
      {revision.errores.length ? <Lista titulo="Falta corregir" tono="rojo" items={revision.errores} alElegir={alElegir} /> : null}
      {revision.avisos.length ? <Lista titulo="Ten en cuenta" tono="ambar" items={revision.avisos} alElegir={alElegir} /> : null}
    </div>
  )
}

function Lista({
  titulo,
  tono,
  items,
  alElegir,
}: {
  titulo: string
  tono: 'rojo' | 'ambar'
  items: { nodo: string | null; mensaje: string }[]
  alElegir: (id: string | null) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{titulo}</p>
      {items.map((item, i) => (
        <button
          key={`${item.nodo}-${i}`}
          type="button"
          onClick={() => alElegir(item.nodo)}
          disabled={!item.nodo}
          className={cn(
            'flex w-full gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors enabled:hover:brightness-95',
            tono === 'rojo' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800',
          )}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {item.mensaje}
        </button>
      ))}
    </div>
  )
}
