import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Contact, KanbanSquare, List, LoaderCircle, MessageCircle, Plus, Settings2, Upload, X } from 'lucide-react'
import { actualizarVariosClientes, leerClientesCrm, type AjustesCrm as Ajustes, type CambiosVarios, type ClienteCrm, type FiltrosClientes } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { TablaResponsiva } from '@/components/TablaResponsiva'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'
import { iniciales } from '../chat/formato'
import { AjustesCrm } from './AjustesCrm'
import { Embudo } from './Embudo'
import { FichaCliente } from './FichaCliente'
import { NuevoCliente } from './NuevoCliente'
import { CLASE_SELECT, CLAVE_CRM, haceCuanto, hayFiltros, useAjustesCrm, useEscribirCliente } from './crm'
import { BarraFiltros, Chip, Punto } from './piezas'

const POR_PAGINA = 25

const ORIGEN: Record<ClienteCrm['origen'], string> = { whatsapp: 'WhatsApp', manual: 'Registrado a mano', importado: 'Importado' }

const VISTAS = [
  { id: 'lista', titulo: 'Lista', icono: List },
  { id: 'embudo', titulo: 'Embudo', icono: KanbanSquare },
] as const

export function Clientes({ propios = false }: { propios?: boolean }) {
  const usuario = leerSesion()?.usuario
  const admin = esAdministrador(usuario)
  const [params, setParams] = useSearchParams()
  const vista = params.get('vista') === 'embudo' ? 'embudo' : 'lista'
  const [filtros, setFiltros] = useState<FiltrosClientes>(propios && usuario ? { id_asesor: usuario.id } : {})
  const [abierto, setAbierto] = useState<number | null>(null)
  const [ajustesAbierto, setAjustesAbierto] = useState(false)
  const [creando, setCreando] = useState(false)
  const ajustes = useAjustesCrm()

  return (
    <div className="space-y-5">
      <CabeceraPagina
        titulo={propios ? 'Mis clientes' : 'Clientes'}
        descripcion={admin && !propios ? 'Todos los clientes de tu empresa, en qué etapa están y quién los atiende.' : 'Los clientes que atiendes o atendiste.'}
        acciones={
          <>
            {admin ? (
              <Button variant="ghost" size="lg" className="h-10" onClick={() => setAjustesAbierto(true)}>
                <Settings2 />
                Ajustes
              </Button>
            ) : null}
            <Link to="/clientes/importar" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10')}>
              <Upload />
              Importar
            </Link>
            <Button size="lg" className="h-10" onClick={() => setCreando(true)}>
              <Plus />
              Nuevo cliente
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          {VISTAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setParams(item.id === 'lista' ? {} : { vista: item.id }, { replace: true })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                vista === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icono className="size-4" />
              {item.titulo}
            </button>
          ))}
        </div>
        <BarraFiltros filtros={filtros} alCambiar={setFiltros} ajustes={ajustes.data} sinEtapa={vista === 'embudo'} />
      </div>

      {vista === 'embudo' ? (
        <Embudo filtros={filtros} alAbrir={setAbierto} />
      ) : (
        <ListaClientes key={JSON.stringify(filtros)} filtros={filtros} ajustes={ajustes.data} admin={admin} alAbrir={setAbierto} />
      )}

      <FichaCliente id={abierto} ajustes={ajustes.data} alCerrar={() => setAbierto(null)} />
      <NuevoCliente abierto={creando} ajustes={ajustes.data} admin={admin} alCerrar={() => setCreando(false)} />
      {admin ? <AjustesCrm abierto={ajustesAbierto} alCerrar={() => setAjustesAbierto(false)} /> : null}
    </div>
  )
}

