export type ModuloReciente = {
  ruta: string
  titulo: string
  at: number
}

const MAX = 8
const IGNORAR = new Set(['/inicio', '/dashboard', '/'])

function clave(idUsuario: number) {
  return `belly:modulos-recientes:${idUsuario}`
}

export function rutaDeModulo(pathname: string): string {
  const limpia = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  if (/^\/automatizacion\/\d+/.test(limpia)) return '/automatizacion'
  if (/^\/envios\/.+/.test(limpia)) return '/envios'
  return limpia
}

export function leerModulosRecientes(idUsuario: number): ModuloReciente[] {
  try {
    const crudo = localStorage.getItem(clave(idUsuario))
    if (!crudo) return []
    const lista = JSON.parse(crudo) as ModuloReciente[]
    return Array.isArray(lista) ? lista.filter((item) => item.ruta && item.titulo) : []
  } catch {
    return []
  }
}

export function registrarModuloReciente(idUsuario: number, pathname: string, titulo: string) {
  const ruta = rutaDeModulo(pathname)
  const nombre = titulo.trim()
  if (!nombre || IGNORAR.has(ruta)) return
  const actual = leerModulosRecientes(idUsuario).filter((item) => item.ruta !== ruta)
  const siguiente = [{ ruta, titulo: nombre, at: Date.now() }, ...actual].slice(0, MAX)
  localStorage.setItem(clave(idUsuario), JSON.stringify(siguiente))
}
