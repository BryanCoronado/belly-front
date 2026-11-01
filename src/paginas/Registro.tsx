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

const TOTAL_PASOS = 5

const PASOS = [
  { titulo: 'Tu negocio', descripcion: 'El nombre real de tu empresa. Así va a verse en Belly.' },
  { titulo: 'Sobre ti', descripcion: 'Nombre, apellido y un correo que uses de verdad.' },
  { titulo: 'Tu WhatsApp', descripcion: 'El número con el que atiendes. WhatsApp (Meta) cobra sus mensajes aparte del plan.' },
  { titulo: 'Tu contraseña', descripcion: 'Mínimo 8 caracteres, con letras y números.' },
  { titulo: 'Confirma', descripcion: 'Revisa los datos. Si algo está mal, vuelve atrás.' },
] as const

const REGISTRO_VACIO: DatosRegistro = {
  empresa: '',
  nombre: '',
  nombres: '',
  apellidos: '',
  correo: '',
  correo_confirmado: '',
  username: '',
  password: '',
  codigo_pais: '51',
  celular: '',
  web: '',
}

export function Registro() {
  const navegar = useNavigate()
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState(REGISTRO_VACIO)
  const [clave2, setClave2] = useState('')
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
    const error = validarPaso(paso, datos, clave2)
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
              <span>Nombre</span>
              <input
                name="nombres"
                placeholder="María"
                value={datos.nombres}
                onChange={cambiar}
                autoComplete="given-name"
                autoFocus
                required
              />
            </label>
            <label className="campo-acceso">
              <span>Apellido</span>
              <input
                name="apellidos"
                placeholder="Quispe"
                value={datos.apellidos}
                onChange={cambiar}
                autoComplete="family-name"
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
            <label className="sr-only" aria-hidden>
              Sitio web
              <input name="web" value={datos.web} onChange={cambiar} tabIndex={-1} autoComplete="off" />
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

            <p className="text-sm leading-relaxed text-zinc-500">
              El plan es Belly. Cada mensaje que mandes por la API lo cobra Meta a tu cuenta de Facebook. Los primeros 1.000 de servicio del mes son gratis.
            </p>
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
          <>
            <label className="campo-acceso">
              <span>Contraseña</span>
              <input
                name="password"
                type="password"
                placeholder="Letras y números, mínimo 8"
                value={datos.password}
                onChange={cambiar}
                autoComplete="new-password"
                minLength={8}
                autoFocus
                required
              />
            </label>
            <label className="campo-acceso">
              <span>Repite la contraseña</span>
              <input
                type="password"
                placeholder="La misma otra vez"
                value={clave2}
                onChange={(evento) => {
                  setErrorPaso(null)
                  setClave2(evento.target.value)
                }}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </>
        ) : null}

        {paso === 5 ? (
          <>
            <ul className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
              <li>
                <span className="text-zinc-500">Empresa </span>
                <span className="font-semibold">{datos.nombre.trim()}</span>
              </li>
              <li>
                <span className="text-zinc-500">Tú </span>
                <span className="font-semibold">
                  {datos.nombres.trim()} {datos.apellidos.trim()}
                </span>
              </li>
              <li>
                <span className="text-zinc-500">WhatsApp </span>
                <span className="font-semibold tabular-nums">
                  +{datos.codigo_pais} {datos.celular}
                </span>
              </li>
            </ul>
            <label className="campo-acceso">
              <span>Escribe otra vez tu correo</span>
              <input
                name="correo_confirmado"
                type="email"
                placeholder={datos.correo}
                value={datos.correo_confirmado}
                onChange={cambiar}
                autoComplete="off"
                autoFocus
                required
              />
            </label>
          </>
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

function validarPaso(paso: number, datos: DatosRegistro, clave2 = ''): string | null {
  if (paso === 1) {
    const nombre = datos.nombre.trim()
    if (nombre.length < 3) return 'El nombre del negocio debe tener al menos 3 letras.'
    if (!/\p{L}/u.test(nombre)) return 'El nombre del negocio tiene que tener letras.'
    if (/^(test|prueba|asdf|qwerty|empresa|negocio|xxx+|aaa+)$/i.test(nombre)) return 'Pon el nombre real de tu negocio.'
  }
  if (paso === 2) {
    if (datos.nombres.trim().length < 2) return 'Escribe tu nombre.'
    if (datos.apellidos.trim().length < 2) return 'Escribe tu apellido.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) return 'Revisa el correo.'
  }
  if (paso === 3) {
    const pais = paisPorCodigo(datos.codigo_pais)
    const numero = soloDigitos(datos.celular)
    if (numero.length < Math.max(7, pais.largo - 1) || numero.length > pais.largo + 1) {
      return `En ${pais.nombre} el número suele tener ${pais.largo} dígitos.`
    }
  }
  if (paso === 4) {
    if (datos.password.length < 8) return 'La contraseña necesita al menos 8 caracteres.'
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(datos.password) || !/\d/.test(datos.password)) {
      return 'La contraseña debe tener letras y números.'
    }
    if (datos.password !== clave2) return 'Las contraseñas no coinciden.'
  }
  if (paso === 5 && datos.correo_confirmado.trim().toLowerCase() !== datos.correo.trim().toLowerCase()) {
    return 'El correo no coincide. Escríbelo otra vez.'
  }
  return null
}

function limpiar(datos: DatosRegistro): DatosRegistro {
  const correo = datos.correo.trim().toLowerCase()
  return {
    ...datos,
    empresa: '',
    nombre: datos.nombre.trim(),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    correo,
    correo_confirmado: datos.correo_confirmado.trim().toLowerCase(),
    username: '',
    web: '',
    codigo_pais: soloDigitos(datos.codigo_pais),
    celular: soloDigitos(datos.celular),
  }
}
