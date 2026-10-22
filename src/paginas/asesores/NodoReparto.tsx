import { useEffect } from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReparto } from './contextoReparto'
import { COLOR_CAMINO, type NodoRepartoRF } from './conversionReparto'
import { META, PASOS_FINALES, resumenPaso, salidasDe } from './tiposReparto'

const ESTILO_PUNTO = { width: 14, height: 14, border: '3px solid var(--card)' } as const

export function NodoReparto({ id, data, selected }: NodeProps<NodoRepartoRF>) {
  const { catalogo, resaltado } = useReparto()
  const meta = META[data.tipo]
  const Icono = meta.icono
  const salidas = salidasDe(data.tipo, data.datos, catalogo)
  const actualizarPuntos = useUpdateNodeInternals()
  const firma = salidas.map((s) => s.id).join('|')
  const tieneProblemas = (data.problemas?.length ?? 0) > 0
  const enCamino = resaltado?.nodos.has(id) ?? false
  const apagado = resaltado !== null && !enCamino
  const entrega = PASOS_FINALES.includes(data.tipo)

  useEffect(() => {
    actualizarPuntos(id)
  }, [id, firma, actualizarPuntos])

  return (
    <div
      className={cn(
        'w-72 rounded-xl bg-white shadow-md ring-1 ring-black/10 transition-all dark:bg-zinc-900',
        selected && 'shadow-xl ring-2',
        tieneProblemas && 'ring-2 ring-rose-400',
        enCamino && 'ring-[3px] ring-emerald-500',
        apagado && 'opacity-45',
      )}
      style={selected && !tieneProblemas && !enCamino ? { boxShadow: `0 0 0 2px ${meta.color}, 0 10px 24px -8px ${meta.color}66` } : undefined}
    >
      {data.tipo !== 'inicio' ? <Handle type="target" position={Position.Left} style={{ ...ESTILO_PUNTO, background: '#94a3b8' }} /> : null}

      <div className={cn('flex items-center gap-2 rounded-t-xl px-3 py-2 text-sm font-semibold', meta.cabecera)}>
        <Icono className="size-4" />
        <span className="flex-1 truncate">{meta.titulo}</span>
        {tieneProblemas ? <TriangleAlert className="size-4" /> : null}
        {enCamino ? <CircleCheck className="size-4" /> : null}
      </div>

      <p className="line-clamp-3 min-h-10 px-3 py-2.5 text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
        {resumenPaso(data.tipo, data.datos, catalogo)}
      </p>

      {entrega ? (
        <p className="-mt-1 px-3 pb-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          {data.tipo === 'agente_ia' ? 'Atiende el chat' : 'Asigna el chat aquí'}
        </p>
      ) : null}

      <div className="border-t pb-1">
        {salidas.map((salida) => {
          const tomada = resaltado?.pasos.has(`${id}:${salida.id}`) ?? false
          return (
            <div key={salida.id} className="relative flex items-center px-3 py-1.5 pr-5 text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <span
                className={cn('mr-2 size-2 shrink-0 rounded-full', salida.secundaria && !tomada && 'opacity-40')}
                style={{ background: tomada ? COLOR_CAMINO : meta.color }}
              />
              <span className={cn('truncate', salida.secundaria && 'font-normal text-zinc-500 italic', tomada && 'font-semibold text-emerald-700 not-italic')}>
                {salida.etiqueta}
              </span>
              <Handle
                id={salida.id}
                type="source"
                position={Position.Right}
                style={{ ...ESTILO_PUNTO, background: tomada ? COLOR_CAMINO : meta.color, opacity: salida.secundaria && !tomada ? 0.6 : 1 }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
