import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, Check, Download, FileSpreadsheet, FileText, LoaderCircle, RotateCcw, Upload, X } from 'lucide-react'
import { importarClientes, leerAsesores, type CampoImportacion, type OpcionesImportacion, type ResultadoImportacion } from '@/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { avisoError } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { esAdministrador, leerSesion } from '@/sesion'
import { CLASE_SELECT, CLAVE_CRM, PAISES, codigoPaisGuardado, normalizarTelefono, recordarCodigoPais, useAjustesCrm } from './crm'
import {
  CAMPOS,
  MAX_FILAS,
  TAMANO_TANDA,
  adivinarColumnas,
  armarFilas,
  descargarPlantilla,
  descargarProblemas,
  leerArchivo,
  type ArchivoLeido,
} from './importacion'
import { SelectorEtiquetas } from './piezas'

type Paso = 'archivo' | 'revisar' | 'listo'

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'archivo', titulo: 'Archivo' },
  { id: 'revisar', titulo: 'Revisar' },
  { id: 'listo', titulo: 'Resultado' },
]

export function ImportarClientes() {
  const [archivo, setArchivo] = useState<ArchivoLeido | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const paso: Paso = resultado ? 'listo' : archivo ? 'revisar' : 'archivo'

  function reiniciar() {
    setArchivo(null)
    setResultado(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Clientes
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Importar clientes</h1>
            <p className="text-sm text-muted-foreground sm:text-base">Carga tu base desde un archivo CSV o TXT y luego escríbeles con una plantilla.</p>
          </div>
          <ol className="flex items-center gap-2 text-sm" aria-label="Pasos">
            {PASOS.map((item, indice) => {
              const actual = PASOS.findIndex((p) => p.id === paso)
              const hecho = indice < actual
              return (
                <li key={item.id} className="flex items-center gap-2">
                  {indice > 0 ? <span className="h-px w-5 bg-border" aria-hidden /> : null}
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                      indice === actual ? 'bg-foreground text-background' : hecho ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {hecho ? <Check className="size-3.5" /> : indice + 1}
                  </span>
                  <span className={cn(indice === actual ? 'font-medium' : 'text-muted-foreground')}>{item.titulo}</span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {paso === 'archivo' ? <PasoArchivo alLeer={setArchivo} /> : null}
      {paso === 'revisar' && archivo ? <PasoRevisar archivo={archivo} alCambiarArchivo={reiniciar} alTerminar={setResultado} /> : null}
      {paso === 'listo' && resultado ? <PasoResultado resultado={resultado} alReiniciar={reiniciar} /> : null}
    </div>
  )
}

function PasoArchivo({ alLeer }: { alLeer: (archivo: ArchivoLeido) => void }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [encima, setEncima] = useState(false)
  const [leyendo, setLeyendo] = useState(false)

  async function abrir(archivo: File | undefined) {
    if (!archivo) return
    if (/\.(xlsx?|ods)$/i.test(archivo.name)) {
      avisoError(new Error('Abre el archivo en Excel y usa «Guardar como» → CSV (delimitado por comas) o Texto (delimitado por tabulaciones).'), 'Ese formato no se puede leer')
      return
    }
    if (archivo.size > 10 * 1024 * 1024) {
      avisoError(new Error('El archivo pesa más de 10 MB.'), 'Archivo muy grande')
      return
    }
    setLeyendo(true)
    try {
      const leido = await leerArchivo(archivo)
      if (leido.filas.length === 0) throw new Error('El archivo está vacío.')
      if (leido.filas.length > MAX_FILAS + 1) throw new Error(`Puedes importar hasta ${MAX_FILAS.toLocaleString('es')} filas por archivo.`)
      alLeer(leido)
    } catch (error) {
      avisoError(error, 'No se pudo leer el archivo')
    } finally {
      setLeyendo(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  function soltar(evento: DragEvent) {
    evento.preventDefault()
    setEncima(false)
    void abrir(evento.dataTransfer.files[0])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setEncima(true)
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltar}
        className={cn(
          'flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card p-8 text-center transition-colors',
          encima ? 'border-foreground/40 bg-muted/60' : 'hover:border-foreground/25 hover:bg-muted/30',
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          {leyendo ? <LoaderCircle className="size-6 animate-spin text-muted-foreground" /> : <Upload className="size-6 text-muted-foreground" />}
        </span>
        <span className="space-y-1">
          <span className="block text-base font-medium">{encima ? 'Suelta el archivo aquí' : 'Arrastra tu archivo o haz clic para elegirlo'}</span>
          <span className="block text-sm text-muted-foreground">CSV o TXT · hasta {MAX_FILAS.toLocaleString('es')} clientes</span>
        </span>
        <input ref={entrada} type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" className="sr-only" onChange={(e) => void abrir(e.target.files?.[0])} tabIndex={-1} />
      </button>

      <aside className="space-y-4 rounded-xl border bg-card p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">¿No tienes el formato?</h2>
          <p className="text-sm text-muted-foreground">Descarga la plantilla, llénala y súbela. Cualquier otro archivo con títulos parecidos también sirve.</p>
        </div>
        <div className="grid gap-2">
          <Button variant="outline" className="h-10 justify-start" onClick={() => descargarPlantilla('csv')}>
            <FileSpreadsheet />
            Plantilla para Excel (.csv)
          </Button>
          <Button variant="outline" className="h-10 justify-start" onClick={() => descargarPlantilla('txt')}>
            <FileText />
            Plantilla de texto (.txt)
          </Button>
        </div>
        <dl className="space-y-2 border-t pt-4 text-sm">
          {CAMPOS.map((campo) => (
            <div key={campo.id}>
              <dt className="font-medium">{campo.titulo}</dt>
              <dd className="text-muted-foreground">{campo.ayuda}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}

function PasoRevisar({
  archivo,
  alCambiarArchivo,
  alTerminar,
}: {
  archivo: ArchivoLeido
  alCambiarArchivo: () => void
  alTerminar: (resultado: ResultadoImportacion) => void
}) {
  const consultas = useQueryClient()
  const admin = esAdministrador(leerSesion()?.usuario)
  const ajustes = useAjustesCrm()
  const asesores = useQuery({ queryKey: [...CLAVE_CRM, 'asesores'], queryFn: leerAsesores, enabled: admin, staleTime: 60_000 })
  const inicial = useMemo(() => adivinarColumnas(archivo.filas), [archivo])
  const [campos, setCampos] = useState(inicial.campos)
  const [tieneTitulos, setTieneTitulos] = useState(inicial.tieneTitulos)
  const [opciones, setOpciones] = useState<OpcionesImportacion>({ codigo_pais: codigoPaisGuardado(), duplicados: 'omitir', etiquetas: [] })
  const [avance, setAvance] = useState<number | null>(null)

  const filas = useMemo(() => armarFilas(archivo.filas, campos, tieneTitulos), [archivo, campos, tieneTitulos])
  const revision = useMemo(() => {
    const vistos = new Set<string>()
    return filas.map((fila) => {
      const numero = normalizarTelefono(fila.telefono ?? '', opciones.codigo_pais)
      if (!fila.telefono) return { numero, problema: 'Sin teléfono' }
      if (!numero) return { numero, problema: 'Teléfono inválido' }
      if (vistos.has(numero)) return { numero, problema: 'Repetido' }
      vistos.add(numero)
      return { numero, problema: null }
    })
  }, [filas, opciones.codigo_pais])
  const validas = revision.filter((r) => !r.problema).length
  const conProblema = revision.length - validas
  const sinTelefono = !campos.includes('telefono')
  const columnas = campos.length
  const muestra = filas.slice(0, 6)

  function asignar(columna: number, campo: CampoImportacion | null) {
    setCampos((actual) => actual.map((valor, i) => (i === columna ? campo : valor === campo && campo !== null ? null : valor)))
  }

  async function importar() {
    recordarCodigoPais(opciones.codigo_pais)
    const total: ResultadoImportacion = { creados: 0, actualizados: 0, omitidos: 0, problemas: [] }
    const enviables = filas.filter((fila) => Object.keys(fila).length > 1)
    setAvance(0)
    try {
      for (let desde = 0; desde < enviables.length; desde += TAMANO_TANDA) {
        const parte = await importarClientes(enviables.slice(desde, desde + TAMANO_TANDA), opciones)
        total.creados += parte.creados
        total.actualizados += parte.actualizados
        total.omitidos += parte.omitidos
        total.problemas.push(...parte.problemas)
        setAvance(Math.min(enviables.length, desde + TAMANO_TANDA) / enviables.length)
      }
      consultas.invalidateQueries({ queryKey: CLAVE_CRM })
      alTerminar(total)
    } catch (error) {
      if (total.creados || total.actualizados) {
        consultas.invalidateQueries({ queryKey: CLAVE_CRM })
        total.problemas.push({ fila: 0, telefono: '', motivo: `La importación se cortó: ${(error as Error).message}` })
        alTerminar(total)
      } else {
        avisoError(error, 'No se pudo importar')
      }
    } finally {
      setAvance(null)
    }
  }

  const importando = avance !== null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileSpreadsheet className="size-5 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{archivo.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {filas.length.toLocaleString('es')} {filas.length === 1 ? 'fila' : 'filas'} · {columnas} {columnas === 1 ? 'columna' : 'columnas'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={alCambiarArchivo} disabled={importando}>
            <X />
            Cambiar
          </Button>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold">¿Qué hay en cada columna?</h2>
              <p className="text-sm text-muted-foreground">Lo adivinamos por los títulos. Corrige lo que no esté bien.</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-foreground" checked={tieneTitulos} onChange={(e) => setTieneTitulos(e.target.checked)} />
              La primera fila son títulos
            </label>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {campos.map((campo, columna) => (
                    <th key={columna} className="min-w-40 p-2 text-left align-top font-normal">
                      <select
                        aria-label={`Columna ${columna + 1}`}
                        className={cn(CLASE_SELECT, 'h-9', campo ? 'font-medium' : 'text-muted-foreground')}
                        value={campo ?? ''}
                        onChange={(e) => asignar(columna, (e.target.value || null) as CampoImportacion | null)}
                      >
                        <option value="">No importar</option>
                        {CAMPOS.map((opcion) => (
                          <option key={opcion.id} value={opcion.id}>
                            {opcion.titulo}
                          </option>
                        ))}
                      </select>
                      {tieneTitulos ? <p className="mt-1 truncate px-1 text-xs text-muted-foreground">«{archivo.filas[0]?.[columna] ?? ''}»</p> : null}
                    </th>
                  ))}
                  <th className="p-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {muestra.map((fila, indice) => {
                  const celdas = archivo.filas[fila.fila - 1] ?? []
                  const problema = revision[indice]?.problema
                  return (
                    <tr key={fila.fila} className="border-b last:border-0">
                      {campos.map((campo, columna) => (
                        <td key={columna} className={cn('max-w-56 truncate px-3 py-2', !campo && 'text-muted-foreground/60')}>
                          {celdas[columna] || <span className="text-muted-foreground/50">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {problema ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="size-3.5" />
                            {problema}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                            <Check className="size-3.5" />+{revision[indice]?.numero}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filas.length > muestra.length ? (
            <p className="text-xs text-muted-foreground">Se muestran las primeras {muestra.length} filas de {filas.length.toLocaleString('es')}.</p>
          ) : null}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-semibold tabular-nums">{validas.toLocaleString('es')}</p>
            <p className="text-xs text-muted-foreground">listos para importar</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className={cn('text-2xl font-semibold tabular-nums', conProblema ? 'text-amber-600' : '')}>{conProblema.toLocaleString('es')}</p>
            <p className="text-xs text-muted-foreground">con problemas</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="grid gap-2">
            <Label htmlFor="importar-pais">Números sin código de país</Label>
            <select
              id="importar-pais"
              className={CLASE_SELECT}
              value={opciones.codigo_pais}
              onChange={(e) => setOpciones({ ...opciones, codigo_pais: e.target.value })}
            >
              {PAISES.map((pais) => (
                <option key={pais.codigo} value={pais.codigo}>
                  Son de {pais.nombre} (+{pais.codigo})
                </option>
              ))}
            </select>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Si el número ya existe</legend>
            {(
              [
                { id: 'omitir', titulo: 'Dejarlo como está' },
                { id: 'actualizar', titulo: 'Completar sus datos con los del archivo' },
              ] as const
            ).map((opcion) => (
              <label key={opcion.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="duplicados"
                  className="size-4 accent-foreground"
                  checked={opciones.duplicados === opcion.id}
                  onChange={() => setOpciones({ ...opciones, duplicados: opcion.id })}
                />
                {opcion.titulo}
              </label>
            ))}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="importar-etapa">Ponerlos en la etapa</Label>
            <select
              id="importar-etapa"
              className={CLASE_SELECT}
              value={opciones.id_etapa ?? ''}
              onChange={(e) => setOpciones({ ...opciones, id_etapa: e.target.value ? Number(e.target.value) : null })}
            >
              {ajustes.data?.etapas.map((etapa, indice) => (
                <option key={etapa.id} value={indice === 0 ? '' : etapa.id}>
                  {etapa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="importar-tipo">Tipo</Label>
            <select
              id="importar-tipo"
              className={CLASE_SELECT}
              value={opciones.id_tipo ?? ''}
              onChange={(e) => setOpciones({ ...opciones, id_tipo: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Sin tipo</option>
              {ajustes.data?.tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Etiquetas para todos</legend>
            <SelectorEtiquetas
              etiquetas={ajustes.data?.etiquetas ?? []}
              elegidas={opciones.etiquetas ?? []}
              alCambiar={(etiquetas) => setOpciones({ ...opciones, etiquetas })}
            />
          </fieldset>

          {admin ? (
            <div className="grid gap-2">
              <Label htmlFor="importar-responsable">Los atiende</Label>
              <select
                id="importar-responsable"
                className={CLASE_SELECT}
                value={opciones.id_responsable ?? ''}
                onChange={(e) => setOpciones({ ...opciones, id_responsable: e.target.value ? Number(e.target.value) : null })}
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
        </div>

        {importando ? (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-medium">
                <LoaderCircle className="size-4 animate-spin" />
                Importando…
              </span>
              <span className="tabular-nums text-muted-foreground">{Math.round((avance ?? 0) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground transition-[width]" style={{ width: `${Math.max(4, (avance ?? 0) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <Button size="lg" className="h-11 w-full" disabled={sinTelefono || validas === 0} onClick={() => void importar()}>
            <Upload />
            {sinTelefono ? 'Elige la columna del teléfono' : `Importar ${validas.toLocaleString('es')} ${validas === 1 ? 'cliente' : 'clientes'}`}
          </Button>
        )}
      </aside>
    </div>
  )
}

function PasoResultado({ resultado, alReiniciar }: { resultado: ResultadoImportacion; alReiniciar: () => void }) {
  const cifras = [
    { valor: resultado.creados, texto: 'nuevos', clase: 'text-emerald-600' },
    { valor: resultado.actualizados, texto: 'actualizados', clase: 'text-sky-600' },
    { valor: resultado.omitidos, texto: 'no se importaron', clase: resultado.omitidos ? 'text-amber-600' : '' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Importación terminada</h2>
              <p className="text-sm text-muted-foreground">Ya puedes verlos en Clientes o escribirles con un envío masivo.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/clientes" className={buttonVariants({ variant: 'outline' })}>
              Ver clientes
            </Link>
            <Link to="/envios/nuevo" className={buttonVariants()}>
              Hacer un envío
            </Link>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-3 divide-x rounded-lg border">
          {cifras.map((cifra) => (
            <div key={cifra.texto} className="px-4 py-3">
              <dd className={cn('text-2xl font-semibold tabular-nums', cifra.clase)}>{cifra.valor.toLocaleString('es')}</dd>
              <dt className="text-xs text-muted-foreground">{cifra.texto}</dt>
            </div>
          ))}
        </dl>
      </div>

      {resultado.problemas.length ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Filas que no se importaron</h2>
            <Button variant="outline" size="sm" onClick={() => descargarProblemas(resultado.problemas)}>
              <Download />
              Descargar lista
            </Button>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Fila</th>
                  <th className="px-4 py-2 font-medium">Teléfono</th>
                  <th className="px-4 py-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {resultado.problemas.map((problema, indice) => (
                  <tr key={`${problema.fila}-${indice}`} className="border-t">
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">{problema.fila || '—'}</td>
                    <td className="px-4 py-2 tabular-nums">{problema.telefono || '—'}</td>
                    <td className="px-4 py-2">{problema.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Button variant="ghost" onClick={alReiniciar}>
        <RotateCcw />
        Importar otro archivo
      </Button>
    </div>
  )
}
