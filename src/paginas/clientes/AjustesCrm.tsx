import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  eliminarAjusteCrm,
  guardarAjusteCrm,
  ordenarAjusteCrm,
  type AjustesCrm as Ajustes,
  type ClaseAjuste,
  type DatosAjuste,
  type ResultadoEtapa,
} from '@/api'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { avisoError } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { CLASE_SELECT, CLAVE_AJUSTES, CLAVE_CRM, COLORES, useAjustesCrm } from './crm'
import { Punto, SelectorColor } from './piezas'

type Item = { id: number; nombre: string; color: string; total_clientes?: number; total_conversaciones?: number; resultado?: ResultadoEtapa }

const PESTANAS: { id: ClaseAjuste; titulo: string; ayuda: string }[] = [
  { id: 'etapas', titulo: 'Etapas del embudo', ayuda: 'El camino que recorre un cliente, de izquierda a derecha en el embudo.' },
  { id: 'tipos', titulo: 'Tipos de cliente', ayuda: 'Para separar, por ejemplo, prospectos, clientes frecuentes o mayoristas.' },
  { id: 'etiquetas', titulo: 'Etiquetas', ayuda: 'Marcas libres: un cliente puede tener varias. También aparecen en el chat.' },
  { id: 'motivos', titulo: 'Motivos de cierre', ayuda: 'Por qué se cierra un chat. Cada empresa arma los suyos.' },
]

const RESULTADOS: { valor: ResultadoEtapa; texto: string }[] = [
  { valor: 'abierta', texto: 'En proceso' },
  { valor: 'ganada', texto: 'Venta ganada' },
  { valor: 'perdida', texto: 'Venta perdida' },
]

