import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { entrar, registrar, type DatosRegistro } from '@/api'
import { LayoutAcceso } from '@/components/layout/LayoutAcceso'
import { Button } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import { marcarRecienRegistrado } from '@/lib/onboarding'
import { PAISES_TELEFONO, paisPorCodigo, soloDigitos } from '@/lib/paises'
import { guardarSesion } from '@/sesion'

const TOTAL_PASOS = 4

const PASOS = [
  { titulo: 'Tu negocio', descripcion: 'Así va a aparecer Belly para tu equipo.' },
  { titulo: 'Sobre ti', descripcion: 'Con el correo vas a entrar después.' },
  { titulo: 'Tu WhatsApp', descripcion: 'El número con el que atiendes a tus clientes.' },
  { titulo: 'Tu contraseña', descripcion: 'Mínimo 8 caracteres. Guárdala bien.' },
] as const

const REGISTRO_VACIO: DatosRegistro = {
  empresa: '',
  nombre: '',
  nombres: '',
  apellidos: '',
  correo: '',
  username: '',
  password: '',
  codigo_pais: '51',
  celular: '',
}

export function Registro() {
  const navegar = useNavigate()
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState(REGISTRO_VACIO)
  const [errorPaso, setErrorPaso] = useState<string | null>(null)

  const alta = useMutation({
    mutationFn: async () => {
      const limpios = limpiar(datos)
      await registrar(limpios)
      return entrar(limpios.correo, limpios.password)
    },
    onSuccess: (sesion) => {
      marcarRecienRegistrado()
      guardarSesion(sesion)
      avisoExito('Cuenta creada', 'Tu espacio ya está listo.')
      navegar('/inicio', { replace: true })
    },
    onError: (error) => avisoError(error, 'No se pudo crear la cuenta'),
  })

  const pais = paisPorCodigo(datos.codigo_pais)

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setErrorPaso(null)
    setDatos((actual) => ({ ...actual, [name]: value }))
  }

  function cambiarPais(codigo: string) {
    setErrorPaso(null)
    setDatos((actual) => ({ ...actual, codigo_pais: codigo, celular: '' }))
  }

  function cambiarCelular(valor: string) {
    setErrorPaso(null)
    const digitos = soloDigitos(valor).slice(0, pais.largo + 1)
    setDatos((actual) => ({ ...actual, celular: digitos }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const error = validarPaso(paso, datos)
    if (error) {
      setErrorPaso(error)
      return
    }
    if (paso < TOTAL_PASOS) {
      setPaso((actual) => actual + 1)
      return
    }
    alta.mutate()
  }

  return (
    <LayoutAcceso
      titulo={PASOS[paso - 1].titulo}
      descripcion={PASOS[paso - 1].descripcion}
      paso={{ actual: paso, total: TOTAL_PASOS }}
      enlace={{ texto: 'Iniciar sesión', to: '/' }}
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={enviar}>
        {paso === 1 ? (
          <label className="campo-acceso">
            <span>Nombre del negocio</span>
            <input
              name="nombre"
              placeholder="Studio Luna"
              value={datos.nombre}
              onChange={cambiar}
              autoComplete="organization"
              autoFocus
              required
            />
          </label>
        ) : null}

        {paso === 2 ? (
          <>
            <label className="campo-acceso">
              <span>Nombre completo</span>
              <input
                name="nombres"
                placeholder="María Quispe"
                value={datos.nombres}
                onChange={cambiar}
                autoComplete="name"
                autoFocus
                required
              />
            </label>
            <label className="campo-acceso">
              <span>Correo</span>
              <input
                name="correo"
                type="email"
                placeholder="tu@correo.com"
                value={datos.correo}
                onChange={cambiar}
                autoComplete="email"
                required
              />
            </label>
          </>
        ) : null}

        {paso === 3 ? (
          <>
            <label className="campo-acceso">
              <span>País</span>
              <select
                value={datos.codigo_pais}
                onChange={(evento) => cambiarPais(evento.target.value)}
                autoFocus
              >
                {PAISES_TELEFONO.map((item) => (
                  <option key={`${item.iso}-${item.codigo}`} value={item.codigo}>
                    {item.bandera} +{item.codigo} {item.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo-acceso">
              <span>WhatsApp</span>
              <div className="campo-tel">
                <span>
                  {pais.bandera} +{pais.codigo}
                </span>
                <input
                  name="celular"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder={pais.placeholder}
                  value={datos.celular}
                  onChange={(evento) => cambiarCelular(evento.target.value)}
                  required
                />
              </div>
            </label>
          </>
        ) : null}

        {paso === 4 ? (
          <label className="campo-acceso">
            <span>Contraseña</span>
            <input
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={datos.password}
              onChange={cambiar}
              autoComplete="new-password"
              minLength={8}
              autoFocus
              required
            />
          </label>
        ) : null}

        {errorPaso ? <p className="text-sm text-rose-600">{errorPaso}</p> : null}

        <div className="mt-1 flex gap-2">
          {paso > 1 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              onClick={() => {
                setErrorPaso(null)
                setPaso((actual) => actual - 1)
              }}
            >
              <ArrowLeft />
              Atrás
            </Button>
          ) : null}
          <Button
            type="submit"
            className="h-11 flex-1 rounded-lg bg-zinc-900 text-sm text-white hover:bg-zinc-800"
            disabled={alta.isPending}
          >
            {alta.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {paso < TOTAL_PASOS ? 'Continuar' : 'Crear cuenta'}
          </Button>
        </div>
      </form>
    </LayoutAcceso>
  )
}

function validarPaso(paso: number, datos: DatosRegistro): string | null {
  if (paso === 1 && datos.nombre.trim().length < 2) return 'Escribe el nombre de tu negocio.'
  if (paso === 2) {
    if (datos.nombres.trim().length < 2) return 'Escribe tu nombre.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) return 'Revisa el correo.'
  }
  if (paso === 3) {
    const pais = paisPorCodigo(datos.codigo_pais)
    const numero = soloDigitos(datos.celular)
    if (numero.length < Math.max(7, pais.largo - 1) || numero.length > pais.largo + 1) {
      return `En ${pais.nombre} el número suele tener ${pais.largo} dígitos.`
    }
  }
  if (paso === 4 && datos.password.length < 8) return 'La contraseña necesita al menos 8 caracteres.'
  return null
}

function limpiar(datos: DatosRegistro): DatosRegistro {
  const correo = datos.correo.trim().toLowerCase()
  const nombres = datos.nombres.trim()
  const partes = nombres.split(/\s+/)
  return {
    ...datos,
    empresa: '',
    nombre: datos.nombre.trim(),
    nombres: partes[0] ?? nombres,
    apellidos: partes.slice(1).join(' ') || datos.apellidos.trim(),
    correo,
    username: '',
    codigo_pais: soloDigitos(datos.codigo_pais),
    celular: soloDigitos(datos.celular),
  }
}