function ListaClientes({
  filtros,
  ajustes,
  admin,
  alAbrir,
}: {
  filtros: FiltrosClientes
  ajustes: Ajustes | undefined
  admin: boolean
  alAbrir: (id: number) => void
}) {
  const [pagina, setPagina] = useState(1)
  const [seleccion, setSeleccion] = useState<number[]>([])
  const { escribir, abriendo } = useEscribirCliente()
  const consulta = useQuery({
    queryKey: [...CLAVE_CRM, 'lista', filtros, pagina],
    queryFn: () => leerClientesCrm(filtros, pagina, POR_PAGINA),
    placeholderData: keepPreviousData,
  })

  const etapas = new Map(ajustes?.etapas.map((e) => [e.id, e]))
  const tipos = new Map(ajustes?.tipos.map((t) => [t.id, t]))
  const total = consulta.data?.total ?? 0
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const filas = consulta.data?.filas

  const alternar = (id: number) => setSeleccion((actual) => (actual.includes(id) ? actual.filter((s) => s !== id) : [...actual, id]))

  return (
    <div className="space-y-3">
      {seleccion.length ? (
        <AccionesVarias ids={seleccion} ajustes={ajustes} alTerminar={() => setSeleccion([])} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {consulta.data ? `${total} ${total === 1 ? 'cliente' : 'clientes'}` : 'Cargando…'}
            {hayFiltros(filtros) ? ' con esos filtros' : ''}
          </span>
          {filas?.length ? (
            <Button variant="ghost" size="sm" onClick={() => setSeleccion(filas.map((f) => f.id))}>
              Seleccionar los {filas.length} de esta página
            </Button>
          ) : null}
        </div>
      )}

      <TablaResponsiva<ClienteCrm>
        filas={filas}
        cargando={consulta.isLoading}
        clave={(fila) => String(fila.id)}
        columnas={[
          {
            titulo: 'Cliente',
            principal: true,
            celda: (fila) => (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-foreground"
                  checked={seleccion.includes(fila.id)}
                  onChange={() => alternar(fila.id)}
                  aria-label={`Seleccionar a ${fila.nombre || fila.telefono}`}
                />
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{iniciales(fila.nombre || '#')}</AvatarFallback>
                </Avatar>
                <button type="button" className="min-w-0 text-left" onClick={() => alAbrir(fila.id)}>
                  <p className="truncate font-medium hover:underline">{fila.nombre || 'Sin nombre'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fila.telefono ? `+${fila.telefono}` : 'Sin teléfono'}
                    {fila.origen !== 'whatsapp' ? ` · ${ORIGEN[fila.origen]}` : ''}
                  </p>
                </button>
              </div>
            ),
          },
          {
            titulo: 'Etapa',
            celda: (fila) => {
              const etapa = fila.id_etapa ? etapas.get(fila.id_etapa) : undefined
              return etapa ? (
                <span className="inline-flex items-center gap-1.5">
                  <Punto color={etapa.color} />
                  {etapa.nombre}
                </span>
              ) : (
                '—'
              )
            },
          },
          {
            titulo: 'Tipo',
            celda: (fila) => {
              const tipo = fila.id_tipo ? tipos.get(fila.id_tipo) : undefined
              return tipo ? <Chip nombre={tipo.nombre} color={tipo.color} /> : <span className="text-muted-foreground">—</span>
            },
          },
          {
            titulo: 'Etiquetas',
            celda: (fila) =>
              fila.etiquetas.length ? (
                <div className="flex flex-wrap justify-end gap-1 md:justify-start">
                  {fila.etiquetas.slice(0, 2).map((etiqueta) => (
                    <Chip key={etiqueta.id} nombre={etiqueta.nombre} color={etiqueta.color} />
                  ))}
                  {fila.etiquetas.length > 2 ? <span className="text-xs text-muted-foreground">+{fila.etiquetas.length - 2}</span> : null}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          ...(admin ? [{ titulo: 'Lo atiende', celda: (fila: ClienteCrm) => fila.asesor_nombre || 'Sin asignar' }] : []),
          {
            titulo: 'Último mensaje',
            celda: (fila) => (
              <span className="inline-flex items-center gap-1.5" title={fila.ventana_abierta ? 'Puede recibir texto libre' : 'Solo plantillas'}>
                <Punto color={fila.ventana_abierta ? '#10b981' : '#cbd5e1'} />
                {haceCuanto(fila.ultimo_mensaje_cliente)}
              </span>
            ),
          },
        ]}
        acciones={(fila) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={abriendo === fila.id} onClick={() => escribir(fila)}>
              {abriendo === fila.id ? <LoaderCircle className="animate-spin" /> : <MessageCircle />}
              Escribirle
            </Button>
            <Button variant="ghost" size="sm" onClick={() => alAbrir(fila.id)}>
              Ver ficha
            </Button>
          </div>
        )}
        vacio={{
          icono: Contact,
          titulo: hayFiltros(filtros) ? 'Nadie coincide con esos filtros' : 'Aún no hay clientes',
          texto: hayFiltros(filtros) ? 'Prueba quitando alguno.' : 'Se crean solos cuando alguien te escribe. También puedes registrarlos o importarlos.',
        }}
      />

      {paginas > 1 ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Página {pagina} de {paginas}
          </span>
          <Button variant="outline" size="icon" aria-label="Página anterior" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Página siguiente" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function AccionesVarias({ ids, ajustes, alTerminar }: { ids: number[]; ajustes: Ajustes | undefined; alTerminar: () => void }) {
  const cliente = useQueryClient()
  const aplicar = useMutation({
    mutationFn: (cambios: CambiosVarios) => actualizarVariosClientes(ids, cambios),
    onSuccess: (total) => {
      avisoExito(total === 1 ? '1 cliente actualizado' : `${total} clientes actualizados`)
      cliente.invalidateQueries({ queryKey: CLAVE_CRM })
      alTerminar()
    },
    onError: (error) => avisoError(error, 'No se pudo aplicar el cambio'),
  })

  const elegir = (valor: string, crear: (id: number) => CambiosVarios) => {
    if (valor !== '') aplicar.mutate(crear(Number(valor)))
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/50 p-3 lg:flex-row lg:items-center">
      <div className="flex items-center justify-between gap-2 lg:mr-2">
        <span className="text-sm font-medium whitespace-nowrap">{ids.length === 1 ? '1 seleccionado' : `${ids.length} seleccionados`}</span>
        <Button variant="ghost" size="icon-sm" aria-label="Quitar selección" onClick={alTerminar} className="lg:hidden">
          <X />
        </Button>
      </div>
      <div className="grid flex-1 gap-2 sm:grid-cols-3">
        <select aria-label="Mover a etapa" className={CLASE_SELECT} value="" disabled={aplicar.isPending} onChange={(e) => elegir(e.target.value, (id) => ({ id_etapa: id }))}>
          <option value="">Mover a etapa…</option>
          {ajustes?.etapas.map((etapa) => (
            <option key={etapa.id} value={etapa.id}>
              {etapa.nombre}
            </option>
          ))}
        </select>
        <select
          aria-label="Cambiar tipo"
          className={CLASE_SELECT}
          value=""
          disabled={aplicar.isPending}
          onChange={(e) => elegir(e.target.value, (id) => ({ id_tipo: id === 0 ? null : id }))}
        >
          <option value="">Cambiar tipo…</option>
          {ajustes?.tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
          <option value="0">Sin tipo</option>
        </select>
        <select
          aria-label="Etiquetas"
          className={CLASE_SELECT}
          value=""
          disabled={aplicar.isPending || !ajustes?.etiquetas.length}
          onChange={(e) => {
            const [accion, id] = e.target.value.split(':')
            if (id) aplicar.mutate(accion === 'quitar' ? { quitar_etiqueta: Number(id) } : { agregar_etiqueta: Number(id) })
          }}
        >
          <option value="">Etiquetas…</option>
          <optgroup label="Agregar">
            {ajustes?.etiquetas.map((etiqueta) => (
              <option key={etiqueta.id} value={`agregar:${etiqueta.id}`}>
                {etiqueta.nombre}
              </option>
            ))}
          </optgroup>
          <optgroup label="Quitar">
            {ajustes?.etiquetas.map((etiqueta) => (
              <option key={etiqueta.id} value={`quitar:${etiqueta.id}`}>
                {etiqueta.nombre}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <Button variant="ghost" size="sm" onClick={alTerminar} className="hidden lg:inline-flex">
        Cancelar
      </Button>
    </div>
  )
}
