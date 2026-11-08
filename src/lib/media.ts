/**
 * Normaliza URLs de archivos en writable/uploads para que se vean
 * tanto en Vite (localhost:5173) como en producción.
 */
export function urlMedia(url: string | null | undefined): string {
  if (!url) return ''
  const texto = url.trim()
  if (!texto) return ''

  const match = texto.match(/\/uploads\/(.+)$/i)
  if (!match) return texto

  const ruta = `/uploads/${match[1]}`
  const base = (import.meta.env.VITE_MEDIA_URL as string | undefined)?.replace(/\/$/, '')
  if (base) return `${base}${ruta}`

  // En desarrollo el proxy de Vite reenvía /uploads al API.
  if (import.meta.env.DEV) return ruta

  return texto
}
