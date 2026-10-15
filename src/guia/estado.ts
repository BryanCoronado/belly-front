let guiaActual: string | null = null
const oyentes = new Set<() => void>()

function avisar() {
  oyentes.forEach((oyente) => oyente())
}

export function registrarGuia(id: string): void {
  guiaActual = id
  avisar()
}

export function liberarGuia(id: string): void {
  if (guiaActual === id) {
    guiaActual = null
    avisar()
  }
}

export function leerGuiaActual(): string | null {
  return guiaActual
}

export function suscribirGuia(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}
