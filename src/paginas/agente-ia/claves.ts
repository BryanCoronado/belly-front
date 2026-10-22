import type { TonoAgente } from '@/api'

export const CLAVE_IA = ['ia']

export const claveAgente = (id: number) => ['ia-agente', id]

export const CLASE_AREA =
  'w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export const MODELOS: Record<string, string> = {
  'gpt-4o-mini': 'GPT-4o mini · rápido y económico (recomendado)',
  'gpt-4.1-mini': 'GPT-4.1 mini · rápido y sigue mejor las indicaciones',
  'gpt-4o': 'GPT-4o · más inteligente, cuesta más',
  'gpt-4.1': 'GPT-4.1 · el más preciso, cuesta más',
}

export const TONOS: Record<TonoAgente, string> = {
  amable: 'Amable',
  formal: 'Formal',
  directo: 'Directo',
  divertido: 'Divertido',
}

/** Mismas reglas que el servidor. */
export const LIMITES = { fichas: 60, ficha: 60000, titulo: 120, mensajePrueba: 1000, lineasPrueba: 20 }

/** Formato de las llaves de OpenAI: empiezan con «sk-» y no llevan espacios. */
export const PATRON_LLAVE = /^sk-[A-Za-z0-9_-]{20,300}$/

export function errorDeNombre(nombre: string, otros: string[]): string | null {
  const limpio = nombre.trim()
  if (limpio.length < 2) return 'Escribe un nombre de al menos 2 letras.'
  if (otros.some((n) => n.trim().toLowerCase() === limpio.toLowerCase())) return 'Ya tienes un asistente con este nombre.'
  return null
}
