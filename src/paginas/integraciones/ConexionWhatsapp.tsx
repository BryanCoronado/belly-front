import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  ExternalLink,
  Lock,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unplug,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  conectarNumeroWhatsapp,
  desconectarNumeroWhatsapp,
  desconectarWhatsapp,
  guardarAppMeta,
  leerEstadoWhatsapp,
  regenerarTokenWebhook,
  type DatosNumeroWhatsapp,
  type EstadoWhatsapp,
  type NumeroWhatsapp,
} from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Campo } from '@/components/Campo'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { useGuia } from '@/guia/useGuia'
import { CLAVE_WHATSAPP_CONECTADO } from '@/hooks/use-whatsapp'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'
import { repartoGuardadoEnServidor } from '@/paginas/asesores/borradorReparto'

const CLAVE_ESTADO = ['whatsapp-estado']

const PASOS = [
  { titulo: 'Tu app de Meta', resumen: 'Identificador y clave' },
  { titulo: 'Recibir mensajes', resumen: 'Enlace y token' },
  { titulo: 'Tu número', resumen: 'Datos y acceso' },
] as const

const ULTIMO = PASOS.length - 1

/** Cada paso solo cuenta como listo si todos los anteriores también lo están. */
function pasosListos(estado: EstadoWhatsapp): boolean[] {
  const base = [estado.pasos.app_meta, estado.pasos.webhook, estado.pasos.numero]
  return base.map((listo, indice) => base.slice(0, indice + 1).every(Boolean) && listo)
}

export function ConexionWhatsapp() {
  useGuia('whatsapp')
  const admin = esAdministrador(leerSesion()?.usuario)
  const consultas = useQueryClient()
  const estado = useQuery({
    queryKey: CLAVE_ESTADO,
    queryFn: leerEstadoWhatsapp,
    enabled: admin,
    refetchInterval: (consulta) => (consulta.state.data && !consulta.state.data.pasos.webhook ? 5000 : false),
  })

  function actualizar(nuevo: EstadoWhatsapp) {
    consultas.setQueryData(CLAVE_ESTADO, nuevo)
    void consultas.invalidateQueries({ queryKey: CLAVE_WHATSAPP_CONECTADO })
    void consultas.invalidateQueries({ queryKey: ['menu-modulos'] })
    void consultas.invalidateQueries({ queryKey: ['catalogo-permisos'] })
  }

  if (!admin) {
    return (
      <div className="space-y-6">
        <CabeceraPagina titulo="WhatsApp" descripcion="WhatsApp Business de tu empresa." />
        <Aviso>Solo el administrador puede conectarlo.</Aviso>
      </div>
    )
  }

  const datos = estado.data
  const completo = datos ? pasosListos(datos).every(Boolean) : false
  const hayConexion = datos ? datos.pasos.app_meta || datos.pasos.webhook || datos.numeros.length > 0 : false

  return (
    <div className="min-w-0 space-y-6">
      <CabeceraPagina
        titulo="WhatsApp"
        descripcion="Conecta el WhatsApp de tu empresa"
        acciones={
          datos ? (
            <>
              <Badge
                className={cn(
                  'h-7 px-3 text-sm',
                  completo ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600',
                )}
              >
                {completo ? <CircleCheck /> : <CircleAlert />}
                {completo ? 'Conectado' : 'Sin terminar'}
              </Badge>
              {hayConexion ? <BotonDesconectar alActualizar={actualizar} /> : null}
            </>
          ) : null
        }
      />

      {!datos ? (
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Skeleton className="h-16 rounded-xl lg:h-52" />
          <Skeleton className="h-80 rounded-xl sm:h-96" />
        </div>
      ) : (
        <>
          {completo && !repartoGuardadoEnServidor() ? (
            <div className="flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">
                <span className="font-medium">Siguiente:</span>{' '}
                <span className="text-muted-foreground">decide quién recibe cada chat nuevo.</span>
              </span>
              <Link
                to="/asesores?tab=reparto"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full sm:w-auto')}
              >
                Reparto de chats
                <ArrowRight />
              </Link>
            </div>
          ) : null}
          <Asistente estado={datos} alActualizar={actualizar} />
        </>
      )}
    </div>
  )
}

