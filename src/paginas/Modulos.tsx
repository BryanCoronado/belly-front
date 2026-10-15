import { Ban, Contact, FileText } from 'lucide-react'
import { texto, type Fila } from '@/api'
import { TablaModulo } from '@/components/TablaModulo'

function nombreCompleto(fila: Fila, nombre: string, apellido: string): string {
  return [texto(fila, nombre), texto(fila, apellido)].filter(Boolean).join(' ')
}

export function Clientes() {
  return (
    <TablaModulo
      titulo="Clientes"
      guia="clientes"
      descripcion="Personas que escribieron o que registraste en tu empresa."
      ruta="/v1/clientes/listar?page=1&perPage=20"
      columnas={[
        { titulo: 'Nombre', valor: (fila) => texto(fila, 'nombre_completo') || nombreCompleto(fila, 'nombre', 'apellido') },
        { titulo: 'Teléfono', valor: (fila) => texto(fila, 'telefono') },
        { titulo: 'Correo', valor: (fila) => texto(fila, 'correo') },
      ]}
      vacio={{
        icono: Contact,
        titulo: 'Aún no hay clientes',
        texto: 'Se crean automáticamente al recibir el primer mensaje.',
      }}
    />
  )
}

export function Plantillas() {
  return (
    <TablaModulo
      titulo="Plantillas"
      guia="plantillas"
      descripcion="Respuestas rápidas para agilizar la atención."
      ruta="/v1/plantilla-rapida/listar?page=1&perPage=20"
      columnas={[
        { titulo: 'Título', valor: (fila) => texto(fila, 'titulo', 'nombre', 'atajo') },
        { titulo: 'Mensaje', valor: (fila) => texto(fila, 'mensaje', 'contenido', 'texto') },
      ]}
      vacio={{
        icono: FileText,
        titulo: 'Aún no hay plantillas',
        texto: 'Crea respuestas para las preguntas más frecuentes.',
      }}
    />
  )
}

export function ListaNegra() {
  return (
    <TablaModulo
      titulo="Bloqueos"
      guia="lista-negra"
      descripcion="Números que tu empresa no atenderá."
      ruta="/v1/lista-negra/listar?page=1&perPage=20"
      columnas={[
        { titulo: 'Teléfono', valor: (fila) => texto(fila, 'telefono') },
        { titulo: 'Motivo', valor: (fila) => texto(fila, 'motivo') },
      ]}
      vacio={{
        icono: Ban,
        titulo: 'Sin números bloqueados',
        texto: 'Los números que bloquees no generarán conversaciones.',
      }}
    />
  )
}
