import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { guardarRespuestaRapida, type RespuestaRapida } from '@/api'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { avisoError, avisoExito } from '@/lib/avisos'

type Props = {
  respuesta: RespuestaRapida | null
  alCerrar: () => void
  alGuardar: () => void
}

export function FormularioRespuesta({ respuesta, alCerrar, alGuardar }: Props) {
  const [nombre, setNombre] = useState(respuesta?.nombre ?? '')
  const [contenido, setContenido] = useState(respuesta?.contenido ?? '')
  const [imagen, setImagen] = useState<File | null>(null)
  const [quitarImagen, setQuitarImagen] = useState(false)
  const preview = imagen ? URL.createObjectURL(imagen) : quitarImagen ? null : (respuesta?.imagen_url ?? null)

  const guardar = useMutation({
    mutationFn: () =>
      guardarRespuestaRapida(
        {
          nombre: nombre.trim(),
          contenido: contenido.trim(),
          imagen: imagen ?? undefined,
          quitarImagen,
        },
        respuesta?.id,
      ),
    onSuccess: () => {
      avisoExito(respuesta ? 'Respuesta actualizada' : 'Respuesta creada')
      alGuardar()
      alCerrar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (nombre.trim() === '') return
    if (contenido.trim() === '' && !imagen && !preview) return
    guardar.mutate()
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <Campo
        etiqueta="Título"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Horario, precios, ubicación…"
        autoFocus
      />
      <div className="grid gap-2">
        <Label htmlFor="respuesta-texto">Mensaje</Label>
        <textarea
          id="respuesta-texto"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={5}
          placeholder="El texto que vas a insertar en el chat"
          className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="respuesta-imagen">Imagen (opcional)</Label>
        {preview ? <img src={preview} alt="" className="h-28 w-auto rounded-lg object-cover" /> : null}
        <input
          id="respuesta-imagen"
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={(e) => {
            setImagen(e.target.files?.[0] ?? null)
            setQuitarImagen(false)
          }}
        />
        {preview && !imagen ? (
          <button type="button" className="justify-self-start text-xs text-rose-600" onClick={() => setQuitarImagen(true)}>
            Quitar imagen
          </button>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={alCerrar} disabled={guardar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending || nombre.trim() === '' || (contenido.trim() === '' && !imagen && !preview)}>
          {respuesta ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}
