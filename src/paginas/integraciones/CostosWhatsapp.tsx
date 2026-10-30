import { useQuery } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { leerCostosWhatsapp } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { InterruptorModoAhorro } from '@/components/InterruptorModoAhorro'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function CostosWhatsapp() {
  const consulta = useQuery({
    queryKey: ['costos-whatsapp'],
    queryFn: leerCostosWhatsapp,
    staleTime: 0,
    refetchInterval: 60_000,
  })

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Costos de WhatsApp"
        descripcion="Solo el reporte oficial de Meta. Belly no suma chats locales: si los borrás, el cupo no cambia."
      />

      <InterruptorModoAhorro />

      {consulta.isPending ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : consulta.isError ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-destructive">{consulta.error.message}</p>
          <Link to="/integraciones/whatsapp" className={cn(buttonVariants({ variant: 'outline' }), 'mt-3')}>
            Ir a conectar WhatsApp
          </Link>
        </div>
      ) : consulta.data ? (
        <Detalle data={consulta.data} />
      ) : null}
    </div>
  )
}

function Detalle({ data }: { data: Awaited<ReturnType<typeof leerCostosWhatsapp>> }) {
  const usado = data.usados_gratis
  const cupo = data.cupo
  const porcentaje = cupo > 0 ? Math.min(100, Math.round((usado / cupo) * 100)) : 0
  const acabandose = data.restantes <= 150
  const [anio, mes] = data.mes.split('-').map(Number)
  const tituloMes = `${MESES[(mes || 1) - 1] ?? data.mes} ${anio}`
  const maxDia = Math.max(1, ...data.dias.map((d) => d.gratis + d.cobrados))

  return (
    <div className="space-y-5">
      {data.aviso ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {data.aviso}
        </p>
      ) : null}

      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{data.numero || 'Tu número'} · {tituloMes}</p>
            <h2 className="text-lg font-semibold">Cupo de mensajes de servicio</h2>
          </div>
          <p className={cn('text-sm font-medium', acabandose ? 'text-amber-700' : 'text-muted-foreground')}>
            {data.restantes} de {cupo} gratis
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full', porcentaje >= 100 ? 'bg-rose-500' : acabandose ? 'bg-amber-500' : 'bg-emerald-500')}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Usaste {usado}. Del 1.001 en adelante Meta cobra unos US$ 0,03 por mensaje entregado. El 1 de cada mes vuelve a 1.000.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{etiquetaFuente(data)}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Cuadro titulo="Dentro del cupo" valor={String(usado)} detalle="Sin cargo este mes" />
        <Cuadro titulo="Ya cobrados" valor={String(data.cobrados)} detalle="Después de los 1.000" />
        <Cuadro titulo="Estimado Meta" valor={dinero(data.costo_usd)} detalle="Solo lo que salió por la API" />
      </div>

      {data.dias.length ? (
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold">Este mes, día a día</h3>
          <div className="mt-4 flex h-36 items-end gap-1">
            {data.dias.map((dia) => {
              const total = dia.gratis + dia.cobrados
              const alto = `${Math.max(4, Math.round((total / maxDia) * 100))}%`
              return (
                <div key={dia.fecha} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${dia.fecha}: ${total} mensajes`}>
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      className={cn('w-full max-w-3 rounded-sm', dia.cobrados > 0 ? 'bg-rose-400' : 'bg-emerald-400')}
                      style={{ height: alto }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{Number(dia.fecha.slice(8))}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Verde: cupo gratis. Rojo: ya cobrado.</p>
        </section>
      ) : null}

      {data.categorias.length ? (
        <section className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 text-right font-medium">Mensajes</th>
                <th className="px-4 py-2 text-right font-medium">Costo</th>
              </tr>
            </thead>
            <tbody>
              {data.categorias.map((fila) => (
                <tr key={`${fila.categoria}-${fila.tipo}`} className="border-t">
                  <td className="px-4 py-2">{fila.categoria}</td>
                  <td className="px-4 py-2 text-muted-foreground">{fila.tipo}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fila.volumen}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{dinero(fila.costo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Meta tarda en publicar (a veces horas). No hay forma oficial de ver el cupo al segundo.
        Borrar chats en Belly no reinicia los 1.000: eso lo lleva WhatsApp.
      </p>
    </div>
  )
}

function Cuadro({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="text-xs text-muted-foreground">{detalle}</p>
    </article>
  )
}

function dinero(usd: number): string {
  if (usd <= 0) return 'US$ 0'
  return `US$ ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function etiquetaFuente(data: { fuente: string; actualizado_at?: string | null }): string {
  const cuando = data.actualizado_at
    ? new Date(data.actualizado_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : ''
  return cuando ? `Reporte oficial de Meta · consultado ${cuando}` : 'Reporte oficial de Meta'
}
