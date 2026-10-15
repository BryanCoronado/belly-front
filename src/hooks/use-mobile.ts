import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768
const CONSULTA = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function suscribir(alCambiar: () => void) {
  const medios = window.matchMedia(CONSULTA)
  medios.addEventListener('change', alCambiar)
  return () => medios.removeEventListener('change', alCambiar)
}

export function useIsMobile() {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches)
}
