import { useQuery } from '@tanstack/react-query'
import { BookImage, ChevronRight, CircleCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { leerCostosWhatsapp, leerEstadoWhatsapp, leerVitrina } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { IconoTelegram } from '@/components/IconoTelegram'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'

export function Integraciones() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const { conectado, cargando } = useWhatsappConectado()
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

  const numero = estado.data?.numeros[0]
  const etiquetaNumero = numero?.telefono || costos.data?.numero || numero?.nombre || ''

  return (
    <div className="space-y-8">
      <CabeceraPagina titulo="Integraciones" descripcion="WhatsApp y tu catálogo. Lo demás se suma cuando esté listo." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="superficie flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-[#25D366]/10">
              <IconoWhatsapp className="size-7" />
            </span>
            {cargando ? (
              <Skeleton className="h-5 w-24" />
            ) : conectado ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <CircleCheck />
                Conectado
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">Sin conectar</Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold">WhatsApp Business</p>
            {etiquetaNumero ? <p className="text-sm tabular-nums">{etiquetaNumero}</p> : null}
            <p className="text-sm text-muted-foreground">
              {conectado ? 'Mensajes y chat de tus clientes.' : 'Conectalo para atender chats desde Belly.'}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3">
            <Link to="/integraciones/whatsapp" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
              {conectado ? 'Configurar' : 'Conectar'}
              <ChevronRight className="size-4" />
            </Link>
            {conectado ? (
              <Link to="/integraciones/costos" className="text-sm text-muted-foreground hover:text-foreground">
                Ver costos
              </Link>
            ) : null}
          </div>
        </article>

        <TarjetaCatalogo admin={admin} />
        <TarjetaProxima
          icono={IconoTelegram}
          titulo="Telegram"
          texto="Otro canal para atender clientes."
          estado="En prueba"
        />
      </div>
    </div>
  )
}

function TarjetaCatalogo({ admin }: { admin: boolean }) {
  const vitrina = useQuery({
    queryKey: ['catalogo-vitrina'],
    queryFn: leerVitrina,
    enabled: admin,
    staleTime: 60_000,
  })
  const publicado = vitrina.data?.publicado === true

  return (
    <article className="superficie flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-[#0B1026]/8 text-[#0B1026]">
          <BookImage className="size-6" />
        </span>
        {!admin ? null : vitrina.isLoading ? (
          <Skeleton className="h-5 w-24" />
        ) : publicado ? (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <CircleCheck />
            Publicado
          </Badge>
        ) : (
          <Badge className="border-amber-200 bg-amber-50 text-amber-800">Sin publicar</Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">Mi Catálogo</p>
        <p className="text-sm text-muted-foreground">
          {publicado
            ? 'Tienda pública: carrusel de banners, productos, enlace y QR.'
            : 'Arma una tienda con carrusel, productos, un enlace y un QR.'}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3">
        <Link to="/catalogo" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
          {publicado ? 'Configurar' : 'Crear catálogo'}
          <ChevronRight className="size-4" />
        </Link>
        {admin ? (
          <Link to="/catalogo?pestana=portada" className="text-sm text-muted-foreground hover:text-foreground">
            Carrusel
          </Link>
        ) : null}
      </div>
    </article>
  )
}

function TarjetaProxima({
  icono: Icono,
  titulo,
  texto,
  estado,
}: {
  icono: typeof IconoTelegram
  titulo: string
  texto: string
  estado: string
}) {
  return (
    <div className="superficie flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icono className="size-6" />
        </span>
        <Badge variant="secondary">{estado}</Badge>
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">{titulo}</p>
        <p className="text-sm text-muted-foreground">{texto}</p>
      </div>
    </div>
  )
}