export function AjustesCrm({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const [pestana, setPestana] = useState<ClaseAjuste>('etapas')
  const ajustes = useAjustesCrm()
  const actual = PESTANAS.find((p) => p.id === pestana) ?? PESTANAS[0]

  return (
    <Dialog open={abierto} onOpenChange={(valor) => (valor ? null : alCerrar())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Etapas, etiquetas y motivos</DialogTitle>
          <DialogDescription>Ordena a tus clientes y cierra chats con las palabras de tu negocio.</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max gap-1 rounded-lg bg-muted p-1">
            {PESTANAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPestana(item.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  pestana === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.titulo}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{actual.ayuda}</p>

        {ajustes.data ? <ListaAjustes key={pestana} clase={pestana} ajustes={ajustes.data} /> : <p className="text-sm text-muted-foreground">Cargando…</p>}
      </DialogContent>
    </Dialog>
  )
}

function ListaAjustes({ clase, ajustes }: { clase: ClaseAjuste; ajustes: Ajustes }) {
  const cliente = useQueryClient()
  const items: Item[] = ajustes[clase] ?? []
  const [editando, setEditando] = useState<number | 'nuevo' | null>(null)
  const [borrando, setBorrando] = useState<Item | null>(null)
  const ordenable = clase !== 'etiquetas'

  const actualizar = (filas: unknown[]) => {
    cliente.setQueryData<Ajustes>(CLAVE_AJUSTES, (previo) => (previo ? { ...previo, [clase]: filas } : previo))
    cliente.invalidateQueries({ queryKey: CLAVE_CRM })
    if (clase === 'motivos') cliente.invalidateQueries({ queryKey: ['motivos-cierre'] })
  }

  const ordenar = useMutation({
    mutationFn: (ids: number[]) => ordenarAjusteCrm(clase as 'etapas' | 'tipos' | 'motivos', ids),
    onSuccess: actualizar,
    onError: (error) => avisoError(error, 'No se pudo ordenar'),
  })

  const eliminar = useMutation({
    mutationFn: (item: Item) => eliminarAjusteCrm(clase, item.id),
    onSuccess: (filas) => {
      actualizar(filas)
      setBorrando(null)
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  function mover(indice: number, paso: -1 | 1) {
    const ids = items.map((item) => item.id)
    const destino = indice + paso
    if (destino < 0 || destino >= ids.length) return
    ;[ids[indice], ids[destino]] = [ids[destino], ids[indice]]
    ordenar.mutate(ids)
  }

  const primeraRestante = borrando ? items.find((item) => item.id !== borrando.id) : undefined

  return (
    <div className="grid gap-3">
      <ul className="divide-y rounded-lg border">
        {items.map((item, indice) =>
          editando === item.id ? (
            <li key={item.id} className="p-3">
              <EditorItem clase={clase} item={item} alTerminar={() => setEditando(null)} alGuardar={actualizar} />
            </li>
          ) : (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
              <Punto color={item.color} className="size-2.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {clase === 'motivos'
                    ? `${item.total_conversaciones ?? 0} ${(item.total_conversaciones ?? 0) === 1 ? 'chat' : 'chats'}`
                    : `${item.total_clientes ?? 0} ${item.total_clientes === 1 ? 'cliente' : 'clientes'}`}
                  {item.resultado && item.resultado !== 'abierta' ? ` · ${RESULTADOS.find((r) => r.valor === item.resultado)?.texto}` : ''}
                </p>
              </div>
              {ordenable ? (
                <div className="flex">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir" disabled={indice === 0 || ordenar.isPending} onClick={() => mover(indice, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Bajar"
                    disabled={indice === items.length - 1 || ordenar.isPending}
                    onClick={() => mover(indice, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              ) : null}
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${item.nombre}`} onClick={() => setEditando(item.id)}>
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar ${item.nombre}`}
                disabled={(clase === 'etapas' || clase === 'motivos') && items.length === 1}
                onClick={() => setBorrando(item)}
              >
                <Trash2 />
              </Button>
            </li>
          ),
        )}
        {items.length === 0 && editando !== 'nuevo' ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">Aún no hay ninguna.</li> : null}
        {editando === 'nuevo' ? (
          <li className="p-3">
            <EditorItem clase={clase} alTerminar={() => setEditando(null)} alGuardar={actualizar} />
          </li>
        ) : null}
      </ul>

      {editando !== 'nuevo' ? (
        <Button type="button" variant="outline" className="w-fit" onClick={() => setEditando('nuevo')}>
          <Plus />
          Agregar
        </Button>
      ) : null}

      <ConfirmarAccion
        abierto={borrando !== null}
        titulo={`¿Eliminar «${borrando?.nombre ?? ''}»?`}
        texto={textoBorrado(clase, borrando, primeraRestante?.nombre)}
        etiqueta="Eliminar"
        cargando={eliminar.isPending}
        alCerrar={() => setBorrando(null)}
        alConfirmar={() => borrando && eliminar.mutate(borrando)}
      />
    </div>
  )
}

function textoBorrado(clase: ClaseAjuste, item: Item | null, primeraRestante?: string): string {
  if (clase === 'motivos') {
    const chats = item?.total_conversaciones ?? 0
    return chats === 0
      ? 'No lo usa ningún chat cerrado.'
      : `Los ${chats === 1 ? 'chat ya cerrado conserva' : `${chats} chats ya cerrados conservan`} este motivo en el historial.`
  }
  const total = item?.total_clientes ?? 0
  if (total === 0) return 'No la usa ningún cliente.'
  const clientes = total === 1 ? '1 cliente' : `${total} clientes`
  if (clase === 'etapas') return `Sus ${clientes} pasarán a «${primeraRestante ?? 'la primera etapa'}».`
  if (clase === 'tipos') return `${clientes} quedarán sin tipo.`
  return `Se quitará de ${clientes} y de los chats que la tengan.`
}

function EditorItem({
  clase,
  item,
  alTerminar,
  alGuardar,
}: {
  clase: ClaseAjuste
  item?: Item
  alTerminar: () => void
  alGuardar: (filas: unknown[]) => void
}) {
  const [datos, setDatos] = useState<DatosAjuste>({
    nombre: item?.nombre ?? '',
    color: item?.color ?? COLORES[1],
    resultado: item?.resultado ?? 'abierta',
  })

  const guardar = useMutation({
    mutationFn: () => guardarAjusteCrm(clase, clase === 'etapas' ? datos : { nombre: datos.nombre, color: datos.color }, item?.id),
    onSuccess: (filas) => {
      alGuardar(filas)
      alTerminar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={datos.nombre}
          onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          placeholder="Nombre"
          maxLength={60}
          required
          autoFocus
          className="h-9"
        />
        {clase === 'etapas' ? (
          <select
            aria-label="Qué significa esta etapa"
            className={cn(CLASE_SELECT, 'h-9 sm:w-44')}
            value={datos.resultado}
            onChange={(e) => setDatos({ ...datos, resultado: e.target.value as ResultadoEtapa })}
          >
            {RESULTADOS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.texto}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <SelectorColor valor={datos.color} alCambiar={(color) => setDatos({ ...datos, color })} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={guardar.isPending}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Guardar
        </Button>
      </div>
    </form>
  )
}
