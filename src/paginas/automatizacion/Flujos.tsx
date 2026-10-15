import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Check, Copy, Headset, LoaderCircle, MessagesSquare, Plus, Trash2, UsersRound, Workflow, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  cambiarEstadoFlujo,
  crearFlujo,
  duplicarFlujo,
  eliminarFlujo,
  guardarFlujo,
  listarFlujos,
  type ResumenFlujo,
} from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { PLANTILLAS, type PlantillaFlujo } from './plantillas'

const CLAVE = ['flujos']

export function Flujos() {
  const [creando, setCreando] = useState(false)
  const flujos = useQuery({ queryKey: CLAVE, queryFn: listarFlujos })
  const lista = flujos.data ?? []

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Respuestas automáticas"
        descripcion="Arma un asistente que conteste solo por WhatsApp con botones y mensajes que tú escribes."
        acciones={
          <Button size="lg" onClick={() => setCreando(true)}>
            <Plus />
            Nuevo flujo
          </Button>
        }
      />

      {flujos.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Vacio alCrear={() => setCreando(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {lista.map((flujo) => (
            <Tarjeta key={flujo.id} flujo={flujo} />
          ))}
        </div>
      )}

      <DialogoNuevo abierto={creando} alCerrar={() => setCreando(false)} />
    </div>
  )
}

function Vacio({ alCrear }: { alCrear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50 to-white px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
        <Bot className="size-7" />
      </div>
      <div className="max-w-md space-y-1.5">
        <p className="text-lg font-semibold">Aún no tienes ningún flujo</p>
        <p className="text-sm text-muted-foreground">
          Un flujo es una conversación que tú diseñas: saluda, ofrece botones, pide datos y, cuando haga falta, pasa al cliente con un asesor.
          Sin inteligencia artificial: responde exactamente lo que escribas.
        </p>
      </div>
      <Button size="lg" onClick={alCrear}>
        <Plus />
        Crear mi primer flujo
      </Button>
    </div>
  )
}

function etiquetaDisparador(flujo: ResumenFlujo): string {
  switch (flujo.disparador.tipo) {
    case 'palabra_clave':
      return flujo.disparador.palabras.length ? `Al escribir: ${flujo.disparador.palabras.slice(0, 3).join(', ')}` : 'Por palabra clave'
    case 'cualquier_mensaje':
      return 'Con cualquier mensaje'
    default:
      return 'Al primer mensaje'
  }
}

/** Cuántas conversaciones atendió el flujo y en qué terminaron. */
function Estadisticas({ datos }: { datos: ResumenFlujo['estadisticas'] }) {
  const aAsesor = Math.round((datos.derivadas / datos.total) * 100)

  return (
    <div className="space-y-1.5 rounded-lg bg-zinc-50 p-2.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">
          <b className="text-sm text-foreground">{datos.total}</b> {datos.total === 1 ? 'conversación atendida' : 'conversaciones atendidas'}
        </span>
        <span className="font-medium text-fuchsia-700">{aAsesor}% pasó a un asesor</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-200" aria-hidden>
        <div className="bg-fuchsia-400" style={{ width: `${aAsesor}%` }} />
      </div>
    </div>
  )
}

