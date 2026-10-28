export type UsuarioSesion = {
  id: number
  id_empresa: number
  empresa: string
  empresa_nombre?: string | null
  usuario: string
  nombres: string | null
  apellidos: string | null
  foto?: string | null
  sudo?: number
}

export type Sesion = {
  token: string
  usuario: UsuarioSesion
}

const CLAVE = 'belly.sesion'
const CLAVE_VENCIDA = 'belly.sesion.vencida'
let expulsando = false

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
    if (tokenVencido(sesion.token)) {
      marcarSesionVencida()
      localStorage.removeItem(CLAVE)
      return null
    }
    return sesion
  } catch {
    return null
  }
}

export function guardarSesion(sesion: Sesion) {
  sessionStorage.removeItem(CLAVE_VENCIDA)
  localStorage.setItem(CLAVE, JSON.stringify(sesion))
  window.dispatchEvent(new Event('belly-sesion'))
}

export function actualizarUsuarioSesion(parcial: Partial<UsuarioSesion>) {
  const sesion = leerSesion()
  if (!sesion) return
  guardarSesion({ ...sesion, usuario: { ...sesion.usuario, ...parcial } })
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE)
}

/** El API rechazó el token (vencido o inválido): borra la sesión y manda al login. */
export function expulsarPorTokenVencido() {
  if (expulsando || window.location.pathname === '/' || window.location.pathname === '/registro') {
    return
  }
  expulsando = true
  marcarSesionVencida()
  cerrarSesion()
  window.location.replace('/')
}

export function consumirSesionVencida(): boolean {
  const vencida = sessionStorage.getItem(CLAVE_VENCIDA) === '1'
  if (vencida) {
    sessionStorage.removeItem(CLAVE_VENCIDA)
  }
  return vencida
}

function marcarSesionVencida() {
  sessionStorage.setItem(CLAVE_VENCIDA, '1')
}

/** Lee el `exp` del JWT sin validar la firma: eso lo hace el API. */
function tokenVencido(token: string): boolean {
  const parte = token.split('.')[1]
  if (!parte) {
    return true
  }
  try {
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(base64 + relleno)) as { exp?: number }
    const expira = Number(payload.exp)
    return Number.isFinite(expira) && expira * 1000 <= Date.now()
  } catch {
    return false
  }
}

export function nombreVisible(usuario: UsuarioSesion): string {
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ').trim()
  return nombre || usuario.usuario
}

export function esAdministrador(usuario?: UsuarioSesion | null): boolean {
  return Number(usuario?.sudo) === 1
}
