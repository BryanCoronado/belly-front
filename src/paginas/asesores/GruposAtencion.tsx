import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import {
  eliminarGrupoAtencion,
  guardarGrupoAtencion,
  leerAsesores,
  leerGruposAtencion,
  type DatosGrupoAtencion,
  type GrupoAtencion,
  type TipoGrupoAtencion,
} from '@/api'
import { Campo } from '@/components/Campo'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { CLAVE_REPARTO } from './contextoReparto'
import { SelectorHorario } from '../automatizacion/controles'
import { FotoAsesor, SelectorEquipo, type AsesorEquipo } from './SelectorEquipo'
import { etiquetaTurnoGrupo } from './tiposReparto'
import { errorConflictoGrupoTurno } from './validarGruposTurno'

const DIAS_LUN_VIE = [1, 2, 3, 4, 5]

function datosIniciales(grupo: GrupoAtencion | null): DatosGrupoAtencion {
  return {
    nombre: grupo?.nombre ?? '',
    descripcion: grupo?.descripcion ?? '',
    color: grupo?.color ?? COLORES[0],
    tipo: grupo?.tipo ?? 'general',
    turno_dias: grupo?.turno_dias?.length ? [...grupo.turno_dias] : [...DIAS_LUN_VIE],
    turno_desde: grupo?.turno_desde ?? '08:00',
    turno_hasta: grupo?.turno_hasta ?? '14:00',
    miembros: grupo?.miembros ?? [],
  }
}

const CLAVE = ['grupos-atencion']
const COLORES = ['#0d9488', '#f59e0b', '#6366f1', '#ec4899', '#0ea5e9', '#84cc16', '#ef4444', '#8b5cf6']

type Abierto = { grupo: GrupoAtencion | null }

