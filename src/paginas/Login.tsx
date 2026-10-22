import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { entrar } from '@/api'
import { Campo } from '@/components/Campo'
import { LayoutAcceso } from '@/components/layout/LayoutAcceso'
import { Button } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import { consumirSesionVencida, guardarSesion, leerSesion, nombreVisible } from '@/sesion'

const CREDENCIALES_VACIAS = { empresa: '', username: '', password: '' }

export function Login() {
  const navegar = useNavigate()
  const [credenciales, setCredenciales] = useState(CREDENCIALES_VACIAS)
  const [vencida] = useState(() => {
    leerSesion()
    return consumirSesionVencida()
  })

  const acceso = useMutation({
    mutationFn: () =>
      entrar(credenciales.empresa.trim(), credenciales.username.trim(), credenciales.password),
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
      descripcion="Ingresa con el usuario de tu empresa."
      pie={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={enviar}>
        {vencida ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tu sesión venció. Entra de nuevo para continuar.
          </p>
        ) : null}
        <Campo
          etiqueta="Empresa"
          name="empresa"
          placeholder="mi-empresa"
          value={credenciales.empresa}
          onChange={cambiar}
          autoComplete="organization"
          required
        />
        <Campo
          etiqueta="Usuario"
          name="username"
          value={credenciales.username}
          onChange={cambiar}
          autoComplete="username"
          required
        />
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          value={credenciales.password}
          onChange={cambiar}
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="lg" className="mt-2 h-11 w-full text-base" disabled={acceso.isPending}>
          {acceso.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Entrar
        </Button>
      </form>
    </LayoutAcceso>
  )
}
