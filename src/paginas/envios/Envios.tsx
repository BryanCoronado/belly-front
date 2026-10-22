import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, MessageSquareText, Plus, Send } from 'lucide-react'
import { leerEnvios, type ResumenEnvio } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Button } from '@/components/ui/button'
import { CLAVE_ENVIOS, ESTADO_ENVIO, fechaEnvio } from './estados'
import { Avance, Estado } from './piezas'

export function Envios() {
  const navegar = useNavigate()
  const consulta = useQuery({
    queryKey: CLAVE_ENVIOS,
    queryFn: leerEnvios,
    refetchInterval: (query) => (query.state.data?.some((envio) => envio.estado === 'enviando') ? 4000 : false),
  })

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo="Envíos masivos"
        descripcion="Escribe a muchos clientes a la vez por WhatsApp, filtrando por etapa, tipo o etiqueta."
        acciones={
          <Button size="lg" className="h-10 w-full sm:w-auto" onClick={() => navegar('/envios/nuevo')}>
            <Plus />
            Nuevo envío
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Regla
          icono={MessageSquareText}
          titulo="Texto libre"
          texto="Solo llega a quien te escribió en las últimas 24 horas. Es la regla de WhatsApp para mensajes sin plantilla."
        />
        <Regla
          icono={FileText}
          titulo="Plantilla aprobada"
          texto="Llega a cualquiera de tus clientes, aunque hayan pasado días. Sirve para retomar o empezar la conversación."
        />
      </div>

      <TablaResponsiva<ResumenEnvio>
        filas={consulta.data}
        cargando={consulta.isLoading}
        clave={(fila) => String(fila.id)}
        columnas={[
          {
            titulo: 'Envío',
            principal: true,
            celda: (fila) => (
              <Link to={`/envios/${fila.id}`} className="block min-w-0 hover:underline">
                <p className="truncate font-medium">{fila.nombre}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {fila.modo === 'texto' ? 'Texto libre' : `Plantilla ${fila.plantilla?.name ?? ''}`} · {fechaEnvio(fila.creado)}
                  {fila.creador ? ` · ${fila.creador}` : ''}
                </p>
              </Link>
            ),
          },
          {
            titulo: 'Avance',
            className: 'min-w-48',
            celda: (fila) => (
              <div className="grid gap-1.5">
                <Avance envio={fila} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {fila.resumen.enviado} de {fila.total} enviados
                  {fila.resumen.fallido ? ` · ${fila.resumen.fallido} con error` : ''}
                </span>
              </div>
            ),
          },
          { titulo: 'Estado', celda: (fila) => <Estado {...ESTADO_ENVIO[fila.estado]} /> },
        ]}
        acciones={(fila) => (
          <Button variant="outline" size="sm" onClick={() => navegar(`/envios/${fila.id}`)}>
            Ver detalle
          </Button>
        )}
        vacio={{ icono: Send, titulo: 'Aún no hiciste envíos', texto: 'Crea el primero con «Nuevo envío».' }}
      />
    </div>
  )
}

function Regla({ icono: Icono, titulo, texto }: { icono: typeof Send; titulo: string; texto: string }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-4">
      <Icono className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-sm text-muted-foreground">{texto}</p>
      </div>
    </div>
  )
}
