import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Search, Smartphone } from 'lucide-react'
import { asignarPlanEmpresa, cambiarEstadoEmpresa, listarEmpresasOperador, listarPlanes } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { avisoError, avisoExito } from '@/lib/avisos'

const CLAVE = ['operador-empresas']

export function EmpresasOperador() {
  const cliente = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const consulta = useQuery({ queryKey: CLAVE, queryFn: listarEmpresasOperador })
  const planes = useQuery({ queryKey: ['operador-planes'], queryFn: listarPlanes })
  const estado = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) => cambiarEstadoEmpresa(id, activa),
    onSuccess: (_datos, { activa }) => {
      avisoExito(activa ? 'Empresa activa' : 'Empresa pausada')
      void cliente.invalidateQueries({ queryKey: CLAVE })
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el estado'),
  })
  const plan = useMutation({
    mutationFn: ({ id, id_plan }: { id: number; id_plan: number }) => asignarPlanEmpresa(id, id_plan),
    onSuccess: () => {
      avisoExito('Plan asignado')
      void cliente.invalidateQueries({ queryKey: CLAVE })
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el plan'),
  })

  const filas = (consulta.data ?? []).filter((fila) => !fila.propia)
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) {
      return filas
    }
    return filas.filter((fila) =>
      [fila.nombre, fila.admin_nombre, fila.admin_correo].some((valor) => valor.toLowerCase().includes(q)),
    )
  }, [filas, busqueda])

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Empresas"
        descripcion="Cuentas, su plan y cuánto están usando. Puedes cambiarles el plan o pausarlas."
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar empresa o correo"
          className="pl-9"
        />
      </div>

      <TablaResponsiva
        filas={visibles}
        cargando={consulta.isPending}
        clave={(fila) => String(fila.id)}
        vacio={{
          icono: Building2,
          titulo: busqueda ? 'Nada coincide' : 'Aún no hay empresas',
          texto: busqueda ? 'Prueba con otro nombre o correo.' : 'Cuando alguien se registre, aparece aquí.',
        }}
        columnas={[
          {
            titulo: 'Empresa',
            principal: true,
            celda: (fila) => (
              <div className="min-w-0">
                <p className="truncate font-medium">{fila.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{fechaCorta(fila.creada)}</p>
              </div>
            ),
          },
          {
            titulo: 'Admin',
            celda: (fila) => (
              <div className="min-w-0">
                <p className="truncate">{fila.admin_nombre || '—'}</p>
                <p className="truncate text-xs text-muted-foreground">{fila.admin_correo || ''}</p>
              </div>
            ),
          },
          {
            titulo: 'Plan',
            celda: (fila) => (
              <select
                className="h-9 max-w-[10rem] rounded-md border bg-background px-2 text-sm"
                value={fila.id_plan || ''}
                disabled={plan.isPending}
                onChange={(evento) => plan.mutate({ id: fila.id, id_plan: Number(evento.target.value) })}
              >
                {(planes.data ?? []).filter((item) => item.activo || item.id === fila.id_plan).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {item.precio_mensual ? ` · S/${item.precio_mensual}` : ''}
                  </option>
                ))}
              </select>
            ),
          },
          {
            titulo: 'Uso del mes',
            celda: (fila) => (
              <span className="text-xs text-muted-foreground">
                {fila.uso?.conversaciones ?? 0}/{fila.limites?.conversaciones || '∞'} chats · {fila.uso?.personas ?? fila.personas}/{fila.limites?.personas || '∞'} pers.
              </span>
            ),
          },
          {
            titulo: 'WhatsApp',
            celda: (fila) =>
              fila.whatsapp ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Smartphone className="size-3.5" />
                  Conectado
                </span>
              ) : (
                <span className="text-muted-foreground">Sin número</span>
              ),
          },
          {
            titulo: 'Estado',
            celda: (fila) =>
              fila.estado === 1 ? <Badge variant="secondary">Activa</Badge> : <Badge variant="outline">Pausada</Badge>,
          },
        ]}
        acciones={(fila) => (
          <Button
            size="sm"
            variant={fila.estado === 1 ? 'outline' : 'default'}
            disabled={estado.isPending}
            onClick={() => estado.mutate({ id: fila.id, activa: fila.estado !== 1 })}
          >
            {fila.estado === 1 ? 'Pausar' : 'Activar'}
          </Button>
        )}
      />
    </div>
  )
}

function fechaCorta(valor: string | null) {
  if (!valor) {
    return '—'
  }
  const fecha = new Date(valor.includes('T') ? valor : valor.replace(' ', 'T'))
  if (Number.isNaN(fecha.getTime())) {
    return valor
  }
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}
