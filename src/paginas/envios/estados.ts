import type { EstadoDestinatario, EstadoEnvio } from '@/api'

export const CLAVE_ENVIOS = ['envios']

export const ESTADO_ENVIO: Record<EstadoEnvio, { texto: string; clase: string }> = {
  enviando: { texto: 'Enviando', clase: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  terminado: { texto: 'Terminado', clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  cancelado: { texto: 'Cancelado', clase: 'bg-muted text-muted-foreground' },
}

export const ESTADO_DESTINATARIO: Record<EstadoDestinatario, { texto: string; clase: string }> = {
  pendiente: { texto: 'En cola', clase: 'bg-muted text-muted-foreground' },
  enviando: { texto: 'Enviando', clase: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  enviado: { texto: 'Enviado', clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  fallido: { texto: 'No se envió', clase: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  omitido: { texto: 'Omitido', clase: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
}

export function fechaEnvio(valor: string | null): string {
  if (!valor) return ''
  const fecha = new Date(valor.replace(' ', 'T'))
  return Number.isNaN(fecha.getTime())
    ? ''
    : fecha.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
