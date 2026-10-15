import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { enviarPlantilla, finalizarChat, leerMotivosCierre, leerPlantillasWhatsapp, type PlantillaWhatsapp } from '@/api'
import { Campo, CampoSelect } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { avisoError, avisoExito } from '@/lib/avisos'
import { contarVariables, textoPlantilla } from './formato'

type PropsPlantilla = {
  abierto: boolean
  idConversacion: number
  idApp: number
  alCerrar: () => void
  alEnviar: () => void
}

export function DialogoPlantilla({ abierto, idConversacion, idApp, alCerrar, alEnviar }: PropsPlantilla) {
  const plantillas = useQuery({
    queryKey: ['plantillas-whatsapp', idApp],
    queryFn: () => leerPlantillasWhatsapp(idApp),
    enabled: abierto && idApp > 0,
    staleTime: 5 * 60_000,
  })

  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar plantilla</DialogTitle>
          <DialogDescription>Aprobadas por Meta.</DialogDescription>
        </DialogHeader>
        {plantillas.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando plantillas…
          </p>
        ) : plantillas.isError ? (
          <p className="text-sm text-destructive">{plantillas.error.message}</p>
        ) : plantillas.data?.length ? (
          <FormularioPlantilla
            key={idConversacion}
            plantillas={plantillas.data}
            idConversacion={idConversacion}
            alCancelar={alCerrar}
            alEnviar={alEnviar}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Este número no tiene plantillas aprobadas.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

type PropsFormularioPlantilla = {
  plantillas: PlantillaWhatsapp[]
  idConversacion: number
  alCancelar: () => void
  alEnviar: () => void
}

function FormularioPlantilla({ plantillas, idConversacion, alCancelar, alEnviar }: PropsFormularioPlantilla) {
  const [idPlantilla, setIdPlantilla] = useState(plantillas[0].id)
  const [variables, setVariables] = useState<string[]>([])
  const plantilla = plantillas.find((opcion) => opcion.id === idPlantilla) ?? plantillas[0]
  const encabezado = textoPlantilla(plantilla, 'HEADER')
  const cuerpo = textoPlantilla(plantilla, 'BODY')
  const totalVariables = contarVariables(encabezado) + contarVariables(cuerpo)

  const envio = useMutation({
    mutationFn: () => enviarPlantilla(idConversacion, plantilla, Array.from({ length: totalVariables }, (_, i) => variables[i] ?? '')),
    onSuccess: () => {
      avisoExito('Plantilla enviada')
      alEnviar()
    },
    onError: (error) => avisoError(error, 'No se pudo enviar la plantilla'),
  })

  const completas = Array.from({ length: totalVariables }, (_, i) => (variables[i] ?? '').trim() !== '').every(Boolean)

  return (
    <form
      className="grid gap-4"
      onSubmit={(evento) => {
        evento.preventDefault()
        envio.mutate()
      }}
    >
      <CampoSelect
        etiqueta="Plantilla"
        value={idPlantilla}
        onChange={(evento) => {
          setIdPlantilla(evento.target.value)
          setVariables([])
        }}
      >
        {plantillas.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>
            {opcion.name} ({opcion.language})
          </option>
        ))}
      </CampoSelect>

      <div className="rounded-md border bg-zinc-50 p-3 text-sm whitespace-pre-wrap">
        {encabezado ? <p className="mb-1 font-semibold">{encabezado}</p> : null}
        {cuerpo || <span className="text-muted-foreground">Sin texto</span>}
      </div>

      {Array.from({ length: totalVariables }, (_, indice) => (
        <Campo
          key={`${plantilla.id}-${indice}`}
          etiqueta={`Valor para {{${indice + 1}}}`}
          value={variables[indice] ?? ''}
          onChange={(evento) => {
            const copia = [...variables]
            copia[indice] = evento.target.value
            setVariables(copia)
          }}
          required
        />
      ))}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={alCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={envio.isPending || !completas}>
          {envio.isPending ? <Loader2 className="animate-spin" /> : null}
          Enviar plantilla
        </Button>
      </DialogFooter>
    </form>
  )
}

type PropsFinalizar = {
  abierto: boolean
  idConversacion: number
  alCerrar: () => void
  alFinalizar: () => void
}

export function DialogoFinalizar({ abierto, idConversacion, alCerrar, alFinalizar }: PropsFinalizar) {
  const [idMotivo, setIdMotivo] = useState(0)
  const motivos = useQuery({ queryKey: ['motivos-cierre'], queryFn: leerMotivosCierre, enabled: abierto, staleTime: 5 * 60_000 })

  const cierre = useMutation({
    mutationFn: () => finalizarChat(idConversacion, idMotivo),
    onSuccess: () => {
      avisoExito('Conversación finalizada')
      setIdMotivo(0)
      alFinalizar()
    },
    onError: (error) => avisoError(error, 'No se pudo finalizar'),
  })

  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar conversación</DialogTitle>
          <DialogDescription>Pasará a Finalizados.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            cierre.mutate()
          }}
        >
          <CampoSelect
            etiqueta="Motivo"
            value={idMotivo}
            onChange={(evento) => setIdMotivo(Number(evento.target.value))}
            required
          >
            <option value={0} disabled>
              {motivos.isLoading ? 'Cargando…' : 'Elige un motivo'}
            </option>
            {motivos.data?.map((motivo) => (
              <option key={motivo.id} value={motivo.id}>
                {motivo.nombre}
              </option>
            ))}
          </CampoSelect>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cierre.isPending || idMotivo === 0}>
              {cierre.isPending ? <Loader2 className="animate-spin" /> : null}
              Finalizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
