import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, LoaderCircle } from 'lucide-react'
import { guardarEmpresaPerfil, guardarPerfil, leerPerfil, subirFotoPerfil, type PerfilCuenta } from '@/api'
import { InterruptorModoAhorro } from '@/components/InterruptorModoAhorro'
import { Campo, CampoSelect } from '@/components/Campo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAvisos } from '@/hooks/use-avisos'
import { avisoError, avisoExito } from '@/lib/avisos'
import { guardarPrefsAviso } from '@/lib/preferencias-aviso'
import { pedirPermisoAvisos } from '@/lib/sonido-aviso'
import { actualizarUsuarioSesion, esAdministrador, leerSesion } from '@/sesion'

export function Perfil() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const perfil = useQuery({ queryKey: ['perfil'], queryFn: leerPerfil })

  useEffect(() => {
    if (!perfil.data) return
    actualizarUsuarioSesion({
      nombres: perfil.data.nombres,
      apellidos: perfil.data.apellidos,
      foto: perfil.data.foto,
      empresa_nombre: perfil.data.empresa.nombre,
    })
  }, [perfil.data])

  if (perfil.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando tu perfil…</p>
  }
  if (perfil.isError || !perfil.data) {
    return <p className="text-sm text-destructive">{perfil.error?.message ?? 'No se pudo cargar el perfil.'}</p>
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Cuenta datos={perfil.data} />
      <AvisosPersonales />
      {admin ? <InterruptorModoAhorro /> : null}
      {admin ? <Empresa datos={perfil.data} /> : null}
    </div>
  )
}

