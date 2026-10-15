import { useEffect } from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { Timer, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NodoRF } from './conversion'
import { META, resumenPaso, salidasDe } from './tipos'

const ESTILO_PUNTO = { width: 14, height: 14, border: '3px solid var(--card)' } as const

export function NodoVisual({ id, data, selected }: NodeProps<NodoRF>) {
  const meta = META[data.tipo]
  const Icono = meta.icono
  const salidas = salidasDe(data.tipo, data.datos)
  const conEtiquetas = salidas.length > 1
  const actualizarPuntos = useUpdateNodeInternals()
  const firma = salidas.map((s) => s.id).join('|')
  const tieneProblemas = (data.problemas?.length ?? 0) > 0
  const pausa = Math.max(0, Number(data.datos.pausa ?? 0)) || 0

  useEffect(() => {
    actualizarPuntos(id)
  }, [id, firma, actualizarPuntos])

  return (
    <div
      className={cn(
        'w-64 rounded-xl bg-white shadow-md ring-1 ring-black/10 transition-shadow',
        selected && 'shadow-xl ring-2',
        tieneProblemas && 'ring-2 ring-rose-400',
      )}
      style={selected && !tieneProblemas ? { boxShadow: `0 0 0 2px ${meta.color}, 0 10px 24px -8px ${meta.color}66` } : undefined}
    >
      {data.tipo !== 'inicio' ? (
        <Handle
          type="target"
          position={Position.Left}
          style={{ ...ESTILO_PUNTO, background: '#94a3b8' }}
        />
      ) : null}

      <div className={cn('relative flex items-center gap-2 rounded-t-xl px-3 py-2 text-sm font-semibold', meta.cabecera)}>
        <Icono className="size-4" />
        <span className="flex-1 truncate">{meta.titulo}</span>
        {tieneProblemas ? <TriangleAlert className="size-4 text-white" /> : null}
        {!conEtiquetas && salidas[0] ? (
          <Handle
            id={salidas[0].id}
            type="source"
            position={Position.Right}
            style={{ ...ESTILO_PUNTO, background: meta.color }}
          />
        ) : null}
      </div>

      <p className="line-clamp-3 min-h-10 px-3 py-2.5 text-[13px] leading-snug whitespace-pre-line text-zinc-600">
        {resumenPaso(data.tipo, data.datos)}
      </p>

      {pausa > 0 ? (
        <p className="-mt-1 flex items-center gap-1 px-3 pb-2 text-[11px] text-muted-foreground">
          <Timer className="size-3" />
          Envía tras {pausa} s
        </p>
      ) : null}

      {conEtiquetas ? (
        <div className="border-t pb-1">
          {salidas.map((salida) => (
            <div key={salida.id} className="relative flex items-center px-3 py-1.5 pr-4 text-xs font-medium text-zinc-700">
              <span
                className={cn('mr-2 size-2 shrink-0 rounded-full', (salida.id === 'otro' || salida.id === 'sin_respuesta') && 'opacity-40')}
                style={{ background: meta.color }}
              />
              <span className={cn('truncate', (salida.id === 'otro' || salida.id === 'sin_respuesta') && 'font-normal text-zinc-500 italic')}>{salida.etiqueta}</span>
              <Handle
                id={salida.id}
                type="source"
                position={Position.Right}
                style={{ ...ESTILO_PUNTO, background: meta.color, opacity: salida.id === 'otro' || salida.id === 'sin_respuesta' ? 0.5 : 1 }}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
