import { useMemo, useState, type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookImage, CircleCheck, Download, Search, Share2, Smartphone, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siWhatsapp } from 'simple-icons'
import { leerAppAsesor, leerCostosWhatsapp, leerEstadoWhatsapp, leerVitrina } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

type Categoria = 'todos' | 'mensajeria' | 'catalogo' | 'costos'

type EstadoCanal = 'disponible' | 'conectado' | 'publicado' | 'popular'

type Canal = {
  id: string
  nombre: string
  texto: string
  categoria: Exclude<Categoria, 'todos'>
  estado: EstadoCanal
  busqueda: string
  ruta: string
  etiquetaAccion: string
  meta?: string
  apkUrl?: string | null
  Icono: ComponentType<{ className?: string }>
}

const FILTROS: { id: Categoria; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'mensajeria', etiqueta: 'Mensajería' },
  { id: 'catalogo', etiqueta: 'Catálogo' },
  { id: 'costos', etiqueta: 'Costos' },
]

export function Integraciones() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const { conectado, cargando } = useWhatsappConectado()
  const [filtro, setFiltro] = useState<Categoria>('todos')
  const [busqueda, setBusqueda] = useState('')

  const estado = useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn: leerEstadoWhatsapp,
    enabled: admin,
    staleTime: 60_000,
  })
  const costos = useQuery({
    queryKey: ['costos-whatsapp'],
    queryFn: leerCostosWhatsapp,
    enabled: conectado,
    staleTime: 60_000,
  })
  const vitrina = useQuery({
    queryKey: ['catalogo-vitrina'],
    queryFn: leerVitrina,
    enabled: admin,
    staleTime: 60_000,
  })
  const appAsesor = useQuery({
    queryKey: ['empresa', 'app-asesor'],
    queryFn: leerAppAsesor,
    enabled: admin,
    staleTime: 60_000,
  })

  const numero = estado.data?.numeros[0]
  const etiquetaNumero = numero?.telefono || costos.data?.numero || numero?.nombre || ''
  const catalogoPublicado = vitrina.data?.publicado === true
  const appActiva = appAsesor.data?.activa !== false

  const canales = useMemo<Canal[]>(() => {
    const items: Canal[] = [
      {
        id: 'whatsapp',
        nombre: 'WhatsApp Business Platform',
        texto: 'Atiende chats, automatiza respuestas y centraliza conversaciones de clientes en un solo lugar.',
        categoria: 'mensajeria',
        estado: conectado ? 'conectado' : 'popular',
        busqueda: 'whatsapp business api mensajeria chat',
        ruta: '/integraciones/whatsapp',
        etiquetaAccion: conectado ? 'Configurar' : 'Conectar',
        meta: etiquetaNumero || undefined,
        Icono: IconoMarcaWhatsapp,
      },
      {
        id: 'app-asesor',
        nombre: 'App Belly Asesor',
        texto: 'App móvil para que tus asesores atiendan chats, cambien etapa y respondan desde el celular.',
        categoria: 'mensajeria',
        estado: appActiva ? 'conectado' : 'disponible',
        busqueda: 'app asesor movil celular expo push notificaciones apk descargar',
        ruta: '/integraciones/app-asesor',
        etiquetaAccion: 'Configurar',
        meta: appAsesor.data?.apk_disponible
          ? appActiva
            ? 'APK lista · acceso activo'
            : 'APK lista · acceso off'
          : appActiva
            ? 'Sube el APK para compartir'
            : 'Acceso desactivado',
        Icono: IconoAppAsesor,
        apkUrl: appAsesor.data?.apk_disponible ? appAsesor.data.apk_url ?? appAsesor.data.share_url ?? null : null,
      },
      {
        id: 'catalogo',
        nombre: 'Mi Catálogo',
        texto: 'Tienda pública con productos, servicios, carrusel, enlace compartible y código QR.',
        categoria: 'catalogo',
        estado: catalogoPublicado ? 'publicado' : 'disponible',
        busqueda: 'catalogo tienda vitrina productos servicios qr',
        ruta: '/catalogo',
        etiquetaAccion: catalogoPublicado ? 'Configurar' : 'Crear catálogo',
        Icono: IconoCatalogo,
      },
    ]

    if (conectado) {
      items.push({
        id: 'costos',
        nombre: 'Costos WhatsApp',
        texto: 'Revisa el consumo de tu número, mensajes facturables y el detalle de costos del mes.',
        categoria: 'costos',
        estado: 'disponible',
        busqueda: 'costos whatsapp consumo facturacion',
        ruta: '/integraciones/costos',
        etiquetaAccion: 'Ver costos',
        Icono: IconoCostos,
      })
    }

    return items
  }, [appActiva, appAsesor.data, catalogoPublicado, conectado, etiquetaNumero])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return canales.filter((canal) => {
      if (filtro !== 'todos' && canal.categoria !== filtro) return false
      if (!q) return true
      return `${canal.nombre} ${canal.texto} ${canal.busqueda}`.toLowerCase().includes(q)
    })
  }, [busqueda, canales, filtro])

  return (
    <div className="space-y-6 sm:space-y-8">
      <CabeceraPagina
        titulo="Catálogo de canales"
        descripcion="Administra tus canales de mensajería y descubre integraciones para captar y atender más clientes."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((item) => {
            const activo = filtro === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFiltro(item.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  activo
                    ? 'bg-foreground text-background'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.etiqueta}
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar canal…"
            className="h-9 rounded-full bg-background pl-8"
            aria-label="Buscar canal"
          />
        </div>
      </div>

      {cargando && filtro === 'todos' && !busqueda ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="superficie flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="font-medium">No hay canales con ese filtro</p>
          <p className="text-sm text-muted-foreground">Prueba otra categoría o limpia la búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((canal) => (
            <TarjetaCanal key={canal.id} canal={canal} />
          ))}
        </div>
      )}
    </div>
  )
}

