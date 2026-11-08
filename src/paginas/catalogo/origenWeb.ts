/** Marca en el mensaje para saber que el cliente vino desde la tienda web. */
export const MARCA_ORIGEN_WEB = '[Belly·Web]'

export function conOrigenWeb(texto: string): string {
  const limpio = texto.trim()
  if (!limpio) return MARCA_ORIGEN_WEB
  if (limpio.includes('Belly·Web')) return limpio
  return `${limpio}\n\n${MARCA_ORIGEN_WEB}`
}

export function enlaceWhatsapp(numero: string, texto?: string): string {
  const digitos = numero.replace(/\D+/g, '')
  const base = `https://wa.me/${digitos}`
  if (!texto?.trim()) return `${base}?text=${encodeURIComponent(MARCA_ORIGEN_WEB)}`
  return `${base}?text=${encodeURIComponent(conOrigenWeb(texto))}`
}
