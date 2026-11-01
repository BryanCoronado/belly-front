const LADO = 720

export function urlQrBase(enlace: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${LADO}x${LADO}&margin=18&ecc=H&data=${encodeURIComponent(enlace)}`
}

export async function armarQrConLogo(enlace: string, logo: HTMLImageElement | null): Promise<string> {
  const qr = await cargarImagen(urlQrBase(enlace), true)
  const lienzo = document.createElement('canvas')
  lienzo.width = LADO
  lienzo.height = LADO
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('No se pudo armar el QR.')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, LADO, LADO)
  ctx.drawImage(qr, 0, 0, LADO, LADO)

  if (logo) {
    const marca = Math.round(LADO * 0.22)
    const aire = Math.round(LADO * 0.02)
    const caja = marca + aire * 2
    const x = (LADO - caja) / 2
    const y = (LADO - caja) / 2

    redondear(ctx, x, y, caja, caja, aire + 4)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    ctx.save()
    redondear(ctx, x + aire, y + aire, marca, marca, Math.round(marca * 0.18))
    ctx.clip()
    ctx.drawImage(logo, x + aire, y + aire, marca, marca)
    ctx.restore()
  }

  return lienzo.toDataURL('image/png')
}

export function cargarImagen(src: string, cruzada = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    if (cruzada) imagen.crossOrigin = 'anonymous'
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    imagen.src = src
  })
}

export async function logoDesdeArchivo(archivo: File): Promise<HTMLImageElement> {
  const local = URL.createObjectURL(archivo)
  try {
    return await cargarImagen(local)
  } finally {
    URL.revokeObjectURL(local)
  }
}

function redondear(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radio = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radio, y)
  ctx.arcTo(x + w, y, x + w, y + h, radio)
  ctx.arcTo(x + w, y + h, x, y + h, radio)
  ctx.arcTo(x, y + h, x, y, radio)
  ctx.arcTo(x, y, x + w, y, radio)
  ctx.closePath()
}
