import { useSyncExternalStore } from 'react'

const CONSULTA = '(min-width: 1280px)'

function suscribir(alCambiar: () => void) {
  const medios = window.matchMedia(CONSULTA)
  medios.addEventListener('change', alCambiar)
  return () => medios.removeEventListener('change', alCambiar)
}

/** Desde el breakpoint `xl` de Tailwind. */
export function usePantallaAncha() {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches)
}
