import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { entrar } from '@/api'
import { LogoMarca } from '@/components/Marca'
import { Button } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import {
  consumirSesionVencida,
  esOperador,
  guardarSesion,
  leerSesion,
  nombreVisible,
  rutaTrasEntrar,
} from '@/sesion'

const VACIAS = { identificador: '', password: '' }

export function LoginDueño() {
  const navegar = useNavigate()
  const [credenciales, setCredenciales] = useState(VACIAS)
  const sesion = leerSesion()
  const [vencida] = useState(() => {
    leerSesion()
    return consumirSesionVencida()
  })

  const acceso = useMutation({
    mutationFn: () => entrar(credenciales.identificador.trim(), credenciales.password),
    onSuccess: (entrada) => {
      if (!esOperador(entrada.usuario)) {
        avisoError(new Error('Este acceso es solo del dueño de Belly.'), 'Cuenta de empresa')
        return
      }
      guardarSesion(entrada)
      avisoExito('Sesión iniciada', `Hola, ${nombreVisible(entrada.usuario)}.`)
      navegar('/operador', { replace: true })
    },
    onError: (error) => avisoError(error, 'No se pudo entrar'),
  })

  if (sesion) {
    return <Navigate to={rutaTrasEntrar(sesion.usuario)} replace />
  }

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setCredenciales((actual) => ({ ...actual, [name]: value }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    acceso.mutate()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#0B1026] px-6 py-10 text-white">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <LogoMarca variante="claro" className="size-10" />
          <div>
            <p className="text-[1.0625rem] font-bold tracking-[-0.04em]">Belly</p>
            <p className="text-[11px] tracking-[0.08em] text-white/50 uppercase">Dueño</p>
          </div>
        </div>

        <h1 className="mt-10 font-heading text-[1.7rem] leading-none font-bold tracking-[-0.035em]">Tu panel</h1>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-white/55">
          Empresas, cuentas y lo que viene de planes. Aquí no está el CRM.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={enviar}>
          {vencida ? (
            <p className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Tu sesión venció. Entra de nuevo.
            </p>
          ) : null}

          <label className="grid gap-1.5 text-sm">
            <span className="text-white/70">Correo</span>
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
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-white outline-none placeholder:text-white/30 focus:border-white/40"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-white/70">Contraseña</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={credenciales.password}
              onChange={cambiar}
              autoComplete="current-password"
              required
              className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-white outline-none placeholder:text-white/30 focus:border-white/40"
            />
          </label>

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-white text-sm text-[#0B1026] hover:bg-white/90"
            disabled={acceso.isPending}
          >
            {acceso.isPending ? <LoaderCircle className="animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      </div>
    </main>
  )
}
