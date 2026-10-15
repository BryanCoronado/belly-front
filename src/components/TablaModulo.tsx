import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { leerLista, type Fila } from '@/api'
import { Badge } from '@/components/ui/badge'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { useGuia } from '@/guia/useGuia'
import { avisoError } from '@/lib/avisos'

export type Columna = {
  titulo: string
  valor: (fila: Fila) => string
}

type TablaModuloProps = {
  titulo: string
  descripcion: string
  ruta: string
  columnas: Columna[]
  vacio: { icono: LucideIcon; titulo: string; texto: string }
  guia: string
}

export function TablaModulo({ titulo, descripcion, ruta, columnas, vacio, guia }: TablaModuloProps) {
  useGuia(guia)
  const consulta = useQuery({ queryKey: [ruta], queryFn: () => leerLista(ruta) })
  const total = consulta.data?.total

  useEffect(() => {
    if (consulta.isError) {
      avisoError(consulta.error, `No se pudo cargar ${titulo.toLowerCase()}`)
    }
  }, [consulta.isError, consulta.error, titulo])

  return (
    <div className="space-y-6">
      <CabeceraPagina
        titulo={titulo}
        descripcion={descripcion}
        acciones={
          total ? (
            <Badge className="h-7 bg-emerald-50 px-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
              {total} registros
            </Badge>
          ) : null
        }
      />

      <TablaResponsiva<Fila>
        filas={consulta.data?.filas}
        cargando={consulta.isPending}
        clave={(fila, indice) => String(fila.id ?? indice)}
        columnas={columnas.map((columna, indice) => ({
          titulo: columna.titulo,
          principal: indice === 0,
          celda: (fila) => columna.valor(fila) || <span className="text-muted-foreground">—</span>,
        }))}
        vacio={vacio}
      />
    </div>
  )
}
