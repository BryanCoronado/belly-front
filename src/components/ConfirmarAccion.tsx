import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmarAccionProps = {
  abierto: boolean
  titulo: string
  texto: string
  etiqueta: string
  cargando?: boolean
  alCerrar: () => void
  alConfirmar: () => void
}

export function ConfirmarAccion({ abierto, titulo, texto, etiqueta, cargando, alCerrar, alConfirmar }: ConfirmarAccionProps) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => (valor ? null : alCerrar())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{texto}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={alCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={alConfirmar} disabled={cargando}>
            {cargando ? <LoaderCircle className="animate-spin" /> : null}
            {etiqueta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
