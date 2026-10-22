import { useState, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, MessageCircle, MoreHorizontal, UserRound } from 'lucide-react'
import { actualizarClienteCrm, leerEmbudo, type ClienteCrm, type ColumnaEmbudo, type FiltrosClientes } from '@/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { CLAVE_CRM, haceCuanto, useEscribirCliente } from './crm'
import { Chip, Punto } from './piezas'

const RESULTADO: Record<string, string> = { ganada: 'Ganada', perdida: 'Perdida' }

export function Embudo({ filtros, alAbrir }: { filtros: FiltrosClientes; alAbrir: (id: number) => void }) {
  const cliente = useQueryClient()
  const clave = [...CLAVE_CRM, 'embudo', filtros]
  const consulta = useQuery({ queryKey: clave, queryFn: () => leerEmbudo(filtros) })
  const [sobre, setSobre] = useState<number | null>(null)
  const { escribir, abriendo } = useEscribirCliente()

  const mover = useMutation({
    mutationFn: ({ id, etapa }: { id: number; etapa: number }) => actualizarClienteCrm(id, { id_etapa: etapa }),
    onMutate: async ({ id, etapa }) => {
      await cliente.cancelQueries({ queryKey: clave })
      const previo = cliente.getQueryData<ColumnaEmbudo[]>(clave)
      if (previo) cliente.setQueryData(clave, moverEnColumnas(previo, id, etapa))
      return { previo }
    },
    onError: (error, _vars, contexto) => {
      if (contexto?.previo) cliente.setQueryData(clave, contexto.previo)
      avisoError(error, 'No se pudo mover al cliente')
    },
    onSettled: () => cliente.invalidateQueries({ queryKey: CLAVE_CRM }),
  })

  function soltar(evento: DragEvent, etapa: number) {
    evento.preventDefault()
    setSobre(null)
    const id = Number(evento.dataTransfer.getData('text/plain'))
    const origen = consulta.data?.find((columna) => columna.clientes.some((c) => c.id === id))
    if (id && origen && origen.id !== etapa) mover.mutate({ id, etapa })
  }

  if (consulta.isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-80 w-72 shrink-0 rounded-xl" />
        ))}
      </div>
    )
  }

  const columnas = consulta.data ?? []

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-3">
        {columnas.map((columna) => (
          <section
            key={columna.id}
            aria-label={columna.nombre}
            onDragOver={(e) => {
              e.preventDefault()
              setSobre(columna.id)
            }}
            onDragLeave={() => setSobre((actual) => (actual === columna.id ? null : actual))}
            onDrop={(e) => soltar(e, columna.id)}
            className={cn(
              'flex max-h-[calc(100dvh-17rem)] min-h-64 w-[17rem] shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors sm:w-72',
              sobre === columna.id && 'border-foreground/30 bg-muted',
            )}
          >
            <header className="flex items-center gap-2 border-b px-3 py-2.5">
              <Punto color={columna.color} className="size-2.5" />
              <h2 className="truncate text-sm font-semibold">{columna.nombre}</h2>
              {RESULTADO[columna.resultado] ? <span className="text-xs text-muted-foreground">· {RESULTADO[columna.resultado]}</span> : null}
              <span className="ml-auto rounded-md bg-background px-1.5 text-xs font-medium text-muted-foreground tabular-nums">{columna.total}</span>
            </header>
            <ul className="grid flex-1 content-start gap-2 overflow-y-auto p-2">
              {columna.clientes.map((c) => (
                <Tarjeta
                  key={c.id}
                  cliente={c}
                  columnas={columnas}
                  actual={columna.id}
                  abriendo={abriendo === c.id}
                  alAbrir={alAbrir}
                  alEscribir={() => escribir(c)}
                  alMover={(etapa) => mover.mutate({ id: c.id, etapa })}
                />
              ))}
              {columna.clientes.length === 0 ? <li className="px-2 py-6 text-center text-xs text-muted-foreground">Arrastra clientes aquí</li> : null}
            </ul>
            {columna.total > columna.clientes.length ? (
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                Y {columna.total - columna.clientes.length} más. Usa la lista para verlos todos.
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}

function Tarjeta({
  cliente,
  columnas,
  actual,
  abriendo,
  alAbrir,
  alEscribir,
  alMover,
}: {
  cliente: ClienteCrm
  columnas: ColumnaEmbudo[]
  actual: number
  abriendo: boolean
  alAbrir: (id: number) => void
  alEscribir: () => void
  alMover: (etapa: number) => void
}) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(cliente.id))
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="group relative cursor-grab rounded-lg border bg-card p-3 shadow-xs active:cursor-grabbing"
    >
      <button type="button" onClick={() => alAbrir(cliente.id)} className="block w-full min-w-0 pr-14 text-left">
        <p className="truncate text-sm font-medium">{cliente.nombre || (cliente.telefono ? `+${cliente.telefono}` : 'Sin nombre')}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Punto color={cliente.ventana_abierta ? '#10b981' : '#cbd5e1'} />
          {haceCuanto(cliente.ultimo_mensaje_cliente)}
          {cliente.asesor_nombre ? <span className="truncate">· {cliente.asesor_nombre}</span> : null}
        </p>
        {cliente.etiquetas.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {cliente.etiquetas.slice(0, 3).map((etiqueta) => (
              <Chip key={etiqueta.id} nombre={etiqueta.nombre} color={etiqueta.color} />
            ))}
            {cliente.etiquetas.length > 3 ? <span className="text-xs text-muted-foreground">+{cliente.etiquetas.length - 3}</span> : null}
          </div>
        ) : null}
      </button>
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-2 right-8 text-muted-foreground hover:text-foreground"
        aria-label={`Escribirle a ${cliente.nombre || cliente.telefono}`}
        title="Escribirle"
        disabled={abriendo}
        onClick={alEscribir}
      >
        {abriendo ? <LoaderCircle className="animate-spin" /> : <MessageCircle />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="absolute top-2 right-2 text-muted-foreground" aria-label="Más acciones" />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={alEscribir}>
              <MessageCircle />
              Escribirle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alAbrir(cliente.id)}>
              <UserRound />
              Ver ficha
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mover a</DropdownMenuLabel>
            {columnas
              .filter((columna) => columna.id !== actual)
              .map((columna) => (
                <DropdownMenuItem key={columna.id} onClick={() => alMover(columna.id)}>
                  <Punto color={columna.color} />
                  {columna.nombre}
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function moverEnColumnas(columnas: ColumnaEmbudo[], id: number, etapa: number): ColumnaEmbudo[] {
  const cliente = columnas.flatMap((columna) => columna.clientes).find((c) => c.id === id)
  if (!cliente) return columnas
  return columnas.map((columna) => {
    if (columna.id === etapa) {
      return { ...columna, total: columna.total + 1, clientes: [{ ...cliente, id_etapa: etapa }, ...columna.clientes] }
    }
    if (columna.clientes.some((c) => c.id === id)) {
      return { ...columna, total: columna.total - 1, clientes: columna.clientes.filter((c) => c.id !== id) }
    }
    return columna
  })
}
