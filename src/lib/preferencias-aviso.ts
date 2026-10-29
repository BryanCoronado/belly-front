export type ItemAviso = {
  id: string
  idConversacion: number
  titulo: string
  descripcion: string
  cuando: number
  leido: boolean
}

export type PrefsAviso = {
  sonido: boolean
  escritorio: boolean
  silenciados: number[]
  bandeja: ItemAviso[]
}

const CLAVE = 'belly.avisos'
export const EVENTO_AVISOS = 'belly-avisos'
const MAX_BANDEJA = 30

function vacio(): PrefsAviso {
  return { sonido: true, escritorio: true, silenciados: [], bandeja: [] }
}

export function leerPrefsAviso(): PrefsAviso {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return vacio()
    const guardado = JSON.parse(crudo) as Partial<PrefsAviso>
    return {
      sonido: guardado.sonido !== false,
      escritorio: guardado.escritorio !== false,
      silenciados: Array.isArray(guardado.silenciados) ? guardado.silenciados.map(Number) : [],
      bandeja: Array.isArray(guardado.bandeja) ? guardado.bandeja : [],
    }
  } catch {
    return vacio()
  }
}

export function guardarPrefsAviso(parcial: Partial<PrefsAviso>): PrefsAviso {
  const actual = { ...leerPrefsAviso(), ...parcial }
  localStorage.setItem(CLAVE, JSON.stringify(actual))
  window.dispatchEvent(new Event(EVENTO_AVISOS))
  return actual
}

export function registrarAviso(datos: { idConversacion: number; titulo: string; descripcion: string }): ItemAviso {
  const prefs = leerPrefsAviso()
  const item: ItemAviso = {
    id: `${datos.idConversacion}-${Date.now()}`,
    idConversacion: datos.idConversacion,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    cuando: Date.now(),
    leido: false,
  }
  const bandeja = [item, ...prefs.bandeja.filter((aviso) => aviso.idConversacion !== datos.idConversacion)].slice(0, MAX_BANDEJA)
  guardarPrefsAviso({ bandeja })
  return item
}

export function marcarAvisosLeidos(idConversacion?: number): void {
  const prefs = leerPrefsAviso()
  guardarPrefsAviso({
    bandeja: prefs.bandeja.map((aviso) =>
      idConversacion && aviso.idConversacion !== idConversacion ? aviso : { ...aviso, leido: true },
    ),
  })
}

export function chatSilenciado(id: number): boolean {
  return leerPrefsAviso().silenciados.includes(Number(id))
}

export function alternarSilencio(id: number): boolean {
  const prefs = leerPrefsAviso()
  const clave = Number(id)
  const silenciados = prefs.silenciados.includes(clave)
    ? prefs.silenciados.filter((actual) => actual !== clave)
    : [...prefs.silenciados, clave]
  guardarPrefsAviso({ silenciados })
  return silenciados.includes(clave)
}

export function avisosSinLeer(): number {
  return leerPrefsAviso().bandeja.filter((aviso) => !aviso.leido).length
}
