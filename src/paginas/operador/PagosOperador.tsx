import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { listarEmpresasOperador, listarPagosOperador, marcarPago, registrarPago, type PagoBelly } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { avisoError, avisoExito } from '@/lib/avisos'

const CLAVE = ['operador-pagos']

export function PagosOperador() {
  const cliente = useQueryClient()
  const pagos = useQuery({ queryKey: CLAVE, queryFn: listarPagosOperador })
  const empresas = useQuery({ queryKey: ['operador-empresas'], queryFn: listarEmpresasOperador })
  const [nuevo, setNuevo] = useState(false)
  const [cargo, setCargo] = useState({ id_empresa: 0, monto: 0, periodo: mesActual(), nota: '' })

  const marcar = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: PagoBelly['estado'] }) => marcarPago(id, { estado }),
    onSuccess: () => {
      avisoExito('Pago actualizado')
      void cliente.invalidateQueries({ queryKey: CLAVE })
    },
    onError: (error) => avisoError(error, 'No se pudo actualizar'),
  })

  const crear = useMutation({
    mutationFn: () => registrarPago(cargo),
    onSuccess: () => {
      avisoExito('Cargo creado')
      setNuevo(false)
      void cliente.invalidateQueries({ queryKey: CLAVE })
    },
    onError: (error) => avisoError(error, 'No se pudo crear'),
  })

  const filas = pagos.data ?? []
  const pendientes = useMemo(() => filas.filter((fila) => fila.estado === 'pendiente').length, [filas])
  const cobrado = useMemo(
    () => filas.filter((fila) => fila.estado === 'pagado').reduce((suma, fila) => suma + fila.monto, 0),
    [filas],
  )

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Pagos"
        descripcion="Solo lo que te pagan a ti (el plan de Belly). Los mensajes de WhatsApp los paga cada empresa directo a Meta."
        acciones={<Button onClick={() => setNuevo(true)}>Registrar cargo</Button>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Cuadro titulo="Pendientes" valor={pendientes} />
        <Cuadro titulo="Cobrados" valor={cobrado} />
        <Cuadro titulo="Movimientos" valor={filas.length} />
      </div>

      <TablaResponsiva
        filas={filas}
        cargando={pagos.isPending}
        clave={(fila) => String(fila.id)}
        vacio={{
          icono: Receipt,
          titulo: 'Sin pagos',
          texto: 'Cuando asignes un plan de pago, el cargo del mes aparece aquí.',
        }}
        columnas={[
          { titulo: 'Empresa', principal: true, celda: (fila) => fila.empresa || '—' },
          { titulo: 'Periodo', celda: (fila) => fila.periodo },
          { titulo: 'Monto', celda: (fila) => soles(fila.monto) },
          {
            titulo: 'Estado',
            celda: (fila) => <Badge variant={fila.estado === 'pagado' ? 'secondary' : 'outline'}>{fila.estado}</Badge>,
          },
          { titulo: 'Pagó', celda: (fila) => fila.pagado_at ? fechaCorta(fila.pagado_at) : '—' },
          { titulo: 'Ref.', celda: (fila) => fila.referencia || fila.metodo || '—' },
        ]}
        acciones={(fila) =>
          fila.estado === 'pendiente' ? (
            <Button size="sm" disabled={marcar.isPending} onClick={() => marcar.mutate({ id: fila.id, estado: 'pagado' })}>
              Marcar pagado
            </Button>
          ) : fila.estado === 'pagado' ? (
            <Button size="sm" variant="outline" disabled={marcar.isPending} onClick={() => marcar.mutate({ id: fila.id, estado: 'pendiente' })}>
              Volver a pendiente
            </Button>
          ) : null
        }
      />

      <Dialog open={nuevo} onOpenChange={setNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cargo</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(evento) => {
              evento.preventDefault()
              crear.mutate()
            }}
          >
            <label className="grid gap-2 text-sm">
              Empresa
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={cargo.id_empresa}
                onChange={(e) => setCargo({ ...cargo, id_empresa: Number(e.target.value) })}
                required
              >
                <option value={0}>Elige</option>
                {(empresas.data ?? []).filter((e) => !e.propia).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
            <Campo etiqueta="Periodo" value={cargo.periodo} onChange={(e) => setCargo({ ...cargo, periodo: e.target.value })} placeholder="2026-11" />
            <Campo etiqueta="Monto" type="number" min={1} step="0.01" value={cargo.monto} onChange={(e) => setCargo({ ...cargo, monto: Number(e.target.value) })} />
            <Campo etiqueta="Nota" value={cargo.nota} onChange={(e) => setCargo({ ...cargo, nota: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNuevo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending || !cargo.id_empresa}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Cuadro({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="superficie px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{titulo}</p>
      <p className="mt-1 font-heading text-2xl font-bold tracking-[-0.04em]">{valor}</p>
    </div>
  )
}

function soles(valor: number) {
  return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: valor % 1 ? 2 : 0 })}`
}

function mesActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

function fechaCorta(valor: string) {
  const fecha = new Date(valor.includes('T') ? valor : valor.replace(' ', 'T'))
  if (Number.isNaN(fecha.getTime())) {
    return valor
  }
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}
