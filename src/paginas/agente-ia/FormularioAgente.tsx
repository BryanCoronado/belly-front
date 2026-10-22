import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Save, Trash2 } from 'lucide-react'
import { eliminarAgenteIa, guardarAgenteIa, type DatosAgenteIa, type DetalleAgenteIa, type TonoAgente } from '@/api'
import { Campo } from '@/components/Campo'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { Interruptor, Numero, Palabras, Seleccion } from '../automatizacion/controles'
import { CLASE_AREA, CLAVE_IA, MODELOS, TONOS, claveAgente, errorDeNombre } from './claves'

const EJEMPLO_INSTRUCCIONES = `Ejemplo:
- Saluda y pregunta el nombre del cliente.
- Ayuda con dudas de horarios, envíos y pagos.
- Si quiere comprar, pide qué producto le interesa y pásalo a un asesor.`

function datosDe(agente: DetalleAgenteIa): DatosAgenteIa {
  return {
    nombre: agente.nombre,
    activo: agente.activo,
    modelo: agente.modelo,
    instrucciones: agente.instrucciones,
    tono: agente.tono,
    usar_catalogo: agente.usar_catalogo,
    max_respuestas: agente.max_respuestas,
    palabras_traspaso: agente.palabras_traspaso,
    mensaje_traspaso: agente.mensaje_traspaso,
    temperatura: agente.temperatura,
  }
}

type FormularioAgenteProps = {
  agente: DetalleAgenteIa
  modelos: string[]
  otrosNombres: string[]
  alEliminar: () => void
}

