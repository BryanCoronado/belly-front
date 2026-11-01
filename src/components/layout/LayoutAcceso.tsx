import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FondoRedBelly, LogoMarca, LogoMarcaGrande } from '@/components/Marca'
import { cn } from '@/lib/utils'
import { leerSesion, rutaTrasEntrar } from '@/sesion'

type LayoutAccesoProps = {
  titulo: string
  descripcion: string
  pie: ReactNode
  enlace?: { texto: string; to: string }
  paso?: { actual: number; total: number }
  children: ReactNode
}

export function LayoutAcceso({ titulo, descripcion, pie, enlace, paso, children }: LayoutAccesoProps) {
  const sesion = leerSesion()
  if (sesion) {
    return <Navigate to={rutaTrasEntrar(sesion.usuario)} replace />
  }

  return (
    <main className="pagina-acceso grid min-h-svh bg-white text-zinc-900 lg:grid-cols-2">
      <section className="flex min-h-svh flex-col px-6 py-8 sm:px-12 lg:px-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[1.0625rem] font-bold tracking-[-0.04em]">
            <LogoMarca variante="oscuro" className="size-9" />
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
          <h1 className="font-heading text-[1.7rem] leading-none font-bold tracking-[-0.035em]">{titulo}</h1>
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-zinc-500">{descripcion}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-zinc-500">{pie}</p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#0B1026] text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <FondoRedBelly className="text-[#A78BFA]/35" />
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[#A78BFA]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-10 size-56 rounded-full bg-[#6D5EF7]/15 blur-3xl" />

        <LogoMarcaGrande variante="claro" className="relative size-24" />

        <div className="relative max-w-sm space-y-4">
          <p className="font-heading text-[2rem] leading-[1.2] font-bold tracking-[-0.035em]">
            Los chats de WhatsApp de tu equipo, en un solo lugar.
          </p>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">Belly CRM</p>
        </div>
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
            className={cn('h-1 flex-1 rounded-full', indice < actual ? 'bg-primary' : 'bg-zinc-200')}
          />
        ))}
      </div>
    </div>
  )
}
