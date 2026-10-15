import { useSyncExternalStore } from 'react'

export type Tema = 'claro' | 'oscuro'

const CLAVE = 'belly-tema'
const oyentes = new Set<() => void>()

function preferenciaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'claro' || guardado === 'oscuro') {
      return guardado
    }
  } catch {
    // Sin acceso al almacenamiento: se usa la preferencia del sistema.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

function aplicar(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro')
  document.documentElement.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light'
}

let actual: Tema = preferenciaInicial()
aplicar(actual)

function cambiar(tema: Tema) {
  actual = tema
  aplicar(tema)
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Si no se puede guardar, igual se aplica en esta sesión.
  }
  oyentes.forEach((avisar) => avisar())
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar)
  return () => {
    oyentes.delete(avisar)
  }
}

/** Tema claro/oscuro de toda la aplicación; se recuerda en este navegador. */
export function useTema() {
  const tema = useSyncExternalStore(suscribir, () => actual, () => 'claro' as Tema)

  return {
    tema,
    oscuro: tema === 'oscuro',
    alternar: () => cambiar(tema === 'oscuro' ? 'claro' : 'oscuro'),
  }
}
