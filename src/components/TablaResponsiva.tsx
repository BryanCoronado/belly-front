import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type ColumnaTabla<T> = {
  titulo: string
  celda: (fila: T) => ReactNode
  /** En celular, se muestra como título de la tarjeta. */
  principal?: boolean
  className?: string
}

type TablaResponsivaProps<T> = {
  filas: T[] | undefined
  columnas: ColumnaTabla<T>[]
  clave: (fila: T, indice: number) => string
  cargando?: boolean
  acciones?: (fila: T) => ReactNode
  vacio: { icono: LucideIcon; titulo: string; texto: string }
}

const FILAS_CARGANDO = 4

export function TablaResponsiva<T>({ filas, columnas, clave, cargando, acciones, vacio }: TablaResponsivaProps<T>) {
  const principales = columnas.filter((columna) => columna.principal)
  const secundarias = columnas.filter((columna) => !columna.principal)

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs" data-tour="lista">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columnas.map((columna) => (
                <TableHead key={columna.titulo} className="h-11 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {columna.titulo}
                </TableHead>
              ))}
              {acciones ? <TableHead className="h-11 px-4" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando
              ? Array.from({ length: FILAS_CARGANDO }, (_, indice) => (
                  <TableRow key={indice}>
                    {columnas.map((columna) => (
                      <TableCell key={columna.titulo} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                    {acciones ? <TableCell /> : null}
                  </TableRow>
                ))
              : filas?.map((fila, indice) => (
                  <TableRow key={clave(fila, indice)}>
                    {columnas.map((columna) => (
                      <TableCell key={columna.titulo} className={cn('max-w-xs truncate px-4 py-3.5 text-sm', columna.className)}>
                        {columna.celda(fila)}
                      </TableCell>
                    ))}
                    {acciones ? (
                      <TableCell className="px-4 py-3.5">
                        <div className="flex justify-end gap-2" data-tour="acciones-fila">
                          {acciones(fila)}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {cargando
          ? Array.from({ length: FILAS_CARGANDO }, (_, indice) => (
              <li key={indice} className="grid gap-2 p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </li>
            ))
          : filas?.map((fila, indice) => (
              <li key={clave(fila, indice)} className="grid gap-3 p-4">
                {principales.length ? (
                  <div className="min-w-0 font-medium">
                    {principales.map((columna) => (
                      <div key={columna.titulo} className="truncate">
                        {columna.celda(fila)}
                      </div>
                    ))}
                  </div>
                ) : null}
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  {secundarias.map((columna) => (
                    <div key={columna.titulo} className="contents">
                      <dt className="text-muted-foreground">{columna.titulo}</dt>
                      <dd className="min-w-0 truncate text-right">{columna.celda(fila)}</dd>
                    </div>
                  ))}
                </dl>
                {acciones ? (
                  <div className="flex flex-wrap gap-2 [&>*]:flex-1" data-tour="acciones-fila">
                    {acciones(fila)}
                  </div>
                ) : null}
              </li>
            ))}
      </ul>

      {!cargando && filas?.length === 0 ? <EstadoVacio {...vacio} /> : null}
    </div>
  )
}

function EstadoVacio({ icono: Icono, titulo, texto }: TablaResponsivaProps<unknown>['vacio']) {
  return (
    <div className="belly-aparecer flex flex-col items-center justify-center gap-2 border-t px-6 py-14 text-center first:border-t-0">
      <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
        <Icono className="size-5 text-emerald-600" />
      </div>
      <p className="text-base font-medium">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{texto}</p>
    </div>
  )
}