function Tarjeta({ flujo }: { flujo: ResumenFlujo }) {
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  const refrescar = () => consultas.invalidateQueries({ queryKey: CLAVE })

  const alternar = useMutation({
    mutationFn: (activo: boolean) => cambiarEstadoFlujo(flujo.id, activo),
    onSuccess: (nuevo) => {
      void refrescar()
      avisoExito(nuevo.activo ? 'Flujo activado' : 'Flujo pausado')
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el estado'),
  })
  const duplicar = useMutation({
    mutationFn: () => duplicarFlujo(flujo.id),
    onSuccess: (copia) => {
      void refrescar()
      avisoExito('Flujo duplicado')
      navegar(`/automatizacion/${copia.id}`)
    },
    onError: (error) => avisoError(error, 'No se pudo duplicar'),
  })
  const eliminar = useMutation({
    mutationFn: () => eliminarFlujo(flujo.id),
    onSuccess: () => {
      setConfirmando(false)
      void refrescar()
      avisoExito('Flujo eliminado')
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-xs transition-shadow hover:shadow-md">
      <div className={cn('h-1.5', flujo.activo ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-zinc-200')} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              flujo.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500',
            )}
          >
            <Workflow className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Link to={`/automatizacion/${flujo.id}`} className="block truncate font-semibold hover:text-emerald-700">
              {flujo.nombre}
            </Link>
            <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{flujo.descripcion || 'Sin descripción'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
            <Zap className="size-3" />
            {etiquetaDisparador(flujo)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
            <UsersRound className="size-3" />
            {flujo.disparador.audiencia === 'nuevos' ? 'Contactos nuevos' : 'Todos los contactos'}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600">{flujo.pasos} pasos</span>
          {flujo.equipo.reparto !== 'mantener' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2 py-1 font-medium text-fuchsia-700">
              <Headset className="size-3" />
              {flujo.equipo.reparto === 'equitativo' ? 'Reparto parejo' : 'Al que tiene menos chats'}
              {flujo.equipo.asesores > 0 ? ` · ${flujo.equipo.asesores}` : ''}
            </span>
          ) : null}
          {flujo.conversaciones_activas > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 font-medium text-sky-700">
              <MessagesSquare className="size-3" />
              {flujo.conversaciones_activas} en curso
            </span>
          ) : null}
        </div>

        {flujo.estadisticas.total > 0 ? <Estadisticas datos={flujo.estadisticas} /> : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Switch
              checked={flujo.activo}
              onCheckedChange={(v) => alternar.mutate(v)}
              disabled={alternar.isPending}
              className="data-checked:bg-emerald-500"
            />
            <span className={flujo.activo ? 'text-emerald-700' : 'text-muted-foreground'}>{flujo.activo ? 'Activo' : 'Pausado'}</span>
          </label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => duplicar.mutate()} disabled={duplicar.isPending} aria-label="Duplicar" title="Duplicar">
              {duplicar.isPending ? <LoaderCircle className="animate-spin" /> : <Copy />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmando(true)} aria-label="Eliminar" title="Eliminar" className="text-muted-foreground hover:text-destructive">
              <Trash2 />
            </Button>
            <Link to={`/automatizacion/${flujo.id}`} className={buttonVariants({ variant: 'outline' })}>
              Editar
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar «{flujo.nombre}»?</DialogTitle>
            <DialogDescription>
              Dejará de responder y se cerrarán las conversaciones que tenga en curso. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => eliminar.mutate()} disabled={eliminar.isPending}>
              {eliminar.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DialogoNuevo({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const consultas = useQueryClient()
  const navegar = useNavigate()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [plantilla, setPlantilla] = useState<PlantillaFlujo['id']>('menu')

  const crear = useMutation({
    mutationFn: async () => {
      const elegida = PLANTILLAS.find((p) => p.id === plantilla)
      const nuevo = await crearFlujo(nombre.trim(), descripcion.trim())
      if (elegida?.definicion) {
        await guardarFlujo(nuevo.id, { definicion: elegida.definicion })
      }
      return nuevo
    },
    onSuccess: (nuevo) => {
      void consultas.invalidateQueries({ queryKey: CLAVE })
      alCerrar()
      setNombre('')
      setDescripcion('')
      navegar(`/automatizacion/${nuevo.id}`)
    },
    onError: (error) => avisoError(error, 'No se pudo crear el flujo'),
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (nombre.trim().length >= 2) {
      crear.mutate()
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (v ? undefined : alCerrar())}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={enviar} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Nuevo flujo</DialogTitle>
            <DialogDescription>Ponle un nombre y elige con qué quieres empezar. Después lo podrás cambiar todo.</DialogDescription>
          </DialogHeader>

          <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Bienvenida" maxLength={120} autoFocus />
          <Campo
            etiqueta="Descripción"
            opcional
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Para qué sirve este flujo"
            maxLength={255}
          />

          <div className="grid gap-2">
            <p className="text-sm font-medium">Punto de partida</p>
            <div className="grid gap-2">
              {PLANTILLAS.map((p) => {
                const elegido = p.id === plantilla
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlantilla(p.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      elegido ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'hover:bg-zinc-50',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                        elegido ? 'border-emerald-500 bg-emerald-500 text-white' : 'bg-white',
                      )}
                    >
                      {elegido ? <Check className="size-3" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{p.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{p.descripcion}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crear.isPending || nombre.trim().length < 2}>
              {crear.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Crear y abrir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
