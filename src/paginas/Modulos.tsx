import { Ban } from 'lucide-react'
import { texto } from '@/api'
import { TablaModulo } from '@/components/TablaModulo'

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
