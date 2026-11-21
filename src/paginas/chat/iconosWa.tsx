import type { ReactNode, SVGProps } from 'react'

type Icono = SVGProps<SVGSVGElement> & { activo?: boolean }

function Base({ children, ...props }: Icono & { children: ReactNode }) {
  const atributos = { ...props }
  delete atributos.activo
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden {...atributos}>
      {children}
    </svg>
  )
}

export function IconoChats({ activo, ...props }: Icono) {
  return (
    <Base {...props}>
      {activo ? (
        <path
          fill="currentColor"
          d="M4.8 2.5h14.4a2.3 2.3 0 0 1 2.3 2.3v10.4a2.3 2.3 0 0 1-2.3 2.3H7.7l-3.4 3.1c-.6.5-1.5.1-1.5-.7V4.8a2.3 2.3 0 0 1 2-2.3Zm2.7 5.3a.9.9 0 1 0 0 1.8h9a.9.9 0 1 0 0-1.8h-9Zm0 3.6a.9.9 0 1 0 0 1.8h5.6a.9.9 0 1 0 0-1.8H7.5Z"
        />
      ) : (
        <>
          <path
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            d="M4.8 3.4h14.4c.8 0 1.4.6 1.4 1.4v10.4c0 .8-.6 1.4-1.4 1.4H7.4l-3.7 3.2V4.8c0-.8.4-1.4 1.1-1.4Z"
          />
          <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M7.5 8.7h9M7.5 12.3h5.6" />
        </>
      )}
    </Base>
  )
}

export function IconoLlamadas(props: Icono) {
  return (
    <Base {...props}>
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M6.6 3.5 9 3.9l1.2 3.9-1.8 1.6a12 12 0 0 0 6.2 6.2l1.6-1.8 3.9 1.2.4 2.4c.1.9-.5 1.7-1.4 1.8C11.4 20 4 12.6 4.8 4.9c.1-.9.9-1.5 1.8-1.4Z"
      />
    </Base>
  )
}

export function IconoEstados(props: Icono) {
  return (
    <Base {...props}>
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M12 3a9 9 0 0 1 0 18M8.1 4a9 9 0 0 0-2.4 1.6M4 8.1a9 9 0 0 0-.9 2.9M3.1 13a9 9 0 0 0 .9 2.9M5.7 18.4A9 9 0 0 0 8.1 20" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
    </Base>
  )
}

export function IconoCanales(props: Icono) {
  return (
    <Base {...props}>
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.3 20.7l4.4-1.1A8.8 8.8 0 1 0 12 3.2Z"
      />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M9 9a4.2 4.2 0 0 0 0 6M15 9a4.2 4.2 0 0 1 0 6" />
    </Base>
  )
}

export function IconoComunidades(props: Icono) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8.3" r="3.1" stroke="currentColor" strokeWidth="1.8" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M6.4 19.4c.4-3 2.8-5 5.6-5s5.2 2 5.6 5" />
      <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M5.6 6.6a2.4 2.4 0 0 0 0 4.4M18.4 6.6a2.4 2.4 0 0 1 0 4.4M2.6 17.4c.3-1.9 1.5-3.2 3.1-3.7M21.4 17.4c-.3-1.9-1.5-3.2-3.1-3.7" />
    </Base>
  )
}

export function IconoTienda(props: Icono) {
  return (
    <Base {...props}>
      <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M4.2 9.4V19c0 .6.4 1 1 1h13.6c.6 0 1-.4 1-1V9.4" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M3.4 5.6 4.6 4h14.8l1.2 1.6.4 2a2.6 2.6 0 0 1-4.6 1.8 2.6 2.6 0 0 1-4.4 0 2.6 2.6 0 0 1-4.4 0A2.6 2.6 0 0 1 3 7.6l.4-2Z" />
      <path stroke="currentColor" strokeWidth="1.8" d="M9.6 20v-4.6h4.8V20" />
    </Base>
  )
}

export function IconoDifusion(props: Icono) {
  return (
    <Base {...props}>
      <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M4 9.4h3.2L16.6 4.6v14.8L7.2 14.6H4c-.6 0-1-.4-1-1v-3.2c0-.6.4-1 1-1Z" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M7.6 14.8 9 20M19.6 9.6a3.2 3.2 0 0 1 0 4.8" />
    </Base>
  )
}

export function IconoMultimedia(props: Icono) {
  return (
    <Base {...props}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="m3.6 16.4 4.6-4.6 3.6 3.6 2.4-2.4 6.2 6.2" />
      <circle cx="15.6" cy="8.4" r="1.6" fill="currentColor" />
    </Base>
  )
}

export function IconoAjustes(props: Icono) {
  return (
    <Base {...props}>
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="m10.3 3 3.4 0 .5 2.4 1.6.9 2.3-.8 1.7 2.9-1.8 1.6v1.9l1.8 1.6-1.7 2.9-2.3-.8-1.6.9-.5 2.4h-3.4l-.5-2.4-1.6-.9-2.3.8L4.2 15.6 6 14V12.1L4.2 10.5l1.7-2.9 2.3.8 1.6-.9L10.3 3Z"
      />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
    </Base>
  )
}

