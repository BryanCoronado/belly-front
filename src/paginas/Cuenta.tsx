import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowUpRight, CheckCircle2, Receipt } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link, Navigate } from 'react-router-dom'
import { leerCostosWhatsapp, leerCuentaEmpresa, type PlanBelly, type UsoPlan } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

export function Cuenta() {
  if (!esAdministrador(leerSesion()?.usuario)) {
    return <Navigate to="/inicio" replace />
  }

  return <PanelCuenta />
}

function PanelCuenta() {
  const reducir = useReducedMotion()
  const consulta = useQuery({ queryKey: ['cuenta-empresa'], queryFn: leerCuentaEmpresa })
  const meta = useQuery({
    queryKey: ['costos-whatsapp'],
    queryFn: leerCostosWhatsapp,
    retry: false,
  })
  const plan = consulta.data?.plan
  const uso = consulta.data?.uso
  const pagos = consulta.data?.pagos ?? []

  return (
    <div className="space-y-6">
      <CabeceraPagina titulo="Membresía" descripcion="Cupos del plan Belly y costos de WhatsApp." />

      {consulta.isPending || !plan ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-40 rounded-2xl lg:col-span-8" />
          <Skeleton className="h-40 rounded-2xl lg:col-span-4" />
          <Skeleton className="h-36 rounded-2xl lg:col-span-12" />
        </div>
      ) : (
        <motion.div
          className="grid gap-4 lg:grid-cols-12"
          initial={reducir ? false : 'oculto'}
          animate="visible"
          variants={{
            oculto: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          <motion.article
            className="superficie flex flex-col justify-between gap-6 p-5 sm:p-6 lg:col-span-8"
            variants={tarjeta}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Plan Belly</p>
                <h2 className="font-heading text-3xl font-bold tracking-[-0.04em]">{plan.nombre}</h2>
                <p className="text-sm text-muted-foreground">
                  {plan.precio_mensual > 0 ? `S/ ${plan.precio_mensual} / mes` : 'Sin costo este mes'}
                </p>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 />
                Activo
              </Badge>
            </div>

            {uso ? (
              <p className="text-sm text-muted-foreground">
                {resumenUso(plan, uso)}
              </p>
            ) : null}
          </motion.article>

          <motion.article
            className="superficie flex flex-col justify-between gap-4 p-5 sm:p-6 lg:col-span-4"
            variants={tarjeta}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/12">
                <IconoWhatsapp className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">Lo cobra Meta</p>
              </div>
            </div>

            <div>
              <p className="font-heading text-2xl font-bold tracking-[-0.03em] tabular-nums">
                {meta.data ? `US$ ${meta.data.costo_usd.toFixed(2)}` : '—'}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {meta.data ? `${meta.data.restantes} gratis este mes` : 'Conecta el número para ver el gasto'}
              </p>
            </div>

            <Link to="/integraciones/costos" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
              Ver costos
              <ArrowUpRight className="size-3.5" />
            </Link>
          </motion.article>

          {uso ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:col-span-12">
              {[
                { etiqueta: 'Chats', usado: uso.conversaciones, tope: plan.max_conversaciones, hint: 'este mes' },
                { etiqueta: 'Personas', usado: uso.personas, tope: plan.max_personas, hint: 'en el equipo' },
                { etiqueta: 'Equipos', usado: uso.equipos, tope: plan.max_equipos, hint: 'activos' },
                { etiqueta: 'Flujos', usado: uso.flujos, tope: plan.max_flujos, hint: 'automáticos' },
              ].map((item, i) => (
                <CupoCard key={item.etiqueta} {...item} delay={i * 0.06} reducir={!!reducir} />
              ))}
            </div>
          ) : null}
        </motion.div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Historial</h2>
        <TablaResponsiva
          filas={pagos}
          cargando={consulta.isPending}
          clave={(fila) => String(fila.id)}
          vacio={{
            icono: Receipt,
            titulo: 'Sin cargos',
            texto: 'Las facturas del plan aparecen aquí.',
          }}
          columnas={[
            { titulo: 'Periodo', principal: true, celda: (fila) => fila.periodo },
            { titulo: 'Monto', celda: (fila) => `S/ ${fila.monto}` },
            {
              titulo: 'Estado',
              celda: (fila) => (
                <Badge variant={fila.estado === 'pagado' ? 'secondary' : 'outline'}>{etiqueta(fila.estado)}</Badge>
              ),
            },
            { titulo: 'Pagado', celda: (fila) => (fila.pagado_at ? fechaCorta(fila.pagado_at) : '—') },
          ]}
        />
      </section>
    </div>
  )
}

const EASE = [0.22, 1, 0.36, 1] as const

const tarjeta = {
  oculto: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE },
  },
}

