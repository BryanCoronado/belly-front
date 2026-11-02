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
  operador?: boolean
  modo_ahorro?: boolean
}

export type Sesion = {
  token: string
  usuario: UsuarioSesion
}

const CLAVE = 'belly.sesion'
const CLAVE_VENCIDA = 'belly.sesion.vencida'
const CLAVE_MOTIVO = 'belly.sesion.motivo'
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
  echarDeLaSesion('vencida')
}

export function expulsarPorEmpresaPausada() {
  echarDeLaSesion('pausada')
}

function echarDeLaSesion(motivo: 'vencida' | 'pausada') {
  const ruta = window.location.pathname
  if (expulsando || ruta === '/' || ruta === '/registro' || ruta === '/acceso' || ruta.startsWith('/c/')) {
    return
  }
  expulsando = true
  sessionStorage.setItem(CLAVE_MOTIVO, motivo)
  marcarSesionVencida()
  cerrarSesion()
  window.location.replace(ruta.startsWith('/operador') ? '/acceso' : '/')
}

export function consumirSesionVencida(): boolean {
  return consumirMotivoCierre() === 'vencida'
}

export function consumirMotivoCierre(): 'pausada' | 'vencida' | null {
  const motivo = sessionStorage.getItem(CLAVE_MOTIVO)
  sessionStorage.removeItem(CLAVE_MOTIVO)
  const vencida = sessionStorage.getItem(CLAVE_VENCIDA) === '1'
  if (vencida) {
    sessionStorage.removeItem(CLAVE_VENCIDA)
  }
  if (motivo === 'pausada') {
    return 'pausada'
  }
  return vencida ? 'vencida' : null
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
  return arreglarNombre(nombre || usuario.usuario)
}

function arreglarNombre(texto: string): string {
  return texto
    .replace(/Due\uFFFDo/g, 'Dueño')
    .replace(/Due�o/g, 'Dueño')
    .replace(/Due├▒o/g, 'Dueño')
    .replace(/DueÃ±o/g, 'Dueño')
}

export function esAdministrador(usuario?: UsuarioSesion | null): boolean {
  return Number(usuario?.sudo) === 1
}

/** Dueño de Belly: cuenta aparte, no una empresa del CRM. */
export function esOperador(usuario?: UsuarioSesion | null): boolean {
  return usuario?.operador === true
}

export function rutaTrasEntrar(usuario?: UsuarioSesion | null): string {
  return esOperador(usuario) ? '/operador' : '/inicio'
}
