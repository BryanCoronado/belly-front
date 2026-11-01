import { cn } from '@/lib/utils'

const LOGO = '/logo_belly.png'
const LOGO_CLARO = '/logo_belly_claro.png'

type Variante = 'auto' | 'oscuro' | 'claro'

type Props = { className?: string; variante?: Variante }

/** El PNG tiene mucho margen: lo acercamos para que el B llene el recuadro. */
const IMAGEN = 'absolute left-1/2 top-1/2 size-[170%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain'

function Imagenes({ variante = 'auto' }: { variante?: Variante }) {
  if (variante === 'claro') {
    return <img src={LOGO_CLARO} alt="Belly" className={IMAGEN} />
  }
  if (variante === 'oscuro') {
    return <img src={LOGO} alt="Belly" className={IMAGEN} />
  }
  return (
    <>
      <img src={LOGO} alt="Belly" className={cn(IMAGEN, 'dark:hidden')} />
      <img src={LOGO_CLARO} alt="Belly" className={cn(IMAGEN, 'hidden dark:block')} />
    </>
  )
}

function Marca({ grande = false, className, variante = 'auto' }: Props & { grande?: boolean }) {
  return (
    <span
      className={cn(
        'logo-belly relative flex shrink-0 items-center justify-center overflow-hidden',
        grande ? 'size-20 rounded-2xl' : 'size-11 rounded-xl',
        className,
      )}
    >
      <Imagenes variante={variante} />
    </span>
  )
}

export function LogoMarca({ className, variante = 'auto' }: Props) {
  return <Marca variante={variante} className={className} />
}

export function LogoMarcaGrande({ className, variante = 'auto' }: Props) {
  return <Marca grande variante={variante} className={className} />
}

/** Red de nodos del isotipo, de fondo. */
export function FondoRedBelly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={cn('pointer-events-none absolute inset-0 size-full', className)} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <line x1="70" y1="90" x2="160" y2="140" />
        <line x1="160" y1="140" x2="240" y2="80" />
        <line x1="160" y1="140" x2="190" y2="230" />
        <line x1="190" y1="230" x2="300" y2="210" />
        <line x1="190" y1="230" x2="120" y2="310" />
        <line x1="300" y1="210" x2="340" y2="300" />
        <line x1="240" y1="80" x2="320" y2="130" />
      </g>
      <g fill="currentColor">
        <circle cx="70" cy="90" r="4" />
        <circle cx="160" cy="140" r="5.5" />
        <circle cx="240" cy="80" r="3.5" />
        <circle cx="190" cy="230" r="4.5" />
        <circle cx="300" cy="210" r="3.5" />
        <circle cx="120" cy="310" r="3" />
        <circle cx="340" cy="300" r="3" />
        <circle cx="320" cy="130" r="3" />
      </g>
    </svg>
  )
}
