export type UsuarioSesion = {
  id: number
  id_empresa: number
  empresa: string
  usuario: string
  nombres: string | null
  apellidos: string | null
  sudo?: number
}

export type Sesion = {
  token: string
  usuario: UsuarioSesion
}

const CLAVE = 'belly.sesion'

export function leerSesion(): Sesion | null {
  const crudo = localStorage.getItem(CLAVE)
  if (!crudo) {
    return null
  }

  try {
    const sesion = JSON.parse(crudo) as Sesion
    if (!sesion.token || !sesion.usuario?.usuario) {
      return null
    }
    return sesion
  } catch {
    return null
  }
}

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(CLAVE, JSON.stringify(sesion))
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE)
}

export function nombreVisible(usuario: UsuarioSesion): string {
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ').trim()
  return nombre || usuario.usuario
}

export function esAdministrador(usuario?: UsuarioSesion | null): boolean {
  return Number(usuario?.sudo) === 1
}
