import { useState } from 'react'
import { Ban, Check, Leaf, LoaderCircle, MessageSquareText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { useModoAhorro } from '@/lib/modo-ahorro'
import { cn } from '@/lib/utils'

type Props = {
  compacto?: boolean
  className?: string
}

const SE_QUITA = [
  'Del menú desaparecen Envíos masivos y el Asistente IA (siguen por la URL si hace falta).',
  'En el chat se ocultan video y stickers.',
  'El bot y la IA: 1 o 2 mensajes y pasan a una persona.',
  'Si se acaban los 1.000, el automático se calla. Un flujo de más de 2 mensajes pide confirmación.',
]

const SE_PUEDE = [
  'Seguís armando flujos: botones, formulario, pasar a asesor.',
  'Los asesores escriben desde Belly o desde el celular.',
  'Los envíos masivos siguen, con aviso de que gastan cupo.',
  'Cuando quieras, volvés a modo libre en un toque.',
]

export function InterruptorModoAhorro({ compacto = false, className }: Props) {
  const { ahorro, admin, cambiando, cambiar } = useModoAhorro()
  const [confirmar, setConfirmar] = useState<'on' | 'off' | null>(null)

  if (!admin) {
    return ahorro ? (
      <p className={cn('flex items-center gap-2 text-sm text-primary', className)}>
        <Leaf className="size-4" />
        La empresa está en modo ahorro.
      </p>
    ) : null
  }

  async function aplicar(valor: boolean) {
    try {
      await cambiar(valor)
      avisoExito(valor ? 'Modo ahorro encendido' : 'Volviste al modo libre')
      setConfirmar(null)
    } catch (error) {
      avisoError(error, 'No se pudo cambiar el modo')
    }
  }

  return (
    <div className={cn('rounded-xl border bg-card p-4', compacto && 'p-3', className)}>
      <label className="flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Leaf className="size-4 text-primary" />
            {ahorro ? 'Modo ahorro' : 'Modo libre'}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {ahorro
              ? 'El CRM está cuidando el cupo. El automático habla poco y un flujo largo no se prende solo.'
              : 'Como siempre: armás y activás sin freno extra. Cada mensaje de WhatsApp igual cuenta.'}
          </span>
        </span>
        {cambiando ? <LoaderCircle className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
        <Switch
          checked={ahorro}
          disabled={cambiando}
          onCheckedChange={(valor) => setConfirmar(valor ? 'on' : 'off')}
        />
      </label>

      <Dialog open={confirmar === 'on'} onOpenChange={(abrir) => !cambiando && !abrir && setConfirmar(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Leaf className="size-5 text-primary" />
              Vas a pasar a modo ahorro
            </DialogTitle>
            <DialogDescription>
              El panel se pone cálido para que se note. No es solo color: cambia cómo gasta WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Lista
              titulo="Qué se recorta"
              icono={Ban}
              tono="rose"
              items={SE_QUITA}
            />
            <Lista
              titulo="Qué sigue igual"
              icono={Check}
              tono="emerald"
              items={SE_PUEDE}
            />
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Sparkles className="size-4" />
              En el armador se ve distinto
            </p>
            <p className="mt-1 text-muted-foreground">
              Arriba sale cuántos mensajes manda el flujo. Formulario y botones van primero. Si son más de 2, para
              activarlo tenés que confirmar.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar(null)} disabled={cambiando}>
              Seguir libre
            </Button>
            <Button onClick={() => void aplicar(true)} disabled={cambiando}>
              {cambiando ? <LoaderCircle className="animate-spin" /> : <Leaf />}
              Encender ahorro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmar === 'off'} onOpenChange={(abrir) => !cambiando && !abrir && setConfirmar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Volver a modo libre?</DialogTitle>
            <DialogDescription>
              El CRM vuelve al verde. El bot y la IA hablan sin el tope de 2. Los flujos largos se pueden activar de
              nuevo sin confirmar. WhatsApp sigue cobrando cada mensaje.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar(null)} disabled={cambiando}>
              Seguir en ahorro
            </Button>
            <Button variant="secondary" onClick={() => void aplicar(false)} disabled={cambiando}>
              {cambiando ? <LoaderCircle className="animate-spin" /> : <MessageSquareText />}
              Volver a libre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Lista({
  titulo,
  icono: Icono,
  tono,
  items,
}: {
  titulo: string
  icono: typeof Check
  tono: 'rose' | 'emerald'
  items: string[]
}) {
  return (
    <div className={cn('rounded-xl border p-3', tono === 'rose' ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30' : 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30')}>
      <p className={cn('mb-2 flex items-center gap-1.5 text-sm font-semibold', tono === 'rose' ? 'text-rose-800 dark:text-rose-200' : 'text-emerald-800 dark:text-emerald-200')}>
        <Icono className="size-4" />
        {titulo}
      </p>
      <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