type PropsPaso = { estado: EstadoWhatsapp; alActualizar: (estado: EstadoWhatsapp) => void }

function BotonDesconectar({ alActualizar }: { alActualizar: (estado: EstadoWhatsapp) => void }) {
  const [abierto, setAbierto] = useState(false)
  const desconectar = useMutation({
    mutationFn: desconectarWhatsapp,
    onSuccess: (nuevo) => {
      setAbierto(false)
      alActualizar(nuevo)
      avisoExito('WhatsApp desconectado')
    },
    onError: (error) => avisoError(error, 'No se pudo desconectar WhatsApp'),
  })

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)} className="w-full text-destructive hover:text-destructive sm:w-auto">
        <Unplug />
        Desconectar
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desconectar WhatsApp?</DialogTitle>
            <DialogDescription>
              Dejarán de llegar mensajes y el chat se desactivará. Tus conversaciones y clientes se conservan. Para volver a usarlo tendrás que repetir los pasos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={() => desconectar.mutate()} disabled={desconectar.isPending}>
              {desconectar.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Asistente({ estado, alActualizar }: PropsPaso) {
  const listos = pasosListos(estado)
  const primerPendiente = listos.indexOf(false)
  const tope = primerPendiente === -1 ? ULTIMO : primerPendiente
  const [elegido, setElegido] = useState(tope)
  // Si un paso anterior deja de estar listo (p. ej. se cambia el token), no se puede seguir en uno posterior.
  const activo = Math.min(elegido, tope)
  const completo = listos.every(Boolean)

  const alAvanzar = () => setElegido(activo + 1)

  return (
    <div className="grid min-w-0 items-start gap-4 sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Pasos" data-tour="pasos-lista" className="min-w-0 lg:sticky lg:top-24">
        <ol className="flex items-center rounded-xl border bg-white p-2 lg:flex-col lg:items-stretch lg:gap-0 lg:border-0 lg:bg-transparent lg:p-0">
          {PASOS.map((paso, indice) => {
            const hecho = listos[indice]
            const bloqueado = indice > tope
            const actual = indice === activo
            return (
              <li key={paso.titulo} className="contents lg:relative lg:mb-3 lg:block">
                {indice < ULTIMO ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-10 bottom-0 left-[19px] hidden w-px lg:block',
                      hecho ? 'bg-emerald-500' : 'bg-zinc-200',
                    )}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => setElegido(indice)}
                  aria-current={actual ? 'step' : undefined}
                  aria-label={`${paso.titulo}${hecho ? ', completado' : bloqueado ? ', bloqueado' : ''}`}
                  className={cn(
                    'flex shrink-0 items-center justify-center gap-3 rounded-lg p-1.5 text-left transition-colors lg:w-full lg:justify-start lg:p-2',
                    actual ? 'bg-zinc-50 ring-1 ring-zinc-200 lg:bg-white lg:shadow-xs' : 'hover:bg-zinc-50 lg:hover:bg-white/70',
                    bloqueado && 'cursor-not-allowed opacity-60 hover:bg-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold lg:size-9',
                      hecho && 'bg-emerald-600 text-white',
                      !hecho && actual && 'border-2 border-emerald-600 bg-white text-emerald-700',
                      !hecho && !actual && 'border bg-zinc-50 text-zinc-400',
                    )}
                  >
                    {hecho ? <Check className="size-4" /> : bloqueado ? <Lock className="size-3.5" /> : indice + 1}
                  </span>
                  <span className="hidden min-w-0 lg:block">
                    <span className="block truncate text-sm font-medium">{paso.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {hecho ? 'Completado' : bloqueado ? 'Bloqueado' : paso.resumen}
                    </span>
                  </span>
                </button>
                {indice < ULTIMO ? (
                  <span aria-hidden className={cn('mx-1 h-px min-w-4 flex-1 lg:hidden', hecho ? 'bg-emerald-500' : 'bg-zinc-200')} />
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>

      <section data-tour="paso-contenido" className="min-w-0 overflow-hidden rounded-xl border bg-white">
        {activo === 0 ? (
          <PasoAppMeta estado={estado} alActualizar={alActualizar} alGuardar={alAvanzar} />
        ) : null}
        {activo === 1 ? <PasoWebhook estado={estado} alActualizar={alActualizar} /> : null}
        {activo === 2 ? <PasoNumero estado={estado} alActualizar={alActualizar} /> : null}

        <footer className="flex flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          {activo > 0 ? (
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setElegido(activo - 1)}>
              <ArrowLeft />
              Atrás
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            {!listos[activo] ? (
              <p className="text-center text-sm text-muted-foreground sm:text-left">Completa este paso para continuar</p>
            ) : null}
            {activo < ULTIMO ? (
              <Button className="w-full sm:w-auto" disabled={!listos[activo]} onClick={alAvanzar}>
                Continuar
                <ArrowRight />
              </Button>
            ) : completo ? (
              <>
                <Link to="/asesores?tab=reparto" className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}>
                  Reparto de chats
                </Link>
                <Link to="/chats" className={cn(buttonVariants(), 'w-full sm:w-auto')}>
                  Ir al chat
                  <ArrowRight />
                </Link>
              </>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  )
}

function PasoAppMeta({ estado, alActualizar, alGuardar }: PropsPaso & { alGuardar: () => void }) {
  const [appId, setAppId] = useState(estado.app_meta.meta_app_id ?? '')
  const [secreto, setSecreto] = useState('')
  const yaListo = estado.pasos.app_meta
  const guardar = useMutation({
    mutationFn: () => guardarAppMeta(appId.trim(), secreto.trim()),
    onSuccess: (nuevo) => {
      setSecreto('')
      alActualizar(nuevo)
      avisoExito('App de Meta guardada')
      if (!yaListo) {
        alGuardar()
      }
    },
    onError: (error) => avisoError(error, 'No se pudo guardar la app de Meta'),
  })

  return (
    <PanelPaso
      indice={0}
      titulo="Tu app de Meta"
      ayuda="Con estos datos comprobamos que los mensajes vienen de tu app."
      guia={[
        <>
          Entra a <EnlaceMeta href="https://developers.facebook.com/apps">Meta para desarrolladores</EnlaceMeta> y abre tu app.
        </>,
        'Ve a Configuración de la app → Básica.',
        'Copia el identificador. En la clave secreta pulsa «Mostrar» y cópiala.',
      ]}
    >
      <form
        className="grid max-w-xl gap-4"
        onSubmit={(evento: FormEvent) => {
          evento.preventDefault()
          guardar.mutate()
        }}
      >
        <Campo
          etiqueta="Identificador de la app"
          inputMode="numeric"
          value={appId}
          onChange={(evento) => setAppId(evento.target.value)}
          required
        />
        <Campo
          etiqueta="Clave secreta"
          type="password"
          autoComplete="off"
          placeholder={yaListo ? '••••••••  guardada' : undefined}
          value={secreto}
          onChange={(evento) => setSecreto(evento.target.value)}
          required={!yaListo}
        />
        <div>
          <Button type="submit" className="w-full sm:w-auto" disabled={guardar.isPending || !appId.trim()}>
            {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {yaListo ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </div>
      </form>
    </PanelPaso>
  )
}

function PasoWebhook({ estado, alActualizar }: PropsPaso) {
  const [confirmar, setConfirmar] = useState(false)
  const { webhook } = estado
  const verificado = estado.pasos.webhook
  const regenerar = useMutation({
    mutationFn: regenerarTokenWebhook,
    onSuccess: (nuevo) => {
      setConfirmar(false)
      alActualizar(nuevo)
      avisoExito('Token nuevo listo')
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el token'),
  })

  return (
    <PanelPaso
      indice={1}
      titulo="Recibir mensajes"
      ayuda="Meta enviará aquí los mensajes de tus clientes."
      guia={[
        'En tu app de Meta abre WhatsApp → Configuración.',
        'En «Webhook» pulsa Editar y pega la URL y el token.',
        'Activa el campo «messages».',
      ]}
    >
      <div className="grid max-w-xl gap-4">
        {!webhook.url_https ? (
          <Aviso>Este enlace aún no está listo para Meta. Escríbenos a soporte para activarlo.</Aviso>
        ) : null}
        <Copiable etiqueta="URL de devolución de llamada" valor={webhook.url} />
        <Copiable etiqueta="Token de verificación" valor={webhook.verify_token} />

        <div className="flex flex-col gap-3 rounded-lg bg-zinc-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          {verificado ? (
            <p className="flex min-w-0 items-start gap-2 text-sm text-zinc-700 sm:items-center">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 sm:mt-0" />
              <span className="min-w-0 break-words">
                Meta ya está conectado
                {webhook.ultimo_evento_at ? ` · último mensaje ${fechaCorta(webhook.ultimo_evento_at)}` : ''}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Esperando a Meta…
            </p>
          )}
          <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setConfirmar(true)}>
            <RefreshCw />
            Cambiar token
          </Button>
        </div>
      </div>

      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cambiar el token?</DialogTitle>
            <DialogDescription>Tendrás que pegar el nuevo en Meta otra vez.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => regenerar.mutate()} disabled={regenerar.isPending}>
              {regenerar.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelPaso>
  )
}

const NUMERO_VACIO: DatosNumeroWhatsapp = { nombre: '', phone_number_id: '', whatsapp_business_account_id: '', access_token: '' }

function PasoNumero({ estado, alActualizar }: PropsPaso) {
  const [numero, setNumero] = useState<DatosNumeroWhatsapp>(NUMERO_VACIO)
  const [quitar, setQuitar] = useState<NumeroWhatsapp | null>(null)
  const conectar = useMutation({
    mutationFn: () => conectarNumeroWhatsapp(numero),
    onSuccess: (nuevo) => {
      setNumero(NUMERO_VACIO)
      alActualizar(nuevo)
      avisoExito('Número conectado')
    },
    onError: (error) => avisoError(error, 'No se pudo conectar el número'),
  })
  const desconectar = useMutation({
    mutationFn: (id: number) => desconectarNumeroWhatsapp(id),
    onSuccess: (nuevo) => {
      setQuitar(null)
      alActualizar(nuevo)
      avisoExito('Número desconectado')
    },
    onError: (error) => avisoError(error, 'No se pudo desconectar'),
  })
  const cambiar = (campo: keyof DatosNumeroWhatsapp) => (evento: { target: { value: string } }) =>
    setNumero((actual) => ({ ...actual, [campo]: evento.target.value }))
  const yaConectado = estado.numeros.some((item) => item.verificado)

  return (
    <PanelPaso
      indice={2}
      titulo="Tu número"
      ayuda="El número de WhatsApp con el que atenderás a tus clientes."
      guia={[
        'En tu app de Meta abre WhatsApp → Configuración de la API y copia los dos identificadores.',
        <>
          Crea el token permanente en <EnlaceMeta href="https://business.facebook.com/settings/system-users">Usuarios del sistema</EnlaceMeta>.
        </>,
        'Pega todo aquí y pulsa Conectar.',
      ]}
    >
      <div className="grid gap-6">
        {estado.numeros.length ? (
          <ul className="grid gap-2">
            {estado.numeros.map((item) => (
              <li key={item.id} className="flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3 sm:px-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  <Smartphone className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.telefono ? `+${item.telefono}` : 'Falta verificar'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.verificado ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CircleCheck />
                      <span className="hidden sm:inline">Verificado</span>
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNumero({
                          nombre: item.nombre,
                          phone_number_id: item.phone_number_id,
                          whatsapp_business_account_id: item.whatsapp_business_account_id,
                          access_token: '',
                        })
                      }
                    >
                      <CircleAlert />
                      Verificar
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label={`Desconectar ${item.nombre}`} onClick={() => setQuitar(item)}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {!yaConectado ? (
        <form
          className="grid max-w-xl gap-4"
          onSubmit={(evento: FormEvent) => {
            evento.preventDefault()
            conectar.mutate()
          }}
        >
          <p className="text-sm font-medium">Conectar un número</p>
          <Campo etiqueta="Nombre" value={numero.nombre} onChange={cambiar('nombre')} opcional />
          <Campo
            etiqueta="Identificador del número de teléfono"
            inputMode="numeric"
            value={numero.phone_number_id}
            onChange={cambiar('phone_number_id')}
            required
          />
          <Campo
            etiqueta="Identificador de la cuenta de WhatsApp Business"
            inputMode="numeric"
            value={numero.whatsapp_business_account_id}
            onChange={cambiar('whatsapp_business_account_id')}
            required
          />
          <Campo
            etiqueta="Token de acceso permanente"
            type="password"
            autoComplete="off"
            value={numero.access_token}
            onChange={cambiar('access_token')}
            required
          />
          <div>
            <Button type="submit" className="w-full sm:w-auto" disabled={conectar.isPending}>
              {conectar.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
              {conectar.isPending ? 'Verificando…' : 'Conectar'}
            </Button>
          </div>
        </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta empresa atiende con un solo número. Si quieres cambiarlo, desconéctalo y conecta el nuevo.
          </p>
        )}
      </div>

      <Dialog open={quitar !== null} onOpenChange={(abierto) => !abierto && setQuitar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desconectar {quitar?.nombre}?</DialogTitle>
            <DialogDescription>Dejarán de llegar sus mensajes.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuitar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => quitar && desconectar.mutate(quitar.id)} disabled={desconectar.isPending}>
              {desconectar.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelPaso>
  )
}

function PanelPaso({
  indice,
  titulo,
  ayuda,
  guia,
  children,
}: {
  indice: number
  titulo: string
  ayuda: string
  guia: ReactNode[]
  children: ReactNode
}) {
  return (
    <>
      <header className="space-y-1 border-b px-4 py-4 sm:px-7 sm:py-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Paso {indice + 1} de {PASOS.length}
        </p>
        <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{ayuda}</p>
      </header>
      <div className="grid min-w-0 gap-6 px-4 py-5 sm:px-7 sm:py-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-8">
        <div className="min-w-0">{children}</div>
        <aside className="h-fit rounded-lg bg-zinc-50 p-4 sm:p-5">
          <p className="text-sm font-medium">Dónde lo encuentro</p>
          <ol className="mt-4 space-y-3.5">
            {guia.map((texto, posicion) => (
              <li key={posicion} className="flex gap-3 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200">
                  {posicion + 1}
                </span>
                <span className="leading-5">{texto}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  )
}

function Copiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor)
      avisoExito('Copiado')
    } catch (error) {
      avisoError(error, 'No se pudo copiar')
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{etiqueta}</span>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={valor}
          className="h-10 min-w-0 font-mono text-[11px] sm:text-xs"
          onFocus={(evento) => evento.target.select()}
        />
        <Button type="button" variant="outline" className="h-10 shrink-0 sm:w-auto" onClick={copiar} aria-label={`Copiar ${etiqueta}`}>
          <Copy />
          Copiar
        </Button>
      </div>
    </div>
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}

function EnlaceMeta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2">
      {children}
      <ExternalLink className="size-3" />
    </a>
  )
}

function fechaCorta(valor: string): string {
  const fecha = new Date(valor.replace(' ', 'T'))
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
}