export function GruposAtencion({ alIrAReparto }: { alIrAReparto: () => void }) {
  const cliente = useQueryClient()
  const grupos = useQuery({ queryKey: CLAVE, queryFn: leerGruposAtencion })
  const asesores = useQuery({ queryKey: ['asesores'], queryFn: leerAsesores })
  const [abierto, setAbierto] = useState<Abierto | null>(null)
  const [borrar, setBorrar] = useState<GrupoAtencion | null>(null)

  const porId = new Map((asesores.data ?? []).map((a) => [a.id, a]))
  const refrescar = () => {
    void cliente.invalidateQueries({ queryKey: CLAVE })
    void cliente.invalidateQueries({ queryKey: CLAVE_REPARTO })
  }

  const eliminar = useMutation({
    mutationFn: (grupo: GrupoAtencion) => eliminarGrupoAtencion(grupo.id),
    onSuccess: () => {
      avisoExito('Grupo eliminado')
      setBorrar(null)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar el grupo'),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          Agrupa asesores para el{' '}
          <button type="button" onClick={alIrAReparto} className="font-medium text-foreground underline-offset-2 hover:underline">
            reparto de chats
          </button>
          .
        </p>
        <Button size="lg" className="h-10 w-full sm:w-auto" onClick={() => setAbierto({ grupo: null })}>
          <Plus />
          Nuevo grupo
        </Button>
      </div>

      {grupos.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : grupos.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {grupos.data.map((grupo) => (
            <article key={grupo.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4" style={{ borderTop: `4px solid ${grupo.color}` }}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{grupo.nombre}</h3>
                  {grupo.tipo === 'turno' ? (
                    <p className="text-xs text-muted-foreground">{etiquetaTurnoGrupo(grupo).replace(`${grupo.nombre} · `, '')}</p>
                  ) : null}
                  {grupo.descripcion ? <p className="line-clamp-2 text-sm text-muted-foreground">{grupo.descripcion}</p> : null}
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Editar grupo" onClick={() => setAbierto({ grupo })}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Eliminar grupo" className="text-rose-600 hover:text-rose-700" onClick={() => setBorrar(grupo)}>
                  <Trash2 />
                </Button>
              </div>
              {grupo.miembros.length ? (
                <ol className="flex flex-wrap gap-1.5">
                  {grupo.miembros.map((id, i) => {
                    const asesor = porId.get(id)
                    return (
                      <li key={id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs font-medium">
                        <FotoAsesor nombre={asesor?.nombre ?? 'Asesor'} foto={asesor?.foto} />
                        <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                        <span className="truncate">{asesor?.nombre ?? 'Asesor'}</span>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Sin asesores.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <UsersRound className="size-8 text-muted-foreground" />
          <p className="font-medium">Aún no tienes grupos</p>
          <p className="max-w-sm text-sm text-muted-foreground">Crea uno para repartir los chats solo entre algunas personas, por ejemplo según su horario.</p>
        </div>
      )}

      <Dialog open={abierto !== null} onOpenChange={(valor) => (valor ? null : setAbierto(null))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{abierto?.grupo ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
            <DialogDescription className="sr-only">Datos del grupo y asesores que lo integran.</DialogDescription>
          </DialogHeader>
          {abierto ? (
            <FormularioGrupo
              key={abierto.grupo?.id ?? 'nuevo'}
              grupo={abierto.grupo}
              otrosNombres={(grupos.data ?? []).filter((g) => g.id !== abierto.grupo?.id).map((g) => g.nombre)}
              todosGrupos={grupos.data ?? []}
              asesores={(asesores.data ?? []).map((a) => ({ id: a.id, nombre: a.nombre, activo: a.activo, foto: a.foto }))}
              alCerrar={() => setAbierto(null)}
              alGuardar={refrescar}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmarAccion
        abierto={borrar !== null}
        titulo="¿Eliminar este grupo?"
        texto={borrar ? `«${borrar.nombre}» se borrará. Si lo usas en el reparto, esos pasos seguirán por «Si nadie está disponible» hasta que elijas otro grupo.` : ''}
        etiqueta="Eliminar"
        cargando={eliminar.isPending}
        alCerrar={() => setBorrar(null)}
        alConfirmar={() => borrar && eliminar.mutate(borrar)}
      />
    </div>
  )
}

function FormularioGrupo({
  grupo,
  otrosNombres,
  todosGrupos,
  asesores,
  alCerrar,
  alGuardar,
}: {
  grupo: GrupoAtencion | null
  otrosNombres: string[]
  todosGrupos: GrupoAtencion[]
  asesores: AsesorEquipo[]
  alCerrar: () => void
  alGuardar: () => void
}) {
  const [datos, setDatos] = useState<DatosGrupoAtencion>(() => datosIniciales(grupo))
  const [tocado, setTocado] = useState(false)
  const nombre = datos.nombre.trim()
  const errorNombre =
    nombre.length < 2
      ? 'Escribe un nombre de al menos 2 letras.'
      : otrosNombres.some((n) => n.toLowerCase() === nombre.toLowerCase())
        ? 'Ya tienes un grupo con este nombre.'
        : null
  const sinActivos = datos.miembros.length > 0 && !datos.miembros.some((id) => asesores.find((a) => a.id === id)?.activo)
  const errorTurnoBasico =
    datos.tipo === 'turno' && (!datos.turno_dias.length || !datos.turno_desde || !datos.turno_hasta || datos.turno_desde === datos.turno_hasta)
      ? 'Indica días y hora de inicio y fin del turno (no pueden ser iguales).'
      : null
  const errorConflicto =
    datos.tipo === 'turno' && !errorTurnoBasico
      ? errorConflictoGrupoTurno(
          { nombre: datos.nombre, tipo: datos.tipo, turno_dias: datos.turno_dias, turno_desde: datos.turno_desde, turno_hasta: datos.turno_hasta, miembros: datos.miembros },
          todosGrupos,
          grupo?.id,
        )
      : null
  const errorTurno = errorTurnoBasico ?? errorConflicto

  const ponerTipo = (tipo: TipoGrupoAtencion) => {
    setDatos((prev) =>
      tipo === 'turno'
        ? {
            ...prev,
            tipo,
            turno_dias: prev.turno_dias.length ? prev.turno_dias : [...DIAS_LUN_VIE],
            turno_desde: prev.turno_desde || '08:00',
            turno_hasta: prev.turno_hasta || '14:00',
          }
        : { ...prev, tipo },
    )
  }

  const guardar = useMutation({
    mutationFn: () => guardarGrupoAtencion({ ...datos, nombre, descripcion: datos.descripcion.trim() }, grupo?.id),
    onSuccess: () => {
      avisoExito(grupo ? 'Grupo actualizado' : 'Grupo creado')
      alGuardar()
      alCerrar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar el grupo'),
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setTocado(true)
    if (!errorNombre && !errorTurno) guardar.mutate()
  }

  return (
    <form className="grid gap-5" onSubmit={enviar} noValidate>
      <Campo
        etiqueta="Nombre"
        value={datos.nombre}
        maxLength={60}
        onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
        onBlur={() => setTocado(true)}
        placeholder="Turno mañana, Ventas…"
        error={tocado ? errorNombre : null}
        required
      />
      <div className="grid gap-2">
        <Label>Tipo</Label>
        <div className="inline-flex w-fit rounded-lg border p-0.5">
          {(['general', 'turno'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => ponerTipo(tipo)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                datos.tipo === tipo ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tipo === 'general' ? 'General' : 'Turno'}
            </button>
          ))}
        </div>
      </div>
      {datos.tipo === 'turno' ? (
        <div className="grid gap-2 border-t pt-4">
          <SelectorHorario
            datos={{ dias: datos.turno_dias, desde: datos.turno_desde, hasta: datos.turno_hasta }}
            alCambiar={(h) =>
              setDatos({
                ...datos,
                turno_dias: h.dias ?? datos.turno_dias,
                turno_desde: h.desde ?? datos.turno_desde,
                turno_hasta: h.hasta ?? datos.turno_hasta,
              })
            }
          />
          {errorConflicto || (tocado && errorTurnoBasico) ? <p className="text-xs text-rose-600">{errorTurno}</p> : null}
        </div>
      ) : null}
      <Campo
        etiqueta="Descripción"
        opcional
        value={datos.descripcion}
        maxLength={200}
        onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
        placeholder="Ej.: Atienden de 8:00 a 14:00"
      />
      <div className="grid gap-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORES.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              aria-pressed={datos.color === color}
              onClick={() => setDatos({ ...datos, color })}
              className={cn('size-8 rounded-full ring-offset-2 transition-shadow', datos.color === color && 'ring-2 ring-foreground')}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Asesores del grupo</Label>
        {asesores.length ? (
          <SelectorEquipo asesores={asesores} valor={datos.miembros} conOrden alCambiar={(miembros) => setDatos({ ...datos, miembros })} />
        ) : (
          <p className="text-sm text-muted-foreground">Primero crea asesores en «Mi equipo».</p>
        )}
        {datos.miembros.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin asesores, el reparto seguirá por «Si nadie está disponible».</p>
        ) : sinActivos ? (
          <p className="text-xs text-muted-foreground">Ningún asesor elegido está activo.</p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending || (tocado && (errorNombre !== null || errorTurno !== null))}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          {grupo ? 'Guardar cambios' : 'Crear grupo'}
        </Button>
      </div>
    </form>
  )
}