export function FormularioAgente({ agente, modelos, otrosNombres, alEliminar }: FormularioAgenteProps) {
  const cliente = useQueryClient()
  const [datos, setDatos] = useState<DatosAgenteIa>(() => datosDe(agente))
  const [guardados, setGuardados] = useState(() => JSON.stringify(datosDe(agente)))
  const [borrar, setBorrar] = useState(false)
  const sinGuardar = JSON.stringify(datos) !== guardados
  const poner = (parcial: Partial<DatosAgenteIa>) => setDatos((actual) => ({ ...actual, ...parcial }))
  const errorNombre = errorDeNombre(datos.nombre, otrosNombres)

  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sinGuardar])

  const refrescar = () => {
    void cliente.invalidateQueries({ queryKey: CLAVE_IA })
    void cliente.invalidateQueries({ queryKey: ['reparto'] })
  }

  const guardar = useMutation({
    mutationFn: () => guardarAgenteIa(datos, agente.id),
    onSuccess: (nuevo) => {
      const limpios = datosDe(nuevo)
      setDatos(limpios)
      setGuardados(JSON.stringify(limpios))
      cliente.setQueryData(claveAgente(agente.id), nuevo)
      refrescar()
      avisoExito('Asistente guardado')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const eliminar = useMutation({
    mutationFn: () => eliminarAgenteIa(agente.id),
    onSuccess: () => {
      avisoExito('Asistente eliminado')
      setBorrar(false)
      refrescar()
      alEliminar()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (errorNombre) {
      avisoError(new Error(errorNombre), 'Revisa el nombre')
      return
    }
    guardar.mutate()
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          value={datos.nombre}
          maxLength={60}
          onChange={(e) => poner({ nombre: e.target.value })}
          required
          ayuda="Así se presenta con tus clientes."
          error={errorNombre}
        />
        <Seleccion
          etiqueta="Modelo"
          valor={datos.modelo}
          alCambiar={(modelo) => poner({ modelo })}
          opciones={modelos.map((m) => ({ valor: m, etiqueta: MODELOS[m] ?? m }))}
        />
      </div>

      <div className="rounded-xl border p-3">
        <Interruptor
          etiqueta="Encendido"
          ayuda="Apagado no atiende: los chats que le lleguen siguen por «Cuando pase a una persona»."
          valor={datos.activo}
          alCambiar={(activo) => poner({ activo })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Forma de hablar</Label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TONOS) as TonoAgente[]).map((tono) => (
            <button
              key={tono}
              type="button"
              onClick={() => poner({ tono })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                datos.tono === tono ? 'border-zinc-800 bg-zinc-800 text-white' : 'hover:bg-zinc-50',
              )}
            >
              {TONOS[tono]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="instrucciones">Qué debe hacer</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{datos.instrucciones.length}/8000</span>
        </div>
        <textarea
          id="instrucciones"
          rows={6}
          maxLength={8000}
          value={datos.instrucciones}
          onChange={(e) => poner({ instrucciones: e.target.value })}
          placeholder={EJEMPLO_INSTRUCCIONES}
          className={CLASE_AREA}
        />
        <p className="text-xs text-muted-foreground">Escríbele como a un empleado nuevo. Los datos del negocio (precios, horarios, políticas) van en «Lo que sabe».</p>
        {!datos.instrucciones.trim() ? (
          <p className="text-xs text-amber-700">Sin indicaciones solo saludará y responderá de forma general. Te recomendamos escribir al menos qué debe hacer.</p>
        ) : null}
      </div>

      <div className="rounded-xl border p-3">
        <Interruptor
          etiqueta="Usar mi catálogo de productos"
          ayuda="Puede responder con los productos, precios y detalles que cargaste en Productos."
          valor={datos.usar_catalogo}
          alCambiar={(usar_catalogo) => poner({ usar_catalogo })}
        />
      </div>

      <fieldset className="space-y-4 rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">Cuándo pasa el chat a una persona</legend>
        <p className="text-sm text-muted-foreground">
          Siempre lo pasa si el cliente pide hablar con alguien, quiere comprar, tiene un reclamo o el asistente no sabe qué responder. Además:
        </p>
        <Palabras
          etiqueta="Si el cliente escribe alguna de estas palabras"
          valores={datos.palabras_traspaso}
          alCambiar={(palabras_traspaso) => poner({ palabras_traspaso })}
          maximo={30}
          largo={40}
          ejemplo="asesor, humano, reclamo…"
        />
        <Numero
          etiqueta="Después de cuántas respuestas"
          valor={datos.max_respuestas}
          min={1}
          max={100}
          alCambiar={(max_respuestas) => poner({ max_respuestas })}
          ayuda="Para que nadie quede hablando solo con el asistente demasiado tiempo."
        />
        <div className="grid gap-2">
          <Label htmlFor="mensaje-traspaso">Mensaje al pasar el chat</Label>
          <textarea
            id="mensaje-traspaso"
            rows={2}
            maxLength={300}
            value={datos.mensaje_traspaso}
            onChange={(e) => poner({ mensaje_traspaso: e.target.value })}
            placeholder="Te paso con una persona de nuestro equipo, en un momento te escribe."
            className={CLASE_AREA}
          />
          <p className="text-xs text-muted-foreground">Vacío = no avisa. A quién le llega se decide en Asesores › Reparto de chats.</p>
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="creatividad">Creatividad</Label>
        <input
          id="creatividad"
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={datos.temperatura}
          onChange={(e) => poner({ temperatura: Number(e.target.value) })}
          className="w-full accent-zinc-800"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Preciso: responde igual siempre</span>
          <span>Creativo: varía más sus respuestas</span>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t bg-white/95 px-4 py-3 backdrop-blur md:-mx-5 md:px-5">
        <Button type="button" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setBorrar(true)}>
          <Trash2 />
          Eliminar
        </Button>
        {sinGuardar ? <span className="ml-auto text-xs font-medium text-amber-600">Cambios sin guardar</span> : null}
        <Button type="submit" className={cn(!sinGuardar && 'ml-auto')} disabled={!sinGuardar || guardar.isPending || errorNombre !== null}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          Guardar
        </Button>
      </div>

      <ConfirmarAccion
        abierto={borrar}
        titulo="¿Eliminar este asistente?"
        texto={`«${agente.nombre}» y todo lo que sabe se borrarán. Si lo usas en el reparto, esos chats irán por «Cuando pase a una persona».`}
        etiqueta="Eliminar"
        cargando={eliminar.isPending}
        alCerrar={() => setBorrar(false)}
        alConfirmar={() => eliminar.mutate()}
      />
    </form>
  )
}
