import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type CampoProps = ComponentProps<typeof Input> & {
  etiqueta: string
  ayuda?: string
  opcional?: boolean
}

export function Campo({ id, etiqueta, ayuda, opcional, className, ...props }: CampoProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado

  return (
    <div className="grid gap-2">
      <Label htmlFor={idCampo}>
        {etiqueta}
        {opcional ? <span className="font-normal text-muted-foreground">(opcional)</span> : null}
      </Label>
      <Input id={idCampo} className={cn('h-10 px-3', className)} {...props} />
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}

type CampoSelectProps = ComponentProps<'select'> & {
  etiqueta: string
  ayuda?: string
}

export function CampoSelect({ id, etiqueta, ayuda, className, children, ...props }: CampoSelectProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado

  return (
    <div className="grid gap-2">
      <Label htmlFor={idCampo}>{etiqueta}</Label>
      <select
        id={idCampo}
        className={cn(
          'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}
