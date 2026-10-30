import { useQuery } from '@tanstack/react-query'
import { Copy, Plus, Settings2, Trash2, TriangleAlert } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router-dom'
import { leerGruposAtencion, type DatosPaso, type TipoArchivoFlujo } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nuevoId } from '@/lib/editorPasos'
import { useModoAhorro } from '@/lib/modo-ahorro'
import { cn } from '@/lib/utils'
import type { NodoRF } from './conversion'
import { etiquetaTurnoGrupo } from '../asesores/tiposReparto'
import { Area, Avanzado, FilaOpcion, Nota, Numero, Pausa, Seleccion, SinRespuesta, SubirArchivo, Texto } from './controles'
import { FormAsesor, FormDividir, FormTemperatura } from './FormsDeDecision'
import {
  LARGO_BOTON,
  LARGO_CUERPO,
  LARGO_DESCRIPCION,
  LARGO_OPCION,
  MAX_BOTONES,
  MAX_OPCIONES,
  META,
  OPERADORES,
  UNIDADES_ESPERA,
  VALIDACIONES,
  camposDe,
  opcionesDe,
  resumenInicio,
  texto,
} from './tipos'

type Props = {
  nodo: NodoRF
  variables: string[]
  alCambiar: (datos: DatosPaso) => void
  alDuplicar: () => void
  alEliminar: () => void
  alConfigurar: () => void
}

const ENVIA_MENSAJE = ['mensaje', 'ubicacion', 'botones', 'lista', 'pregunta', 'formulario', 'asesor', 'fin']
const ESPERA_RESPUESTA = ['botones', 'lista', 'pregunta', 'formulario']
const MAX_CAMPOS = 8

