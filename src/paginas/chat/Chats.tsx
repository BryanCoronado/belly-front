import { FileText, Lock, UserPlus, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useGuia } from '@/guia/useGuia'
import { cn } from '@/lib/utils'
import { ListaChats } from './ListaChats'
import { PanelConversacion } from './PanelConversacion'

export function Chats() {
  const [parametros, setParametros] = useSearchParams()
  const seleccionado = Number(parametros.get('c')) || null
  useGuia('chats')

  return (
    <div className="chat-wa flex min-h-0 flex-1 overflow-hidden bg-[var(--wa-lista)]">
      <ListaChats
        seleccionado={seleccionado}
        alSeleccionar={(chat) => setParametros({ c: String(chat.id) })}
        className={cn('flex w-full min-h-0 md:w-[40%] md:min-w-[340px] md:shrink-0 xl:w-[30%]', seleccionado && 'hidden md:flex')}
      />
      {seleccionado ? (
        <PanelConversacion
          idConversacion={seleccionado}
          alVolver={() => setParametros({})}
          className="min-h-0 flex-1"
        />
      ) : (
        <PanelVacioWa />
      )}
    </div>
  )
}

function PanelVacioWa() {
  return (
    <div className="relative hidden min-h-0 flex-1 flex-col items-center justify-center bg-[var(--wa-panel)] px-8 text-center md:flex">
      <div className="flex max-w-lg flex-col items-center gap-5">
        <div className="rounded-2xl bg-[var(--wa-lista)] px-10 py-9 shadow-[0_2px_12px_rgba(11,20,26,0.08)]">
          <IlustracionWa />
          <h1 className="mt-6 text-[28px] font-light leading-tight text-[var(--wa-texto)]">
            Belly listo para atender
          </h1>
          <p className="mt-2 text-[14px] leading-5 text-[var(--wa-muted)]">
            Elige un chat a la izquierda. Tus superpoderes CRM (etapa, etiquetas, bot y cierre) viven en el perfil
            del contacto y en el menú del chat.
          </p>
          <Link
            to="/clientes"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[var(--wa-verde)] px-5 text-sm font-medium text-white hover:bg-[var(--wa-verde-oscuro)]"
          >
            Buscar o iniciar chat
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-1">
          <AccesoRapido to="/integraciones/whatsapp" icono={<FileText className="size-5" />} texto="Plantillas" />
          <AccesoRapido to="/clientes" icono={<UserPlus className="size-5" />} texto="Contactos" />
          <AccesoRapido to="/asesores" icono={<Users className="size-5" />} texto="Equipo" />
        </div>
      </div>

      <p className="absolute bottom-6 flex items-center gap-1.5 text-[12px] text-[var(--wa-muted)]">
        <Lock className="size-3.5" />
        Tus mensajes personales están cifrados de extremo a extremo
      </p>
    </div>
  )
}

function AccesoRapido({ to, icono, texto }: { to: string; icono: ReactNode; texto: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 text-[12px] text-[var(--wa-muted)] hover:text-[var(--wa-texto)]">
      <span className="flex size-12 items-center justify-center rounded-full bg-[var(--wa-lista)] text-[var(--wa-texto)] shadow-sm ring-1 ring-black/5">
        {icono}
      </span>
      {texto}
    </Link>
  )
}

function IlustracionWa() {
  return (
    <svg viewBox="0 0 220 120" className="mx-auto h-24 w-auto text-[var(--wa-verde)]" aria-hidden>
      <rect x="18" y="28" width="120" height="72" rx="8" fill="currentColor" opacity="0.12" />
      <rect x="26" y="36" width="104" height="48" rx="4" fill="#fff" className="dark:fill-[#111b21]" />
      <rect x="34" y="44" width="48" height="6" rx="3" fill="currentColor" opacity="0.35" />
      <rect x="34" y="56" width="72" height="6" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="34" y="68" width="56" height="6" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="130" y="40" width="52" height="68" rx="10" fill="currentColor" opacity="0.18" />
      <rect x="138" y="50" width="36" height="44" rx="4" fill="#fff" className="dark:fill-[#111b21]" />
      <circle cx="156" cy="100" r="3" fill="currentColor" opacity="0.45" />
      <circle cx="178" cy="22" r="14" fill="currentColor" />
      <path d="M172 22h12M178 16v12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
