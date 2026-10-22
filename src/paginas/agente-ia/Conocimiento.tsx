import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileUp, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { eliminarFichaConocimiento, guardarFichaConocimiento, type DetalleAgenteIa, type FichaConocimiento } from '@/api'
import { Campo } from '@/components/Campo'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { avisoError, avisoExito } from '@/lib/avisos'
import { CLASE_AREA, CLAVE_IA, LIMITES, claveAgente } from './claves'

const MAX_FICHA = LIMITES.ficha
/** Lo que la IA alcanza a leer en cada respuesta (lo mismo que limita el servidor). */
const MAX_LECTURA = 40000
const ARCHIVOS = '.txt,.md,.csv,text/plain,text/markdown,text/csv'
const EXTENSIONES = /\.(txt|md|csv)$/i

type Edicion = { ficha: FichaConocimiento | null; titulo: string; contenido: string }

export function Conocimiento({ agente }: { agente: DetalleAgenteIa }) {
  const cliente = useQueryClient()
  const archivo = useRef<HTMLInputElement>(null)
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [borrar, setBorrar] = useState<FichaConocimiento | null>(null)
  const total = agente.conocimiento.reduce((suma, f) => suma + f.contenido.length, 0)
  const lleno = agente.conocimiento.length >= LIMITES.fichas
  const errorTitulo = (e: Edicion): string | null => {
    const titulo = e.titulo.trim().toLowerCase()
    if (!titulo) return 'Ponle un título.'
    if (agente.conocimiento.some((f) => f.id !== e.ficha?.id && f.titulo.trim().toLowerCase() === titulo)) return 'Ya hay una ficha con este título. Edítala o usa otro.'
    return null
  }

  const actualizar = (fichas: FichaConocimiento[]) => {
    cliente.setQueryData<DetalleAgenteIa>(claveAgente(agente.id), (actual) => (actual ? { ...actual, conocimiento: fichas } : actual))
    void cliente.invalidateQueries({ queryKey: CLAVE_IA })
  }

  const guardar = useMutation({
    mutationFn: (e: Edicion) => guardarFichaConocimiento(agente.id, { titulo: e.titulo.trim(), contenido: e.contenido.trim() }, e.ficha?.id),
    onSuccess: (fichas) => {
      actualizar(fichas)
      setEdicion(null)
      avisoExito('Información guardada', 'El asistente ya la usa en sus respuestas.')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const eliminar = useMutation({
    mutationFn: (ficha: FichaConocimiento) => eliminarFichaConocimiento(agente.id, ficha.id),
    onSuccess: (fichas) => {
      actualizar(fichas)
      setBorrar(null)
      avisoExito('Ficha eliminada')
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar'),
  })

  const leerArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0]
    e.target.value = ''
    if (!elegido) return
    if (!EXTENSIONES.test(elegido.name)) {
      avisoError(new Error('Solo se pueden subir archivos de texto: .txt, .md o .csv. Si es un Word o PDF, copia el texto y pégalo en «Agregar».'), 'Tipo de archivo no válido')
      return
    }
    if (elegido.size > 1024 * 1024) {
      avisoError(new Error('El archivo pesa más de 1 MB. Divide la información en archivos más pequeños.'), 'Archivo muy grande')
      return
    }
    const texto = (await elegido.text()).replace(/\r\n/g, '\n').trim()
    if (!texto || texto.includes('\u0000') || texto.includes('\uFFFD\uFFFD\uFFFD')) {
      avisoError(new Error('El archivo está vacío o no es de texto. Guárdalo como «Texto sin formato (UTF-8)» y vuelve a subirlo.'), 'No se pudo leer')
      return
    }
    if (texto.length > MAX_FICHA) {
      avisoError(new Error(`Tiene ${texto.length.toLocaleString()} letras y una ficha admite ${MAX_FICHA.toLocaleString()}. Se cargó solo el comienzo: revisa antes de guardar.`), 'Archivo recortado')
    }
    setEdicion({ ficha: null, titulo: elegido.name.replace(/\.[^.]+$/, '').slice(0, LIMITES.titulo), contenido: texto.slice(0, MAX_FICHA) })
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!edicion) return
    const problema = errorTitulo(edicion) ?? (edicion.contenido.trim() ? null : 'Escribe la información.')
    if (problema) {
      avisoError(new Error(problema), 'Falta completar')
      return
    }
    guardar.mutate(edicion)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          Todo lo que el asistente debe saber de tu negocio: horarios, envíos, formas de pago, preguntas frecuentes, políticas de cambio… Solo responde con esta información y tu
          catálogo; lo que no sepa, lo pasa a una persona.
        </p>
        <div className="flex shrink-0 gap-2">
          <input ref={archivo} type="file" accept={ARCHIVOS} className="hidden" onChange={(e) => void leerArchivo(e)} />
          <Button variant="outline" onClick={() => archivo.current?.click()} disabled={lleno}>
            <FileUp />
            Subir archivo
          </Button>
          <Button onClick={() => setEdicion({ ficha: null, titulo: '', contenido: '' })} disabled={lleno}>
            <Plus />
            Agregar
          </Button>
        </div>
      </div>

      {lleno ? (
        <p className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          Llegaste al máximo de {LIMITES.fichas} fichas. Junta varias en una sola para agregar más.
        </p>
      ) : null}

      {total > MAX_LECTURA ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Tienes mucha información ({total.toLocaleString()} letras). El asistente lee las primeras {MAX_LECTURA.toLocaleString()}: deja arriba lo más importante y resume lo demás.
        </p>
      ) : null}

      {agente.conocimiento.length ? (
        <ul className="space-y-2">
          {agente.conocimiento.map((ficha) => (
            <li key={ficha.id} className="flex items-start gap-3 rounded-xl border p-3">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{ficha.titulo}</p>
                <p className="line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{ficha.contenido}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{ficha.contenido.length.toLocaleString()} letras</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEdicion({ ficha, titulo: ficha.titulo, contenido: ficha.contenido })}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Eliminar" className="text-rose-600 hover:text-rose-700" onClick={() => setBorrar(ficha)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <BookOpen className="size-7 text-muted-foreground" />
          <p className="font-medium">Todavía no sabe nada de tu negocio</p>
          <p className="max-w-sm text-sm text-muted-foreground">Agrega fichas con tus preguntas frecuentes o sube un archivo de texto (.txt, .md o .csv).</p>
        </div>
      )}

      <Dialog open={edicion !== null} onOpenChange={(valor) => (valor ? null : setEdicion(null))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{edicion?.ficha ? 'Editar información' : 'Nueva información'}</DialogTitle>
            <DialogDescription>Escribe claro y concreto, como se lo explicarías a alguien nuevo en tu equipo.</DialogDescription>
          </DialogHeader>
          {edicion ? (
            <form onSubmit={enviar} className="grid gap-4" noValidate>
              <Campo
                etiqueta="Título"
                value={edicion.titulo}
                maxLength={LIMITES.titulo}
                onChange={(e) => setEdicion({ ...edicion, titulo: e.target.value })}
                placeholder="Ej.: Envíos y formas de pago"
                error={edicion.titulo ? errorTitulo(edicion) : null}
                required
              />
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contenido-ficha">Información</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {edicion.contenido.length.toLocaleString()}/{MAX_FICHA.toLocaleString()}
                  </span>
                </div>
                <textarea
                  id="contenido-ficha"
                  rows={12}
                  maxLength={MAX_FICHA}
                  value={edicion.contenido}
                  onChange={(e) => setEdicion({ ...edicion, contenido: e.target.value })}
                  placeholder={'Ej.:\nEnviamos a todo el país en 24 a 72 horas.\nAceptamos transferencia, tarjeta y pago contra entrega.'}
                  className={CLASE_AREA}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEdicion(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardar.isPending || errorTitulo(edicion) !== null || !edicion.contenido.trim()}>
                  {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
                  Guardar
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmarAccion
        abierto={borrar !== null}
        titulo="¿Eliminar esta información?"
        texto={borrar ? `El asistente dejará de saber «${borrar.titulo}».` : ''}
        etiqueta="Eliminar"
        cargando={eliminar.isPending}
        alCerrar={() => setBorrar(null)}
        alConfirmar={() => borrar && eliminar.mutate(borrar)}
      />
    </div>
  )
}