export function PanelNodo({ nodo, variables, alCambiar, alDuplicar, alEliminar, alConfigurar }: Props) {
  const { tipo, datos, problemas } = nodo.data
  const meta = META[tipo]
  const Icono = meta.icono
  const poner = (parcial: DatosPaso) => alCambiar({ ...datos, ...parcial })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className={cn('flex size-9 items-center justify-center rounded-lg', meta.suave)}>
          <Icono className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{meta.titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{meta.descripcion}</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {problemas?.length ? (
          <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {problemas.map((p) => (
              <p key={p} className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                {p}
              </p>
            ))}
          </div>
        ) : null}

        {tipo === 'inicio' ? <ResumenInicio datos={datos} alConfigurar={alConfigurar} /> : null}
        {tipo === 'mensaje' ? <FormMensaje datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'botones' ? <FormBotones datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'lista' ? <FormLista datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'pregunta' ? (
          <>
            <AvisoPreguntaCara />
            <FormPregunta datos={datos} poner={poner} variables={variables} />
          </>
        ) : null}
        {tipo === 'formulario' ? <FormFormulario datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'condicion' ? <FormCondicion datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'horario' ? <FormTurnos /> : null}
        {tipo === 'variable' ? <FormVariable datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'espera' ? <FormEspera datos={datos} poner={poner} /> : null}
        {tipo === 'ubicacion' ? <FormUbicacion datos={datos} poner={poner} /> : null}
        {tipo === 'temperatura' ? <FormTemperatura datos={datos} poner={poner} /> : null}
        {tipo === 'dividir' ? <FormDividir datos={datos} poner={poner} /> : null}
        {tipo === 'asesor' ? <FormAsesor datos={datos} poner={poner} variables={variables} /> : null}
        {tipo === 'fin' ? (
          <Area
            etiqueta="Mensaje final"
            ayuda="Cierra el flujo. Si el cliente vuelve a escribir, el bot no responde hasta que otro flujo lo active."
            valor={texto(datos, 'texto')}
            alCambiar={(v) => poner({ texto: v })}
            variables={variables}
            max={4000}
            opcional
          />
        ) : null}

        {ENVIA_MENSAJE.includes(tipo) || ESPERA_RESPUESTA.includes(tipo) ? (
          <Avanzado>
            {ENVIA_MENSAJE.includes(tipo) ? <Pausa datos={datos} poner={poner} /> : null}
            {ESPERA_RESPUESTA.includes(tipo) ? <SinRespuesta datos={datos} poner={poner} /> : null}
          </Avanzado>
        ) : null}
      </div>

      {tipo !== 'inicio' ? (
        <div className="flex gap-2 border-t p-3">
          <Button variant="outline" className="flex-1" onClick={alDuplicar}>
            <Copy />
            Duplicar
          </Button>
          <Button variant="destructive" className="flex-1" onClick={alEliminar}>
            <Trash2 />
            Quitar
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/** El inicio solo muestra un resumen: todo se configura en la ventana «Configurar flujo». */
function ResumenInicio({ datos, alConfigurar }: { datos: DatosPaso; alConfigurar: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-zinc-50 p-3 text-sm text-muted-foreground">{resumenInicio(datos)}</div>
      <Button className="w-full" onClick={alConfigurar}>
        <Settings2 />
        Configurar flujo
      </Button>
      <Nota>
        Aquí solo defines cuándo arranca el bot y con qué contactos. Turnos, horarios y quién atiende están en <b>Asesores</b>.
      </Nota>
    </div>
  )
}
function AvisoPreguntaCara() {
  const { ahorro } = useModoAhorro()
  if (!ahorro) return null
  return (
    <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      En ahorro este paso es caro: cada dato es un mensaje. Mejor un <b>Formulario</b> (varios datos, un envío).
    </p>
  )
}

type FormProps = { datos: DatosPaso; poner: (parcial: DatosPaso) => void; variables: string[] }

// ───────────────────────── formularios por paso ─────────────────────────

function FormMensaje({ datos, poner, variables }: FormProps) {
  const media = texto(datos, 'media') || 'ninguno'

  return (
    <>
      <Area
        etiqueta={media === 'ninguno' ? 'Mensaje' : 'Texto que acompaña (opcional)'}
        valor={texto(datos, 'texto')}
        alCambiar={(v) => poner({ texto: v })}
        variables={variables}
        max={media === 'ninguno' ? 4000 : LARGO_CUERPO}
        opcional={media !== 'ninguno'}
      />
      <Seleccion
        etiqueta="Adjuntar archivo"
        valor={media}
        alCambiar={(v) => poner({ media: v, url: '', nombre_archivo: '' })}
        opciones={[
          { valor: 'ninguno', etiqueta: 'Sin archivo' },
          { valor: 'imagen', etiqueta: 'Imagen' },
          { valor: 'video', etiqueta: 'Video' },
          { valor: 'audio', etiqueta: 'Audio' },
          { valor: 'documento', etiqueta: 'Documento (PDF, Word…)' },
        ]}
      />
      {media !== 'ninguno' ? (
        <SubirArchivo
          tipo={media as TipoArchivoFlujo}
          url={texto(datos, 'url')}
          nombre={texto(datos, 'nombre_archivo')}
          alCambiar={(url, nombre) => poner({ url, nombre_archivo: media === 'documento' ? nombre : texto(datos, 'nombre_archivo') })}
        />
      ) : null}
      {media === 'documento' && texto(datos, 'url') ? (
        <Texto
          etiqueta="Nombre con el que se verá"
          valor={texto(datos, 'nombre_archivo')}
          alCambiar={(v) => poner({ nombre_archivo: v })}
          marcador="catalogo.pdf"
        />
      ) : null}
      {media === 'audio' ? <Nota>El audio se envía solo, sin texto. Si escribiste un mensaje, llega justo después.</Nota> : null}
    </>
  )
}

function FormEspera({ datos, poner }: Omit<FormProps, 'variables'>) {
  const unidad = texto(datos, 'unidad') || 'horas'

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Numero etiqueta="Esperar" valor={Number(datos.cantidad ?? 1)} min={1} max={100000} alCambiar={(v) => poner({ cantidad: v })} />
        <Seleccion
          etiqueta="Unidad"
          valor={unidad}
          alCambiar={(v) => poner({ unidad: v })}
          opciones={UNIDADES_ESPERA}
        />
      </div>
      <Nota>
        Después de este tiempo el flujo sigue solo con el paso conectado. Si el cliente escribe mientras tanto, el bot no le responde. La
        espera máxima es de 30 días.
      </Nota>
    </>
  )
}

function FormUbicacion({ datos, poner }: Omit<FormProps, 'variables'>) {
  return (
    <>
      <Texto etiqueta="Nombre del lugar" valor={texto(datos, 'nombre')} alCambiar={(v) => poner({ nombre: v })} marcador="Tienda Miraflores" max={100} />
      <Texto etiqueta="Dirección" valor={texto(datos, 'direccion')} alCambiar={(v) => poner({ direccion: v })} marcador="Av. Larco 123, Lima" max={200} />
      <div className="grid grid-cols-2 gap-3">
        <Texto etiqueta="Latitud" valor={texto(datos, 'latitud')} alCambiar={(v) => poner({ latitud: v })} marcador="-12.1211" />
        <Texto etiqueta="Longitud" valor={texto(datos, 'longitud')} alCambiar={(v) => poner({ longitud: v })} marcador="-77.0297" />
      </div>
      <Nota>
        Para conseguir las coordenadas abre Google Maps, haz clic derecho sobre tu local y toca los números que aparecen arriba: se copian
        solos.
      </Nota>
    </>
  )
}

function FormBotones({ datos, poner, variables }: FormProps) {
  const botones = opcionesDe('botones', datos) as { id: string; titulo: string }[]

  return (
    <>
      <Area
        etiqueta="Pregunta"
        valor={texto(datos, 'texto')}
        alCambiar={(v) => poner({ texto: v })}
        variables={variables}
        max={LARGO_CUERPO}
      />
      <div className="space-y-2">
        <Label>Botones</Label>
        {botones.map((b, i) => (
          <FilaOpcion
            key={b.id}
            valor={b.titulo}
            max={LARGO_BOTON}
            marcador={`Botón ${i + 1}`}
            puedeQuitar={botones.length > 1}
            alCambiar={(v) => poner({ botones: botones.map((x) => (x.id === b.id ? { ...x, titulo: v } : x)) })}
            alQuitar={() => poner({ botones: botones.filter((x) => x.id !== b.id) })}
          />
        ))}
        {botones.length < MAX_BOTONES ? (
          <Button variant="outline" size="sm" onClick={() => poner({ botones: [...botones, { id: nuevoId('b'), titulo: '' }] })}>
            <Plus />
            Agregar botón
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">WhatsApp permite máximo {MAX_BOTONES} botones. ¿Necesitas más? Usa una lista.</p>
        )}
      </div>
      <Nota>
        Une cada botón con una flecha al paso que debe seguir. <b>Otra respuesta</b> se usa si el cliente escribe algo distinto; si no la
        conectas, se le vuelve a preguntar y a la tercera pasa a un asesor.
      </Nota>
    </>
  )
}

function FormLista({ datos, poner, variables }: FormProps) {
  const opciones = opcionesDe('lista', datos) as { id: string; titulo: string; descripcion?: string }[]

  return (
    <>
      <Area
        etiqueta="Mensaje"
        valor={texto(datos, 'texto')}
        alCambiar={(v) => poner({ texto: v })}
        variables={variables}
        max={LARGO_CUERPO}
      />
      <Texto
        etiqueta="Texto del botón que abre la lista"
        valor={texto(datos, 'boton')}
        alCambiar={(v) => poner({ boton: v })}
        max={LARGO_BOTON}
        marcador="Ver opciones"
      />
      <div className="space-y-3">
        <Label>Opciones</Label>
        {opciones.map((o, i) => (
          <div key={o.id} className="space-y-1.5 rounded-lg border p-2">
            <FilaOpcion
              valor={o.titulo}
              max={LARGO_OPCION}
              marcador={`Opción ${i + 1}`}
              puedeQuitar={opciones.length > 1}
              alCambiar={(v) => poner({ opciones: opciones.map((x) => (x.id === o.id ? { ...x, titulo: v } : x)) })}
              alQuitar={() => poner({ opciones: opciones.filter((x) => x.id !== o.id) })}
            />
            <Input
              value={o.descripcion ?? ''}
              maxLength={LARGO_DESCRIPCION}
              placeholder="Descripción corta (opcional)"
              onChange={(e) => poner({ opciones: opciones.map((x) => (x.id === o.id ? { ...x, descripcion: e.target.value } : x)) })}
              className="h-8 text-xs"
            />
          </div>
        ))}
        {opciones.length < MAX_OPCIONES ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => poner({ opciones: [...opciones, { id: nuevoId('o'), titulo: '', descripcion: '' }] })}
          >
            <Plus />
            Agregar opción
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">WhatsApp permite máximo {MAX_OPCIONES} opciones.</p>
        )}
      </div>
    </>
  )
}

function FormPregunta({ datos, poner, variables }: FormProps) {
  const variable = texto(datos, 'variable')

  return (
    <>
      <Area
        etiqueta="Lo que le preguntará el bot"
        valor={texto(datos, 'texto')}
        alCambiar={(v) => poner({ texto: v })}
        variables={variables}
        max={LARGO_CUERPO}
      />
      <Texto
        etiqueta="¿Cómo se llamará este dato?"
        valor={variable}
        alCambiar={(v) => poner({ variable: v })}
        marcador="correo"
        ayuda={variable ? `Podrás usarlo en otros mensajes escribiendo {{${variable}}}` : 'Una palabra sin espacios, por ejemplo: correo, distrito, modelo'}
      />
      <Seleccion
        etiqueta="Qué tipo de respuesta espera"
        valor={texto(datos, 'validacion') || 'texto'}
        alCambiar={(v) => poner({ validacion: v })}
        opciones={VALIDACIONES.map((v) => ({ valor: v.valor, etiqueta: v.etiqueta }))}
      />
      <Area
        etiqueta="Mensaje si no la entiende"
        valor={texto(datos, 'error')}
        alCambiar={(v) => poner({ error: v })}
        variables={[]}
        max={LARGO_CUERPO}
        opcional
        ayuda="A la tercera respuesta inválida pasa a un asesor."
      />
    </>
  )
}

function FormFormulario({ datos, poner }: FormProps) {
  const campos = camposDe(datos)

  return (
    <>
      <Area
        etiqueta="Mensaje que ve el cliente"
        valor={texto(datos, 'texto')}
        alCambiar={(v) => poner({ texto: v })}
        variables={[]}
        max={LARGO_CUERPO}
        ayuda="Un solo envío. El cliente responde todo junto y el bot guarda cada dato."
      />
      <div className="space-y-2">
        <Label>Datos a pedir</Label>
        {campos.map((campo, indice) => (
          <div key={campo.id} className="grid gap-2 rounded-lg border p-3">
            <Texto
              etiqueta="Cómo se lo pedís"
              valor={campo.etiqueta ?? ''}
              alCambiar={(etiqueta) =>
                poner({ campos: campos.map((c, i) => (i === indice ? { ...c, etiqueta } : c)) })
              }
              marcador="Nombre"
            />
            <Texto
              etiqueta="Nombre del dato"
              valor={campo.variable ?? ''}
              alCambiar={(variable) =>
                poner({ campos: campos.map((c, i) => (i === indice ? { ...c, variable } : c)) })
              }
              marcador="nombre"
              ayuda={campo.variable ? `Luego usás {{${campo.variable}}}` : 'Sin espacios, por ejemplo: nombre'}
            />
            {campos.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-destructive"
                onClick={() => poner({ campos: campos.filter((_, i) => i !== indice) })}
              >
                <Trash2 />
                Quitar
              </Button>
            ) : null}
          </div>
        ))}
        {campos.length < MAX_CAMPOS ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              poner({ campos: [...campos, { id: nuevoId('c'), etiqueta: '', variable: '' }] })
            }
          >
            <Plus />
            Agregar dato
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Hasta {MAX_CAMPOS} datos en un formulario.</p>
        )}
      </div>
    </>
  )
}

