import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bot, ChevronDown, MousePointerClick } from 'lucide-react'
import { leerResumenBot } from '@/api'
import { cn } from '@/lib/utils'

const nombreDelDato = (clave: string) => {
  const texto = clave.replaceAll('_', ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Lo que el asistente automático ya recogió: opciones que eligió el cliente y datos que respondió.
 * Así el asesor sabe de qué se trata sin leer toda la conversación.
 */
export function ResumenBot({ idConversacion, totalMensajes }: { idConversacion: number; totalMensajes: number }) {
  const [abierto, setAbierto] = useState<boolean | null>(null)
  const resumen = useQuery({
    queryKey: ['bot-resumen', idConversacion, totalMensajes],
    queryFn: () => leerResumenBot(idConversacion),
    staleTime: 15_000,
    retry: false,
  })

  const datos = resumen.data
  if (!datos || (datos.ruta.length === 0 && datos.datos.length === 0)) {
    return null
  }

  // Si el bot ya pasó el chat a una persona se muestra desplegado; si no, el asesor decide.
  const desplegado = abierto ?? datos.estado === 'derivada'

  return (
    <div className="border-b border-[var(--wa-borde)] bg-emerald-50/80 text-sm dark:bg-emerald-950/30">
      <button
        type="button"
        onClick={() => setAbierto(!desplegado)}
        aria-expanded={desplegado}
        className="flex w-full items-center gap-2 px-4 py-2 text-left"
      >
        <Bot className="size-4 shrink-0 text-emerald-600" />
        <span className="min-w-0 flex-1 truncate font-medium text-emerald-800">
          Resumen del asistente <span className="font-normal text-emerald-700/80">· {datos.flujo}</span>
        </span>
        <ChevronDown className={cn('size-4 text-emerald-700 transition-transform', desplegado && 'rotate-180')} />
      </button>

      {desplegado ? (
        <div className="space-y-2.5 px-4 pb-3">
          {datos.ruta.length ? (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                <MousePointerClick className="size-3.5" />
                Lo que fue eligiendo
              </p>
              <ol className="flex flex-wrap items-center gap-1.5">
                {datos.ruta.map((paso, i) => (
                  <li key={`${paso}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 ? <span className="text-emerald-600">›</span> : null}
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium shadow-xs">{paso}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {datos.datos.length ? (
            <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {datos.datos.map((d) => (
                <div key={d.clave} className="min-w-0">
                  <dt className="text-[11px] text-emerald-800/80">{nombreDelDato(d.clave)}</dt>
                  <dd className="truncate text-sm font-medium" title={d.valor}>
                    {d.valor}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
