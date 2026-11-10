/** APK embebido en el front (`public/app/belly-asesor.apk`). Se descarga desde el CRM, no se sube. */
export const APK_ASESOR_PATH = '/app/belly-asesor.apk'
export const APK_ASESOR_VERSION = '1.0.0'

export function urlApkAsesor(): string {
  if (typeof window === 'undefined') return APK_ASESOR_PATH
  return `${window.location.origin}${APK_ASESOR_PATH}`
}