function TarjetaCanal({ canal }: { canal: Canal }) {
  const { Icono } = canal

  const compartirApk = async () => {
    if (!canal.apkUrl) return
    const texto = `Instala Belly Asesor:\n${canal.apkUrl}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Belly Asesor', text: texto, url: canal.apkUrl })
        return
      }
      await navigator.clipboard.writeText(canal.apkUrl)
    } catch {
      /* canceló */
    }
  }

  return (
    <article className="superficie group relative flex min-h-[11.5rem] flex-col gap-4 overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2.5">
          <InsigniaEstado estado={canal.estado} />
          <div className="space-y-1 pr-14">
            <h2 className="text-base font-semibold tracking-tight sm:text-[1.05rem]">{canal.nombre}</h2>
            {canal.meta ? <p className="text-sm tabular-nums text-foreground/80">{canal.meta}</p> : null}
            <p className="text-sm leading-relaxed text-muted-foreground">{canal.texto}</p>
          </div>
        </div>
        <span className="absolute top-5 right-5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/70 sm:top-6 sm:right-6 sm:size-12">
          <Icono className="size-7 sm:size-8" />
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">
        {canal.apkUrl ? (
          <>
            <a href={canal.apkUrl} className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}>
              <Download className="size-3.5" />
              Descargar
            </a>
            <button type="button" onClick={() => void compartirApk()} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 bg-background')}>
              <Share2 className="size-3.5" />
              Compartir
            </button>
          </>
        ) : null}
        <Link to={canal.ruta} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'bg-background')}>
          {canal.etiquetaAccion}
        </Link>
      </div>
    </article>
  )
}

function InsigniaEstado({ estado }: { estado: EstadoCanal }) {
  if (estado === 'conectado') {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
        <CircleCheck />
        Conectado
      </Badge>
    )
  }
  if (estado === 'publicado') {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
        <CircleCheck />
        Publicado
      </Badge>
    )
  }
  if (estado === 'popular') {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Popular</Badge>
  }
  return <Badge className="border-amber-200 bg-amber-50 text-amber-800">Disponible</Badge>
}

function IconoMarcaWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5 shrink-0', className)} aria-hidden>
      <path fill={`#${siWhatsapp.hex}`} d={siWhatsapp.path} />
    </svg>
  )
}

function IconoCatalogo({ className }: { className?: string }) {
  return <BookImage className={cn('size-5 text-[#0B1026]', className)} strokeWidth={1.75} />
}

function IconoCostos({ className }: { className?: string }) {
  return <Wallet className={cn('size-5 text-lime-700', className)} strokeWidth={1.75} />
}

function IconoAppAsesor({ className }: { className?: string }) {
  return <Smartphone className={cn('size-5 text-emerald-700', className)} strokeWidth={1.75} />
}