function FormCondicion({ datos, poner, variables }: FormProps) {
  const operador = OPERADORES.find((o) => o.valor === (texto(datos, 'operador') || 'igual'))
  const lista = useId()

  return (
    <>
      <div className="grid gap-2">
        <Label>Dato a revisar</Label>
        <Input
          list={lista}
          value={texto(datos, 'variable')}
          onChange={(e) => poner({ variable: e.target.value })}
          placeholder="ultima_opcion"
          className="h-9"
        />
        <datalist id={lista}>
          {variables.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">Por ejemplo: <b>ultima_opcion</b> (lo último que eligió) o un dato que le hayas pedido.</p>
      </div>
      <Seleccion
        etiqueta="Comparación"
        valor={operador?.valor ?? 'igual'}
        alCambiar={(v) => poner({ operador: v })}
        opciones={OPERADORES.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta }))}
      />
      {operador?.sinValor ? null : (
        <Texto etiqueta="Valor" valor={texto(datos, 'valor')} alCambiar={(v) => poner({ valor: v })} marcador="Precios" />
      )}
      <Nota>
        Si se cumple, sigue la flecha <b>Sí se cumple</b>; si no, la de <b>No se cumple</b>.
      </Nota>
    </>
  )
}

function FormTurnos() {
  const grupos = useQuery({ queryKey: ['grupos-atencion'], queryFn: leerGruposAtencion })
  const turnos = (grupos.data ?? []).filter((g) => g.tipo === 'turno')

  return (
    <>
      <div className="space-y-2 rounded-lg border bg-zinc-50 p-3">
        <p className="text-sm font-medium">Tus turnos</p>
        {grupos.isPending ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        {!grupos.isPending && turnos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes grupos tipo turno, así que este paso siempre irá por «En turno».</p>
        ) : null}
        <ul className="space-y-1 text-sm">
          {turnos.map((g) => (
            <li key={g.id}>{etiquetaTurnoGrupo(g)}</li>
          ))}
        </ul>
        <Link to="/asesores?tab=grupos" className="inline-block text-sm font-medium text-emerald-700 underline-offset-2 hover:underline">
          Editar turnos en Asesores → Grupos
        </Link>
      </div>
      <Nota>
        Si el cliente escribe dentro de alguno de estos turnos sigue por <b>En turno</b>; si no, por <b>Fuera de turno</b>. Las horas no se
        escriben aquí, así nunca se contradicen con el reparto.
      </Nota>
    </>
  )
}

function FormVariable({ datos, poner, variables }: FormProps) {
  return (
    <>
      <Texto
        etiqueta="Nombre del dato"
        valor={texto(datos, 'variable')}
        alCambiar={(v) => poner({ variable: v })}
        marcador="interes"
        ayuda="Una palabra sin espacios."
      />
      <Area
        etiqueta="Valor"
        valor={texto(datos, 'valor')}
        alCambiar={(v) => poner({ valor: v })}
        variables={variables}
        max={500}
        ayuda="Puede incluir otros datos, por ejemplo {{ultima_opcion}}."
      />
    </>
  )
}
