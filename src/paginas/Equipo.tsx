import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, FolderKanban, LoaderCircle, Plus, Search, Shield, UsersRound } from 'lucide-react'
import {
  cambiarEstadoUsuario,
  crearUsuario,
  editarUsuario,
  eliminarGrupo,
  eliminarRol,
  guardarGrupo,
  guardarRol,
  leerCatalogo,
  leerGrupo,
  leerGrupos,
  leerLista,
  leerRol,
  leerRoles,
  texto,
  type DatosUsuario,
  type Fila,
  type GrupoUsuario,
  type PermisoRol,
  type Rol,
} from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo, CampoSelect } from '@/components/Campo'
import { MatrizPermisos } from '@/components/MatrizPermisos'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useGuia } from '@/guia/useGuia'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

const RUTA_USUARIOS = '/v1/usuario?page=1&perPage=200'
const CLAVE_GRUPOS = ['grupos-usuario']
const AVATARES_VISIBLES = 4
const VACIO_USUARIO: DatosUsuario = {
  nombres: '',
  apellidos: '',
  correo: '',
  celular: '',
  nro_documento: '',
  usuario: '',
  password: '',
  id_rol: 0,
  id_grupo_usuario: 0,
}

type UsuarioEdicion = DatosUsuario & { id?: number }

type Pestana = 'usuarios' | 'grupos' | 'roles'

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'usuarios', titulo: 'Usuarios' },
  { id: 'grupos', titulo: 'Grupos de usuarios' },
  { id: 'roles', titulo: 'Roles' },
]

export function Equipo() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const [pestana, setPestana] = useState<Pestana>('usuarios')

  return (
    <div className="space-y-6">
      <CabeceraPagina titulo="Equipo" descripcion="Las personas de tu empresa, cómo se agrupan y qué puede hacer cada una." />

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex w-max gap-1 rounded-lg bg-muted p-1" data-tour="pestanas-equipo">
          {PESTANAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPestana(item.id)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                pestana === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.titulo}
            </button>
          ))}
        </div>
      </div>

      {pestana === 'usuarios' ? <PanelUsuarios admin={admin} /> : null}
      {pestana === 'grupos' ? <PanelGrupos admin={admin} /> : null}
      {pestana === 'roles' ? <PanelRoles admin={admin} /> : null}
    </div>
  )
}

function BarraPanel({ texto, accion }: { texto: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" data-tour="explicacion">
        {texto}
      </p>
      {accion}
    </div>
  )
}

function BotonNuevo({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <Button size="lg" className="h-10 w-full sm:w-auto" data-tour="nuevo" onClick={onClick}>
      <Plus />
      {children}
    </Button>
  )
}

function idDe(fila: Fila): number {
  return Number(fila.id_usuario ?? fila.id)
}

