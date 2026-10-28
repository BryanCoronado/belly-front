export const CLAVE_RECIEN_REGISTRADO = 'belly:recien-registrado'

export function marcarRecienRegistrado(): void {
  sessionStorage.setItem(CLAVE_RECIEN_REGISTRADO, '1')
}

export function hayRecienRegistrado(): boolean {
  return sessionStorage.getItem(CLAVE_RECIEN_REGISTRADO) === '1'
}

export function limpiarRecienRegistrado(): void {
  sessionStorage.removeItem(CLAVE_RECIEN_REGISTRADO)
}
