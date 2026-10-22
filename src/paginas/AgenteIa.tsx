import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, BookOpen, Bot, LoaderCircle, MessagesSquare, Plus, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { guardarAgenteIa, leerAgenteIa, leerEstadoIa, type EstadoIa, type ResumenAgenteIa } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { ChatPrueba } from './agente-ia/ChatPrueba'
import { CLAVE_IA, claveAgente, errorDeNombre } from './agente-ia/claves'
import { ConexionOpenAi } from './agente-ia/ConexionOpenAi'
import { Conocimiento } from './agente-ia/Conocimiento'
import { FormularioAgente } from './agente-ia/FormularioAgente'

const PESTANAS = [
  { id: 'como', titulo: 'Cómo es', icono: Settings2 },
  { id: 'sabe', titulo: 'Lo que sabe', icono: BookOpen },
  { id: 'probar', titulo: 'Probar', icono: MessagesSquare },
] as const

type Pestana = (typeof PESTANAS)[number]['id']

const MAX_AGENTES = 10

export function AgenteIa() {
  const estado = useQuery({ queryKey: CLAVE_IA, queryFn: leerEstadoIa })
  const [elegido, setElegido] = useState<number | null>(null)
  const [creando, setCreando] = useState(false)

  const agentes = estado.data?.agentes ?? []
  const idActual = elegido !== null && agentes.some((a) => a.id === elegido) ? elegido : (agentes[0]?.id ?? null)

  return (
    <div className="min-w-0 space-y-6">
      <CabeceraPagina
        titulo="Asistente IA"
        descripcion="Responde chats cuando no hay un asesor, con lo que tú le enseñes. Si no puede, pasa el chat a tu equipo."
      />

      {estado.isLoading || !estado.data ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          <ConexionOpenAi conexion={estado.data.conexion} />

          <section className="flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-muted-foreground">
              <span className="font-medium text-foreground">Para que atienda chats</span> ponlo en el reparto (por ejemplo, fuera de turno).
            </p>
            <Link
              to="/asesores?tab=reparto"
              className="inline-flex shrink-0 items-center justify-center gap-1 text-sm font-medium text-zinc-800 hover:underline"
            >
              Reparto de chats
              <ArrowRight className="size-4" />
            </Link>
          </section>

          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <aside className="space-y-2">
              {agentes.map((agente) => (
                <TarjetaAgente key={agente.id} agente={agente} activa={agente.id === idActual} conectada={estado.data.conexion.conectada} alElegir={() => setElegido(agente.id)} />
              ))}
              <Button variant="outline" className="h-11 w-full border-dashed" onClick={() => setCreando(true)} disabled={agentes.length >= MAX_AGENTES}>
                <Plus />
                Nuevo asistente
              </Button>
              {agentes.length >= MAX_AGENTES ? <p className="text-center text-xs text-muted-foreground">Puedes tener hasta {MAX_AGENTES} asistentes.</p> : null}
            </aside>

            {idActual !== null ? (
              <DetalleAgente key={idActual} id={idActual} estado={estado.data} alEliminar={() => setElegido(null)} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-white p-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  <Bot className="size-6" />
                </span>
                <p className="font-medium">Crea el primero</p>
                <p className="max-w-sm text-sm text-muted-foreground">Ponle un nombre, dile qué debe hacer y agrega datos de tu negocio. Pruébalo aquí antes de usarlo con clientes.</p>
                <Button className="mt-2" onClick={() => setCreando(true)}>
                  <Plus />
                  Nuevo asistente
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={creando} onOpenChange={setCreando}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo asistente</DialogTitle>
            <DialogDescription>Después podrás decirle qué hacer y qué sabe.</DialogDescription>
          </DialogHeader>
          {creando ? (
            <NuevoAgente
              otrosNombres={agentes.map((a) => a.nombre)}
              alCrear={(id) => {
                setElegido(id)
                setCreando(false)
              }}
              alCerrar={() => setCreando(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TarjetaAgente({ agente, activa, conectada, alElegir }: { agente: ResumenAgenteIa; activa: boolean; conectada: boolean; alElegir: () => void }) {
  const listo = agente.activo && conectada
  return (
    <button
      type="button"
      onClick={alElegir}
      className={cn(
        'w-full rounded-lg border bg-white p-3 text-left transition-colors',
        activa ? 'border-zinc-300 ring-1 ring-zinc-300' : 'hover:bg-zinc-50',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
          <Bot className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{agente.nombre}</span>
        <Badge variant={listo ? 'default' : 'secondary'}>{listo ? 'Listo' : agente.activo ? 'Sin conexión' : 'Apagado'}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {agente.conocimientos} {agente.conocimientos === 1 ? 'ficha' : 'fichas'} de información · {agente.atendidos_hoy} {agente.atendidos_hoy === 1 ? 'chat' : 'chats'} hoy
      </p>
    </button>
  )
}

function DetalleAgente({ id, estado, alEliminar }: { id: number; estado: EstadoIa; alEliminar: () => void }) {
  const detalle = useQuery({ queryKey: claveAgente(id), queryFn: () => leerAgenteIa(id) })
  const [pestana, setPestana] = useState<Pestana>('como')

  if (detalle.isLoading || !detalle.data) {
    return <Skeleton className="h-[60vh] w-full rounded-xl" />
  }

  return (
    <section className="min-w-0 rounded-xl border bg-white">
      <div className="-mx-1 overflow-x-auto border-b px-2 py-2">
        <div className="flex w-max gap-1 rounded-lg bg-muted p-1">
        {PESTANAS.map((item) => {
          const Icono = item.icono
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPestana(item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                pestana === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icono className="size-4" />
              {item.titulo}
              {item.id === 'sabe' ? <span className="text-xs tabular-nums opacity-70">{detalle.data.conocimiento.length}</span> : null}
            </button>
          )
        })}
        </div>
      </div>
      <div className="p-4 md:p-5">
        <div className={cn(pestana !== 'como' && 'hidden')}>
          <FormularioAgente
            agente={detalle.data}
            modelos={estado.modelos}
            otrosNombres={estado.agentes.filter((a) => a.id !== id).map((a) => a.nombre)}
            alEliminar={alEliminar}
          />
        </div>
        {pestana === 'sabe' ? <Conocimiento agente={detalle.data} /> : null}
        {pestana === 'probar' ? <ChatPrueba idAgente={id} conectada={estado.conexion.conectada} nombre={detalle.data.nombre} /> : null}
      </div>
    </section>
  )
}

function NuevoAgente({ otrosNombres, alCrear, alCerrar }: { otrosNombres: string[]; alCrear: (id: number) => void; alCerrar: () => void }) {
  const cliente = useQueryClient()
  const [nombre, setNombre] = useState('')
  const error = nombre.trim() ? errorDeNombre(nombre, otrosNombres) : null

  const crear = useMutation({
    mutationFn: () =>
      guardarAgenteIa({
        nombre: nombre.trim(),
        activo: true,
        tono: 'amable',
        usar_catalogo: true,
        palabras_traspaso: ['asesor', 'persona', 'humano'],
        mensaje_traspaso: 'Te paso con una persona de nuestro equipo, en un momento te escribe.',
      }),
    onSuccess: (agente) => {
      cliente.setQueryData(claveAgente(agente.id), agente)
      void cliente.invalidateQueries({ queryKey: CLAVE_IA })
      void cliente.invalidateQueries({ queryKey: ['reparto'] })
      avisoExito('Asistente creado', 'Ahora cuéntale qué hacer y qué sabe de tu negocio.')
      alCrear(agente.id)
    },
    onError: (error) => avisoError(error, 'No se pudo crear'),
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!errorDeNombre(nombre, otrosNombres)) crear.mutate()
  }

  return (
    <form onSubmit={enviar} className="grid gap-4" noValidate>
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Ej.: Sofía" error={error} required autoFocus />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={crear.isPending || errorDeNombre(nombre, otrosNombres) !== null}>
          {crear.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Crear asistente
        </Button>
      </div>
    </form>
  )
}