function Cuenta({ datos }: { datos: PerfilCuenta }) {
  const [nombres, setNombres] = useState(datos.nombres)
  const [apellidos, setApellidos] = useState(datos.apellidos)
  const [correo, setCorreo] = useState(datos.correo)
  const [celular, setCelular] = useState(datos.celular)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const guardar = useMutation({
    mutationFn: () =>
      guardarPerfil({
        nombres,
        apellidos,
        correo,
        celular,
        password_actual: nueva ? actual : undefined,
        password_nueva: nueva || undefined,
      }),
    onSuccess: (guardado) => {
      setActual('')
      setNueva('')
      actualizarUsuarioSesion({ nombres: guardado.nombres, apellidos: guardado.apellidos, foto: guardado.foto })
      avisoExito('Perfil actualizado')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const foto = useMutation({
    mutationFn: subirFotoPerfil,
    onSuccess: (guardado) => {
      actualizarUsuarioSesion({ foto: guardado.foto })
      avisoExito('Foto actualizada')
    },
    onError: (error) => avisoError(error, 'No se pudo subir la foto'),
  })

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (nueva && nueva.length < 8) {
      avisoError(new Error('La contraseña nueva necesita al menos 8 caracteres.'), 'Revisa la contraseña')
      return
    }
    if (nueva && !actual) {
      avisoError(new Error('Escribe tu contraseña actual para cambiarla.'), 'Revisa la contraseña')
      return
    }
    guardar.mutate()
  }

  const nombre = [nombres, apellidos].filter(Boolean).join(' ') || datos.usuario
  const fotoActual = foto.data?.foto ?? datos.foto

  return (
    <form className="rounded-xl border bg-card p-5 md:p-6" onSubmit={enviar}>
      <h2 className="text-base font-semibold">Tu cuenta</h2>
      <p className="mt-1 text-sm text-muted-foreground">Este es el usuario con el que entras: {datos.usuario}</p>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-16">
            {fotoActual ? <AvatarImage src={fotoActual} alt={nombre} /> : null}
            <AvatarFallback className="text-base">{iniciales(nombre)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border bg-white text-zinc-600 shadow-sm hover:text-zinc-900"
            aria-label="Cambiar foto"
            disabled={foto.isPending}
            onClick={() => input.current?.click()}
          >
            {foto.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0]
              evento.target.value = ''
              if (archivo) foto.mutate(archivo)
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">JPG, PNG o WEBP. Hasta 5 MB.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" value={nombres} onChange={(evento) => setNombres(evento.target.value)} required />
        <Campo etiqueta="Apellidos" value={apellidos} onChange={(evento) => setApellidos(evento.target.value)} opcional />
        <Campo etiqueta="Correo" type="email" value={correo} onChange={(evento) => setCorreo(evento.target.value)} required />
        <Campo
          etiqueta="Celular"
          value={celular}
          onChange={(evento) => setCelular(evento.target.value.replace(/[^\d+]/g, ''))}
          opcional
          inputMode="tel"
        />
      </div>

      <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
        <Campo
          etiqueta="Contraseña actual"
          type="password"
          value={actual}
          onChange={(evento) => setActual(evento.target.value)}
          autoComplete="current-password"
          opcional
        />
        <Campo
          etiqueta="Contraseña nueva"
          type="password"
          value={nueva}
          onChange={(evento) => setNueva(evento.target.value)}
          autoComplete="new-password"
          ayuda="Déjala vacía si no quieres cambiarla."
          opcional
        />
      </div>

      <Button type="submit" className="mt-5" disabled={guardar.isPending}>
        {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
        Guardar
      </Button>
    </form>
  )
}

function AvisosPersonales() {
  const prefs = useAvisos()

  return (
    <section className="rounded-xl border bg-card p-5 md:p-6">
      <h2 className="text-base font-semibold">Avisos</h2>
      <p className="mt-1 text-sm text-muted-foreground">Cómo te enteras cuando te escriben o te pasan un chat.</p>
      <div className="mt-5 grid gap-4">
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Sonido</span>
            <span className="block text-xs text-muted-foreground">Un tono corto cuando llega un mensaje tuyo.</span>
          </span>
          <Switch checked={prefs.sonido} onCheckedChange={(valor) => guardarPrefsAviso({ sonido: valor })} />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Avisos del navegador</span>
            <span className="block text-xs text-muted-foreground">Aunque estés en otra pestaña.</span>
          </span>
          <Switch
            checked={prefs.escritorio}
            onCheckedChange={(valor) => {
              guardarPrefsAviso({ escritorio: valor })
              if (valor) pedirPermisoAvisos()
            }}
          />
        </label>
      </div>
    </section>
  )
}

function Empresa({ datos }: { datos: PerfilCuenta }) {
  const consultas = useQueryClient()
  const [nombre, setNombre] = useState(datos.empresa.nombre)
  const [correo, setCorreo] = useState(datos.empresa.correo)
  const [avisoIa, setAvisoIa] = useState(datos.empresa.id_aviso_ia ? String(datos.empresa.id_aviso_ia) : '')

  const guardar = useMutation({
    mutationFn: () =>
      guardarEmpresaPerfil({
        nombre,
        correo,
        id_aviso_ia: avisoIa ? Number(avisoIa) : null,
      }),
    onSuccess: (guardado) => {
      consultas.setQueryData(['perfil'], guardado)
      actualizarUsuarioSesion({ empresa_nombre: guardado.empresa.nombre })
      setAvisoIa(guardado.empresa.id_aviso_ia ? String(guardado.empresa.id_aviso_ia) : '')
      avisoExito('Empresa actualizada')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar la empresa'),
  })

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    guardar.mutate()
  }

  return (
    <form className="rounded-xl border bg-card p-5 md:p-6" onSubmit={enviar}>
      <h2 className="text-base font-semibold">Empresa</h2>
      <p className="mt-1 text-sm text-muted-foreground">Solo el administrador puede cambiar estos datos.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" value={nombre} onChange={(evento) => setNombre(evento.target.value)} required />
        <Campo
          etiqueta="Correo"
          type="email"
          value={correo}
          onChange={(evento) => setCorreo(evento.target.value)}
          opcional
        />
      </div>
      <div className="mt-4">
        <CampoSelect
          etiqueta="Avisos de la IA"
          value={avisoIa}
          onChange={(evento) => setAvisoIa(evento.target.value)}
          ayuda="Si un chat lo atiende la IA, el aviso con sonido llega a esta persona. Si no eliges a nadie, llega al administrador."
        >
          <option value="">Administrador de la empresa</option>
          {(datos.destinos_aviso ?? []).map((destino) => (
            <option key={destino.id} value={destino.id}>
              {destino.nombre}
              {destino.admin ? ' · Admin' : ''}
            </option>
          ))}
        </CampoSelect>
      </div>
      <Button type="submit" className="mt-5" disabled={guardar.isPending}>
        {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
        Guardar empresa
      </Button>
    </form>
  )
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}
