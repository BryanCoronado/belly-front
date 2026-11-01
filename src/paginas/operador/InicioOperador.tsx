import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listarEmpresasOperador } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Skeleton } from '@/components/ui/skeleton'
import { nombreVisible, leerSesion } from '@/sesion'

const CLAVE = ['operador-empresas']

export function InicioOperador() {
  const nombre = leerSesion()?.usuario ? nombreVisible(leerSesion()!.usuario) : ''
  const consulta = useQuery({ queryKey: CLAVE, queryFn: listarEmpresasOperador })
  const filas = consulta.data ?? []
  const clientes = filas.filter((fila) => !fila.propia)
  const activas = clientes.filter((fila) => fila.estado === 1).length
  const mensual = clientes.reduce((suma, fila) => suma + (fila.plan_precio || 0), 0)
  const recientes = clientes.slice(0, 6)

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo={`Hola, ${nombre}`}
        descripcion="Te pagan el plan. WhatsApp lo pagan ellas a Meta. Aquí no está el CRM."
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Cuadro titulo="Empresas" valor={consulta.isPending ? null : clientes.length} />
        <Cuadro titulo="Activas" valor={consulta.isPending ? null : activas} />
        <Cuadro titulo="Soles / mes" valor={consulta.isPending ? null : mensual} />
      </div>

      <section className="superficie overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-sm font-semibold">Últimas cuentas</h2>
          <Link to="/operador/empresas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            Ver todas
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {consulta.isPending ? (
          <div className="space-y-3 px-4 pb-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : recientes.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted-foreground">Cuando alguien se registre, aparece aquí.</p>
        ) : (
          <ul className="divide-y">
            {recientes.map((fila) => (
              <li key={fila.id} className="flex items-center gap-3 px-4 py-3">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fila.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{fila.admin_correo || fila.admin_nombre || '—'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{fila.plan_nombre || fila.plan}</span>
                <span className="text-xs text-muted-foreground">{fila.estado === 1 ? 'Activa' : 'Pausada'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Cuadro({ titulo, valor }: { titulo: string; valor: number | null }) {
  return (
    <div className="superficie px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{titulo}</p>
      {valor === null ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1 font-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{valor}</p>
      )}
    </div>
  )
}
