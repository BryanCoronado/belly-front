import type { DatosPaso } from '@/api'
import { cn } from '@/lib/utils'
import { Area, Nota, Numero, Seleccion } from './controles'
import { SelectorAsesores } from './SelectorAsesores'
import { MODOS_ASIGNACION, TEMPERATURAS, idsDe, porcentajeA, texto } from './tipos'

type Props = { datos: DatosPaso; poner: (parcial: DatosPaso) => void }

/** Paso «Pasar a un asesor»: a quién pasa el chat y qué le dice al cliente. */
export function FormAsesor({ datos, poner, variables }: Props & { variables: string[] }) {
  const modo = texto(datos, 'asignar') || 'flujo'
  const actual = MODOS_ASIGNACION.find((m) => m.valor === modo)

  return (
    <>
      <div className="space-y-3 rounded-lg border bg-zinc-50 p-3">
        <p className="text-sm font-medium">¿A quién se lo paso?</p>
        <Seleccion
          etiqueta="Asignar la conversación"
          valor={modo}
          alCambiar={(v) => poner({ asignar: v })}
          opciones={MODOS_ASIGNACION.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
          ayuda={actual?.ayuda}
        />

        {modo === 'elegir' ? (
          <SelectorAsesores unico valor={Number(datos.asesor_id) > 0 ? [Number(datos.asesor_id)] : []} alCambiar={(ids) => poner({ asesor_id: ids[0] ?? 0 })} />
        ) : null}

        {modo === 'equitativo' || modo === 'menos_carga' ? (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Entre quiénes</p>
            <SelectorAsesores valor={idsDe(datos.asesores)} alCambiar={(ids) => poner({ asesores: ids })} />
          </div>
        ) : null}
      </div>

      <Area
        etiqueta="Mensaje antes de pasar al asesor"
        ayuda="Escribe {{asesor}} para decirle al cliente quién lo atenderá. Después de este paso el bot deja de responder."
        valor={texto(datos, 'texto')}
        alCambiar={(v) => poner({ texto: v })}
        variables={[...variables, 'asesor']}
        max={4000}
        opcional
      />
      <Nota>
        Quien reciba el chat lo verá en su bandeja al instante, junto con un <b>resumen de lo que el cliente eligió y respondió</b>, para no
        empezar de cero.
      </Nota>
    </>
  )
}

/** Paso «Marcar interés»: pone al contacto como frío, tibio o caliente. */
export function FormTemperatura({ datos, poner }: Props) {
  const valor = texto(datos, 'valor')

  return (
    <>
      <div className="grid gap-2">
        {TEMPERATURAS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => poner({ valor: t.valor })}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
              valor === t.valor ? 'border-red-400 bg-red-50 ring-1 ring-red-400' : 'bg-white hover:bg-zinc-50',
            )}
          >
            <span className="text-2xl">{t.emoji}</span>
            <span>
              <span className="block text-sm font-medium">{t.etiqueta}</span>
              <span className="block text-xs text-muted-foreground">{t.ayuda}</span>
            </span>
          </button>
        ))}
      </div>
      <Nota>
        El asesor verá el interés de cada contacto y podrá empezar por los más calientes. Nunca baja un nivel que ya se había marcado, ni
        cambia una venta registrada. El flujo sigue solo con el paso conectado.
      </Nota>
    </>
  )
}

/** Paso «Dividir en dos caminos»: prueba A/B. */
export function FormDividir({ datos, poner }: Props) {
  const a = porcentajeA(datos)

  return (
    <>
      <Numero
        etiqueta="Porcentaje que va por el camino A"
        valor={a}
        min={1}
        max={99}
        alCambiar={(v) => poner({ porcentaje_a: v })}
        ayuda={`El camino B recibe el ${100 - a}% restante.`}
      />
      <div className="flex h-3 overflow-hidden rounded-full bg-purple-100">
        <div className="bg-purple-500 transition-all" style={{ width: `${a}%` }} />
      </div>
      <Nota>
        Cada cliente que llegue aquí va por A o por B al azar. Sirve para probar dos mensajes distintos y ver cuál funciona mejor, o para
        repartir la atención entre dos equipos.
      </Nota>
    </>
  )
}
