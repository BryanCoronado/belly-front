import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Card, CardContent } from '@/components/ui/card'

function ModuloEnConstruccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="space-y-6">
      <CabeceraPagina titulo={titulo} descripcion={descripcion} />
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">
          Este módulo ya está en el catálogo (grupos de módulos, módulos, permisos y grupos de permisos).
          La pantalla se irá completando; quién lo ve se define en Equipo → Roles y permisos.
        </CardContent>
      </Card>
    </div>
  )
}

export function Conversaciones() {
  return <ModuloEnConstruccion titulo="Conversaciones" descripcion="Bandeja general y conversaciones por equipo." />
}

export function ConversacionesAsesores() {
  return <ModuloEnConstruccion titulo="Conversaciones Asesores" descripcion="Listado de conversaciones de contact center." />
}

export function ConversacionesCustomer() {
  return <ModuloEnConstruccion titulo="Conversaciones Customer Success" descripcion="Conversaciones de customer success." />
}

export function Metricas() {
  return <ModuloEnConstruccion titulo="Métricas" descripcion="Indicadores de conversaciones y orígenes de WhatsApp." />
}

export function MetricasAsesores() {
  return <ModuloEnConstruccion titulo="Métricas Asesores" descripcion="Métricas de contact center." />
}

export function MetricasCustomer() {
  return <ModuloEnConstruccion titulo="Métricas Customer Success" descripcion="Métricas de customer success." />
}

export function MetricasMarketing() {
  return <ModuloEnConstruccion titulo="Métricas Marketing" descripcion="Métricas de campañas y marketing." />
}

export function MetricasOrigenes() {
  return <ModuloEnConstruccion titulo="Métricas Orígenes" descripcion="Conversaciones por origen de WhatsApp." />
}

export function Leads() {
  return <ModuloEnConstruccion titulo="Leads" descripcion="Clientes y lista negra de la empresa." />
}

export function Asesores() {
  return <ModuloEnConstruccion titulo="Asesores" descripcion="Personal que atiende chats, según su grupo y rol." />
}

export function AsesoresVenta() {
  return <ModuloEnConstruccion titulo="Asesores de venta" descripcion="Asesores de contact center." />
}

export function AsesoresCustomer() {
  return <ModuloEnConstruccion titulo="Asesores Customer Success" descripcion="Asesores de customer success." />
}

export function Marketing() {
  return <ModuloEnConstruccion titulo="Marketing" descripcion="Imágenes, videos y plantillas de campaña." />
}

export function MarketingImagenes() {
  return <ModuloEnConstruccion titulo="Imágenes" descripcion="Imágenes de marketing." />
}

export function MarketingVideos() {
  return <ModuloEnConstruccion titulo="Videos" descripcion="Videos de marketing." />
}

export function MarketingPlantillas() {
  return <ModuloEnConstruccion titulo="Plantillas de marketing" descripcion="Plantillas de campaña." />
}

export function Ventas() {
  return <ModuloEnConstruccion titulo="Ventas" descripcion="Seguimiento de ventas ligadas a las conversaciones." />
}

export function Productos() {
  return <ModuloEnConstruccion titulo="Productos" descripcion="Catálogo para enviar por WhatsApp." />
}

export function MisClientes() {
  return <ModuloEnConstruccion titulo="Mis clientes" descripcion="Clientes asignados al asesor." />
}
