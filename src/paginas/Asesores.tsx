import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, LoaderCircle, MessageSquare, Plus, UserRound } from 'lucide-react'
import { cambiarEstadoAsesor, crearAsesor, leerAsesores, subirFotoAsesor, type Asesor, type DatosAsesor } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'
import { EditorReparto } from './asesores/EditorReparto'
import { GruposAtencion } from './asesores/GruposAtencion'

const CLAVE = ['asesores']
const VACIO: DatosAsesor = { nombres: '', apellidos: '', usuario: '', password: '', correo: '', celular: '' }

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

const PESTANAS = [
  { id: 'equipo', titulo: 'Mi equipo' },
  { id: 'grupos', titulo: 'Grupos' },
  { id: 'reparto', titulo: 'Reparto de chats' },
] as const

type Pestana = (typeof PESTANAS)[number]['id']

export function Asesores() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const [params, setParams] = useSearchParams()
  const pestana = PESTANAS.find((p) => p.id === params.get('tab'))?.id ?? 'equipo'
  const [repartoAbierto, setRepartoAbierto] = useState(false)
  const vioReparto = repartoAbierto || pestana === 'reparto'

  const setPestana = (id: Pestana) => {
    if (vioReparto || id === 'reparto') setRepartoAbierto(true)
    setParams({ tab: id }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <CabeceraPagina titulo="Asesores" descripcion="Las personas que atienden tus chats, sus grupos y cómo les llegan los clientes." />

      {admin ? (
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max gap-1 rounded-lg bg-muted p-1">
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
      ) : null}

      {!admin || pestana === 'equipo' ? <PanelAsesores admin={admin} /> : null}
      {admin && pestana === 'grupos' ? <GruposAtencion alIrAReparto={() => setPestana('reparto')} /> : null}
      {/* El editor queda montado al cambiar de pestaña para no perder lo que no se guardó. */}
      {admin && vioReparto ? (
        <div className={cn(pestana !== 'reparto' && 'hidden')}>
          <EditorReparto alIrAGrupos={() => setPestana('grupos')} />
        </div>
      ) : null}
    </div>
  )
}

function PanelAsesores({ admin }: { admin: boolean }) {
  const cliente = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const consulta = useQuery({ queryKey: CLAVE, queryFn: leerAsesores })

  const activos = consulta.data?.filter((asesor) => asesor.activo).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {consulta.data
            ? `${activos} de ${consulta.data.length} asesores están activos. Solo ellos reciben chats nuevos y pueden recibir transferencias.`
            : 'Cargando asesores…'}
        </p>
        {admin ? (
          <Button size="lg" className="h-10 w-full sm:w-auto" onClick={() => setAbierto(true)}>
            <Plus />
            Nuevo asesor
          </Button>
        ) : null}
      </div>

      <TablaResponsiva<Asesor>
        filas={consulta.data}
        cargando={consulta.isLoading}
        clave={(fila) => String(fila.id)}
        columnas={[
          {
            titulo: 'Asesor',
            principal: true,
            celda: (fila) => (
              <div className="flex items-center gap-3">
                <FotoAsesor asesor={fila} editable={admin} alCambiar={() => cliente.invalidateQueries({ queryKey: CLAVE })} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{fila.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">@{fila.usuario}</p>
                </div>
              </div>
            ),
          },
          { titulo: 'Contacto', celda: (fila) => fila.celular || fila.correo || '—' },
          { titulo: 'Rol', celda: (fila) => fila.rol || '—' },
          {
            titulo: 'Chats abiertos',
            celda: (fila) => (
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-4 text-muted-foreground" />
                {fila.chats_abiertos}
              </span>
            ),
          },
          {
            titulo: 'Estado',
            celda: (fila) => (
              <Badge variant={fila.activo ? 'default' : 'secondary'}>{fila.activo ? 'Activo' : 'Inactivo'}</Badge>
            ),
          },
        ]}
        acciones={admin ? (fila) => <BotonEstado asesor={fila} alCambiar={() => cliente.invalidateQueries({ queryKey: CLAVE })} /> : undefined}
        vacio={{
          icono: UserRound,
          titulo: 'Aún no hay asesores',
          texto: admin ? 'Crea el primero con el botón “Nuevo asesor”.' : 'Pide a un administrador que cree a tu equipo.',
        }}
      />

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo asesor</DialogTitle>
            <DialogDescription>Podrá entrar al sistema con su usuario y contraseña y atender chats.</DialogDescription>
          </DialogHeader>
          {abierto ? (
            <FormularioAsesor
              alCerrar={() => setAbierto(false)}
              alGuardar={() => cliente.invalidateQueries({ queryKey: CLAVE })}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FotoAsesor({ asesor, editable, alCambiar }: { asesor: Asesor; editable: boolean; alCambiar: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const subir = useMutation({
    mutationFn: (archivo: File) => subirFotoAsesor(asesor.id, archivo),
    onSuccess: () => {
      avisoExito('Foto actualizada')
      alCambiar()
    },
    onError: (error) => avisoError(error, 'No se pudo subir la foto'),
  })

  return (
    <div className="relative">
      <Avatar className="size-10">
        {asesor.foto ? <AvatarImage src={asesor.foto} alt={asesor.nombre} /> : null}
        <AvatarFallback>{iniciales(asesor.nombre) || <UserRound className="size-4" />}</AvatarFallback>
      </Avatar>
      {editable ? (
        <>
          <button
            type="button"
            className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground"
            aria-label={`Cambiar foto de ${asesor.nombre}`}
            disabled={subir.isPending}
            onClick={() => input.current?.click()}
          >
            {subir.isPending ? <LoaderCircle className="size-3 animate-spin" /> : <Camera className="size-3" />}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0]
              evento.target.value = ''
              if (archivo) {
                subir.mutate(archivo)
              }
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function BotonEstado({ asesor, alCambiar }: { asesor: Asesor; alCambiar: () => void }) {
  const estado = useMutation({
    mutationFn: () => cambiarEstadoAsesor(asesor.id, !asesor.activo),
    onSuccess: () => {
      avisoExito(asesor.activo ? 'Asesor desactivado' : 'Asesor activado')
      alCambiar()
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el estado'),
  })

  return (
    <Button variant="outline" size="sm" disabled={estado.isPending} onClick={() => estado.mutate()}>
      {asesor.activo ? 'Desactivar' : 'Activar'}
    </Button>
  )
}

function FormularioAsesor({ alCerrar, alGuardar }: { alCerrar: () => void; alGuardar: () => void }) {
  const [datos, setDatos] = useState<DatosAsesor>(VACIO)

  const guardar = useMutation({
    mutationFn: () => crearAsesor(datos),
    onSuccess: () => {
      avisoExito('Asesor creado', 'Ya puede iniciar sesión con su usuario.')
      alCerrar()
      alGuardar()
    },
    onError: (error) => avisoError(error, 'No se pudo crear el asesor'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((actual) => ({ ...actual, [name]: value }))
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
          ayuda="Mínimo 8 caracteres."
          value={datos.password}
          onChange={cambiar}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Campo etiqueta="Celular" name="celular" value={datos.celular} onChange={cambiar} autoComplete="off" inputMode="tel" opcional />
        <Campo etiqueta="Correo" name="correo" type="email" value={datos.correo} onChange={cambiar} autoComplete="off" opcional />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Crear asesor
        </Button>
      </div>
    </form>
  )
}
