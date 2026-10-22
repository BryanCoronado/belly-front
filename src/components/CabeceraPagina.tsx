import type { ReactNode } from 'react'

type CabeceraPaginaProps = {
  titulo: string
  descripcion: string
  acciones?: ReactNode
}

export function CabeceraPagina({ titulo, descripcion, acciones }: CabeceraPaginaProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1.5" data-tour="cabecera">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{descripcion}</p>
      </div>
      {acciones ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{acciones}</div> : null}
    </div>
  )
}
