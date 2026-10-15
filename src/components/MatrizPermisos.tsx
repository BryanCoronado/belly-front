import { useState } from 'react'
import { Check, ChevronRight, CornerDownRight, Lock, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PermisoRol } from '@/api'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const ACCIONES = [
  { campo: 'acc_crear', etiqueta: 'Crear' },
  { campo: 'acc_actualizar', etiqueta: 'Editar' },
  { campo: 'acc_eliminar', etiqueta: 'Eliminar' },
] as const

type CampoAccion = (typeof ACCIONES)[number]['campo']

type Grupo = {
  nombre: string
  modulos: PermisoRol[]
}

const activo = (permiso: PermisoRol) => Number(permiso.acc_lectura) === 1

function conTodo(permiso: PermisoRol, valor: boolean): PermisoRol {
  const bandera = valor ? 1 : 0
  return { ...permiso, acc_lectura: bandera, acc_crear: bandera, acc_actualizar: bandera, acc_eliminar: bandera }
}

export function MatrizPermisos({
  permisos: todos,
  onCambiar,
  whatsappConectado,
}: {
  permisos: PermisoRol[]
  onCambiar: (permisos: PermisoRol[]) => void
  whatsappConectado: boolean
}) {
  const permisos = todos.filter((permiso) => !permiso.solo_admin)
  const bloqueado = (permiso: PermisoRol) => Boolean(permiso.requiere_whatsapp) && !whatsappConectado
  const hayBloqueados = permisos.some(bloqueado)
  const grupos = agrupar(permisos)
  const hijosDe = (id: number) => permisos.filter((permiso) => permiso.id_padre === id)
  const [abiertos, setAbiertos] = useState<string[]>(() => {
    const conAcceso = grupos.find((grupo) => grupo.modulos.some(activo))
    return [conAcceso?.nombre ?? grupos[0]?.nombre ?? '']
  })

  function cambiarAcceso(modulo: PermisoRol, valor: boolean) {
    const ids = new Set([modulo.id, ...hijosDe(modulo.id).map((hijo) => hijo.id)])
    onCambiar(
      todos.map((permiso) => {
        if (!ids.has(permiso.id)) return permiso
        if (permiso.id_padre) return valor ? permiso : conTodo(permiso, false)
        return valor ? { ...permiso, acc_lectura: 1 } : conTodo(permiso, false)
      }),
    )
  }

  function cambiarAccion(idPermiso: number, campo: CampoAccion, valor: boolean) {
    onCambiar(todos.map((permiso) => (permiso.id === idPermiso ? { ...permiso, [campo]: valor ? 1 : 0 } : permiso)))
  }

  function cambiarSubpermiso(idPermiso: number, valor: boolean) {
    onCambiar(todos.map((permiso) => (permiso.id === idPermiso ? conTodo(permiso, valor) : permiso)))
  }

  function cambiarGrupo(grupo: Grupo, valor: boolean) {
    const ids = new Set(
      grupo.modulos
        .filter((modulo) => !bloqueado(modulo))
        .flatMap((modulo) => [modulo.id, ...hijosDe(modulo.id).filter((hijo) => !bloqueado(hijo)).map((hijo) => hijo.id)]),
    )
    onCambiar(todos.map((permiso) => (ids.has(permiso.id) ? conTodo(permiso, valor) : permiso)))
  }

  function alternar(nombre: string) {
    setAbiertos((actual) => (actual.includes(nombre) ? actual.filter((item) => item !== nombre) : [...actual, nombre]))
  }

  return (
    <div className="space-y-2">
      {hayBloqueados ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <Smartphone className="size-4 shrink-0" />
          <p className="flex-1">Sin WhatsApp conectado, los permisos de atención están bloqueados.</p>
          <Link to="/integraciones/whatsapp" className="font-medium text-amber-900 underline underline-offset-2">
            Conectar
          </Link>
        </div>
      ) : null}
      {grupos.map((grupo) => {
        const abierto = abiertos.includes(grupo.nombre)
        const activos = grupo.modulos.filter(activo).length
        const editables = grupo.modulos.filter((modulo) => !bloqueado(modulo))
        const completo = editables.length > 0 && editables.every(activo)

        return (
          <section key={grupo.nombre} className="overflow-hidden rounded-xl border bg-white">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => alternar(grupo.nombre)}
                className="flex flex-1 items-center gap-2 text-left"
                aria-expanded={abierto}
              >
                <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', abierto && 'rotate-90')} />
                <span className="text-sm font-semibold">{grupo.nombre}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    activos ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500',
                  )}
                >
                  {activos} de {grupo.modulos.length}
                </span>
              </button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Todo
                <Switch
                  checked={completo}
                  disabled={editables.length === 0}
                  onCheckedChange={(valor) => cambiarGrupo(grupo, valor)}
                  aria-label={`Activar todo ${grupo.nombre}`}
                />
              </label>
            </div>

            {abierto ? (
              <div className="divide-y border-t">
                {grupo.modulos.map((modulo) => (
                  <FilaModulo
                    key={modulo.id}
                    modulo={modulo}
                    hijos={hijosDe(modulo.id)}
                    bloqueado={bloqueado(modulo)}
                    hijoBloqueado={bloqueado}
                    alCambiarAcceso={(valor) => cambiarAcceso(modulo, valor)}
                    alCambiarAccion={(campo, valor) => cambiarAccion(modulo.id, campo, valor)}
                    alCambiarSubpermiso={cambiarSubpermiso}
                  />
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

type PropsFila = {
  modulo: PermisoRol
  hijos: PermisoRol[]
  bloqueado: boolean
  hijoBloqueado: (hijo: PermisoRol) => boolean
  alCambiarAcceso: (valor: boolean) => void
  alCambiarAccion: (campo: CampoAccion, valor: boolean) => void
  alCambiarSubpermiso: (id: number, valor: boolean) => void
}

function FilaModulo({ modulo, hijos, bloqueado, hijoBloqueado, alCambiarAcceso, alCambiarAccion, alCambiarSubpermiso }: PropsFila) {
  const tieneAcceso = activo(modulo)
  const editable = tieneAcceso && !bloqueado
  const nombre = nombreCorto(modulo.nombre)

  return (
    <div className={cn('px-3 py-3 transition-colors', bloqueado && 'bg-zinc-50/60')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className={cn('flex min-w-0 flex-1 items-center gap-3', bloqueado ? 'cursor-not-allowed' : 'cursor-pointer')}>
          <Switch checked={tieneAcceso} disabled={bloqueado} onCheckedChange={alCambiarAcceso} aria-label={`Acceso a ${nombre}`} />
          <span className={cn('truncate text-sm', editable ? 'font-medium' : 'text-muted-foreground')}>{nombre}</span>
          {bloqueado ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              <Lock className="size-3" />
              Requiere WhatsApp
            </span>
          ) : null}
        </label>
        <div className={cn('flex gap-1.5', !editable && 'pointer-events-none opacity-40')} aria-hidden={!editable}>
          {ACCIONES.map(({ campo, etiqueta }) => {
            const marcado = Number(modulo[campo]) === 1
            return (
              <button
                key={campo}
                type="button"
                disabled={!editable}
                aria-pressed={marcado}
                onClick={() => alCambiarAccion(campo, !marcado)}
                className={cn(
                  'flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors',
                  marcado
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50',
                )}
              >
                {marcado ? <Check className="size-3" /> : null}
                {etiqueta}
              </button>
            )
          })}
        </div>
      </div>

      {hijos.length ? (
        <div className="mt-3 ml-12 rounded-lg border border-dashed bg-white p-2">
          <p className="flex items-center gap-1.5 px-1 pb-1.5 text-xs font-medium text-muted-foreground">
            <CornerDownRight className="size-3.5" />
            {bloqueado
              ? 'Requiere WhatsApp'
              : tieneAcceso
                ? `Dentro de ${nombre}, puede:`
                : `Activa ${nombre} para elegir estas opciones`}
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {hijos.map((hijo) => {
              const hijoEditable = editable && !hijoBloqueado(hijo)
              return (
                <label
                  key={hijo.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-1.5 py-1.5',
                    hijoEditable ? 'cursor-pointer hover:bg-zinc-50' : 'cursor-not-allowed',
                  )}
                  title={hijo.descripcion}
                >
                  <Switch
                    checked={tieneAcceso && activo(hijo)}
                    disabled={!hijoEditable}
                    onCheckedChange={(valor) => alCambiarSubpermiso(hijo.id, valor)}
                    aria-label={hijo.nombre}
                  />
                  <span className={cn('text-[13px]', !hijoEditable && 'text-muted-foreground')}>{hijo.nombre}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function agrupar(permisos: PermisoRol[]): Grupo[] {
  const grupos = new Map<string, PermisoRol[]>()
  for (const permiso of permisos) {
    if (permiso.id_padre) continue
    const nombre = permiso.grupo || 'General'
    grupos.set(nombre, [...(grupos.get(nombre) ?? []), permiso])
  }
  return [...grupos.entries()].map(([nombre, modulos]) => ({ nombre, modulos }))
}

function nombreCorto(nombre: string): string {
  const corto = nombre
    .replace(/^Acceso\s+(al|a)?\s*/i, '')
    .replace(/^Mod\.\s*/i, '')
    .trim()
  return corto.charAt(0).toUpperCase() + corto.slice(1)
}
