import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { leerEstadoIa, listarFlujos } from '@/api'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { CLAVE_IA } from '@/paginas/agente-ia/claves'
import { repartoGuardadoEnServidor } from '@/paginas/asesores/borradorReparto'

type Paso = { titulo: string; detalle: string; ruta: string; hecho: boolean; opcional?: boolean }

/** Lista de configuración inicial; se oculta sola cuando todo está hecho. */
export function PrimerosPasos({ className }: { className?: string }) {
  const { conectado } = useWhatsappConectado()
  const flujos = useQuery({ queryKey: ['flujos-resumen'], queryFn: listarFlujos, staleTime: 60_000 })
  const ia = useQuery({ queryKey: CLAVE_IA, queryFn: leerEstadoIa, staleTime: 60_000 })

  const pasos: Paso[] = [
    { titulo: 'Conectar WhatsApp', detalle: 'Tu número de empresa', ruta: '/integraciones/whatsapp', hecho: conectado },
    { titulo: 'Reparto de chats', detalle: 'Quién recibe cada chat nuevo', ruta: '/asesores?tab=reparto', hecho: repartoGuardadoEnServidor() },
    {
      titulo: 'Respuestas automáticas',
      detalle: 'Bienvenida y menús',
      ruta: '/automatizacion',
      hecho: (flujos.data?.length ?? 0) > 0,
      opcional: true,
    },
    {
      titulo: 'Asistente IA',
      detalle: 'Responde con OpenAI',
      ruta: '/agente-ia',
      hecho: Boolean(ia.data?.conexion.conectada && ia.data.agentes.some((a) => a.activo)),
      opcional: true,
    },
  ]

  const hechos = pasos.filter((p) => p.hecho).length
  if (hechos === pasos.length) return null

  return (
    <section className={cn('rounded-xl border bg-white', className)} data-tour="primeros-pasos">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-semibold">Primeros pasos</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {hechos} de {pasos.length}
        </span>
      </header>
      <ol className="divide-y">
        {pasos.map((paso) => (
          <li key={paso.ruta}>
            <Link to={paso.ruta} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full',
                  paso.hecho ? 'bg-emerald-600 text-white' : 'border border-zinc-300',
                )}
              >
                {paso.hecho ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-sm font-medium', paso.hecho && 'text-muted-foreground')}>{paso.titulo}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {paso.detalle}
                  {paso.opcional ? ' · opcional' : ''}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