function nombreDe(fila: Fila): string {
  return [texto(fila, 'nombres'), texto(fila, 'apellidos')].filter(Boolean).join(' ') || texto(fila, 'usuario')
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function PanelUsuarios({ admin }: { admin: boolean }) {
  useGuia('equipo-usuarios')
  const sesion = leerSesion()
  const consultas = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<UsuarioEdicion | null>(null)
  const equipo = useQuery({ queryKey: [RUTA_USUARIOS], queryFn: () => leerLista(RUTA_USUARIOS) })
  const roles = useQuery({ queryKey: ['roles'], queryFn: leerRoles })
  const grupos = useQuery({ queryKey: CLAVE_GRUPOS, queryFn: leerGrupos })
  const refrescar = () => {
    consultas.invalidateQueries({ queryKey: [RUTA_USUARIOS] })
    consultas.invalidateQueries({ queryKey: CLAVE_GRUPOS })
  }

  return (
    <>
      <BarraPanel
        texto="Cada usuario entra con su usuario y contraseña."
        accion={
          admin ? (
            <BotonNuevo
              onClick={() => {
                setEditando(null)
                setAbierto(true)
              }}
            >
              Nuevo usuario
            </BotonNuevo>
          ) : null
        }
      />

      <TablaResponsiva
        filas={equipo.data?.filas}
        cargando={equipo.isPending}
        clave={(fila) => String(idDe(fila))}
        columnas={[
          {
            titulo: 'Nombre',
            principal: true,
            celda: (fila) => (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-emerald-50 text-xs font-medium text-emerald-700">{iniciales(nombreDe(fila))}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{nombreDe(fila)}</p>
                  <p className="truncate text-xs text-muted-foreground">@{texto(fila, 'usuario')}</p>
                </div>
              </div>
            ),
          },
          { titulo: 'Correo', celda: (fila) => texto(fila, 'correo') || <span className="text-muted-foreground">—</span> },
          { titulo: 'Grupo', celda: (fila) => <Badge variant="outline">{texto(fila, 'grupo') || '—'}</Badge> },
          {
            titulo: 'Rol',
            celda: (fila) => {
              const esAdmin = Number(fila.sudo) === 1 || Number(fila.es_admin) === 1
              return <Badge variant={esAdmin ? 'default' : 'secondary'}>{texto(fila, 'rol') || (esAdmin ? 'Administrador' : 'Sin rol')}</Badge>
            },
          },
          {
            titulo: 'Estado',
            celda: (fila) => {
              const activo = Number(fila.activo) === 1
              return (
                <Badge className={activo ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-muted text-muted-foreground'}>
                  {activo ? 'Activo' : 'Inactivo'}
                </Badge>
              )
            },
          },
        ]}
        acciones={
          admin
            ? (fila) => (
                <AccionesUsuario
                  fila={fila}
                  yo={idDe(fila) === Number(sesion?.usuario.id)}
                  alCambiar={refrescar}
                  alEditar={(usuario) => {
                    setEditando(usuario)
                    setAbierto(true)
                  }}
                />
              )
            : undefined
        }
        vacio={{ icono: UsersRound, titulo: 'Aún no hay usuarios', texto: 'Crea el primero: solo necesitas un nombre, un usuario y una contraseña.' }}
      />

      <ModalUsuario
        abierto={abierto}
        inicial={editando}
        roles={roles.data ?? []}
        grupos={grupos.data ?? []}
        alCerrar={(valor) => {
          setAbierto(valor)
          if (!valor) setEditando(null)
        }}
        alGuardar={refrescar}
      />
    </>
  )
}

function AccionesUsuario({
  fila,
  yo,
  alCambiar,
  alEditar,
}: {
  fila: Fila
  yo: boolean
  alCambiar: () => void
  alEditar: (usuario: UsuarioEdicion) => void
}) {
  const activo = Number(fila.activo) === 1
  const esAdmin = Number(fila.sudo) === 1 || Number(fila.es_admin) === 1
  const estado = useMutation({
    mutationFn: () => cambiarEstadoUsuario(idDe(fila), activo ? 0 : 1),
    onSuccess: () => {
      avisoExito(activo ? 'Usuario desactivado' : 'Usuario activado')
      alCambiar()
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el estado'),
  })

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          alEditar({
            id: idDe(fila),
            nombres: texto(fila, 'nombres'),
            apellidos: texto(fila, 'apellidos'),
            correo: texto(fila, 'correo'),
            celular: texto(fila, 'celular'),
            nro_documento: texto(fila, 'nro_documento'),
            usuario: texto(fila, 'usuario'),
            password: '',
            id_rol: Number(fila.id_rol ?? 0),
            id_grupo_usuario: Number(fila.id_grupo_usuario ?? 0),
          })
        }
      >
        Editar
      </Button>
      {yo || esAdmin ? null : (
        <Button variant="outline" size="sm" disabled={estado.isPending} onClick={() => estado.mutate()}>
          {activo ? 'Desactivar' : 'Activar'}
        </Button>
      )}
    </>
  )
}

function ModalUsuario({
  abierto,
  inicial,
  roles,
  grupos,
  alCerrar,
  alGuardar,
}: {
  abierto: boolean
  inicial: UsuarioEdicion | null
  roles: Rol[]
  grupos: GrupoUsuario[]
  alCerrar: (abierto: boolean) => void
  alGuardar: () => void
}) {
  const editando = inicial?.id != null

  return (
    <Dialog open={abierto} onOpenChange={alCerrar}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {editando ? 'Cambia sus datos, su rol o su grupo.' : 'Solo lo básico para que pueda entrar. Lo demás es opcional.'}
          </DialogDescription>
        </DialogHeader>
        {abierto ? (
          <FormularioUsuario
            key={editando ? `editar-${inicial.id}` : 'nuevo'}
            inicial={inicial ?? VACIO_USUARIO}
            roles={roles}
            grupos={grupos}
            alCerrar={alCerrar}
            alGuardar={alGuardar}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function FormularioUsuario({
  inicial,
  roles,
  grupos,
  alCerrar,
  alGuardar,
}: {
  inicial: UsuarioEdicion
  roles: Rol[]
  grupos: GrupoUsuario[]
  alCerrar: (abierto: boolean) => void
  alGuardar: () => void
}) {
  const [datos, setDatos] = useState<UsuarioEdicion>(inicial)
  const editando = inicial.id != null
  const tieneExtras = Boolean(inicial.correo || inicial.celular || inicial.nro_documento)
  const rolPorDefecto = roles.find((rol) => !rol.es_admin) ?? roles[0]
  const idRol = datos.id_rol || rolPorDefecto?.id || 0

  const guardar = useMutation({
    mutationFn: () => {
      const cuerpo = { ...limpiar(datos), id_rol: idRol }
      return editando ? editarUsuario(inicial.id as number, cuerpo) : crearUsuario(cuerpo)
    },
    onSuccess: () => {
      avisoExito(editando ? 'Usuario actualizado' : 'Usuario creado', editando ? undefined : 'Ya puede iniciar sesión con su usuario.')
      alCerrar(false)
      alGuardar()
    },
    onError: (error) => avisoError(error, editando ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = evento.target
    setDatos((actual) => ({
      ...actual,
      [name]: name === 'id_rol' || name === 'id_grupo_usuario' ? Number(value) : value,
    }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" name="nombres" value={datos.nombres} onChange={cambiar} autoComplete="off" required />
        <Campo etiqueta="Apellidos" name="apellidos" value={datos.apellidos} onChange={cambiar} autoComplete="off" opcional />
        <Campo
          etiqueta="Usuario"
          name="usuario"
          value={datos.usuario}
          onChange={cambiar}
          autoComplete="off"
          autoCapitalize="none"
          pattern="[A-Za-z0-9._\-]{3,45}"
          title="De 3 a 45 caracteres: letras, números, punto o guion."
          required
        />
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          ayuda={editando ? 'Vacía = no cambia.' : 'Mínimo 8 caracteres.'}
          value={datos.password ?? ''}
          onChange={cambiar}
          autoComplete="new-password"
          minLength={8}
          required={!editando}
        />
        <CampoSelect etiqueta="Rol" name="id_rol" value={idRol || ''} onChange={cambiar} ayuda="Define todo lo que puede ver y hacer.">
          {roles.map((rol) => (
            <option key={rol.id} value={rol.id}>
              {rol.rol}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect
          etiqueta="Grupo"
          name="id_grupo_usuario"
          value={datos.id_grupo_usuario || 0}
          onChange={cambiar}
          ayuda="Solo para organizar, no da permisos. Automático: Administrador va a Administradores; los demás, a Equipo."
        >
          <option value={0}>Automático según el rol</option>
          {grupos.map((grupo) => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.grupo}
            </option>
          ))}
        </CampoSelect>
      </div>

      <Collapsible defaultOpen={tieneExtras} className="group/extras rounded-lg border">
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium">
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-open/extras:rotate-90" />
          Más datos
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-4 border-t p-3 sm:grid-cols-2">
            <Campo etiqueta="Correo" name="correo" type="email" value={datos.correo} onChange={cambiar} autoComplete="off" />
            <Campo etiqueta="Celular" name="celular" type="tel" value={datos.celular} onChange={cambiar} autoComplete="off" />
            <Campo etiqueta="Documento" name="nro_documento" value={datos.nro_documento} onChange={cambiar} maxLength={15} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <DialogFooter>
        <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={guardar.isPending}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          {editando ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function limpiar(datos: DatosUsuario): DatosUsuario {
  return {
    ...datos,
    usuario: datos.usuario.trim().toLowerCase(),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim(),
    celular: datos.celular.trim(),
    nro_documento: datos.nro_documento.trim(),
    id_rol: Number(datos.id_rol),
    id_grupo_usuario: Number(datos.id_grupo_usuario ?? 0),
  }
}

function PanelGrupos({ admin }: { admin: boolean }) {
  useGuia('equipo-grupos')
  const consultas = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)
  const grupos = useQuery({ queryKey: CLAVE_GRUPOS, queryFn: leerGrupos })
  const refrescar = () => {
    consultas.invalidateQueries({ queryKey: CLAVE_GRUPOS })
    consultas.invalidateQueries({ queryKey: [RUTA_USUARIOS] })
  }

  return (
    <>
      <BarraPanel
        texto="Un grupo junta a las personas que trabajan juntas, por ejemplo Ventas o Soporte. Sirve para organizar; los permisos los da el rol."
        accion={
          admin ? (
            <BotonNuevo
              onClick={() => {
                setEditando(null)
                setAbierto(true)
              }}
            >
              Nuevo grupo
            </BotonNuevo>
          ) : null
        }
      />

      {grupos.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, indice) => (
            <Skeleton key={indice} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : grupos.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grupos.data.map((grupo) => (
            <TarjetaGrupo
              key={grupo.id}
              grupo={grupo}
              admin={admin}
              alEditar={() => {
                setEditando(grupo.id)
                setAbierto(true)
              }}
              alBorrar={refrescar}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card px-6 py-14 text-center">
          <FolderKanban className="mx-auto mb-3 size-6 text-emerald-600" />
          <p className="font-medium">Aún no hay grupos</p>
          <p className="text-sm text-muted-foreground">Crea un grupo y agrega a las personas que trabajan juntas.</p>
        </div>
      )}

      <EditorGrupo
        abierto={abierto}
        id={editando}
        alCerrar={(valor) => {
          setAbierto(valor)
          if (!valor) setEditando(null)
        }}
        alGuardar={refrescar}
      />
    </>
  )
}

function TarjetaGrupo({
  grupo,
  admin,
  alEditar,
  alBorrar,
}: {
  grupo: GrupoUsuario
  admin: boolean
  alEditar: () => void
  alBorrar: () => void
}) {
  const miembros = grupo.miembros ?? []
  const resto = miembros.length - AVATARES_VISIBLES

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs" data-tour="tarjeta-grupo">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{grupo.grupo}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{grupo.descripcion || 'Sin descripción'}</p>
        </div>
        {grupo.es_base ? <Badge variant="secondary">Base</Badge> : null}
      </div>

      <div className="flex items-center gap-3">
        {miembros.length ? (
          <AvatarGroup>
            {miembros.slice(0, AVATARES_VISIBLES).map((miembro) => (
              <Avatar key={miembro.id} title={miembro.nombre}>
                <AvatarFallback className="bg-emerald-50 text-xs font-medium text-emerald-700">{iniciales(miembro.nombre)}</AvatarFallback>
              </Avatar>
            ))}
            {resto > 0 ? <AvatarGroupCount className="text-xs">+{resto}</AvatarGroupCount> : null}
          </AvatarGroup>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {miembros.length === 0 ? 'Sin miembros' : miembros.length === 1 ? '1 miembro' : `${miembros.length} miembros`}
        </span>
      </div>

      {admin ? (
        <div className="mt-auto flex gap-2 [&>*]:flex-1">
          <Button variant="outline" size="sm" data-tour="editar-grupo" onClick={alEditar}>
            Editar miembros
          </Button>
          {grupo.es_base ? null : <BorrarGrupo id={grupo.id} vacio={miembros.length === 0} onOk={alBorrar} />}
        </div>
      ) : null}
    </article>
  )
}

function BorrarGrupo({ id, vacio, onOk }: { id: number; vacio: boolean; onOk: () => void }) {
  const baja = useMutation({
    mutationFn: () => eliminarGrupo(id),
    onSuccess: () => {
      avisoExito('Grupo eliminado')
      onOk()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar el grupo'),
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      className="max-w-28"
      disabled={baja.isPending || !vacio}
      title={vacio ? undefined : 'Saca a los miembros antes de eliminarlo.'}
      onClick={() => baja.mutate()}
    >
      Eliminar
    </Button>
  )
}

type InicialGrupo = { grupo: string; descripcion: string; es_base?: number; miembros: number[] }

const GRUPO_NUEVO: InicialGrupo = { grupo: '', descripcion: '', miembros: [] }

function EditorGrupo({
  abierto,
  id,
  alCerrar,
  alGuardar,
}: {
  abierto: boolean
  id: number | null
  alCerrar: (abierto: boolean) => void
  alGuardar: () => void
}) {
  const detalle = useQuery({
    queryKey: ['grupo-usuario', id],
    queryFn: () => leerGrupo(id as number),
    enabled: abierto && id !== null,
  })
  const usuarios = useQuery({
    queryKey: [RUTA_USUARIOS],
    queryFn: () => leerLista(RUTA_USUARIOS),
    enabled: abierto,
  })

  const inicial: InicialGrupo | undefined = id
    ? detalle.data
      ? { ...detalle.data, miembros: detalle.data.miembros ?? [] }
      : undefined
    : GRUPO_NUEVO

  return (
    <Dialog open={abierto} onOpenChange={alCerrar}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{id ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
          <DialogDescription>
            Elige quiénes forman parte. Lo que cada uno puede hacer lo define su rol.
          </DialogDescription>
        </DialogHeader>
        {inicial && usuarios.data ? (
          <FormularioGrupo
            key={`${id ?? 'nuevo'}-${detalle.dataUpdatedAt}`}
            id={id}
            inicial={inicial}
            usuarios={usuarios.data.filas}
            alCerrar={alCerrar}
            alGuardar={alGuardar}
          />
        ) : (
          <div className="grid gap-3 py-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-40" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormularioGrupo({
  id,
  inicial,
  usuarios,
  alCerrar,
  alGuardar,
}: {
  id: number | null
  inicial: InicialGrupo
  usuarios: Fila[]
  alCerrar: (abierto: boolean) => void
  alGuardar: () => void
}) {
  const [nombre, setNombre] = useState(inicial.grupo)
  const [descripcion, setDescripcion] = useState(inicial.descripcion)
  const [miembros, setMiembros] = useState<number[]>(inicial.miembros)

  const guardar = useMutation({
    mutationFn: () => guardarGrupo({ grupo: nombre.trim(), descripcion: descripcion.trim(), miembros }, id ?? undefined),
    onSuccess: () => {
      avisoExito(id ? 'Grupo actualizado' : 'Grupo creado')
      alCerrar(false)
      alGuardar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar el grupo'),
  })

  return (
    <form
      className="grid gap-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        guardar.mutate()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del grupo" placeholder="Ej. Ventas" value={nombre} onChange={(evento) => setNombre(evento.target.value)} required />
        <Campo etiqueta="Descripción" value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} opcional />
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Miembros ({miembros.length})</p>
        <SelectorMiembros
          usuarios={usuarios}
          elegidos={miembros}
          fijos={inicial.es_base ? inicial.miembros : []}
          onCambiar={setMiembros}
        />
      </div>

      <DialogFooter>
        <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={guardar.isPending || !nombre.trim()}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Guardar grupo
        </Button>
      </DialogFooter>
    </form>
  )
}

function SelectorMiembros({
  usuarios,
  elegidos,
  fijos,
  onCambiar,
}: {
  usuarios: Fila[]
  elegidos: number[]
  fijos: number[]
  onCambiar: (ids: number[]) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return termino
      ? usuarios.filter((fila) => `${nombreDe(fila)} ${texto(fila, 'usuario')}`.toLowerCase().includes(termino))
      : usuarios
  }, [busqueda, usuarios])

  function alternar(id: number) {
    onCambiar(elegidos.includes(id) ? elegidos.filter((actual) => actual !== id) : [...elegidos, id])
  }

  if (usuarios.length === 0) {
    return <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Primero crea usuarios en la pestaña Usuarios.</p>
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar por nombre o usuario"
          className="h-10 pl-9"
        />
      </div>
      {fijos.length ? (
        <p className="text-xs text-muted-foreground">
          Es un grupo base: para sacar a alguien, agrégalo a otro grupo.
        </p>
      ) : null}
      <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border">
        {visibles.map((fila) => {
          const id = idDe(fila)
          const marcado = elegidos.includes(id)
          const fijo = fijos.includes(id)
          const grupoActual = texto(fila, 'grupo')
          return (
            <li key={id}>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50',
                  marcado && 'bg-emerald-50/50',
                  fijo && 'cursor-not-allowed opacity-70',
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-emerald-50 font-medium text-emerald-700">{iniciales(nombreDe(fila))}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{nombreDe(fila)}</span>
                  <span className="block truncate text-xs text-muted-foreground">@{texto(fila, 'usuario')}</span>
                </span>
                {grupoActual && !marcado ? (
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Ahora en {grupoActual}</span>
                ) : null}
                <Switch checked={marcado} disabled={fijo} onCheckedChange={() => alternar(id)} aria-label={`Incluir a ${nombreDe(fila)}`} />
              </label>
            </li>
          )
        })}
        {visibles.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nadie coincide con “{busqueda}”.</li> : null}
      </ul>
    </div>
  )
}

function PanelRoles({ admin }: { admin: boolean }) {
  useGuia('equipo-roles')
  const consultas = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)
  const roles = useQuery({ queryKey: ['roles'], queryFn: leerRoles })

  return (
    <>
      <BarraPanel
        texto="El rol dice qué puede hacer cada persona, por ejemplo Asesor o Supervisor."
        accion={
          admin ? (
            <BotonNuevo
              onClick={() => {
                setEditando(null)
                setAbierto(true)
              }}
            >
              Nuevo rol
            </BotonNuevo>
          ) : null
        }
      />

      <TablaResponsiva
        filas={roles.data}
        cargando={roles.isPending}
        clave={(rol) => String(rol.id)}
        columnas={[
          { titulo: 'Rol', principal: true, celda: (rol) => <span className="font-medium">{rol.rol}</span> },
          { titulo: 'Descripción', celda: (rol) => <span className="text-muted-foreground">{rol.descripcion || '—'}</span> },
          {
            titulo: 'Tipo',
            celda: (rol) => <Badge variant={rol.es_admin ? 'default' : 'secondary'}>{rol.es_admin ? 'Administrador' : 'Personalizado'}</Badge>,
          },
        ]}
        acciones={
          admin
            ? (rol) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditando(rol.id)
                      setAbierto(true)
                    }}
                  >
                    Editar permisos
                  </Button>
                  {rol.es_admin ? null : <BorrarRol id={rol.id} onOk={() => consultas.invalidateQueries({ queryKey: ['roles'] })} />}
                </>
              )
            : undefined
        }
        vacio={{ icono: Shield, titulo: 'Aún no hay roles', texto: 'Crea un rol y marca qué puede hacer.' }}
      />

      <EditorRol
        abierto={abierto}
        id={editando}
        alCerrar={(valor) => {
          setAbierto(valor)
          if (!valor) setEditando(null)
        }}
        alGuardar={() => consultas.invalidateQueries({ queryKey: ['roles'] })}
      />
    </>
  )
}

function BorrarRol({ id, onOk }: { id: number; onOk: () => void }) {
  const baja = useMutation({
    mutationFn: () => eliminarRol(id),
    onSuccess: () => {
      avisoExito('Rol eliminado')
      onOk()
    },
    onError: (error) => avisoError(error, 'No se pudo eliminar el rol'),
  })

  return (
    <Button variant="ghost" size="sm" disabled={baja.isPending} onClick={() => baja.mutate()}>
      Eliminar
    </Button>
  )
}

function EditorRol({
  abierto,
  id,
  alCerrar,
  alGuardar,
}: {
  abierto: boolean
  id: number | null
  alCerrar: (abierto: boolean) => void
  alGuardar: () => void
}) {
  const detalle = useQuery({
    queryKey: ['rol', id],
    queryFn: () => leerRol(id as number),
    enabled: abierto && id !== null,
  })
  const catalogo = useQuery({
    queryKey: ['catalogo-permisos'],
    queryFn: leerCatalogo,
    enabled: abierto && id === null,
  })
  const inicial = id ? detalle.data : catalogo.data ? { rol: '', descripcion: '', permisos: catalogo.data } : undefined

  return (
    <Dialog open={abierto} onOpenChange={alCerrar}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{id ? 'Permisos del rol' : 'Nuevo rol'}</DialogTitle>
          <DialogDescription>Marca qué puede ver y hacer quien tenga este rol.</DialogDescription>
        </DialogHeader>
        {inicial ? (
          <FormularioRol key={`${id ?? 'nuevo'}-${detalle.dataUpdatedAt}`} id={id} inicial={inicial} alCerrar={alCerrar} alGuardar={alGuardar} />
        ) : (
          <div className="grid gap-3 py-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-40" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormularioRol({
  id,
  inicial,
  alCerrar,
  alGuardar,
}: {
  id: number | null
  inicial: { rol: string; descripcion: string; permisos?: PermisoRol[] }
  alCerrar: (abierto: boolean) => void
  alGuardar: () => void
}) {
  const [nombre, setNombre] = useState(inicial.rol)
  const [descripcion, setDescripcion] = useState(inicial.descripcion)
  const [permisos, setPermisos] = useState<PermisoRol[]>(inicial.permisos ?? [])
  const whatsapp = useWhatsappConectado()

  const guardar = useMutation({
    mutationFn: () => guardarRol({ rol: nombre.trim(), descripcion: descripcion.trim(), permisos }, id ?? undefined),
    onSuccess: () => {
      avisoExito(id ? 'Rol actualizado' : 'Rol creado')
      alCerrar(false)
      alGuardar()
    },
    onError: (error) => avisoError(error, 'No se pudo guardar el rol'),
  })

  return (
    <form
      className="grid gap-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        guardar.mutate()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del rol" placeholder="Ej. Supervisor" value={nombre} onChange={(evento) => setNombre(evento.target.value)} required />
        <Campo etiqueta="Descripción" value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} opcional />
      </div>
      <MatrizPermisos permisos={permisos} onCambiar={setPermisos} whatsappConectado={whatsapp.conectado} />

      <DialogFooter>
        <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={guardar.isPending || !nombre.trim()}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Guardar rol
        </Button>
      </DialogFooter>
    </form>
  )
}
