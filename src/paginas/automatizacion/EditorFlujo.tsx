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
import { ArrowLeft, CircleCheck, LoaderCircle, MousePointerClick, Pause, Play, Save, Settings2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  cambiarEstadoFlujo,
  guardarFlujo,
  leerFlujo,
  revisarFlujo,
  type DatosPaso,
  type Flujo,
  type RevisionFlujo,
  type TipoPaso,
} from '@/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito, avisoInfo } from '@/lib/avisos'
import { useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { ConfiguracionFlujo } from './ConfiguracionFlujo'
import { aAristasRF, aDefinicion, aNodosRF, estiloArista, type NodoRF } from './conversion'
import { NodoVisual } from './NodoVisual'
import { PanelNodo } from './PanelNodo'
import { Simulador } from './Simulador'
import { GRUPOS_PASOS, META, PASOS_AGREGABLES, VARIABLES_BASE, datosIniciales, nuevoId, resumenEquipo, resumenInicio, salidasDe } from './tipos'

const TIPOS_NODO = { paso: NodoVisual }
const FORMATO_ARRASTRE = 'application/x-belly-paso'

export function EditorFlujo() {
  const { id } = useParams()
  const idFlujo = Number(id)
  const flujo = useQuery({
    queryKey: ['flujo', idFlujo],
    queryFn: () => leerFlujo(idFlujo),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 0,
    enabled: Number.isInteger(idFlujo) && idFlujo > 0,
  })

  if (flujo.isPending) {
    return <Skeleton className="m-6 h-[60vh] rounded-lg" />
  }
  if (flujo.isError || !flujo.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium">No encontramos este flujo</p>
        <Link to="/automatizacion" className="text-sm text-emerald-700 underline">
          Volver a mis flujos
        </Link>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <Lienzo key={flujo.data.id} flujo={flujo.data} />
    </ReactFlowProvider>
  )
}

function Lienzo({ flujo }: { flujo: Flujo }) {
  const consultas = useQueryClient()
  const { oscuro } = useTema()
  const { screenToFlowPosition, fitView, deleteElements } = useReactFlow<NodoRF>()
  const contenedor = useRef<HTMLDivElement>(null)

  const [nodos, setNodos, alCambiarNodos] = useNodesState<NodoRF>(aNodosRF(flujo.definicion))
  const [aristas, setAristas, alCambiarAristas] = useEdgesState(aAristasRF(flujo.definicion))
  const [nombre, setNombre] = useState(flujo.nombre)
  const [activo, setActivo] = useState(flujo.activo)
  const [panel, setPanel] = useState<'paso' | 'probar'>('paso')
  const [yaProbo, setYaProbo] = useState(false)
  const [configurando, setConfigurando] = useState(false)
  const [revision, setRevision] = useState<{ firma: string; datos: RevisionFlujo } | null>(null)

  const definicion = useMemo(() => aDefinicion(nodos, aristas), [nodos, aristas])
  const firma = useMemo(() => JSON.stringify(definicion), [definicion])
  const [guardado, setGuardado] = useState({ firma, nombre: flujo.nombre })
  const sinGuardar = firma !== guardado.firma || nombre.trim() !== guardado.nombre

  const inicio = nodos.find((n) => n.data.tipo === 'inicio')
  const seleccionados = nodos.filter((n) => n.selected)
  const seleccionado = seleccionados.length === 1 ? seleccionados[0] : null

  const revisionVigente = revision && revision.firma === firma ? revision.datos : null
  const problemasPorNodo = useMemo(() => {
    const mapa: Record<string, string[]> = {}
    for (const p of revisionVigente?.errores ?? []) {
      if (p.nodo) {
        mapa[p.nodo] = [...(mapa[p.nodo] ?? []), p.mensaje]
      }
    }
    return mapa
  }, [revisionVigente])

  const nodosVisibles = useMemo(
    () =>
      nodos.map((n) => {
        const problemas = problemasPorNodo[n.id]
        return problemas || n.data.problemas ? { ...n, data: { ...n.data, problemas } } : n
      }),
    [nodos, problemasPorNodo],
  )

  const variables = useMemo(() => {
    const propias = nodos
      .filter((n) => n.data.tipo === 'pregunta' || n.data.tipo === 'variable')
      .map((n) => String(n.data.datos.variable ?? '').trim().toLowerCase().replace(/\s+/g, '_'))
      .filter(Boolean)
    return [...new Set([...VARIABLES_BASE.map((v) => v.nombre), ...propias])]
  }, [nodos])

  // ───────────── acciones sobre el lienzo ─────────────

  const alConectar = useCallback(
    (conexion: Connection) => {
      const salida = conexion.sourceHandle ?? 'siguiente'
      if (!conexion.source || !conexion.target || conexion.source === conexion.target) {
        return
      }
      setAristas((actuales) =>
        addEdge(
          { ...conexion, sourceHandle: salida, id: nuevoId('c'), ...estiloArista() },
          actuales.filter((a) => !(a.source === conexion.source && (a.sourceHandle ?? 'siguiente') === salida)),
        ),
      )
    },
    [setAristas],
  )

  const agregarPaso = useCallback(
    (tipo: TipoPaso, posicion?: { x: number; y: number }) => {
      const caja = contenedor.current?.getBoundingClientRect()
      const centro = caja
        ? screenToFlowPosition({ x: caja.left + caja.width / 2 - 128, y: caja.top + caja.height / 2 - 60 })
        : { x: 0, y: 0 }
      const desvio = Math.round(Math.random() * 60)
      const nuevo: NodoRF = {
        id: nuevoId('n'),
        type: 'paso',
        position: posicion ?? { x: centro.x + desvio, y: centro.y + desvio },
        data: { tipo, datos: datosIniciales(tipo) },
        selected: true,
      }
      setNodos((actuales) => [...actuales.map((n) => ({ ...n, selected: false })), nuevo])
      setPanel('paso')
    },
    [screenToFlowPosition, setNodos],
  )

  const cambiarDatos = useCallback(
    (idNodo: string, datos: DatosPaso) => {
      const tipo = nodos.find((n) => n.id === idNodo)?.data.tipo
      if (!tipo) {
        return
      }
      setNodos((actuales) => actuales.map((n) => (n.id === idNodo ? { ...n, data: { ...n.data, datos } } : n)))
      const vigentes = new Set(salidasDe(tipo, datos).map((s) => s.id))
      setAristas((actuales) => actuales.filter((a) => a.source !== idNodo || vigentes.has(a.sourceHandle ?? 'siguiente')))
    },
    [nodos, setNodos, setAristas],
  )

  const duplicar = (nodo: NodoRF) => {
    const datos = structuredClone(nodo.data.datos) as DatosPaso
    for (const clave of ['botones', 'opciones']) {
      if (Array.isArray(datos[clave])) {
        datos[clave] = (datos[clave] as { id: string }[]).map((o) => ({ ...o, id: nuevoId(clave === 'botones' ? 'b' : 'o') }))
      }
    }
    const copia: NodoRF = {
      id: nuevoId('n'),
      type: 'paso',
      position: { x: nodo.position.x + 40, y: nodo.position.y + 60 },
      data: { tipo: nodo.data.tipo, datos },
      selected: true,
    }
    setNodos((actuales) => [...actuales.map((n) => ({ ...n, selected: false })), copia])
  }

  const enfocar = (idNodo: string | null) => {
    if (!idNodo) {
      return
    }
    setNodos((actuales) => actuales.map((n) => ({ ...n, selected: n.id === idNodo })))
    setPanel('paso')
    void fitView({ nodes: [{ id: idNodo }], duration: 400, maxZoom: 1, padding: 0.6 })
  }

  const alSoltar = (e: DragEvent) => {
    e.preventDefault()
    const tipo = e.dataTransfer.getData(FORMATO_ARRASTRE) as TipoPaso
    if (PASOS_AGREGABLES.includes(tipo)) {
      agregarPaso(tipo, screenToFlowPosition({ x: e.clientX - 128, y: e.clientY - 24 }))
    }
  }

  // ───────────── guardar, revisar, activar ─────────────

  const guardar = useMutation({
    mutationFn: () => guardarFlujo(flujo.id, { nombre: nombre.trim(), definicion }),
    onSuccess: (nuevo) => {
      setGuardado({ firma, nombre: nuevo.nombre })
      setNombre(nuevo.nombre)
      setActivo(nuevo.activo)
      void consultas.invalidateQueries({ queryKey: ['flujos'] })
      if (nuevo.pausado_por_errores) {
        avisoInfo('Guardado, pero el flujo se pausó', 'Tiene pasos incompletos. Corrígelos y vuelve a activarlo.')
      } else {
        avisoExito('Cambios guardados')
      }
      void revisar.mutateAsync(firma).catch(() => undefined)
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const revisar = useMutation({
    mutationFn: async (firmaActual: string) => {
      const datos = await revisarFlujo(definicion)
      setRevision({ firma: firmaActual, datos })
      return datos
    },
    onError: (error) => avisoError(error, 'No se pudo revisar el flujo'),
  })

  const alternar = useMutation({
    mutationFn: async (encender: boolean) => {
      if (sinGuardar) {
        await guardarFlujo(flujo.id, { nombre: nombre.trim(), definicion })
        setGuardado({ firma, nombre: nombre.trim() })
      }
      return cambiarEstadoFlujo(flujo.id, encender)
    },
    onSuccess: (nuevo) => {
      setActivo(nuevo.activo)
      void consultas.invalidateQueries({ queryKey: ['flujos'] })
      avisoExito(nuevo.activo ? 'Flujo activado' : 'Flujo pausado', nuevo.activo ? 'Ya responde a tus clientes por WhatsApp.' : undefined)
    },
    onError: (error) => {
      avisoError(error, 'No se pudo cambiar el estado')
      void revisar.mutateAsync(firma).catch(() => undefined)
    },
  })

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (sinGuardar && !guardar.isPending) {
          guardar.mutate()
        }
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  useEffect(() => {
    if (!sinGuardar) {
      return
    }
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sinGuardar])

  const ocupado = guardar.isPending || alternar.isPending

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 md:px-4">
        <Link to="/automatizacion" aria-label="Volver" className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={120}
          aria-label="Nombre del flujo"
          className="h-9 min-w-40 max-w-md flex-1 rounded-lg border border-transparent bg-transparent px-2 text-base font-semibold outline-none hover:border-input focus:border-ring focus:ring-3 focus:ring-ring/40"
        />
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            activo ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600',
          )}
        >
          <span className={cn('size-1.5 rounded-full', activo ? 'bg-emerald-500' : 'bg-zinc-400')} />
          {activo ? 'Activo' : 'Pausado'}
        </span>
        {sinGuardar ? <span className="text-xs text-amber-600">Cambios sin guardar</span> : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setConfigurando(true)} disabled={!inicio}>
            <Settings2 />
            Configurar
          </Button>
          <Button variant="outline" onClick={() => revisar.mutate(firma)} disabled={revisar.isPending}>
            {revisar.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
            Revisar
          </Button>
          <Button
            variant={panel === 'probar' ? 'secondary' : 'outline'}
            onClick={() => {
              setYaProbo(true)
              setPanel(panel === 'probar' ? 'paso' : 'probar')
            }}
          >
            <Play />
            Probar
          </Button>
          <Button variant="outline" onClick={() => guardar.mutate()} disabled={!sinGuardar || ocupado}>
            {guardar.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            Guardar
          </Button>
          {activo ? (
            <Button variant="outline" onClick={() => alternar.mutate(false)} disabled={ocupado}>
              <Pause />
              Pausar
            </Button>
          ) : (
            <Button onClick={() => alternar.mutate(true)} disabled={ocupado}>
              {alternar.isPending ? <LoaderCircle className="animate-spin" /> : <Play />}
              Activar
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 space-y-1 overflow-y-auto border-r bg-white p-3 md:block">
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
                    className="group flex w-full cursor-grab items-center gap-2.5 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 active:cursor-grabbing"
                  >
                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', meta.suave)}>
                      <Icono className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{meta.titulo}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{meta.descripcion}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
          <p className="px-1 pt-1 text-[11px] leading-relaxed text-muted-foreground">
            Arrastra un paso al lienzo o haz clic para agregarlo. Une los pasos jalando desde el punto de color hasta el siguiente paso.
          </p>
        </aside>

        <div
          ref={contenedor}
          className="relative min-w-0 flex-1 bg-zinc-50"
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={alSoltar}
        >
          <ReactFlow
            nodes={nodosVisibles}
            edges={aristas}
            nodeTypes={TIPOS_NODO}
            onNodesChange={alCambiarNodos}
            onEdgesChange={alCambiarAristas}
            onConnect={alConectar}
            isValidConnection={(c) => c.source !== c.target}
            fitView
            fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
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
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => META[(n.data as NodoRF['data']).tipo]?.color ?? '#94a3b8'}
              className="!hidden rounded-lg !border !border-zinc-200 lg:!block"
            />
          </ReactFlow>
        </div>

        <aside className="hidden w-[22rem] shrink-0 flex-col border-l bg-white lg:flex">
          <div className="flex shrink-0 gap-1 border-b p-2">
            {(['paso', 'probar'] as const).map((pestana) => (
              <button
                key={pestana}
                type="button"
                onClick={() => {
                  setPanel(pestana)
                  if (pestana === 'probar') {
                    setYaProbo(true)
                  }
                }}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  panel === pestana ? 'bg-emerald-50 text-emerald-700' : 'text-muted-foreground hover:bg-zinc-50',
                )}
              >
                {pestana === 'paso' ? 'Paso' : 'Probar'}
              </button>
            ))}
          </div>
          <div className={cn('min-h-0 flex-1', panel !== 'paso' && 'hidden')}>
            {seleccionado ? (
              <PanelNodo
                key={seleccionado.id}
                nodo={seleccionado}
                variables={variables}
                alCambiar={(datos) => cambiarDatos(seleccionado.id, datos)}
                alDuplicar={() => duplicar(seleccionado)}
                alEliminar={() => void deleteElements({ nodes: [{ id: seleccionado.id }] })}
                alConfigurar={() => setConfigurando(true)}
              />
            ) : (
              <Resumen
                revision={revisionVigente}
                cargando={revisar.isPending}
                total={nodos.length}
                alElegir={enfocar}
                datosInicio={inicio?.data.datos}
                alConfigurar={() => setConfigurando(true)}
              />
            )}
          </div>
          {yaProbo ? (
            <div className={cn('min-h-0 flex-1', panel !== 'probar' && 'hidden')}>
              <Simulador definicion={definicion} />
            </div>
          ) : null}
        </aside>
      </div>

      {inicio ? (
        <ConfiguracionFlujo
          abierto={configurando}
          alCerrar={() => setConfigurando(false)}
          datos={inicio.data.datos}
          alCambiar={(datos) => cambiarDatos(inicio.id, datos)}
        />
      ) : null}
    </div>
  )
}

function Resumen({
  revision,
  cargando,
  total,
  alElegir,
  datosInicio,
  alConfigurar,
}: {
  revision: RevisionFlujo | null
  cargando: boolean
  total: number
  alElegir: (id: string | null) => void
  datosInicio?: DatosPaso
  alConfigurar: () => void
}) {
  const sinProblemas = revision && revision.errores.length === 0 && revision.avisos.length === 0

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      {datosInicio ? (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Settings2 className="size-4" />
            Cómo funciona este flujo
          </p>
          <p className="text-sm text-emerald-900">{resumenInicio(datosInicio)}</p>
          <p className="text-xs text-emerald-800">{resumenEquipo(datosInicio)}</p>
          <Button size="sm" onClick={alConfigurar} className="w-full">
            Configurar: a quién responde y reparto de asesores
          </Button>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <p className="flex items-center gap-2 font-semibold">
          <MousePointerClick className="size-4 text-emerald-600" />
          Elige un paso para editarlo
        </p>
        <p className="text-sm text-muted-foreground">
          Tienes {total} {total === 1 ? 'paso' : 'pasos'}. Haz clic en uno del lienzo para cambiar su texto, botones u opciones.
        </p>
      </div>

      {cargando ? <p className="text-sm text-muted-foreground">Revisando…</p> : null}

      {sinProblemas ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CircleCheck className="size-4 shrink-0" />
          Todo se ve bien. Ya puedes activarlo.
        </p>
      ) : null}

      {revision?.errores.length ? (
        <Lista titulo="Falta corregir" tono="rojo" items={revision.errores} alElegir={alElegir} />
      ) : null}
      {revision?.avisos.length ? <Lista titulo="Ten en cuenta" tono="ambar" items={revision.avisos} alElegir={alElegir} /> : null}

      {!revision && !cargando ? (
        <p className="rounded-lg bg-zinc-100 p-3 text-xs leading-relaxed text-zinc-600">
          Pulsa <b>Revisar</b> para comprobar que no falte nada antes de activar el flujo.
        </p>
      ) : null}
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
