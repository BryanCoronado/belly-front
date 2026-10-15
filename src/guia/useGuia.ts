import { useEffect, useSyncExternalStore } from 'react'
import { leerGuiaActual, liberarGuia, registrarGuia, suscribirGuia } from './estado'
import { guiaVista, iniciarGuia } from './motor'

/** Espera a que la pantalla cargue sus datos antes de resaltar elementos. */
const ESPERA_INICIO_MS = 900

/** Declara la guía de la pantalla actual y la abre sola la primera vez. */
export function useGuia(id: string): void {
  useEffect(() => {
    registrarGuia(id)
    const temporizador = window.setTimeout(() => {
      if (!guiaVista(id)) iniciarGuia(id)
    }, ESPERA_INICIO_MS)

    return () => {
      window.clearTimeout(temporizador)
      liberarGuia(id)
    }
  }, [id])
}

export function useGuiaActual(): string | null {
  return useSyncExternalStore(suscribirGuia, leerGuiaActual)
}
