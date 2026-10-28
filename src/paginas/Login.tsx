import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { entrar } from '@/api'
import { LayoutAcceso } from '@/components/layout/LayoutAcceso'
import { Button } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import { consumirSesionVencida, guardarSesion, leerSesion, nombreVisible } from '@/sesion'

const CREDENCIALES_VACIAS = { identificador: '', password: '' }

export function Login() {
  const navegar = useNavigate()
  const [credenciales, setCredenciales] = useState(CREDENCIALES_VACIAS)
  const [vencida] = useState(() => {
    leerSesion()
    return consumirSesionVencida()
  })

  const acceso = useMutation({
    mutationFn: () => entrar(credenciales.identificador.trim(), credenciales.password),
    onSuccess: (sesion) => {
      guardarSesion(sesion)
      avisoExito('Sesión iniciada', `Bienvenido, ${nombreVisible(sesion.usuario)}.`)
      navegar('/inicio', { replace: true })
    },
    onError: (error) => avisoError(error, 'No se pudo iniciar sesión'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setCredenciales((actual) => ({ ...actual, [name]: value }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    acceso.mutate()
  }

  return (
    <LayoutAcceso
      titulo="Iniciar sesión"
      descripcion="Usa el correo de tu cuenta."
      enlace={{ texto: 'Crear cuenta', to: '/registro' }}
      pie={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={enviar}>
        {vencida ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tu sesión venció. Entra de nuevo para continuar.
          </p>
        ) : null}

        <label className="campo-acceso">
          <span>Correo</span>
          <input
            name="identificador"
            type="text"
            inputMode="email"
            placeholder="tu@correo.com"
            value={credenciales.identificador}
            onChange={cambiar}
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label className="campo-acceso">
          <span>Contraseña</span>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={credenciales.password}
            onChange={cambiar}
            autoComplete="current-password"
            required
          />
        </label>

        <Button
          type="submit"
          className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm text-white hover:bg-zinc-800"
          disabled={acceso.isPending}
        >
          {acceso.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Entrar
        </Button>
      </form>
    </LayoutAcceso>
  )
}
