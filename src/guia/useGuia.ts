import { useEffect, useSyncExternalStore } from 'react'
import { leerGuiaActual, liberarGuia, registrarGuia, suscribirGuia } from './estado'
import { guiaVista, iniciarGuia } from './motor'

/** Espera a que la pantalla cargue sus datos antes de resaltar elementos. */
const ESPERA_INICIO_MS = 900

/** Declara la guía de la pantalla actual y la abre sola la primera vez. */
export function useGuia(id: string, opciones?: { silenciar?: boolean }): void {
  const silenciar = opciones?.silenciar ?? false
  useEffect(() => {
    registrarGuia(id)
    const temporizador = silenciar
      ? undefined
      : window.setTimeout(() => {
          if (!guiaVista(id)) iniciarGuia(id)
        }, ESPERA_INICIO_MS)

    return () => {
      if (temporizador !== undefined) window.clearTimeout(temporizador)
      liberarGuia(id)
    }
  }, [id, silenciar])
}

export function useGuiaActual(): string | null {
  return useSyncExternalStore(suscribirGuia, leerGuiaActual)
}
