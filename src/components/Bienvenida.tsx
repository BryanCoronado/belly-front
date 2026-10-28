import { Bot, Play, Radio, Sparkles, UsersRound, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { iniciarGuia } from '@/guia/motor'
import { limpiarRecienRegistrado } from '@/lib/onboarding'
import { leerSesion } from '@/sesion'

const FUNCIONES = [
  { icono: Radio, texto: 'WhatsApp de tu negocio, en una sola bandeja' },
  { icono: UsersRound, texto: 'Varios asesores atendiendo al mismo tiempo' },
  { icono: Workflow, texto: 'Embudo, tipos y etiquetas de clientes' },
  { icono: Bot, texto: 'Bots y agente con IA cuando lo actives' },
  { icono: Sparkles, texto: 'Envíos masivos con plantillas de Meta' },
]

function claveVista(): string {
  return `belly:bienvenida:${leerSesion()?.usuario.id ?? 'anonimo'}`
}

type BienvenidaProps = {
  abierta: boolean
  onCerrar: () => void
}

export function Bienvenida({ abierta, onCerrar }: BienvenidaProps) {
  const nombre = leerSesion()?.usuario.nombres?.split(' ')[0] ?? ''

  function terminar(verTutorial: boolean) {
    limpiarRecienRegistrado()
    localStorage.setItem(claveVista(), '1')
    onCerrar()
    if (verTutorial) {
      window.setTimeout(() => iniciarGuia('inicio'), 280)
    }
  }

  return (
    <Dialog open={abierta} onOpenChange={(abierto) => !abierto && terminar(false)}>
      <DialogContent showCloseButton className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="grid sm:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-5 p-6 sm:p-7">
            <DialogHeader className="gap-2">
              <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">Tu cuenta ya está lista</p>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {nombre ? `Hola, ${nombre}. Empecemos` : 'Hola. Empecemos'}
              </DialogTitle>
              <DialogDescription>
                En un minuto te muestro dónde está cada cosa. Después puedes seguir a tu ritmo.
              </DialogDescription>
            </DialogHeader>

            <ul className="grid gap-2.5">
              {FUNCIONES.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <Icono className="size-3.5" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
              <Button className="h-10 flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => terminar(true)}>
                Ver el recorrido
              </Button>
              <Button variant="outline" className="h-10" onClick={() => terminar(false)}>
                Entrar ya
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => terminar(true)}
            className="relative min-h-52 overflow-hidden bg-zinc-950 text-left sm:min-h-full"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.35),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(20,184,166,0.25),transparent_50%)]" />
            <div className="absolute inset-x-6 top-8 h-24 rounded-xl border border-white/10 bg-white/5" />
            <div className="absolute inset-x-10 top-16 h-20 rounded-lg border border-white/10 bg-zinc-900/80" />
            <div className="relative flex h-full min-h-52 flex-col items-center justify-center gap-3 p-6 text-center text-white">
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-900/40">
                <Play className="ml-0.5 size-6 fill-white" />
              </span>
              <span className="text-sm font-medium">Recorrido de 1 minuto</span>
              <span className="text-xs text-white/70">Te señala el menú, el chat y los primeros pasos</span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
