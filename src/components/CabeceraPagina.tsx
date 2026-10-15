import type { ReactNode } from 'react'

type CabeceraPaginaProps = {
  titulo: string
  descripcion: string
  acciones?: ReactNode
}

export function CabeceraPagina({ titulo, descripcion, acciones }: CabeceraPaginaProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5" data-tour="cabecera">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{descripcion}</p>
      </div>
      {acciones}
    </div>
  )
}