export function IconoNuevoChat(props: Icono) {
  return (
    <Base {...props}>
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M12 3.4H5c-.9 0-1.6.7-1.6 1.6v10.6c0 .9.7 1.6 1.6 1.6h2v3.4l3.8-3.4H19c.9 0 1.6-.7 1.6-1.6V12"
      />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M17.6 2.8v6.4M14.4 6h6.4" />
    </Base>
  )
}

export function IconoMenu(props: Icono) {
  return (
    <Base {...props}>
      <circle cx="12" cy="5.4" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="18.6" r="1.7" fill="currentColor" />
    </Base>
  )
}

export function IconoBuscar(props: Icono) {
  return (
    <Base {...props}>
      <circle cx="10.6" cy="10.6" r="6.4" stroke="currentColor" strokeWidth="1.9" />
      <path stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" d="m15.4 15.4 4.8 4.8" />
    </Base>
  )
}

export function IconoArchivados(props: Icono) {
  return (
    <Base {...props}>
      <rect x="3.6" y="4" width="16.8" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path stroke="currentColor" strokeWidth="1.8" d="M3.6 13.2h4.8l1.2 2h4.8l1.2-2h4.8" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m-2.2-2.2L12 12l2.2-2.2" />
    </Base>
  )
}

export function IconoAdjuntar(props: Icono) {
  return (
    <Base {...props}>
      <path stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" d="M12 5v14M5 12h14" />
    </Base>
  )
}

export function IconoSticker(props: Icono) {
  return (
    <Base {...props}>
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M20.6 12.6V6.4a3 3 0 0 0-3-3H6.4a3 3 0 0 0-3 3v11.2a3 3 0 0 0 3 3h6.2l8-8Z"
      />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12.6 20.6v-5a3 3 0 0 1 3-3h5" />
      <circle cx="9" cy="9.6" r="1.2" fill="currentColor" />
      <circle cx="15" cy="9.6" r="1.2" fill="currentColor" />
      <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M8.6 14c.8.8 1.8 1.2 3 1.2" />
    </Base>
  )
}

export function IconoMicrofono(props: Icono) {
  return (
    <Base {...props}>
      <rect x="8.6" y="2.8" width="6.8" height="11.6" rx="3.4" fill="currentColor" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6v3.6" />
    </Base>
  )
}

export function IconoEnviar(props: Icono) {
  return (
    <Base {...props}>
      <path fill="currentColor" d="M4.1 20.3 21.4 12 4.1 3.7l-.1 6.5 12.4 1.8-12.4 1.8.1 6.5Z" />
    </Base>
  )
}

export function IconoLlamar(props: Icono) {
  return <IconoLlamadas {...props} />
}

export function IconoPlantilla(props: Icono) {
  return (
    <Base {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
    </Base>
  )
}

export function IconoTickDoble(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 11" fill="none" aria-hidden {...props}>
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="m1.2 5.9 2.9 2.9L10.6 1.4M8 8.4l.5.4L15 1.4" />
    </svg>
  )
}

export function IconoTickSimple(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 11" fill="none" aria-hidden {...props}>
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="m1.2 5.9 2.9 2.9 6.6-7.4" />
    </svg>
  )
}

export function IconoEtiqueta(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="currentColor" d="M3.6 6.2C3.6 4.8 4.8 3.6 6.2 3.6h7.3c.7 0 1.3.3 1.8.7l5.2 5.9c.8.9.8 2.4 0 3.3l-5.2 5.9c-.5.5-1.1.8-1.8.8H6.2c-1.4 0-2.6-1.2-2.6-2.6V6.2Z" />
    </svg>
  )
}

export function AvatarWa({ foto, nombre, className }: { foto?: string | null; nombre?: string; className?: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-[#dfe5e7] dark:bg-[#6a7175] ${className ?? 'size-10'}`}
      title={nombre}
    >
      {foto ? (
        <img src={foto} alt={nombre ?? ''} className="size-full object-cover" loading="lazy" />
      ) : (
        <svg viewBox="0 0 212 212" className="size-full" aria-hidden>
          <path
            className="fill-white dark:fill-[#cfd4d6]"
            d="M106.3 33.2c-21.8 0-39.5 17.7-39.5 39.5 0 21.8 17.7 39.5 39.5 39.5s39.5-17.7 39.5-39.5c0-21.8-17.7-39.5-39.5-39.5Zm0 89.9c-37.7 0-71.7 15.8-91.2 41.2C34.4 193.4 68 212 106 212s71.6-18.6 90.9-47.7c-19.5-25.4-52.9-41.2-90.6-41.2Z"
          />
        </svg>
      )}
    </span>
  )
}

export function IconoLista(props: Icono) {
  return (
    <Base {...props}>
      <rect x="3.6" y="4.4" width="16.8" height="15.2" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 4.4v15.2M11.4 9.6h5.4M11.4 14.4h5.4" />
    </Base>
  )
}
