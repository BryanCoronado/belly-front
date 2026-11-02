import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { leerCupoEmpresa } from '@/api'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

const CLAVE = ['empresa-cupo'] as const

export function LimitesPlan({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const admin = esAdministrador(leerSesion()?.usuario)
  const consulta = useQuery({
    queryKey: CLAVE,
    queryFn: leerCupoEmpresa,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  const datos = consulta.data
  if (!datos) {
    return null
  }

  const { plan, uso } = datos

  return (
    <div
      className={cn(
        compacto
          ? 'flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-[11px] leading-tight text-[var(--wa-muted)]'
          : 'flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground sm:px-6',
        className,
      )}
    >
      <span className={cn('font-medium', compacto ? 'text-[var(--wa-texto)]' : 'text-foreground')}>Plan {plan.nombre}</span>
      <Item usado={uso.conversaciones} tope={plan.max_conversaciones} texto={compacto ? 'chats' : 'chats este mes'} />
      <Item usado={uso.personas} tope={plan.max_personas} texto="personas" />
      {compacto ? null : <Item usado={uso.equipos} tope={plan.max_equipos} texto="equipos" />}
      <Item usado={uso.flujos} tope={plan.max_flujos} texto="flujos" />
      {!compacto && plan.max_envios > 0 ? <Item usado={uso.envios} tope={plan.max_envios} texto="envíos" /> : null}
      {admin && !compacto ? (
        <Link to="/cuenta" className="ml-auto font-medium text-foreground underline-offset-2 hover:underline">
          Ver plan
        </Link>
      ) : null}
    </div>
  )
}

function Item({ usado, tope, texto }: { usado: number; tope: number; texto: string }) {
  const lleno = tope > 0 && usado >= tope
  const cerca = tope > 0 && usado / tope >= 0.8
  return (
    <span className={cn(lleno ? 'font-medium text-rose-700' : cerca ? 'text-amber-800' : undefined)}>
      {usado} / {tope > 0 ? tope : '∞'} {texto}
    </span>
  )
}
