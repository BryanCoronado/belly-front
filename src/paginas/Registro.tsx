import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { entrar, registrar, type DatosRegistro } from '@/api'
import { Campo } from '@/components/Campo'
import { LayoutAcceso } from '@/components/layout/LayoutAcceso'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { avisoError, avisoExito } from '@/lib/avisos'
import { guardarSesion } from '@/sesion'

const REGISTRO_VACIO: DatosRegistro = {
  empresa: '',
  nombre: '',
  nombres: '',
  apellidos: '',
  correo: '',
  username: '',
  password: '',
}

export function Registro() {
  const navegar = useNavigate()
  const [datos, setDatos] = useState(REGISTRO_VACIO)

  const alta = useMutation({
    mutationFn: async () => {
      const limpios = limpiar(datos)
      await registrar(limpios)
      return entrar(limpios.empresa, limpios.username, limpios.password)
    },
    onSuccess: (sesion) => {
      guardarSesion(sesion)
      avisoExito('Cuenta creada', `Tu empresa ${sesion.usuario.empresa} ya está lista.`)
      navegar('/inicio', { replace: true })
    },
    onError: (error) => avisoError(error, 'No se pudo crear la cuenta'),
  })

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((actual) => ({ ...actual, [name]: value }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    alta.mutate()
  }

  return (
    <LayoutAcceso
      ancho="xl"
      titulo="Crea tu cuenta"
      descripcion="Registra tu empresa y su usuario administrador."
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form className="grid gap-6" onSubmit={enviar}>
        <Seccion titulo="Empresa">
          <Campo
            etiqueta="Identificador"
            name="empresa"
            placeholder="mi-empresa"
            ayuda="Lo usarás para iniciar sesión."
            value={datos.empresa}
            onChange={cambiar}
            required
          />
          <Campo
            etiqueta="Nombre comercial"
            name="nombre"
            value={datos.nombre}
            onChange={cambiar}
            autoComplete="organization"
            required
          />
        </Seccion>

        <Separator />

        <Seccion titulo="Administrador">
          <Campo etiqueta="Nombres" name="nombres" value={datos.nombres} onChange={cambiar} autoComplete="given-name" required />
          <Campo etiqueta="Apellidos" name="apellidos" value={datos.apellidos} onChange={cambiar} autoComplete="family-name" opcional />
          <Campo etiqueta="Correo" name="correo" type="email" value={datos.correo} onChange={cambiar} autoComplete="email" opcional />
          <Campo etiqueta="Usuario" name="username" value={datos.username} onChange={cambiar} autoComplete="username" required />
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
        </Seccion>

        <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={alta.isPending}>
          {alta.isPending ? <LoaderCircle className="animate-spin" /> : null}
          Crear cuenta
        </Button>
      </form>
    </LayoutAcceso>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-4 text-sm font-semibold tracking-wide text-primary uppercase">{titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function limpiar(datos: DatosRegistro): DatosRegistro {
  return Object.fromEntries(
    Object.entries(datos).map(([campo, valor]) => [campo, campo === 'password' ? valor : valor.trim()]),
  ) as DatosRegistro
}
