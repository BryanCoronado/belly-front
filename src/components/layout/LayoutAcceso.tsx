import type { ReactNode } from 'react'
import { MessagesSquare, Shuffle, UsersRound } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { BotonTema } from '@/components/BotonTema'
import { LogoMarca } from '@/components/Marca'
import { cn } from '@/lib/utils'
import { leerSesion } from '@/sesion'

const BENEFICIOS = [
  { icono: MessagesSquare, texto: 'Todas las conversaciones de WhatsApp en una sola bandeja.' },
  { icono: Shuffle, texto: 'Reparto equitativo de chats entre tus vendedoras.' },
  { icono: UsersRound, texto: 'Cada empresa con su propio equipo y sus clientes.' },
]

type LayoutAccesoProps = {
  titulo: string
  descripcion: string
  pie: ReactNode
  ancho?: 'md' | 'xl'
  children: ReactNode
}

export function LayoutAcceso({ titulo, descripcion, pie, ancho = 'md', children }: LayoutAccesoProps) {
  if (leerSesion()) {
    return <Navigate to="/inicio" replace />
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <PanelMarca />

      <section className="relative flex flex-col items-center justify-center bg-background px-6 py-12 md:px-12">
        <BotonTema className="absolute top-4 right-4 rounded-full" />
        <div className={cn('w-full space-y-8', ancho === 'md' ? 'max-w-md' : 'max-w-2xl')}>
          <div className="flex items-center gap-2.5 text-lg font-semibold lg:hidden">
            <LogoMarca />
            Belly
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
            <p className="text-base text-muted-foreground">{descripcion}</p>
          </div>

          {children}

          <p className="text-sm text-muted-foreground">{pie}</p>
        </div>
      </section>
    </main>
  )
}

function PanelMarca() {
  return (
    <aside className="tema-fijo relative hidden overflow-hidden bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative flex items-center gap-3 text-xl font-semibold">
        <LogoMarca className="size-10 bg-white text-emerald-700" />
        Belly
      </div>

      <div className="relative space-y-8">
        <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">
          Atiende a tus clientes de WhatsApp con todo tu equipo.
        </h2>
        <ul className="space-y-4">
          {BENEFICIOS.map(({ icono: Icono, texto }) => (
            <li key={texto} className="flex items-center gap-3 text-base text-emerald-50">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                <Icono className="size-4" />
              </span>
              {texto}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-emerald-100/80">© {new Date().getFullYear()} Belly CRM</p>
    </aside>
  )
}
