import { toast } from 'sonner'

export function avisoExito(titulo: string, descripcion?: string) {
  toast.success(titulo, { description: descripcion })
}

export function avisoError(error: unknown, titulo = 'Algo salió mal') {
  const descripcion = error instanceof Error ? error.message : 'Inténtalo de nuevo.'
  toast.error(titulo, { description: descripcion })
}

export function avisoInfo(titulo: string, descripcion?: string) {
  toast.info(titulo, { description: descripcion })
}
