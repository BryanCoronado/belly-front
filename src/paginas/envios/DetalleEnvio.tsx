import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, Send, Square } from 'lucide-react'
import { cancelarEnvio, leerEnvio, type DestinatarioEnvio, type EstadoDestinatario } from '@/api'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { CLAVE_ENVIOS, ESTADO_DESTINATARIO, ESTADO_ENVIO, fechaEnvio } from './estados'
import { Avance, Estado } from './piezas'

type Pestana = 'todos' | EstadoDestinatario

const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: 'todos', texto: 'Todos' },
  { id: 'enviado', texto: 'Enviados' },
  { id: 'fallido', texto: 'Con error' },
  { id: 'omitido', texto: 'Omitidos' },
  { id: 'pendiente', texto: 'En cola' },
]

export function DetalleEnvio() {
  const id = Number(useParams().id)
  const cliente = useQueryClient()
  const [pestana, setPestana] = useState<Pestana>('todos')
  const [cancelando, setCancelando] = useState(false)

  const consulta = useQuery({
    queryKey: [...CLAVE_ENVIOS, id],
    queryFn: () => leerEnvio(id),
    enabled: id > 0,
    refetchInterval: (query) => (query.state.data?.estado === 'enviando' ? 3000 : false),
  })

  const cancelar = useMutation({
    mutationFn: () => cancelarEnvio(id),
    onSuccess: (envio) => {
      cliente.setQueryData([...CLAVE_ENVIOS, id], envio)
      cliente.invalidateQueries({ queryKey: CLAVE_ENVIOS })
      setCancelando(false)
      avisoExito('Envío detenido', 'Los que aún estaban en cola ya no se enviarán.')
    },
    onError: (error) => avisoError(error, 'No se pudo detener el envío'),
  })

  const envio = consulta.data

  if (consulta.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!envio) {
    return (
      <div className="space-y-4">
        <Volver />
        <p className="text-sm text-muted-foreground">{consulta.error ? (consulta.error as Error).message : 'No encontramos este envío.'}</p>
      </div>
    )
  }

  const enviados = envio.resumen.enviado
  const conteo = (estado: Pestana) =>
    estado === 'todos' ? envio.destinatarios.length : envio.destinatarios.filter((d) => d.estado === estado || (estado === 'pendiente' && d.estado === 'enviando')).length
  const filas =
    pestana === 'todos'
      ? envio.destinatarios
      : envio.destinatarios.filter((d) => d.estado === pestana || (pestana === 'pendiente' && d.estado === 'enviando'))

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Volver />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{envio.nombre}</h1>
              <Estado {...ESTADO_ENVIO[envio.estado]} />
            </div>
            <p className="text-sm text-muted-foreground">
              {envio.modo === 'texto' ? 'Texto libre' : `Plantilla ${envio.plantilla?.name ?? ''}`} · {fechaEnvio(envio.creado)}
              {envio.creador ? ` · por ${envio.creador}` : ''}
            </p>
          </div>
          {envio.estado === 'enviando' ? (
            <Button variant="outline" className="h-10 w-full sm:w-auto" onClick={() => setCancelando(true)}>
              <Square />
              Detener envío
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">
            <span className="text-2xl font-semibold tabular-nums">{enviados}</span>
            <span className="text-muted-foreground"> de {envio.total} enviados</span>
          </p>
          {envio.estado === 'enviando' ? <span className="text-xs text-muted-foreground">Se actualiza solo</span> : null}
        </div>
        <Avance envio={envio} className="h-2" />
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Dato color="bg-emerald-500" texto="Enviados" valor={enviados} />
          <Dato color="bg-rose-500" texto="Con error" valor={envio.resumen.fallido} />
          <Dato color="bg-amber-400" texto="Omitidos" valor={envio.resumen.omitido} />
          <Dato color="bg-muted-foreground/30" texto="En cola" valor={envio.resumen.pendiente} />
        </dl>
        <div className="rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap">{envio.modo === 'texto' ? envio.mensaje : envio.plantilla?.vista}</div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={cn(
                'h-8 shrink-0 rounded-md px-3 text-sm transition-colors',
                pestana === p.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {p.texto} <span className="tabular-nums opacity-70">{conteo(p.id)}</span>
            </button>
          ))}
        </div>

        <TablaResponsiva<DestinatarioEnvio>
          filas={filas}
          clave={(fila) => String(fila.id)}
          columnas={[
            {
              titulo: 'Cliente',
              principal: true,
              celda: (fila) => (
                <div className="min-w-0">
                  <p className="truncate font-medium">{fila.nombre}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{fila.telefono}</p>
                </div>
              ),
            },
            { titulo: 'Estado', celda: (fila) => <Estado {...ESTADO_DESTINATARIO[fila.estado]} /> },
            {
              titulo: 'Detalle',
              className: 'max-w-72',
              celda: (fila) => (
                <span className="text-sm text-muted-foreground">{fila.detalle || (fila.enviado_at ? fechaEnvio(fila.enviado_at) : '')}</span>
              ),
            },
          ]}
          acciones={(fila) =>
            fila.id_conversacion ? (
              <Link to={`/chats?c=${fila.id_conversacion}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                <MessageCircle />
                Chat
              </Link>
            ) : null
          }
          vacio={{ icono: Send, titulo: 'Nadie en esta pestaña', texto: 'Prueba con otra.' }}
        />
        {envio.total > envio.destinatarios.length ? (
          <p className="text-xs text-muted-foreground">Se muestran los primeros {envio.destinatarios.length} de {envio.total}.</p>
        ) : null}
      </div>

      <ConfirmarAccion
        abierto={cancelando}
        alCerrar={() => setCancelando(false)}
        titulo="¿Detener el envío?"
        texto={`Los ${envio.resumen.pendiente} mensajes en cola no se enviarán. Los ya enviados no se pueden borrar.`}
        etiqueta="Detener"
        cargando={cancelar.isPending}
        alConfirmar={() => cancelar.mutate()}
      />
    </div>
  )
}

function Volver() {
  return (
    <Link to="/envios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      Envíos masivos
    </Link>
  )
}

function Dato({ color, texto, valor }: { color: string; texto: string; valor: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('size-2 shrink-0 rounded-full', color)} />
      <dt className="text-muted-foreground">{texto}</dt>
      <dd className="ml-auto font-medium tabular-nums sm:ml-0">{valor}</dd>
    </div>
  )
}
