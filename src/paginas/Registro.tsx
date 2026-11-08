import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, Copy, Download, Eye, EyeOff, LoaderCircle, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { consultarDocumento, entrar, registrar, type DatosRegistro, type DocumentoConsulta } from '@/api'
import { LayoutAcceso } from '@/components/layout/LayoutAcceso'
import { Button } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { marcarRecienRegistrado } from '@/lib/onboarding'
import { soloDigitos } from '@/lib/paises'
import { guardarSesion } from '@/sesion'

const PERU = { codigo: '51', bandera: '🇵🇪', placeholder: '999 999 999', largo: 9 }

const TOTAL_PASOS = 5

const PASOS = [
  { titulo: 'Tu negocio', descripcion: 'Cómo se va a llamar tu cuenta.' },
  { titulo: 'DNI o RUC', descripcion: 'Lo pedimos para abrir tu cuenta.' },
  { titulo: 'Sobre ti', descripcion: 'Tu nombre y correo.' },
  { titulo: 'WhatsApp', descripcion: 'El número con el que atiendes.' },
  { titulo: 'Contraseña', descripcion: 'Créala tú o genera una segura.' },
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
  documento: '',
  web: '',
}

export function Registro() {
  const navegar = useNavigate()
  const [paso, setPaso] = useState(1)
  const [direccion, setDireccion] = useState(1)
  const [datos, setDatos] = useState(REGISTRO_VACIO)
  const [clave2, setClave2] = useState('')
  const [errorPaso, setErrorPaso] = useState<string | null>(null)
  const [consulta, setConsulta] = useState<DocumentoConsulta | null>(null)
  const [tipoDoc, setTipoDoc] = useState<'dni' | 'ruc'>('dni')
  const [verClave, setVerClave] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const ultimoConsultado = useRef('')

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

  const buscarDoc = useMutation({
    mutationFn: (numero: string) => consultarDocumento(numero),
    onSuccess: (doc) => {
      ultimoConsultado.current = doc.numero
      setConsulta(doc)
      setErrorPaso(null)
      setDatos((actual) => ({
        ...actual,
        documento: doc.numero,
        nombre: actual.nombre.trim() || (doc.tipo === 'ruc' ? doc.nombre : actual.nombre),
        nombres: actual.nombres.trim() || doc.nombres || actual.nombres,
        apellidos: actual.apellidos.trim() || doc.apellidos || actual.apellidos,
      }))
    },
    onError: (error) => {
      setConsulta(null)
      setErrorPaso(error instanceof Error ? error.message : 'No encontramos ese número.')
    },
  })

  const ocupado = alta.isPending || buscarDoc.isPending
  const largoDoc = tipoDoc === 'dni' ? 8 : 11
  const digitosDoc = soloDigitos(datos.documento).slice(0, largoDoc)

  useEffect(() => {
    if (paso !== 2) return
    if (digitosDoc.length !== largoDoc) return
    if (digitosDoc === ultimoConsultado.current) return
    if (buscarDoc.isPending) return
    buscarDoc.mutate(digitosDoc)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al completar los dígitos
  }, [paso, digitosDoc, largoDoc])

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setErrorPaso(null)
    setDatos((actual) => ({ ...actual, [name]: value }))
  }

  function cambiarCelular(valor: string) {
    setErrorPaso(null)
    const digitos = soloDigitos(valor).slice(0, PERU.largo)
    setDatos((actual) => ({ ...actual, codigo_pais: PERU.codigo, celular: digitos }))
  }

  function elegirTipo(tipo: 'dni' | 'ruc') {
    setTipoDoc(tipo)
    setConsulta(null)
    setErrorPaso(null)
    ultimoConsultado.current = ''
    setDatos((actual) => ({ ...actual, documento: '' }))
  }

  function ponerDocumento(valor: string) {
    setErrorPaso(null)
    setConsulta(null)
    ultimoConsultado.current = ''
    setDatos((actual) => ({ ...actual, documento: soloDigitos(valor).slice(0, largoDoc) }))
  }

  function irAtras() {
    setErrorPaso(null)
    setDireccion(-1)
    setPaso((actual) => Math.max(1, actual - 1))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const error = validarPaso(paso, datos, clave2, consulta, tipoDoc)
    if (error) {
      setErrorPaso(error)
      return
    }
    if (paso < TOTAL_PASOS) {
      setDireccion(1)
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
        <div className="relative min-h-[12rem] overflow-hidden">
          <AnimatePresence mode="wait" custom={direccion}>
            <motion.div
              key={paso}
              custom={direccion}
              variants={variantes}
              initial="entrar"
              animate="centro"
              exit="salir"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4"
            >
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => elegirTipo('dni')}
                      className={cn(
                        'h-10 rounded-lg border text-sm font-medium',
                        tipoDoc === 'dni' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700',
                      )}
                    >
                      DNI
                    </button>
                    <button
                      type="button"
                      onClick={() => elegirTipo('ruc')}
                      className={cn(
                        'h-10 rounded-lg border text-sm font-medium',
                        tipoDoc === 'ruc' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700',
                      )}
                    >
                      RUC
                    </button>
                  </div>

                  <CasillasDocumento
                    largo={largoDoc}
                    valor={digitosDoc}
                    alCambiar={ponerDocumento}
                    desactivado={buscarDoc.isPending}
                  />

                  {buscarDoc.isPending ? (
                    <p className="flex items-center gap-2 text-sm text-zinc-500">
                      <LoaderCircle className="size-4 animate-spin" />
                      Buscando…
                    </p>
                  ) : null}

                  {consulta ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                      <p className="font-medium">{consulta.nombre}</p>
                      {consulta.tipo === 'ruc' && consulta.representante_nombre ? (
                        <p className="mt-1 text-emerald-900/80">{consulta.representante_nombre}</p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}

              {paso === 3 ? (
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

              {paso === 4 ? (
                <label className="campo-acceso">
                  <span>WhatsApp</span>
                  <div className="campo-tel">
                    <span>
                      {PERU.bandera} +{PERU.codigo}
                    </span>
                    <input
                      name="celular"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder={PERU.placeholder}
                      value={datos.celular}
                      onChange={(evento) => cambiarCelular(evento.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </label>
              ) : null}

              {paso === 5 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-lg"
                      onClick={() => {
                        const clave = generarClave()
                        setErrorPaso(null)
                        setVerClave(true)
                        setDatos((actual) => ({ ...actual, password: clave }))
                        setClave2(clave)
                      }}
                    >
                      <RefreshCw />
                      Generar segura
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-lg"
                      disabled={!datos.password}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(datos.password)
                          setCopiado(true)
                          window.setTimeout(() => setCopiado(false), 1500)
                        } catch {
                          setErrorPaso('No se pudo copiar.')
                        }
                      }}
                    >
                      {copiado ? <Check /> : <Copy />}
                      {copiado ? 'Copiada' : 'Copiar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-lg"
                      disabled={!datos.password}
                      onClick={() => guardarClaveArchivo(datos)}
                    >
                      <Download />
                      Guardar
                    </Button>
                  </div>

                  <label className="campo-acceso">
                    <span>Contraseña</span>
                    <div className="relative">
                      <input
                        name="password"
                        type={verClave ? 'text' : 'password'}
                        placeholder="Mínimo 8"
                        value={datos.password}
                        onChange={(evento) => {
                          setErrorPaso(null)
                          setDatos((actual) => ({ ...actual, password: evento.target.value }))
                        }}
                        autoComplete="new-password"
                        minLength={8}
                        autoFocus
                        required
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                        onClick={() => setVerClave((v) => !v)}
                        aria-label={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {verClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>
                  <label className="campo-acceso">
                    <span>Repite la contraseña</span>
                    <input
                      type={verClave ? 'text' : 'password'}
                      placeholder="Otra vez"
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
            </motion.div>
          </AnimatePresence>
        </div>

        {errorPaso ? <p className="text-sm text-rose-600">{errorPaso}</p> : null}

        <div className="mt-1 flex gap-2">
          {paso > 1 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              onClick={irAtras}
              disabled={ocupado}
            >
              <ArrowLeft />
              Atrás
            </Button>
          ) : null}
          <Button
            type="submit"
            className="h-11 flex-1 rounded-lg bg-zinc-900 text-sm text-white hover:bg-zinc-800"
            disabled={ocupado || (paso === 2 && !consulta)}
          >
            {ocupado ? <LoaderCircle className="animate-spin" /> : null}
            {paso < TOTAL_PASOS ? 'Continuar' : 'Crear cuenta'}
          </Button>
        </div>
      </form>
    </LayoutAcceso>
  )
}

function CasillasDocumento({
  largo,
  valor,
  alCambiar,
  desactivado,
}: {
  largo: number
  valor: string
  alCambiar: (valor: string) => void
  desactivado?: boolean
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digitos = Array.from({ length: largo }, (_, i) => valor[i] ?? '')

  useEffect(() => {
    refs.current[0]?.focus()
  }, [largo])

  function escribir(indice: number, texto: string) {
    const solo = soloDigitos(texto)
    if (solo.length > 1) {
      const juntos = (valor.slice(0, indice) + solo).slice(0, largo)
      alCambiar(juntos)
      const siguiente = Math.min(juntos.length, largo - 1)
      refs.current[siguiente]?.focus()
      return
    }
    const lista = digitos.slice()
    lista[indice] = solo.slice(-1)
    const nuevo = lista.join('').replace(/\s/g, '')
    alCambiar(nuevo)
    if (solo && indice < largo - 1) {
      refs.current[indice + 1]?.focus()
    }
  }

  function tecla(indice: number, evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Backspace' && !digitos[indice] && indice > 0) {
      refs.current[indice - 1]?.focus()
    }
  }

  function pegar(evento: ClipboardEvent<HTMLInputElement>) {
    evento.preventDefault()
    alCambiar(soloDigitos(evento.clipboardData.getData('text')).slice(0, largo))
    refs.current[Math.min(largo - 1, soloDigitos(evento.clipboardData.getData('text')).length)]?.focus()
  }

  return (
    <div className={cn('grid gap-1.5', largo === 8 ? 'grid-cols-8' : 'grid-cols-11')}>
      {digitos.map((digito, indice) => (
        <input
          key={`${largo}-${indice}`}
          ref={(nodo) => {
            refs.current[indice] = nodo
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digito}
          disabled={desactivado}
          onChange={(evento) => escribir(indice, evento.target.value)}
          onKeyDown={(evento) => tecla(indice, evento)}
          onPaste={pegar}
          aria-label={`Dígito ${indice + 1}`}
          className="h-11 rounded-lg border border-zinc-200 bg-white text-center text-base font-semibold tabular-nums outline-none focus:border-zinc-900"
        />
      ))}
    </div>
  )
}

const variantes = {
  entrar: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  centro: { opacity: 1, x: 0 },
  salir: (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}

function validarPaso(
  paso: number,
  datos: DatosRegistro,
  clave2 = '',
  consulta: DocumentoConsulta | null,
  tipoDoc: 'dni' | 'ruc',
): string | null {
  if (paso === 1) {
    const nombre = datos.nombre.trim()
    if (nombre.length < 3) return 'Pon el nombre de tu negocio.'
    if (!/\p{L}/u.test(nombre)) return 'El nombre tiene que tener letras.'
    if (/^(test|prueba|asdf|qwerty|empresa|negocio|xxx+|aaa+)$/i.test(nombre)) return 'Pon el nombre real.'
  }
  if (paso === 2) {
    const esperado = tipoDoc === 'dni' ? 8 : 11
    if (soloDigitos(datos.documento).length !== esperado) return `Completa los ${esperado} dígitos.`
    if (!consulta) return 'Espera a que aparezcan tus datos.'
  }
  if (paso === 3) {
    if (!consulta) return 'Vuelve y completa tu DNI o RUC.'
    if (datos.nombres.trim().length < 2) return 'Escribe tu nombre.'
    if (datos.apellidos.trim().length < 2) return 'Escribe tu apellido.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) return 'Revisa el correo.'
  }
  if (paso === 4) {
    const numero = soloDigitos(datos.celular)
    if (numero.length !== PERU.largo) return 'El WhatsApp debe tener 9 dígitos.'
  }
  if (paso === 5) {
    if (datos.password.length < 8) return 'Mínimo 8 caracteres.'
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(datos.password) || !/\d/.test(datos.password)) {
      return 'Usa letras y números.'
    }
    if (datos.password !== clave2) return 'Las contraseñas no coinciden.'
  }
  return null
}

function generarClave(largo = 14): string {
  const letras = 'abcdefghijkmnopqrstuvwxyz'
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '23456789'
  const simbolos = '!@#$%&*?'
  const todos = letras + mayus + nums + simbolos
  const obligatorio = [
    letras[aleatorio(letras.length)],
    mayus[aleatorio(mayus.length)],
    nums[aleatorio(nums.length)],
    simbolos[aleatorio(simbolos.length)],
  ]
  const resto = Array.from({ length: Math.max(0, largo - obligatorio.length) }, () => todos[aleatorio(todos.length)])
  return [...obligatorio, ...resto].sort(() => Math.random() - 0.5).join('')
}

function aleatorio(max: number) {
  const valores = new Uint32Array(1)
  crypto.getRandomValues(valores)
  return valores[0] % max
}

function guardarClaveArchivo(datos: DatosRegistro) {
  const texto = [
    'Belly · tu acceso',
    `Negocio: ${datos.nombre.trim() || '—'}`,
    `Correo: ${datos.correo.trim() || '—'}`,
    `Contraseña: ${datos.password}`,
    '',
    'Guarda este archivo en un lugar seguro.',
  ].join('\n')
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const ancla = document.createElement('a')
  ancla.href = url
  ancla.download = `belly-acceso-${soloDigitos(datos.documento) || 'cuenta'}.txt`
  ancla.click()
  URL.revokeObjectURL(url)
}

function limpiar(datos: DatosRegistro): DatosRegistro {
  return {
    ...datos,
    empresa: '',
    nombre: datos.nombre.trim(),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim().toLowerCase(),
    username: '',
    web: '',
    documento: soloDigitos(datos.documento),
    codigo_pais: PERU.codigo,
    celular: soloDigitos(datos.celular),
  }
}
