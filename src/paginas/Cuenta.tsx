import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { leerCostosWhatsapp, leerCuentaEmpresa } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

export function Cuenta() {
  if (!esAdministrador(leerSesion()?.usuario)) {
    return <Navigate to="/inicio" replace />
  }

  return <PanelCuenta />
}

function PanelCuenta() {
  const consulta = useQuery({ queryKey: ['cuenta-empresa'], queryFn: leerCuentaEmpresa })
  const meta = useQuery({
    queryKey: ['costos-whatsapp'],
    queryFn: leerCostosWhatsapp,
    retry: false,
  })
  const plan = consulta.data?.plan
  const pagos = consulta.data?.pagos ?? []

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Plan y pagos"
        descripcion="Son dos cuentas distintas. Belly es el CRM. Meta es WhatsApp. No se mezclan."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <article className="superficie p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">1 · Lo pagas a Belly</p>
          <p className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em]">{plan?.nombre ?? '—'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan?.precio_mensual ? `S/ ${plan.precio_mensual} al mes` : 'Este mes no tiene costo'}
            {plan?.descripcion ? ` · ${plan.descripcion}` : ''}
          </p>
          <ul className="mt-3 grid gap-1 text-sm text-foreground/80">
            {(plan?.incluye ?? ['Mi Catálogo: tienda web, banners, carrito y QR', 'WhatsApp en una sola bandeja', 'Equipo, chats y clientes', 'Flujos automáticos']).map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Esto se paga a Belly. No incluye los mensajes de WhatsApp: esos los cobra Meta.
          </p>
        </article>

        <article className="superficie p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">2 · Lo pagas a Meta</p>
          <p className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em]">
            {meta.data ? `US$ ${meta.data.costo_usd.toFixed(2)}` : 'WhatsApp'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.data
              ? `${meta.data.cobrados} mensajes cobrados este mes · ${meta.data.restantes} gratis aún`
              : 'Cuando conectes el número, aquí sale el gasto del mes.'}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Esto lo cobra Meta a tu cuenta de Facebook, no Belly. 1.000 mensajes de servicio gratis por número; el resto en Perú va unos US$ 0,03.
          </p>
          <Link to="/integraciones/costos" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
            Ver costos de WhatsApp
          </Link>
        </article>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Historial con Belly</h2>
        <TablaResponsiva
          filas={pagos}
          cargando={consulta.isPending}
          clave={(fila) => String(fila.id)}
          vacio={{
            icono: Receipt,
            titulo: 'Sin cargos de Belly',
            texto: 'Acá solo aparece lo del plan. Lo de Meta lo ves en Costos de WhatsApp.',
          }}
          columnas={[
            { titulo: 'Periodo', principal: true, celda: (fila) => fila.periodo },
            { titulo: 'Monto', celda: (fila) => `S/ ${fila.monto}` },
            {
              titulo: 'Estado',
              celda: (fila) => <Badge variant={fila.estado === 'pagado' ? 'secondary' : 'outline'}>{etiqueta(fila.estado)}</Badge>,
            },
            { titulo: 'Pagado', celda: (fila) => (fila.pagado_at ? fechaCorta(fila.pagado_at) : '—') },
            { titulo: 'Dato', celda: (fila) => fila.referencia || fila.metodo || '—' },
          ]}
        />
      </section>
    </div>
  )
}

function etiqueta(estado: string) {
  if (estado === 'pagado') return 'Pagado'
  if (estado === 'vencido') return 'Vencido'
  if (estado === 'anulado') return 'Anulado'
  return 'Por pagar'
}

function fechaCorta(valor: string) {
  const fecha = new Date(valor.includes('T') ? valor : valor.replace(' ', 'T'))
  if (Number.isNaN(fecha.getTime())) {
    return valor
  }
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}
