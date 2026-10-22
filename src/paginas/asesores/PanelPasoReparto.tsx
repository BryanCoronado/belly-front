import { Copy, Plus, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TramoHorario } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Nota, Numero, Palabras, Seleccion, SelectorHorario } from '../automatizacion/controles'
import { useReparto } from './contextoReparto'
import type { NodoRepartoRF } from './conversionReparto'
import { porcentajeA } from '@/lib/editorPasos'
import { ESTRATEGIAS, META, etiquetaTurnoGrupo, gruposTurnoDe, nuevoTramo, tramosDe, type Catalogo } from './tiposReparto'
import { problemasTramo } from './validarReparto'
import { avisosTurnosGrupos } from './validarGruposTurno'

const MAX_TRAMOS = 8

type PanelPasoRepartoProps = {
  nodo: NodoRepartoRF
  alCambiar: (datos: Record<string, unknown>) => void
  alDuplicar: () => void
  alEliminar: () => void
  alIrAGrupos: () => void
}

function AvisosTurnosGrupos() {
  const { catalogo } = useReparto()
  const avisos = avisosTurnosGrupos(catalogo.grupos)
  if (!avisos.length) return null
  return (
    <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
      {avisos.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </ul>
  )
}

export function PanelPasoReparto({ nodo, alCambiar, alDuplicar, alEliminar, alIrAGrupos }: PanelPasoRepartoProps) {
  const meta = META[nodo.data.tipo]
  const Icono = meta.icono
  const datos = nodo.data.datos
  const poner = (parcial: Record<string, unknown>) => alCambiar({ ...datos, ...parcial })
  const esInicio = nodo.data.tipo === 'inicio'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b p-3">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', meta.suave)}>
          <Icono className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{meta.titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{meta.descripcion}</p>
        </div>
        {!esInicio ? (
          <>
            <Button variant="ghost" size="icon-sm" onClick={alDuplicar} aria-label="Duplicar paso" title="Duplicar">
              <Copy />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={alEliminar} aria-label="Eliminar paso" title="Eliminar" className="text-rose-600 hover:text-rose-700">
              <Trash2 />
            </Button>
          </>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {nodo.data.problemas?.length ? (
          <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {nodo.data.problemas.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ) : null}
        <Formulario nodo={nodo} datos={datos} poner={poner} alIrAGrupos={alIrAGrupos} />
      </div>
    </div>
  )
}

function Formulario({
  nodo,
  datos,
  poner,
  alIrAGrupos,
}: {
  nodo: NodoRepartoRF
  datos: Record<string, unknown>
  poner: (parcial: Record<string, unknown>) => void
  alIrAGrupos: () => void
}) {
  const { catalogo } = useReparto()

  switch (nodo.data.tipo) {
    case 'inicio':
      return (
        <>
          <Nota>
            Aquí empieza todo: cada vez que un cliente te escribe por primera vez (o vuelve tras cerrar su chat), sigue las flechas desde este paso hasta encontrar quién
            lo atiende.
          </Nota>
          <Seleccion
            etiqueta="Persona de respaldo"
            valor={String(datos.id_usuario_respaldo ?? '')}
            alCambiar={(v) => poner({ id_usuario_respaldo: v ? Number(v) : null })}
            opciones={[
              { valor: '', etiqueta: 'El primer administrador' },
              ...catalogo.personas.map((p) => ({ valor: String(p.id), etiqueta: `${p.nombre}${p.es_admin ? ' (administrador)' : ''}` })),
            ]}
            ayuda="Recibe el chat si ningún camino encuentra a alguien disponible. Así ningún cliente se queda sin respuesta."
          />
        </>
      )

    case 'asesor_previo':
      return (
        <Nota>
          Si el cliente ya fue atendido antes y ese asesor sigue activo, el chat vuelve con él. Si es nuevo o su asesor no está, sigue por la flecha de abajo.
        </Nota>
      )

    case 'turnos_grupos': {
      const turnos = gruposTurnoDe(catalogo)
      return (
        <>
          <Nota>Las salidas coinciden con tus grupos «Turno» en la pestaña Grupos. Enlaza cada una a un paso Repartir con el mismo grupo.</Nota>
          {turnos.length ? (
            <>
              <ul className="divide-y text-sm">
                {turnos.map((g) => (
                  <li key={g.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="font-medium">{g.nombre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{etiquetaTurnoGrupo(g).replace(`${g.nombre} · `, '')}</span>
                  </li>
                ))}
              </ul>
              <AvisosTurnosGrupos />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No hay grupos turno todavía.</p>
          )}
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={alIrAGrupos}>
            Abrir Grupos
          </Button>
        </>
      )
    }

    case 'horario':
      return <EditorTramos tramos={tramosDe(datos)} alCambiar={(tramos) => poner({ tramos })} catalogo={catalogo} alIrAGrupos={alIrAGrupos} />

    case 'cliente':
      return <Nota>Revisa si el número ya te había escrito antes. Une cada salida con lo que quieras hacer en cada caso.</Nota>

    case 'origen':
      return <Nota>«Viene de un anuncio» son los clientes que tocaron un anuncio de Facebook o Instagram que lleva a WhatsApp.</Nota>

    case 'palabras':
      return (
        <Palabras
          etiqueta="Palabras a buscar en su primer mensaje"
          valores={Array.isArray(datos.palabras) ? (datos.palabras as string[]) : []}
          alCambiar={(palabras) => poner({ palabras })}
          maximo={30}
          largo={40}
          ejemplo="precio, cotización, reclamo…"
          ayuda="Escribe una palabra y pulsa Enter. No importan mayúsculas ni tildes de más."
        />
      )

    case 'dividir': {
      const a = porcentajeA(datos)
      return (
        <div className="space-y-3">
          <Label>¿Cuántos van por el camino A?</Label>
          <input
            type="range"
            min={1}
            max={99}
            value={a}
            onChange={(e) => poner({ porcentaje_a: Number(e.target.value) })}
            className="w-full accent-teal-600"
            aria-label="Porcentaje del camino A"
          />
          <div className="flex justify-between text-sm font-medium">
            <span>Camino A: {a}%</span>
            <span>Camino B: {100 - a}%</span>
          </div>
          <Nota>Sirve para probar dos formas de atender, o para mandar una parte de los chats a un equipo y el resto a otro.</Nota>
        </div>
      )
    }

    case 'repartir': {
      const estrategia = String(datos.estrategia ?? 'equitativo')
      const grupo = catalogo.grupos.find((g) => g.id === Number(datos.id_grupo))
      return (
        <>
          <div className="space-y-2">
            <Seleccion
              etiqueta="¿Entre quiénes?"
              valor={String(datos.id_grupo ?? '')}
              alCambiar={(v) => poner({ id_grupo: v ? Number(v) : null })}
              opciones={[
                { valor: '', etiqueta: 'Todos los asesores' },
                ...catalogo.grupos.map((g) => ({
                  valor: String(g.id),
                  etiqueta: g.tipo === 'turno' ? etiquetaTurnoGrupo(g) + ` (${g.miembros.length})` : `Grupo «${g.nombre}» (${g.miembros.length})`,
                })),
              ]}
            />
            {!datos.id_grupo && gruposTurnoDe(catalogo).length ? (
              <p className="text-xs text-muted-foreground">Si la flecha viene de un turno, se usa ese grupo aunque aquí diga «Todos».</p>
            ) : null}
            {grupo ? (
              <p className="text-xs text-muted-foreground">
                {grupo.miembros.length
                  ? grupo.miembros.map((id) => catalogo.asesores.find((a) => a.id === id)?.nombre ?? 'Asesor').join(', ')
                  : 'Este grupo no tiene asesores todavía.'}
              </p>
            ) : null}
            <button type="button" onClick={alIrAGrupos} className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline">
              {catalogo.grupos.length ? 'Crear o editar grupos' : 'Aún no tienes grupos: créalos aquí'}
            </button>
          </div>

          <div className="grid gap-2">
            <Label>¿Cómo se reparte?</Label>
            {ESTRATEGIAS.map((e) => (
              <label
                key={e.valor}
                className={cn(
                  'flex cursor-pointer gap-2.5 rounded-lg border p-2.5 text-sm transition-colors',
                  estrategia === e.valor ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'hover:bg-muted/60',
                )}
              >
                <input type="radio" className="mt-0.5 accent-teal-600" checked={estrategia === e.valor} onChange={() => poner({ estrategia: e.valor })} />
                <span>
                  <span className="block font-medium">{e.titulo}</span>
                  <span className="block text-xs text-muted-foreground">{e.ayuda}</span>
                </span>
              </label>
            ))}
            {estrategia === 'prioridad' && !datos.id_grupo ? (
              <p className="text-xs text-rose-600">Para «Por prioridad» elige un grupo: el orden del grupo define quién va primero.</p>
            ) : null}
          </div>

          <Numero
            etiqueta="Máximo de chats abiertos por asesor"
            valor={Number(datos.limite_chats ?? 0)}
            min={0}
            max={500}
            alCambiar={(v) => poner({ limite_chats: v > 0 ? v : null })}
            ayuda="0 = sin límite. Quien llega al máximo no recibe más hasta cerrar alguno."
          />
          <Nota>Solo reciben chats los asesores activos. Si nadie puede, sigue por «Si nadie está disponible».</Nota>
        </>
      )
    }

    case 'persona':
      return (
        <>
          <Seleccion
            etiqueta="¿A quién le llega?"
            valor={String(datos.id_usuario ?? '')}
            alCambiar={(v) => poner({ id_usuario: v ? Number(v) : null })}
            opciones={[
              { valor: '', etiqueta: 'Elige una persona…' },
              ...catalogo.personas.map((p) => ({ valor: String(p.id), etiqueta: `${p.nombre}${p.es_admin ? ' (administrador)' : ''}` })),
            ]}
          />
          <Nota>Si esa persona está inactiva, el chat sigue por «Si nadie está disponible».</Nota>
        </>
      )

    case 'agente_ia': {
      const agente = catalogo.agentes.find((a) => a.id === Number(datos.id_agente))
      return (
        <>
          <Seleccion
            etiqueta="¿Qué asistente atiende?"
            valor={String(datos.id_agente ?? '')}
            alCambiar={(v) => poner({ id_agente: v ? Number(v) : null })}
            opciones={[{ valor: '', etiqueta: 'Elige un asistente…' }, ...catalogo.agentes.map((a) => ({ valor: String(a.id), etiqueta: a.nombre }))]}
          />
          {agente && !agente.listo ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {agente.activo ? 'Falta conectar tu cuenta de OpenAI.' : 'Este asistente está apagado.'} Mientras tanto, los chats siguen por «Cuando pase a una persona».
            </p>
          ) : null}
          <Nota>
            El asistente contesta solo. Cuando el cliente pide una persona, quiere comprar o la IA no sabe responder, el chat sigue por la flecha «Cuando pase a una persona».
          </Nota>
          <Link to="/agente-ia" className="inline-block text-xs font-medium text-emerald-700 underline-offset-2 hover:underline">
            {catalogo.agentes.length ? 'Configurar asistentes' : 'Crear mi primer asistente'}
          </Link>
        </>
      )
    }
  }
}

function nombreLibre(tramos: TramoHorario[]): string {
  const usados = new Set(tramos.map((t) => t.nombre.trim().toLowerCase()))
  if (!usados.has('turno tarde')) return 'Turno tarde'
  let n = tramos.length + 1
  while (usados.has(`horario ${n}`)) n++
  return `Horario ${n}`
}

function EditorTramos({
  tramos,
  alCambiar,
  catalogo,
  alIrAGrupos,
}: {
  tramos: TramoHorario[]
  alCambiar: (tramos: TramoHorario[]) => void
  catalogo: Catalogo
  alIrAGrupos: () => void
}) {
  const cambiar = (id: string, parcial: Partial<TramoHorario>) => alCambiar(tramos.map((t) => (t.id === id ? { ...t, ...parcial } : t)))

  return (
    <div className="space-y-3">
      <Nota>Cada horario crea su propia salida. Si escribe fuera de todos, va por «Fuera de horario». Si dos horarios se cruzan, gana el primero.</Nota>
      {gruposTurnoDe(catalogo).length ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            alCambiar(
              gruposTurnoDe(catalogo).map((g) => ({
                id: nuevoTramo(g.nombre).id,
                nombre: g.nombre,
                dias: [...g.turno_dias],
                desde: g.turno_desde ?? '09:00',
                hasta: g.turno_hasta ?? '18:00',
              })),
            )
          }
        >
          Copiar horarios desde grupos turno
        </Button>
      ) : (
        <button type="button" onClick={alIrAGrupos} className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline">
          Crea grupos tipo turno para no repetir horas aquí
        </button>
      )}
      {tramos.map((tramo, i) => (
        <div key={tramo.id} className="space-y-3 rounded-xl border p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">{i + 1}</span>
            <Input value={tramo.nombre} maxLength={40} onChange={(e) => cambiar(tramo.id, { nombre: e.target.value })} placeholder="Ej.: Turno mañana" className="h-9" aria-label="Nombre del horario" />
            <Button variant="ghost" size="icon-sm" onClick={() => alCambiar(tramos.filter((t) => t.id !== tramo.id))} disabled={tramos.length === 1} aria-label="Quitar horario">
              <X />
            </Button>
          </div>
          <SelectorHorario
            datos={tramo}
            alCambiar={(h) => cambiar(tramo.id, { dias: h.dias ?? tramo.dias, desde: h.desde ?? tramo.desde, hasta: h.hasta ?? tramo.hasta })}
          />
          {problemasTramo(tramo, tramos).map((p) => (
            <p key={p} className="text-xs text-rose-600">
              {p}
            </p>
          ))}
        </div>
      ))}
      <Button
        variant="outline"
        className="w-full"
        disabled={tramos.length >= MAX_TRAMOS}
        onClick={() => alCambiar([...tramos, nuevoTramo(nombreLibre(tramos))])}
      >
        <Plus />
        Agregar horario
      </Button>
    </div>
  )
}
