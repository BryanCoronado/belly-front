import { useQuery } from '@tanstack/react-query'
import { ChevronRight, CircleCheck, Mail, Receipt, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { leerCostosWhatsapp, leerEstadoWhatsapp } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { IconoTelegram } from '@/components/IconoTelegram'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

const PROXIMAS = [
  { titulo: 'Telegram', texto: 'Otro canal para atender clientes', icono: IconoTelegram },
  { titulo: 'Ventas', texto: 'Cotizaciones y pedidos desde el chat', icono: Store },
  { titulo: 'Correo', texto: 'Bandeja junto a las conversaciones', icono: Mail },
]

export function Integraciones() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const { conectado, cargando } = useWhatsappConectado()
  const estado = useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn: leerEstadoWhatsapp,
    enabled: admin,
    staleTime: 60_000,
  })
  const costos = useQuery({
    queryKey: ['costos-whatsapp'],
    queryFn: leerCostosWhatsapp,
    enabled: conectado,
    staleTime: 60_000,
  })

  const numero = estado.data?.numeros[0]
  const etiquetaNumero = numero?.telefono || costos.data?.numero || numero?.nombre || ''

  return (
    <div className="space-y-8">
      <CabeceraPagina titulo="Integraciones" descripcion="WhatsApp de tu empresa y lo que se sume después." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          to="/integraciones/whatsapp"
          className="group flex flex-col justify-between gap-6 rounded-xl border bg-white p-5 transition-colors hover:border-zinc-400 sm:p-6 lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-14 items-center justify-center rounded-xl border bg-white">
              <IconoWhatsapp className="size-8" />
            </span>
            {cargando ? (
              <Skeleton className="h-5 w-24" />
            ) : conectado ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <CircleCheck />
                Conectado
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">Sin conectar</Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold">WhatsApp Business</p>
            {etiquetaNumero ? (
              <p className="text-sm tabular-nums text-foreground">{etiquetaNumero}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {conectado
                ? 'Mensajes y chat de tus clientes.'
                : 'Conectalo para atender chats desde Belly.'}
            </p>
          </div>

          <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
            {conectado ? 'Configurar' : 'Conectar'}
            <ChevronRight className="size-4" />
          </span>
        </Link>

        <Link
          to="/integraciones/costos"
          className="flex flex-col justify-between gap-5 rounded-xl border bg-white p-5 transition-colors hover:border-zinc-400 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg border bg-white text-zinc-700">
              <Receipt className="size-5" />
            </span>
            <Badge className="bg-zinc-100 text-zinc-600">{conectado ? 'Este mes' : 'WhatsApp'}</Badge>
          </div>

          <div className="space-y-1">
            <p className="font-semibold">Costos WhatsApp</p>
            <p className="text-sm text-muted-foreground">
              {conectado
                ? 'Cupo de 1.000 y lo que Meta cobra.'
                : 'Se ve cuando WhatsApp ya está conectado.'}
            </p>
          </div>

          {costos.data ? (
            <Cupo usados={costos.data.usados_gratis} cupo={costos.data.cupo} restantes={costos.data.restantes} />
          ) : (
            <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
              Ver costos
              <ChevronRight className="size-4" />
            </span>
          )}
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Más adelante</h2>
        <ul className="overflow-hidden rounded-xl border bg-white">
          {PROXIMAS.map((item) => (
            <li
              key={item.titulo}
              className="flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0 sm:px-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-white text-zinc-500">
                <item.icono className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">{item.texto}</p>
              </div>
              <span className="text-xs text-muted-foreground">Próximamente</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Cupo({ usados, cupo, restantes }: { usados: number; cupo: number; restantes: number }) {
  const porcentaje = cupo > 0 ? Math.min(100, Math.round((usados / cupo) * 100)) : 0
  const apretado = restantes <= 150

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="tabular-nums font-medium">
          {usados} / {cupo}
        </span>
        <span className={cn('text-xs', apretado ? 'text-amber-700' : 'text-muted-foreground')}>
          {restantes} gratis
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn('h-full rounded-full', porcentaje >= 100 ? 'bg-rose-500' : apretado ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
