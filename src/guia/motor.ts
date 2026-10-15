import { driver, type DriveStep, type Side } from 'driver.js'
import 'driver.js/dist/driver.css'
import { leerSesion } from '@/sesion'
import { GUIAS } from './guias'

export type PasoGuia = {
  /** Valor de data-tour. Sin selector, el paso aparece centrado. */
  en?: string
  titulo: string
  texto: string
  lado?: Side
  /** Muestra un botón que cierra la guía y pulsa el elemento resaltado. */
  probar?: string
}

const PREFIJO = 'belly:guia-vista'

function claveVista(id: string): string {
  return `${PREFIJO}:${leerSesion()?.usuario.id ?? 'anonimo'}:${id}`
}

export function guiaVista(id: string): boolean {
  return localStorage.getItem(claveVista(id)) === '1'
}

function marcarVista(id: string): void {
  localStorage.setItem(claveVista(id), '1')
}

/** Vuelve a mostrar sola cada guía la próxima vez que se entre a su pantalla. */
export function reiniciarGuias(): void {
  Object.keys(GUIAS).forEach((id) => localStorage.removeItem(claveVista(id)))
}

function elementoVisible(en: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${en}"]`)).find(
    (elemento) => elemento.getClientRects().length > 0,
  )
}

export function iniciarGuia(id: string): void {
  const definicion = GUIAS[id]
  if (!definicion) return

  const pasos = definicion.filter((paso) => !paso.en || elementoVisible(paso.en))
  if (pasos.length === 0) return

  const pasosDriver: DriveStep[] = pasos.map((paso) => ({
    element: paso.en ? () => elementoVisible(paso.en as string) as Element : undefined,
    popover: {
      title: paso.titulo,
      description: paso.texto,
      side: paso.lado,
      align: 'start',
      onPopoverRender: paso.probar
        ? (popover) => {
            const boton = document.createElement('button')
            boton.type = 'button'
            boton.className = 'belly-guia-probar'
            boton.textContent = paso.probar as string
            boton.addEventListener('click', () => {
              const destino = paso.en ? elementoVisible(paso.en) : undefined
              recorrido.destroy()
              destino?.click()
            })
            popover.footerButtons.prepend(boton)
          }
        : undefined,
    },
  }))

  const recorrido = driver({
    steps: pasosDriver,
    showProgress: pasosDriver.length > 1,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Atrás',
    doneBtnText: 'Entendido',
    popoverClass: 'belly-guia',
    overlayOpacity: 0.5,
    stagePadding: 6,
    stageRadius: 12,
    smoothScroll: true,
    onDestroyed: () => marcarVista(id),
  })

  recorrido.drive()
}
