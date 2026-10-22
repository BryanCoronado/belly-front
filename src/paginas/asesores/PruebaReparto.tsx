import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FlaskConical, LoaderCircle, Sparkles, UserRound } from 'lucide-react'
import { probarReparto, type DefinicionReparto, type PruebaReparto as DatosPrueba, type ResultadoPrueba } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { avisoError } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { Nota } from '../automatizacion/controles'
import { explicarResultado } from './tiposReparto'

function ahoraLocal(): string {
  const fecha = new Date()
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
  return fecha.toISOString().slice(0, 16)
}

type Opcion<T extends string> = { valor: T; etiqueta: string }

function Botones<T extends string>({ etiqueta, valor, opciones, alCambiar }: { etiqueta: string; valor: T; opciones: Opcion<T>[]; alCambiar: (v: T) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{etiqueta}</Label>
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => alCambiar(o.valor)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              valor === o.valor ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </div>
  )
}

type PruebaRepartoProps = {
  definicion: DefinicionReparto
  /** Cambia solo si cambian los pasos o las flechas (no al mover un paso). */
  camino: string
  alResultado: (r: ResultadoPrueba | null) => void
}

export function PruebaReparto({ definicion, camino, alResultado }: PruebaRepartoProps) {
  const [datos, setDatos] = useState<DatosPrueba>({ cliente: 'nuevo', origen: 'directo', texto: 'Hola, quiero información', cuando: ahoraLocal() })
  const [probado, setProbado] = useState<{ camino: string; resultado: ResultadoPrueba } | null>(null)
  const resultado = probado?.resultado ?? null
  const desactualizado = probado !== null && probado.camino !== camino
  const sinFecha = !datos.cuando

  const probar = useMutation({
    mutationFn: () => probarReparto({ ...datos, texto: datos.texto.trim(), definicion }),
    onSuccess: (r) => {
      setProbado({ camino, resultado: r })
      alResultado(r)
    },
    onError: (error) => avisoError(error, 'No se pudo probar'),
  })

  const cambiar = (parcial: Partial<DatosPrueba>) => {
    setDatos((actual) => ({ ...actual, ...parcial }))
    setProbado(null)
    alResultado(null)
  }

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <Nota>Imagina que llega un cliente. Elige cómo es y verás en verde el camino que seguiría en el lienzo (aunque no hayas guardado).</Nota>

      <Botones
        etiqueta="El cliente es"
        valor={datos.cliente}
        alCambiar={(cliente) => cambiar({ cliente })}
        opciones={[
          { valor: 'nuevo', etiqueta: 'Nuevo' },
          { valor: 'recurrente', etiqueta: 'Ya había escrito' },
        ]}
      />
      <Botones
        etiqueta="Llega"
        valor={datos.origen}
        alCambiar={(origen) => cambiar({ origen })}
        opciones={[
          { valor: 'directo', etiqueta: 'Escribiendo directo' },
          { valor: 'anuncio', etiqueta: 'Desde un anuncio' },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="prueba-texto">Su primer mensaje</Label>
        <Input id="prueba-texto" value={datos.texto} maxLength={1000} onChange={(e) => cambiar({ texto: e.target.value })} className="h-9" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="prueba-cuando">Día y hora</Label>
        <Input id="prueba-cuando" type="datetime-local" value={datos.cuando} onChange={(e) => cambiar({ cuando: e.target.value })} className="h-9" />
        {sinFecha ? <p className="text-xs text-rose-600">Elige el día y la hora para la prueba.</p> : null}
      </div>

      <Button className="w-full" onClick={() => probar.mutate()} disabled={probar.isPending || sinFecha}>
        {probar.isPending ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}
        Probar
      </Button>

      {resultado ? (
        <div
          className={cn(
            'space-y-2 rounded-xl border p-3',
            resultado.tipo === 'ninguno' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900',
          )}
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            {resultado.tipo === 'agente' ? <Sparkles className="size-4" /> : <UserRound className="size-4" />}
            {resultado.nombre ?? 'Nadie'}
          </p>
          <p className="text-sm">{explicarResultado(resultado)}</p>
          {desactualizado ? <p className="text-xs font-medium text-amber-700">Cambiaste el camino después de probar: vuelve a pulsar «Probar».</p> : null}
          <button
            type="button"
            className="text-xs font-medium underline-offset-2 hover:underline"
            onClick={() => {
              setProbado(null)
              alResultado(null)
            }}
          >
            Quitar el resaltado
          </button>
        </div>
      ) : null}
    </div>
  )
}
