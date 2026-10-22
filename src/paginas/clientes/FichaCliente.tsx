import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, MessageSquare, Send } from 'lucide-react'
import { actualizarClienteCrm, leerFichaCliente, type AjustesCrm, type FichaCliente as Ficha } from '@/api'
import { Campo } from '@/components/Campo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { iniciales } from '../chat/formato'
import { CLASE_SELECT, CLAVE_CRM, haceCuanto, useEscribirCliente } from './crm'
import { Punto, SelectorEtiquetas } from './piezas'

const ESTADOS_CHAT: Record<number, string> = { 1: 'En atención', 2: 'Finalizado', 3: 'Sin abrir' }

export function FichaCliente({
  id,
  ajustes,
  alCerrar,
  desdeChat = false,
}: {
  id: number | null
  ajustes: AjustesCrm | undefined
  alCerrar: () => void
  desdeChat?: boolean
}) {
  const consulta = useQuery({ queryKey: [...CLAVE_CRM, 'ficha', id], queryFn: () => leerFichaCliente(id as number), enabled: id !== null })

  return (
    <Sheet open={id !== null} onOpenChange={(abierto) => (abierto ? null : alCerrar())}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {consulta.data && ajustes ? (
          <Formulario key={consulta.data.id} ficha={consulta.data} ajustes={ajustes} alCerrar={alCerrar} desdeChat={desdeChat} />
        ) : (
          <div className="space-y-4 p-6">
            <SheetHeader className="p-0">
              <SheetTitle>Cliente</SheetTitle>
              <SheetDescription>Cargando…</SheetDescription>
            </SheetHeader>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Formulario({ ficha, ajustes, alCerrar, desdeChat }: { ficha: Ficha; ajustes: AjustesCrm; alCerrar: () => void; desdeChat: boolean }) {
  const cliente = useQueryClient()
  const [datos, setDatos] = useState({
    nombre: ficha.nombres ?? '',
    apellido: ficha.apellidos ?? '',
    correo: ficha.correo ?? '',
    distrito: ficha.distrito ?? '',
    notas: ficha.notas ?? '',
    id_etapa: ficha.id_etapa,
    id_tipo: ficha.id_tipo,
    etiquetas: ficha.etiquetas.map((e) => e.id),
  })

  const guardar = useMutation({
    mutationFn: () => actualizarClienteCrm(ficha.id, datos),
    onSuccess: () => {
      avisoExito('Cliente actualizado')
      cliente.invalidateQueries({ queryKey: CLAVE_CRM })
      cliente.invalidateQueries({ queryKey: ['chats'] })
      cliente.invalidateQueries({ queryKey: ['conversacion'] })
      if (!desdeChat) alCerrar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const { escribir, abriendo } = useEscribirCliente()

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  const nombre = ficha.nombre || ficha.telefono || 'Cliente sin nombre'

  return (
    <form onSubmit={enviar} className="flex min-h-full flex-col">
      <SheetHeader className="gap-3 border-b p-6 pr-12">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{iniciales(nombre)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg">{nombre}</SheetTitle>
            <SheetDescription>{ficha.telefono ? `+${ficha.telefono}` : 'Sin teléfono'}</SheetDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1', ficha.ventana_abierta ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted')}>
            <Punto color={ficha.ventana_abierta ? '#10b981' : '#94a3b8'} />
            {ficha.ventana_abierta ? 'Puede recibir texto libre' : 'Solo plantillas'}
          </span>
          <span>Último mensaje: {haceCuanto(ficha.ultimo_mensaje_cliente).toLowerCase()}</span>
        </div>
        {desdeChat ? null : ficha.id_conversacion && ficha.conversacion_activa ? (
          <Link to={`/chats?c=${ficha.id_conversacion}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
            <MessageSquare />
            Abrir chat
          </Link>
        ) : (
          <Button type="button" variant="outline" size="sm" className="w-fit" disabled={abriendo === ficha.id} onClick={() => escribir(ficha)}>
            {abriendo === ficha.id ? <LoaderCircle className="animate-spin" /> : <Send />}
            Escribirle
          </Button>
        )}
      </SheetHeader>

      <div className="grid gap-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="ficha-etapa">Etapa</Label>
            <select
              id="ficha-etapa"
              className={CLASE_SELECT}
              value={datos.id_etapa ?? ''}
              onChange={(e) => setDatos({ ...datos, id_etapa: e.target.value ? Number(e.target.value) : null })}
            >
              {ajustes.etapas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ficha-tipo">Tipo</Label>
            <select
              id="ficha-tipo"
              className={CLASE_SELECT}
              value={datos.id_tipo ?? ''}
              onChange={(e) => setDatos({ ...datos, id_tipo: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Sin tipo</option>
              {ajustes.tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Etiquetas</legend>
          <SelectorEtiquetas etiquetas={ajustes.etiquetas} elegidas={datos.etiquetas} alCambiar={(etiquetas) => setDatos({ ...datos, etiquetas })} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} maxLength={100} />
          <Campo etiqueta="Apellidos" value={datos.apellido} onChange={(e) => setDatos({ ...datos, apellido: e.target.value })} maxLength={100} opcional />
          <Campo etiqueta="Correo" type="email" value={datos.correo} onChange={(e) => setDatos({ ...datos, correo: e.target.value })} maxLength={150} opcional />
          <Campo etiqueta="Ubicación" value={datos.distrito} onChange={(e) => setDatos({ ...datos, distrito: e.target.value })} maxLength={100} placeholder="Ciudad o distrito" opcional />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ficha-notas">Notas</Label>
          <textarea
            id="ficha-notas"
            value={datos.notas}
            onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
            maxLength={5000}
            rows={4}
            placeholder="Lo que conviene recordar de este cliente"
            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {ficha.conversaciones.length ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Conversaciones</p>
            <ul className="divide-y rounded-lg border text-sm">
              {ficha.conversaciones.map((conversacion) => (
                <li key={conversacion.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate">{conversacion.asesor_nombre || 'Sin asesor'}</p>
                    <p className="text-xs text-muted-foreground">{haceCuanto(conversacion.updated_at ?? conversacion.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{ESTADOS_CHAT[conversacion.id_estado] ?? '—'}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 mt-auto flex justify-end gap-2 border-t bg-popover p-4">
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Guardar
        </Button>
      </div>
    </form>
  )
}
