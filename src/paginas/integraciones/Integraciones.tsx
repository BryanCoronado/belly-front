import { ChevronRight, CircleCheck, Mail, Wallet, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { Link } from 'react-router-dom'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Badge } from '@/components/ui/badge'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'

type Integracion = {
  titulo: string
  texto: string
  icono: LucideIcon | ComponentType<{ className?: string }>
  ruta?: string
}

const PROXIMAS: Integracion[] = [
  { titulo: 'Ventas', texto: 'Ventas y cotizaciones', icono: Wallet },
  { titulo: 'Correo', texto: 'Bandeja de correo', icono: Mail },
]

export function Integraciones() {
  const { conectado, cargando } = useWhatsappConectado()

  return (
    <div className="space-y-6">
      <CabeceraPagina titulo="Integraciones" descripcion="Servicios conectados a Belly" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <Tarjeta
          titulo="WhatsApp Business"
          texto="Mensajes de clientes y chat"
          icono={IconoWhatsapp}
          ruta="/integraciones/whatsapp"
          estado={cargando ? null : conectado ? 'Conectado' : 'Sin conectar'}
          destacado={!cargando && conectado}
        />
        {PROXIMAS.map((integracion) => (
          <Tarjeta key={integracion.titulo} {...integracion} estado="Próximamente" />
        ))}
      </div>
    </div>
  )
}

function Tarjeta({
  titulo,
  texto,
  icono: Icono,
  ruta,
  estado,
  destacado = false,
}: Integracion & { estado: string | null; destacado?: boolean }) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg border bg-white">
          <Icono className="size-6" />
        </div>
        {estado ? (
          <Badge className={cn(destacado ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600')}>
            {destacado ? <CircleCheck /> : null}
            {estado}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="flex items-center gap-1 font-semibold">
          {titulo}
          {ruta ? <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /> : null}
        </p>
        <p className="text-sm text-muted-foreground">{texto}</p>
      </div>
    </>
  )

  const clases = 'group grid gap-4 rounded-lg border bg-white p-5 transition-colors'
  if (!ruta) {
    return <div className={cn(clases, 'opacity-60')}>{contenido}</div>
  }
  return (
    <Link to={ruta} className={cn(clases, 'hover:border-zinc-400')}>
      {contenido}
    </Link>
  )
}
