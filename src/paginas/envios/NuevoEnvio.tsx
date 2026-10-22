import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, LoaderCircle, MessageSquareText, Send, UserRound } from 'lucide-react'
import {
  crearEnvio,
  leerAudienciaEnvio,
  leerPlantillasEnvio,
  type AudienciaEnvio,
  type FiltrosClientes,
  type ModoEnvio,
  type PlantillaWhatsapp,
} from '@/api'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { contarVariables, textoPlantilla } from '../chat/formato'
import { CLASE_SELECT, useAjustesCrm } from '../clientes/crm'
import { BarraFiltros } from '../clientes/piezas'
import { CLAVE_ENVIOS } from './estados'

const TOKEN_NOMBRE = '{{nombre}}'
const NOMBRE_EJEMPLO = 'María'

function nombrePorDefecto(): string {
  return `Envío del ${new Date().toLocaleDateString('es', { day: 'numeric', month: 'long' })}`
}

function rellenar(texto: string, valores: string[], desde = 0): string {
  return texto.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => valores[desde + Number(n) - 1]?.trim() || `{{${n}}}`)
}

function conNombre(texto: string): string {
  return texto.replace(/\{\{\s*nombre\s*\}\}/gi, NOMBRE_EJEMPLO)
}

export function NuevoEnvio() {
  const navegar = useNavigate()
  const cliente = useQueryClient()
  const ajustes = useAjustesCrm()
  const [filtros, setFiltros] = useState<FiltrosClientes>({})
  const [modo, setModo] = useState<ModoEnvio>('plantilla')
  const [mensaje, setMensaje] = useState('')
  const [idPlantilla, setIdPlantilla] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [nombre, setNombre] = useState(nombrePorDefecto)
  const [confirmando, setConfirmando] = useState(false)
  const areaTexto = useRef<HTMLTextAreaElement>(null)

  const audiencia = useQuery({ queryKey: [...CLAVE_ENVIOS, 'audiencia', filtros], queryFn: () => leerAudienciaEnvio(filtros) })
  const plantillas = useQuery({ queryKey: [...CLAVE_ENVIOS, 'plantillas'], queryFn: leerPlantillasEnvio, staleTime: 5 * 60_000 })

  const plantilla = plantillas.data?.find((p) => p.id === idPlantilla)
  const encabezado = plantilla ? textoPlantilla(plantilla, 'HEADER') : ''
  const cuerpo = plantilla ? textoPlantilla(plantilla, 'BODY') : ''
  const variablesEncabezado = contarVariables(encabezado)
  const totalVariables = variablesEncabezado + contarVariables(cuerpo)
  const valores = Array.from({ length: totalVariables }, (_, i) => variables[i] ?? '')

  const destinatarios = audiencia.data ? (modo === 'texto' ? audiencia.data.en_ventana : audiencia.data.total) : 0
  const listo =
    nombre.trim() !== '' &&
    destinatarios > 0 &&
    (modo === 'texto' ? mensaje.trim() !== '' : Boolean(plantilla) && valores.every((valor) => valor.trim() !== ''))

  const enviar = useMutation({
    mutationFn: () =>
      crearEnvio({
        nombre: nombre.trim(),
        modo,
        filtros,
        ...(modo === 'texto'
          ? { mensaje: mensaje.trim() }
          : {
              plantilla: {
                id: plantilla?.id ?? '',
                name: plantilla?.name ?? '',
                language: plantilla?.language ?? 'es',
                parametros: valores,
                vista: rellenar(cuerpo, valores, variablesEncabezado),
              },
            }),
      }),
    onSuccess: (envio) => {
      avisoExito('Envío en marcha', 'Los mensajes salen por tandas. Puedes cerrar esta página.')
      cliente.invalidateQueries({ queryKey: CLAVE_ENVIOS })
      navegar(`/envios/${envio.id}`, { replace: true })
    },
    onError: (error) => {
      setConfirmando(false)
      avisoError(error, 'No se pudo crear el envío')
    },
  })

  function insertarNombre() {
    const area = areaTexto.current
    const inicio = area?.selectionStart ?? mensaje.length
    const fin = area?.selectionEnd ?? mensaje.length
    setMensaje(mensaje.slice(0, inicio) + TOKEN_NOMBRE + mensaje.slice(fin))
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(inicio + TOKEN_NOMBRE.length, inicio + TOKEN_NOMBRE.length)
    })
  }

  function cambiarPlantilla(id: string) {
    setIdPlantilla(id)
    setVariables([])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link to="/envios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Envíos masivos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo envío</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Seccion numero={1} titulo="¿A quién le escribes?" ayuda="Usa los mismos filtros que en Clientes. Si no eliges nada, va a todos.">
            <BarraFiltros filtros={filtros} alCambiar={setFiltros} ajustes={ajustes.data} sinBusqueda />
            <ResumenAudiencia cargando={audiencia.isFetching && !audiencia.data} datos={audiencia.data} />
          </Seccion>

          <Seccion numero={2} titulo="¿Qué les mandas?">
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de mensaje">
              <OpcionModo
                activo={modo === 'plantilla'}
                icono={FileText}
                titulo="Plantilla aprobada"
                detalle={audiencia.data ? `Llega a ${audiencia.data.total}` : 'Llega a todos'}
                alElegir={() => setModo('plantilla')}
              />
              <OpcionModo
                activo={modo === 'texto'}
                icono={MessageSquareText}
                titulo="Texto libre"
                detalle={audiencia.data ? `Llega a ${audiencia.data.en_ventana} (últimas 24 h)` : 'Solo últimas 24 h'}
                alElegir={() => setModo('texto')}
              />
            </div>

            {modo === 'texto' ? (
              <div className="grid gap-2">
                <div className="flex items-end justify-between gap-2">
                  <Label htmlFor="envio-mensaje">Mensaje</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={insertarNombre}>
                    <UserRound />
                    Insertar nombre
                  </Button>
                </div>
                <textarea
                  id="envio-mensaje"
                  ref={areaTexto}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={6}
                  maxLength={4000}
                  placeholder={`Hola ${TOKEN_NOMBRE}, esta semana tenemos…`}
                  className="min-h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <p className="text-xs text-muted-foreground">
                  {TOKEN_NOMBRE} se cambia por el primer nombre de cada cliente. Quien no tenga nombre lo recibe sin él.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="envio-plantilla">Plantilla</Label>
                  {plantillas.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <select id="envio-plantilla" className={CLASE_SELECT} value={idPlantilla} onChange={(e) => cambiarPlantilla(e.target.value)}>
                      <option value="">Elige una plantilla…</option>
                      {plantillas.data?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.language})
                        </option>
                      ))}
                    </select>
                  )}
                  {plantillas.isError ? <p className="text-xs text-rose-600">{(plantillas.error as Error).message}</p> : null}
                  {plantillas.data?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tienes plantillas aprobadas por Meta todavía. Créalas en tu cuenta de WhatsApp Business.</p>
                  ) : null}
                </div>
                {valores.map((valor, indice) => (
                  <div key={indice} className="grid gap-2">
                    <Label htmlFor={`envio-variable-${indice}`}>
                      {indice < variablesEncabezado ? `Título, variable ${indice + 1}` : `Variable {{${indice - variablesEncabezado + 1}}}`}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`envio-variable-${indice}`}
                        value={valor}
                        maxLength={500}
                        onChange={(e) => {
                          const copia = [...valores]
                          copia[indice] = e.target.value
                          setVariables(copia)
                        }}
                        className="h-10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0"
                        onClick={() => {
                          const copia = [...valores]
                          copia[indice] = TOKEN_NOMBRE
                          setVariables(copia)
                        }}
                      >
                        Usar nombre
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          <Seccion numero={3} titulo="Ponle un nombre" ayuda="Solo lo ves tú, para encontrarlo después.">
            <Campo etiqueta="Nombre del envío" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} required />
          </Seccion>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm font-medium">Así se verá</p>
            <VistaPrevia modo={modo} mensaje={mensaje} plantilla={plantilla} encabezado={encabezado} cuerpo={cuerpo} valores={valores} desde={variablesEncabezado} />
          </div>
          <Button size="lg" className="h-11 w-full" disabled={!listo} onClick={() => setConfirmando(true)}>
            <Send />
            {destinatarios > 0 ? `Enviar a ${destinatarios} ${destinatarios === 1 ? 'cliente' : 'clientes'}` : 'Enviar'}
          </Button>
          {modo === 'texto' && audiencia.data && audiencia.data.fuera_ventana > 0 ? (
            <p className="text-xs text-muted-foreground">
              {audiencia.data.fuera_ventana} {audiencia.data.fuera_ventana === 1 ? 'cliente no lo recibirá' : 'clientes no lo recibirán'} porque no te escribieron en las
              últimas 24 horas. Para ellos usa una plantilla.
            </p>
          ) : null}
        </aside>
      </div>

      <Dialog open={confirmando} onOpenChange={(valor) => (enviar.isPending ? null : setConfirmando(valor))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Enviar ahora?</DialogTitle>
            <DialogDescription>
              Se mandará a {destinatarios} {destinatarios === 1 ? 'cliente' : 'clientes'}. Las respuestas llegarán al chat de quien los atiende. Una vez enviado,
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmando(false)} disabled={enviar.isPending}>
              Revisar
            </Button>
            <Button onClick={() => enviar.mutate()} disabled={enviar.isPending}>
              {enviar.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Seccion({ numero, titulo, ayuda, children }: { numero: number; titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{numero}</span>
        <div className="space-y-0.5">
          <h2 className="font-semibold">{titulo}</h2>
          {ayuda ? <p className="text-sm text-muted-foreground">{ayuda}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function ResumenAudiencia({ cargando, datos }: { cargando: boolean; datos: AudienciaEnvio | undefined }) {
  if (cargando || !datos) return <Skeleton className="h-16 w-full" />
  const items = [
    { valor: datos.total, texto: 'con WhatsApp' },
    { valor: datos.en_ventana, texto: 'escribieron en las últimas 24 h' },
    { valor: datos.bloqueados, texto: 'en lista negra (no reciben)' },
  ]
  return (
    <dl className="grid grid-cols-3 divide-x rounded-lg border">
      {items.map((item) => (
        <div key={item.texto} className="px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">{item.texto}</dt>
          <dd className="text-lg font-semibold tabular-nums">{item.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

function OpcionModo({
  activo,
  icono: Icono,
  titulo,
  detalle,
  alElegir,
}: {
  activo: boolean
  icono: typeof Send
  titulo: string
  detalle: string
  alElegir: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={alElegir}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
        activo ? 'border-foreground/40 bg-foreground/[0.03] ring-1 ring-foreground/20' : 'hover:bg-muted/50',
      )}
    >
      <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{titulo}</span>
        <span className="block text-xs text-muted-foreground">{detalle}</span>
      </span>
    </button>
  )
}

function VistaPrevia({
  modo,
  mensaje,
  plantilla,
  encabezado,
  cuerpo,
  valores,
  desde,
}: {
  modo: ModoEnvio
  mensaje: string
  plantilla: PlantillaWhatsapp | undefined
  encabezado: string
  cuerpo: string
  valores: string[]
  desde: number
}) {
  const pie = plantilla?.components?.find((componente) => componente.type === 'FOOTER')?.text ?? ''
  const vacio = modo === 'texto' ? mensaje.trim() === '' : !plantilla

  return (
    <div className="rounded-lg bg-muted/60 p-3">
      {vacio ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{modo === 'texto' ? 'Escribe el mensaje para verlo aquí.' : 'Elige una plantilla para verla aquí.'}</p>
      ) : (
        <div className="ml-auto w-fit max-w-[90%] rounded-lg rounded-tr-sm bg-emerald-100 px-3 py-2 text-sm text-emerald-950 shadow-xs dark:bg-emerald-900 dark:text-emerald-50">
          {modo === 'texto' ? (
            <p className="whitespace-pre-wrap">{conNombre(mensaje)}</p>
          ) : (
            <div className="space-y-1">
              {encabezado ? <p className="font-semibold">{conNombre(rellenar(encabezado, valores))}</p> : null}
              <p className="whitespace-pre-wrap">{conNombre(rellenar(cuerpo, valores, desde))}</p>
              {pie ? <p className="text-xs opacity-70">{pie}</p> : null}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">Ejemplo con un cliente llamado {NOMBRE_EJEMPLO}</p>
    </div>
  )
}
