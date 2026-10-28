import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { LogoMarca } from '@/components/Marca'
import { cn } from '@/lib/utils'
import { leerSesion } from '@/sesion'

type LayoutAccesoProps = {
  titulo: string
  descripcion: string
  pie: ReactNode
  enlace?: { texto: string; to: string }
  paso?: { actual: number; total: number }
  children: ReactNode
}

export function LayoutAcceso({ titulo, descripcion, pie, enlace, paso, children }: LayoutAccesoProps) {
  if (leerSesion()) {
    return <Navigate to="/inicio" replace />
  }

  return (
    <main className="pagina-acceso grid min-h-svh bg-white text-zinc-900 lg:grid-cols-2">
      <section className="flex min-h-svh flex-col px-6 py-8 sm:px-12 lg:px-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <LogoMarca className="size-8 shadow-none" />
            Belly
          </div>
          {enlace ? (
            <Link to={enlace.to} className="text-sm text-zinc-600 hover:text-zinc-900">
              {enlace.texto}
            </Link>
          ) : null}
        </header>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {paso ? <ProgresoPaso actual={paso.actual} total={paso.total} /> : null}
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{descripcion}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-zinc-500">{pie}</p>
        </div>
      </section>

      <aside className="hidden bg-zinc-950 text-white lg:flex lg:flex-col lg:justify-end lg:p-14">
        <p className="max-w-sm text-3xl leading-snug font-medium">
          Los chats de WhatsApp de tu equipo, en un solo lugar.
        </p>
        <p className="mt-4 max-w-sm text-sm text-zinc-400">Belly CRM</p>
      </aside>
    </main>
  )
}

function ProgresoPaso({ actual, total }: { actual: number; total: number }) {
  return (
    <div className="mb-8 space-y-2">
      <p className="text-xs text-zinc-500">
        Paso {actual} de {total}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, indice) => (
          <span
            key={indice}
            className={cn('h-1 flex-1 rounded-full', indice < actual ? 'bg-emerald-600' : 'bg-zinc-200')}
          />
        ))}
      </div>
    </div>
  )
}
