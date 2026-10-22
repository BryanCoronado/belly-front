import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, CircleHelp, FileText, ImageIcon, Loader2, Search, Send, Video } from 'lucide-react'
import { useMemo, useState } from 'react'
import { enviarPlantilla, finalizarChat, leerMotivosCierre, leerPlantillasWhatsapp, type PlantillaWhatsapp } from '@/api'
import { Campo, CampoSelect } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { botonesPlantilla, contarVariables, mediaPlantilla, textoPlantilla } from './formato'

type PropsPlantilla = {
  abierto: boolean
  idConversacion: number
  idApp: number
  alCerrar: () => void
  alEnviar: () => void
}

export function DialogoPlantilla({ abierto, idConversacion, idApp, alCerrar, alEnviar }: PropsPlantilla) {
  const plantillas = useQuery({
    queryKey: ['plantillas-whatsapp', idApp],
    queryFn: () => leerPlantillasWhatsapp(idApp),
    enabled: abierto && idApp > 0,
    staleTime: 5 * 60_000,
  })

  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent className="flex h-[min(40rem,90vh)] flex-col gap-0 overflow-hidden p-0 max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-[92dvh] max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12">
          <div className="flex items-center gap-2">
            <DialogTitle>Enviar plantilla</DialogTitle>
            <AyudaPlantillas />
          </div>
          <DialogDescription>Las que Meta ya aprobó para este número.</DialogDescription>
        </DialogHeader>
        {plantillas.isLoading ? (
          <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando plantillas…
          </p>
        ) : plantillas.isError ? (
          <p className="p-6 text-sm text-destructive">{plantillas.error.message}</p>
        ) : plantillas.data?.length ? (
          <FormularioPlantilla
            key={idConversacion}
            plantillas={plantillas.data}
            idConversacion={idConversacion}
            alCancelar={alCerrar}
            alEnviar={alEnviar}
          />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Meta no devolvió plantillas aprobadas para este número.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

type PropsFormularioPlantilla = {
  plantillas: PlantillaWhatsapp[]
  idConversacion: number
  alCancelar: () => void
  alEnviar: () => void
}

function FormularioPlantilla({ plantillas, idConversacion, alCancelar, alEnviar }: PropsFormularioPlantilla) {
  const [busqueda, setBusqueda] = useState('')
  const [idPlantilla, setIdPlantilla] = useState<string | null>(null)
  const [variables, setVariables] = useState<string[]>([])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return plantillas
    return plantillas.filter((p) => {
      const cuerpo = textoPlantilla(p, 'BODY').toLowerCase()
      return p.name.toLowerCase().includes(q) || cuerpo.includes(q) || idiomaPlantilla(p.language).toLowerCase().includes(q)
    })
  }, [plantillas, busqueda])

  const plantilla = plantillas.find((opcion) => opcion.id === idPlantilla) ?? null
  const encabezado = plantilla ? textoPlantilla(plantilla, 'HEADER') : ''
  const cuerpo = plantilla ? textoPlantilla(plantilla, 'BODY') : ''
  const pie = plantilla?.components?.find((componente) => componente.type === 'FOOTER')?.text ?? ''
  const media = plantilla ? mediaPlantilla(plantilla) : null
  const botones = plantilla ? botonesPlantilla(plantilla) : []
  const variablesEncabezado = contarVariables(encabezado)
  const totalVariables = variablesEncabezado + contarVariables(cuerpo)
  const valores = Array.from({ length: totalVariables }, (_, i) => variables[i] ?? '')

  const envio = useMutation({
    mutationFn: () => enviarPlantilla(idConversacion, plantilla as PlantillaWhatsapp, valores),
    onSuccess: () => {
      avisoExito('Plantilla enviada')
      alEnviar()
    },
    onError: (error) => avisoError(error, 'No se pudo enviar la plantilla'),
  })

  const completas = plantilla !== null && valores.every((valor) => valor.trim() !== '')
  const enDetalle = plantilla !== null

  function elegir(id: string) {
    setIdPlantilla(id)
    setVariables([])
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (completas) envio.mutate()
      }}
    >
      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={cn('flex min-h-0 flex-col md:border-r', enDetalle && 'max-md:hidden')}>
          <div className="relative shrink-0 border-b p-3">
            <Search className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por nombre o texto"
              className="h-11 pl-9"
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Plantillas">
            {visibles.map((opcion) => {
              const activa = opcion.id === idPlantilla
              const texto = textoPlantilla(opcion, 'BODY')
              const mediaItem = mediaPlantilla(opcion)
              const vars = contarVariables(textoPlantilla(opcion, 'HEADER')) + contarVariables(texto)
              return (
                <li key={opcion.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activa}
                    onClick={() => elegir(opcion.id)}
                    className={cn(
                      'flex w-full gap-3 border-b px-4 py-3.5 text-left transition-colors last:border-b-0',
                      activa ? 'bg-foreground/[0.06]' : 'hover:bg-muted/60',
                    )}
                  >
                    {mediaItem ? <Miniatura media={mediaItem} /> : null}
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 truncate font-medium">{opcion.name}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{idiomaPlantilla(opcion.language)}</span>
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{texto || (mediaItem ? etiquetaMedia(mediaItem.tipo) : 'Sin texto')}</span>
                      <span className="flex flex-wrap gap-1">
                        {opcion.category ? <Etiqueta>{categoriaPlantilla(opcion.category)}</Etiqueta> : null}
                        {mediaItem ? <Etiqueta>{etiquetaMedia(mediaItem.tipo)}</Etiqueta> : null}
                        {vars > 0 ? <Etiqueta>{vars === 1 ? '1 variable' : `${vars} variables`}</Etiqueta> : null}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
            {visibles.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted-foreground">Ninguna coincide con «{busqueda}».</li> : null}
          </ul>
        </div>

        <div className={cn('flex min-h-0 flex-col', !enDetalle && 'max-md:hidden')}>
          {plantilla ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start gap-2 border-b px-3 py-3 md:hidden">
                <Button type="button" variant="ghost" size="icon" className="-ml-1" aria-label="Volver a la lista" onClick={() => setIdPlantilla(null)}>
                  <ArrowLeft />
                </Button>
                <div className="min-w-0 pt-1">
                  <p className="truncate font-medium">{plantilla.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {idiomaPlantilla(plantilla.language)}
                    {plantilla.category ? ` · ${categoriaPlantilla(plantilla.category)}` : ''}
                  </p>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <div className="hidden md:block">
                  <p className="truncate font-medium">{plantilla.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {idiomaPlantilla(plantilla.language)}
                    {plantilla.category ? ` · ${categoriaPlantilla(plantilla.category)}` : ''}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <div className="ml-auto w-full overflow-hidden rounded-lg rounded-tr-sm bg-emerald-100 text-sm text-emerald-950 shadow-xs dark:bg-emerald-900 dark:text-emerald-50">
                    {media ? <MediaCompleta media={media} /> : null}
                    <div className="space-y-1 px-3 py-2">
                      {encabezado ? <p className="font-semibold">{rellenar(encabezado, valores)}</p> : null}
                      <p className="whitespace-pre-wrap">{cuerpo ? rellenar(cuerpo, valores, variablesEncabezado) : media ? '' : 'Sin texto'}</p>
                      {pie ? <p className="text-xs opacity-70">{pie}</p> : null}
                    </div>
                    {botones.length ? (
                      <div className="divide-y divide-emerald-900/10 border-t border-emerald-900/10 dark:divide-white/10 dark:border-white/10">
                        {botones.map((boton) => (
                          <p key={boton.texto} className="px-3 py-2 text-center text-xs font-medium text-sky-800 dark:text-sky-200">
                            {boton.texto}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                {valores.length ? (
                  <div className="grid gap-3">
                    {valores.map((valor, indice) => (
                      <Campo
                        key={`${plantilla.id}-${indice}`}
                        etiqueta={indice < variablesEncabezado ? `Título, variable ${indice + 1}` : `Variable {{${indice - variablesEncabezado + 1}}}`}
                        value={valor}
                        onChange={(evento) => {
                          const copia = [...valores]
                          copia[indice] = evento.target.value
                          setVariables(copia)
                        }}
                        required
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Esta plantilla no pide datos. Se envía tal cual.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="m-auto hidden px-4 text-center text-sm text-muted-foreground md:block">Elige una plantilla de la lista.</p>
          )}
        </div>
      </div>

      <DialogFooter className={cn(!enDetalle && 'max-md:hidden')}>
        {enDetalle ? (
          <Button type="button" variant="outline" className="h-11 md:hidden" onClick={() => setIdPlantilla(null)}>
            Cambiar plantilla
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="max-md:hidden" onClick={alCancelar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={envio.isPending || !completas}>
          {envio.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Enviar
        </Button>
      </DialogFooter>
    </form>
  )
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{children}</span>
}

function AyudaPlantillas() {
  const [abierta, setAbierta] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={abierta}
        aria-label="Qué son estas plantillas"
        onClick={() => setAbierta((v) => !v)}
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <CircleHelp className="size-4" />
      </button>
      {abierta ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Cerrar ayuda" onClick={() => setAbierta(false)} />
          <div className="absolute top-8 left-0 z-50 w-[min(22rem,calc(100vw-3rem))] space-y-2 rounded-xl border bg-popover p-3 text-sm shadow-lg">
            <p className="font-medium">Plantillas de Meta</p>
            <p className="text-muted-foreground">
              Las crea y aprueba WhatsApp (Meta) en tu Business Manager. Aquí solo se listan las ya aprobadas para este número.
            </p>
            <p className="text-muted-foreground">
              Sirven para escribirle a alguien que no te ha escrito en las últimas 24 horas, o para empezar la conversación. El texto libre solo llega dentro de esa ventana.
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Utilidad</span> son avisos y confirmaciones.{' '}
              <span className="font-medium text-foreground">Marketing</span>, promociones.{' '}
              <span className="font-medium text-foreground">Autenticación</span>, códigos. <span className="font-medium text-foreground">hello_world</span> viene de fábrica para probar.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}

type Media = NonNullable<ReturnType<typeof mediaPlantilla>>

function etiquetaMedia(tipo: Media['tipo']): string {
  return tipo === 'IMAGE' ? 'Imagen' : tipo === 'VIDEO' ? 'Video' : 'Documento'
}

function Miniatura({ media }: { media: Media }) {
  if (media.tipo === 'IMAGE' && media.url) {
    return <img src={media.url} alt="" className="size-12 shrink-0 rounded-md object-cover" />
  }
  const Icono = media.tipo === 'VIDEO' ? Video : media.tipo === 'DOCUMENT' ? FileText : ImageIcon
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Icono className="size-5" />
    </span>
  )
}

function MediaCompleta({ media }: { media: Media }) {
  const [falla, setFalla] = useState(false)
  const etiqueta = etiquetaMedia(media.tipo)

  if (media.tipo === 'IMAGE' && media.url && !falla) {
    return <img src={media.url} alt={etiqueta} className="block w-full bg-black/5 object-contain" onError={() => setFalla(true)} />
  }
  if (media.tipo === 'VIDEO' && media.url && !falla) {
    return <video src={media.url} className="block w-full bg-black/5" controls playsInline onError={() => setFalla(true)} />
  }

  const Icono = media.tipo === 'VIDEO' ? Video : media.tipo === 'DOCUMENT' ? FileText : ImageIcon
  return (
    <div className="flex items-center gap-2 bg-black/5 px-3 py-6 text-xs opacity-70">
      <Icono className="size-4" />
      {etiqueta} de la plantilla
    </div>
  )
}

function rellenar(texto: string, valores: string[], desde = 0): string {
  return texto.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => valores[desde + Number(n) - 1]?.trim() || `{{${n}}}`)
}

const CATEGORIA: Record<string, string> = {
  UTILITY: 'Utilidad',
  MARKETING: 'Marketing',
  AUTHENTICATION: 'Autenticación',
}

function categoriaPlantilla(categoria: string): string {
  return CATEGORIA[categoria.toUpperCase()] ?? categoria
}

function idiomaPlantilla(codigo: string): string {
  const base = codigo.split('_')[0]?.toLowerCase()
  if (base === 'es') return 'Español'
  if (base === 'en') return 'Inglés'
  if (base === 'pt') return 'Portugués'
  return codigo
}

type PropsFinalizar = {
  abierto: boolean
  idConversacion: number
  alCerrar: () => void
  alFinalizar: () => void
}

export function DialogoFinalizar({ abierto, idConversacion, alCerrar, alFinalizar }: PropsFinalizar) {
  const [idMotivo, setIdMotivo] = useState(0)
  const motivos = useQuery({ queryKey: ['motivos-cierre'], queryFn: leerMotivosCierre, enabled: abierto, staleTime: 5 * 60_000 })

  const cierre = useMutation({
    mutationFn: () => finalizarChat(idConversacion, idMotivo),
    onSuccess: () => {
      avisoExito('Conversación finalizada')
      setIdMotivo(0)
      alFinalizar()
    },
    onError: (error) => avisoError(error, 'No se pudo finalizar'),
  })

  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar conversación</DialogTitle>
          <DialogDescription>Pasará a Finalizados.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            cierre.mutate()
          }}
        >
          <CampoSelect
            etiqueta="Motivo"
            value={idMotivo}
            onChange={(evento) => setIdMotivo(Number(evento.target.value))}
            required
          >
            <option value={0} disabled>
              {motivos.isLoading ? 'Cargando…' : 'Elige un motivo'}
            </option>
            {motivos.data?.map((motivo) => (
              <option key={motivo.id} value={motivo.id}>
                {motivo.nombre}
              </option>
            ))}
          </CampoSelect>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cierre.isPending || idMotivo === 0}>
              {cierre.isPending ? <Loader2 className="animate-spin" /> : null}
              Finalizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
