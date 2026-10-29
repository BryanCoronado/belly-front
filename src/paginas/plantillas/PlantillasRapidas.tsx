import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { eliminarRespuestaRapida, leerRespuestasRapidas, type RespuestaRapida } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useGuia } from '@/guia/useGuia'
import { avisoError, avisoExito } from '@/lib/avisos'
import { FormularioRespuesta } from './FormularioRespuesta'

const CLAVE = ['respuestas-rapidas']

export function Plantillas() {
  useGuia('plantillas')
  const cliente = useQueryClient()
  const lista = useQuery({ queryKey: CLAVE, queryFn: leerRespuestasRapidas })
  const [abierto, setAbierto] = useState<RespuestaRapida | null | 'nueva'>(null)
  const [borrar, setBorrar] = useState<RespuestaRapida | null>(null)

  const eliminar = useMutation({
    mutationFn: (item: RespuestaRapida) => eliminarRespuestaRapida(item.id),
    onSuccess: () => {
      avisoExito('Respuesta eliminada')
      setBorrar(null)
      void cliente.invalidateQueries({ queryKey: CLAVE })
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Respuestas rápidas"
        descripcion="Textos e imágenes que insertas en el chat con un clic. No son las plantillas que aprueba Meta."
        acciones={
          <Button size="lg" className="h-10" onClick={() => setAbierto('nueva')}>
            <Plus />
            Nueva respuesta
          </Button>
        }
      />

      {lista.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : lista.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-tour="lista">
          {lista.data.map((item) => (
            <article key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{item.nombre}</h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.contenido || 'Solo imagen'}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setAbierto(item)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Eliminar" className="text-rose-600" onClick={() => setBorrar(item)}>
                  <Trash2 />
                </Button>
              </div>
              {item.imagen_url ? <img src={item.imagen_url} alt="" className="h-28 w-full rounded-lg object-cover" /> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="font-medium">Aún no hay respuestas</p>
          <p className="max-w-sm text-sm text-muted-foreground">Crea una para precios, horarios o la pregunta que más te hacen.</p>
          <Button onClick={() => setAbierto('nueva')}>
            <Plus />
            Nueva respuesta
          </Button>
        </div>
      )}

      <Dialog open={abierto !== null} onOpenChange={(valor) => (valor ? null : setAbierto(null))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{abierto && abierto !== 'nueva' ? 'Editar respuesta' : 'Nueva respuesta'}</DialogTitle>
            <DialogDescription>Se guarda para tu usuario y aparece en el rayo del chat.</DialogDescription>
          </DialogHeader>
          {abierto !== null ? (
            <FormularioRespuesta
              key={abierto === 'nueva' ? 'nueva' : abierto.id}
              respuesta={abierto === 'nueva' ? null : abierto}
              alCerrar={() => setAbierto(null)}
              alGuardar={() => void cliente.invalidateQueries({ queryKey: CLAVE })}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmarAccion
        abierto={borrar !== null}
        titulo="¿Eliminar esta respuesta?"
        texto={borrar ? `«${borrar.nombre}» dejará de aparecer en el chat.` : ''}
        etiqueta="Eliminar"
        cargando={eliminar.isPending}
        alCerrar={() => setBorrar(null)}
        alConfirmar={() => borrar && eliminar.mutate(borrar)}
      />
    </div>
  )
}