function CupoCard({
  etiqueta,
  usado,
  tope,
  hint,
  delay,
  reducir,
}: {
  etiqueta: string
  usado: number
  tope: number
  hint: string
  delay: number
  reducir: boolean
}) {
  const pct = tope > 0 ? Math.min(100, Math.round((usado / tope) * 100)) : 0
  const estado = estadoCupo(usado, tope)

  return (
    <motion.article
      className={cn(
        'superficie relative overflow-hidden p-4 sm:p-5',
        estado === 'excedido' && 'ring-1 ring-rose-200',
        estado === 'lleno' && 'ring-1 ring-amber-200',
        estado === 'cerca' && 'ring-1 ring-amber-200',
      )}
      initial={reducir ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: EASE }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{etiqueta}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <EstadoPill estado={estado} />
      </div>

      <p className="mt-4 font-heading text-3xl font-bold tracking-[-0.04em] tabular-nums">
        {usado}
        <span className="ml-1 text-base font-medium text-muted-foreground">/ {tope > 0 ? tope : '∞'}</span>
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            'h-full rounded-full',
            estado === 'excedido' ? 'bg-rose-500' : estado === 'lleno' || estado === 'cerca' ? 'bg-amber-500' : 'bg-emerald-500',
          )}
          initial={reducir ? { width: `${pct}%` } : { width: 0 }}
          animate={{ width: `${tope > 0 ? pct : 6}%` }}
          transition={{ delay: delay + 0.15, duration: 0.7, ease: EASE }}
        />
      </div>

      {estado === 'excedido' ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-700">
          <AlertTriangle className="size-3.5" />
          Pasaste el límite
        </p>
      ) : estado === 'lleno' ? (
        <p className="mt-2 text-xs font-medium text-amber-800">Cupo completo · no puedes agregar más</p>
      ) : estado === 'cerca' ? (
        <p className="mt-2 text-xs font-medium text-amber-800">Queda poco cupo</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{tope > 0 ? `${Math.max(0, tope - usado)} disponibles` : 'Sin tope'}</p>
      )}
    </motion.article>
  )
}

function EstadoPill({ estado }: { estado: 'ok' | 'cerca' | 'lleno' | 'excedido' }) {
  if (estado === 'excedido') {
    return <Badge className="border-rose-200 bg-rose-50 text-rose-700">Pasado</Badge>
  }
  if (estado === 'lleno') {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-800">Completo</Badge>
  }
  if (estado === 'cerca') {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-800">Casi</Badge>
  }
  return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">OK</Badge>
}

function estadoCupo(usado: number, tope: number): 'ok' | 'cerca' | 'lleno' | 'excedido' {
  if (tope <= 0) return 'ok'
  if (usado > tope) return 'excedido'
  if (usado === tope) return 'lleno'
  if (usado / tope >= 0.8) return 'cerca'
  return 'ok'
}

function resumenUso(plan: PlanBelly, uso: UsoPlan) {
  const items = [
    { usado: uso.conversaciones, tope: plan.max_conversaciones },
    { usado: uso.personas, tope: plan.max_personas },
    { usado: uso.equipos, tope: plan.max_equipos },
    { usado: uso.flujos, tope: plan.max_flujos },
  ]
  const pasados = items.filter((i) => i.tope > 0 && i.usado > i.tope).length
  const completos = items.filter((i) => i.tope > 0 && i.usado === i.tope).length

  if (pasados > 0) return `${pasados} cupo${pasados > 1 ? 's' : ''} por encima del plan.`
  if (completos > 0) return `${completos} cupo${completos > 1 ? 's' : ''} completo${completos > 1 ? 's' : ''}. No puedes agregar más.`
  return 'Tus cupos del plan. Verde = bien, ámbar = casi o completo.'
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
