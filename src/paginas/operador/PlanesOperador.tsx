import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { eliminarPlan, guardarPlan, listarPlanes, type PlanBelly } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'

const CLAVE = ['operador-planes']
const VACIO: Partial<PlanBelly> = {
  nombre: '',
  clave: '',
  descripcion: '',
  precio_mensual: 0,
  moneda: 'PEN',
  max_conversaciones: 0,
  max_equipos: 0,
  max_personas_equipo: 0,
  max_personas: 0,
  max_flujos: 0,
  max_envios: 0,
  max_numeros: 1,
  incluye_agente_ia: false,
  activo: true,
}

export function PlanesOperador() {
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: CLAVE, queryFn: listarPlanes })
  const [edicion, setEdicion] = useState<Partial<PlanBelly> | null>(null)

  const guardar = useMutation({
    mutationFn: () => guardarPlan(edicion ?? {}, edicion?.id),
    onSuccess: () => {
      avisoExito(edicion?.id ? 'Plan actualizado' : 'Plan creado')
      setEdicion(null)
      void cliente.invalidateQueries({ queryKey: CLAVE })
      void cliente.invalidateQueries({ queryKey: ['operador-empresas'] })
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const borrar = useMutation({
    mutationFn: eliminarPlan,
    onSuccess: () => {
      avisoExito('Plan eliminado')
      void cliente.invalidateQueries({ queryKey: CLAVE })
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  const planes = consulta.data ?? []

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Planes"
        descripcion="Precios y cupos. 0 en un límite significa sin tope. Lo puedes cambiar cuando quieras."
        acciones={
          <Button onClick={() => setEdicion({ ...VACIO })}>
            <Plus />
            Nuevo plan
          </Button>
        }
      />

      {consulta.isPending ? (
        <p className="text-sm text-muted-foreground">Cargando planes…</p>
      ) : planes.length === 0 ? (
        <p className="superficie p-6 text-sm text-muted-foreground">Aún no hay planes. Crea el primero.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {planes.map((plan) => (
            <article key={plan.id} className="superficie flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-lg font-bold tracking-[-0.03em]">{plan.nombre}</p>
                  <p className="text-xs text-muted-foreground">{plan.descripcion || plan.clave}</p>
                </div>
                {plan.activo ? <Badge variant="secondary">Activo</Badge> : <Badge variant="outline">Oculto</Badge>}
              </div>
              <p className="font-heading text-2xl font-bold tracking-[-0.04em]">
                {precio(plan)}
                <span className="text-sm font-medium text-muted-foreground"> / mes</span>
              </p>
              <ul className="grid gap-1 text-sm text-muted-foreground">
                {(plan.incluye ?? ['Mi Catálogo: tienda web, banners, carrito y QR']).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>{tope(plan.max_conversaciones)} conversaciones / mes</li>
                <li>{tope(plan.max_equipos)} equipos · {tope(plan.max_personas_equipo)} pers. c/u</li>
                <li>{tope(plan.max_personas)} personas en total</li>
                <li>{tope(plan.max_flujos)} flujos · {tope(plan.max_envios)} envíos / mes</li>
                <li>{tope(plan.max_numeros)} números WhatsApp</li>
              </ul>
              <div className="mt-auto flex gap-2 pt-1">
                <Button size="sm" className="flex-1" variant="outline" onClick={() => setEdicion(plan)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" disabled={borrar.isPending} onClick={() => borrar.mutate(plan.id)}>
                  Borrar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={edicion !== null} onOpenChange={(abierto) => !abierto && setEdicion(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edicion?.id ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
          </DialogHeader>
          {edicion ? (
            <form
              className="grid gap-3"
              onSubmit={(evento) => {
                evento.preventDefault()
                guardar.mutate()
              }}
            >
              <Campo etiqueta="Nombre" value={edicion.nombre ?? ''} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value, clave: edicion.id ? edicion.clave : e.target.value })} required />
              <Campo etiqueta="Descripción" value={edicion.descripcion ?? ''} onChange={(e) => setEdicion({ ...edicion, descripcion: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Precio al mes" type="number" min={0} step="0.01" value={edicion.precio_mensual ?? 0} onChange={(e) => setEdicion({ ...edicion, precio_mensual: Number(e.target.value) })} />
                <Campo etiqueta="Moneda" value={edicion.moneda ?? 'PEN'} onChange={(e) => setEdicion({ ...edicion, moneda: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground">Límites: pon 0 si no hay tope.</p>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Conversaciones / mes" type="number" min={0} value={edicion.max_conversaciones ?? 0} onChange={(e) => setEdicion({ ...edicion, max_conversaciones: Number(e.target.value) })} />
                <Campo etiqueta="Equipos" type="number" min={0} value={edicion.max_equipos ?? 0} onChange={(e) => setEdicion({ ...edicion, max_equipos: Number(e.target.value) })} />
                <Campo etiqueta="Personas por equipo" type="number" min={0} value={edicion.max_personas_equipo ?? 0} onChange={(e) => setEdicion({ ...edicion, max_personas_equipo: Number(e.target.value) })} />
                <Campo etiqueta="Personas en total" type="number" min={0} value={edicion.max_personas ?? 0} onChange={(e) => setEdicion({ ...edicion, max_personas: Number(e.target.value) })} />
                <Campo etiqueta="Flujos" type="number" min={0} value={edicion.max_flujos ?? 0} onChange={(e) => setEdicion({ ...edicion, max_flujos: Number(e.target.value) })} />
                <Campo etiqueta="Envíos / mes" type="number" min={0} value={edicion.max_envios ?? 0} onChange={(e) => setEdicion({ ...edicion, max_envios: Number(e.target.value) })} />
                <Campo etiqueta="Números WhatsApp" type="number" min={0} value={edicion.max_numeros ?? 1} onChange={(e) => setEdicion({ ...edicion, max_numeros: Number(e.target.value) })} />
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                Incluye asistente IA
                <Switch checked={Boolean(edicion.incluye_agente_ia)} onCheckedChange={(v) => setEdicion({ ...edicion, incluye_agente_ia: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                Visible para asignar
                <Switch checked={edicion.activo !== false} onCheckedChange={(v) => setEdicion({ ...edicion, activo: v })} />
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEdicion(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardar.isPending}>
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function precio(plan: PlanBelly) {
  if (!plan.precio_mensual) {
    return 'Gratis'
  }
  return `S/ ${plan.precio_mensual.toLocaleString('es-PE', { minimumFractionDigits: plan.precio_mensual % 1 ? 2 : 0 })}`
}

function tope(valor: number) {
  return valor === 0 ? 'Ilimitado' : String(valor)
}
