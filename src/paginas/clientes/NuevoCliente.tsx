import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, LoaderCircle, Send, UserPlus } from 'lucide-react'
import { crearClienteCrm, leerAsesores, type AjustesCrm } from '@/api'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { CLASE_SELECT, CLAVE_CRM, PAISES, codigoPaisGuardado, normalizarTelefono, recordarCodigoPais } from './crm'
import { SelectorEtiquetas } from './piezas'

const CLASE_AREA =
  'min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function NuevoCliente({ abierto, ajustes, admin, alCerrar }: { abierto: boolean; ajustes: AjustesCrm | undefined; admin: boolean; alCerrar: () => void }) {
  return (
    <Sheet open={abierto} onOpenChange={(valor) => (valor ? null : alCerrar())}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {abierto ? <Formulario ajustes={ajustes} admin={admin} alCerrar={alCerrar} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function Formulario({ ajustes, admin, alCerrar }: { ajustes: AjustesCrm | undefined; admin: boolean; alCerrar: () => void }) {
  const cliente = useQueryClient()
  const navegar = useNavigate()
  const [codigoPais, setCodigoPais] = useState(codigoPaisGuardado)
  const [telefono, setTelefono] = useState('')
  const [tocado, setTocado] = useState(false)
  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    distrito: '',
    notas: '',
    id_etapa: null as number | null,
    id_tipo: null as number | null,
    etiquetas: [] as number[],
    id_responsable: null as number | null,
  })
  const asesores = useQuery({ queryKey: [...CLAVE_CRM, 'asesores'], queryFn: leerAsesores, enabled: admin, staleTime: 60_000 })

  const numero = normalizarTelefono(telefono, codigoPais)
  const errorTelefono = tocado && telefono.trim() !== '' && !numero ? 'Revisa el número: deben ser de 8 a 15 dígitos con el código de país.' : undefined

  const guardar = useMutation({
    mutationFn: (abrirChat: boolean) => crearClienteCrm({ ...datos, telefono, codigo_pais: codigoPais, abrir_chat: abrirChat }),
    onSuccess: (creado, abrirChat) => {
      recordarCodigoPais(codigoPais)
      cliente.invalidateQueries({ queryKey: CLAVE_CRM })
      if (creado.aviso) {
        avisoError(new Error(creado.aviso), 'Cliente guardado')
      } else {
        avisoExito('Cliente guardado', creado.nombre || `+${creado.telefono}`)
      }
      alCerrar()
      if (abrirChat && creado.id_conversacion) navegar(`/chats?c=${creado.id_conversacion}`)
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  function enviar(evento: FormEvent, abrirChat = false) {
    evento.preventDefault()
    setTocado(true)
    if (numero) guardar.mutate(abrirChat)
  }

  return (
    <form onSubmit={(e) => enviar(e)} className="flex min-h-full flex-col">
      <SheetHeader className="gap-1 border-b p-6 pr-12">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <UserPlus className="size-5 text-muted-foreground" />
          </span>
          <div>
            <SheetTitle className="text-lg">Nuevo cliente</SheetTitle>
            <SheetDescription>Regístralo aunque todavía no te haya escrito.</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="grid gap-5 p-6">
        <div className="grid gap-2">
          <Label htmlFor="nuevo-telefono">WhatsApp</Label>
          <div className="flex gap-2">
            <select aria-label="País" className={cn(CLASE_SELECT, 'w-28 shrink-0')} value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)}>
              {PAISES.map((pais) => (
                <option key={pais.codigo} value={pais.codigo}>
                  +{pais.codigo} {pais.nombre}
                </option>
              ))}
            </select>
            <Input
              id="nuevo-telefono"
              type="tel"
              inputMode="tel"
              autoFocus
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onBlur={() => setTocado(true)}
              placeholder="987 654 321"
              aria-invalid={errorTelefono ? true : undefined}
              className="h-10"
            />
          </div>
          {errorTelefono ? (
            <p className="text-xs text-rose-600">{errorTelefono}</p>
          ) : numero ? (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3.5 text-emerald-600" />
              Se guardará como +{numero}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Si es de otro país, escríbelo con + y su código.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} maxLength={100} />
          <Campo etiqueta="Apellidos" value={datos.apellido} onChange={(e) => setDatos({ ...datos, apellido: e.target.value })} maxLength={100} opcional />
          <Campo etiqueta="Correo" type="email" value={datos.correo} onChange={(e) => setDatos({ ...datos, correo: e.target.value })} maxLength={150} opcional />
          <Campo etiqueta="Ubicación" value={datos.distrito} onChange={(e) => setDatos({ ...datos, distrito: e.target.value })} maxLength={100} placeholder="Ciudad o distrito" opcional />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nuevo-etapa">Etapa</Label>
            <select
              id="nuevo-etapa"
              className={CLASE_SELECT}
              value={datos.id_etapa ?? ''}
              onChange={(e) => setDatos({ ...datos, id_etapa: e.target.value ? Number(e.target.value) : null })}
            >
              {ajustes?.etapas.map((etapa, indice) => (
                <option key={etapa.id} value={indice === 0 ? '' : etapa.id}>
                  {etapa.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nuevo-tipo">Tipo</Label>
            <select
              id="nuevo-tipo"
              className={CLASE_SELECT}
              value={datos.id_tipo ?? ''}
              onChange={(e) => setDatos({ ...datos, id_tipo: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Sin tipo</option>
              {ajustes?.tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Etiquetas</legend>
          <SelectorEtiquetas etiquetas={ajustes?.etiquetas ?? []} elegidas={datos.etiquetas} alCambiar={(etiquetas) => setDatos({ ...datos, etiquetas })} />
        </fieldset>

        {admin ? (
          <div className="grid gap-2">
            <Label htmlFor="nuevo-responsable">Lo atiende</Label>
            <select
              id="nuevo-responsable"
              className={CLASE_SELECT}
              value={datos.id_responsable ?? ''}
              onChange={(e) => setDatos({ ...datos, id_responsable: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Yo</option>
              {asesores.data
                ?.filter((asesor) => asesor.activo)
                .map((asesor) => (
                  <option key={asesor.id} value={asesor.id}>
                    {asesor.nombre || asesor.usuario}
                  </option>
                ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="nuevo-notas">
            Notas <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <textarea
            id="nuevo-notas"
            value={datos.notas}
            onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
            maxLength={5000}
            rows={3}
            placeholder="De dónde viene, qué le interesa…"
            className={CLASE_AREA}
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto grid gap-2 border-t bg-popover p-4 sm:flex sm:justify-end">
        <Button type="button" variant="ghost" onClick={alCerrar} className="order-last sm:order-first">
          Cancelar
        </Button>
        <Button type="submit" variant="outline" disabled={guardar.isPending}>
          {guardar.isPending && !guardar.variables ? <LoaderCircle className="animate-spin" /> : null}
          Guardar
        </Button>
        <Button type="button" disabled={guardar.isPending} onClick={(e) => enviar(e, true)}>
          {guardar.isPending && guardar.variables ? <LoaderCircle className="animate-spin" /> : <Send />}
          Guardar y escribirle
        </Button>
      </div>
    </form>
  )
}
