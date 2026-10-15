import type { ReactNode } from 'react'
import { Headset, Hourglass, MessageSquareReply, Users, Zap, type LucideIcon } from 'lucide-react'
import type { DatosPaso } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Area, Interruptor, Nota, Numero, Palabras, SelectorHorario, Seleccion } from './controles'
import { SelectorAsesores } from './SelectorAsesores'
import { AUDIENCIAS, REPARTOS, REPETICIONES, audienciaDe, horarioActivo, idsDe, repartoDe, repeticionDe, texto } from './tipos'

const PALABRAS_ASESOR = ['asesor', 'agente', 'humano', 'persona', 'operador']

type Props = {
  abierto: boolean
  alCerrar: () => void
  datos: DatosPaso
  alCambiar: (datos: DatosPaso) => void
}

/** Ajustes de todo el flujo: cuÃ¡ndo arranca, a quiÃ©n responde y cÃ³mo se reparten los chats entre asesores. */
export function ConfiguracionFlujo({ abierto, alCerrar, datos, alCambiar }: Props) {
  const poner = (parcial: DatosPaso) => alCambiar({ ...datos, ...parcial })
  const disparador = texto(datos, 'disparador') || 'primer_mensaje'
  const palabras = Array.isArray(datos.palabras) ? (datos.palabras as string[]) : []
  const palabrasAsesor = Array.isArray(datos.palabras_asesor) ? (datos.palabras_asesor as string[]) : PALABRAS_ASESOR
  const reparto = repartoDe(datos)
  const repartoActual = REPARTOS.find((r) => r.valor === reparto)

  return (
    <Dialog open={abierto} onOpenChange={(v) => (v ? undefined : alCerrar())}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle className="text-lg">Configurar flujo</DialogTitle>
          <DialogDescription>Los cambios se aplican al instante. Recuerda guardar el flujo cuando termines.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50/60 p-5">
          <Seccion icono={Zap} titulo="Â¿CuÃ¡ndo empieza?" tono="amber">
            <Seleccion
              etiqueta="Se activa"
              valor={disparador}
              alCambiar={(v) => poner({ disparador: v })}
              opciones={[
                { valor: 'primer_mensaje', etiqueta: 'Cuando alguien escribe por primera vez' },
                { valor: 'palabra_clave', etiqueta: 'Cuando escriben una palabra o frase' },
                { valor: 'cualquier_mensaje', etiqueta: 'Con cualquier mensaje' },
              ]}
              ayuda={
                disparador === 'palabra_clave'
                  ? 'Si hay varios flujos activos, gana el que coincida con una palabra.'
                  : disparador === 'cualquier_mensaje'
                    ? 'Solo arranca si la conversaciÃ³n aÃºn no tuvo un flujo.'
                    : 'Arranca con el primer mensaje de una conversaciÃ³n nueva.'
              }
            />
            {disparador === 'palabra_clave' ? (
              <>
                <Palabras
                  etiqueta="Palabras o frases"
                  valores={palabras}
                  alCambiar={(v) => poner({ palabras: v })}
                  ayuda="Escribe una y presiona Enter. No importan mayÃºsculas ni tildes."
                  ejemplo="Ej: precio, cotizaciÃ³n"
                />
                <Interruptor
                  etiqueta="Debe coincidir exactamente"
                  ayuda="Apagado: basta con que el mensaje la contenga."
                  valor={Boolean(datos.exacta)}
                  alCambiar={(v) => poner({ exacta: v })}
                />
              </>
            ) : null}
          </Seccion>

          <Seccion icono={Users} titulo="Â¿A quiÃ©n le responde?" tono="emerald">
            <Seleccion
              etiqueta="Contactos"
              valor={audienciaDe(datos)}
              alCambiar={(v) => poner({ audiencia: v })}
              opciones={AUDIENCIAS.map((a) => ({ valor: a.valor, etiqueta: a.etiqueta }))}
              ayuda={AUDIENCIAS.find((a) => a.valor === audienciaDe(datos))?.ayuda}
            />
            <Seleccion
              etiqueta="Â¿CuÃ¡ntas veces con la misma persona?"
              valor={repeticionDe(datos)}
              alCambiar={(v) => poner({ repetir: v })}
              opciones={REPETICIONES.map((r) => ({ valor: r.valor, etiqueta: r.etiqueta }))}
            />
            {repeticionDe(datos) === 'cada_horas' ? (
              <Numero
                etiqueta="Volver a activarlo despuÃ©s de (horas)"
                valor={Number(datos.repetir_horas ?? 24)}
                min={1}
                max={8760}
                alCambiar={(v) => poner({ repetir_horas: v })}
                ayuda="Ejemplo: 24 = una vez al dÃ­a como mÃ¡ximo."
              />
            ) : null}
            <div className="space-y-3 border-t pt-3">
              <Interruptor
                etiqueta="Solo funciona en ciertos horarios"
                ayuda="Fuera de ese horario el bot no responde y el mensaje queda para tu equipo."
                valor={Boolean(horarioActivo(datos).activo)}
                alCambiar={(v) => poner({ horario_activo: { ...horarioActivo(datos), activo: v } })}
              />
              {horarioActivo(datos).activo ? (
                <SelectorHorario datos={horarioActivo(datos)} alCambiar={(h) => poner({ horario_activo: { ...h, activo: true } })} />
              ) : null}
            </div>
          </Seccion>

          <Seccion icono={Headset} titulo="Reparto entre tus asesores" tono="fuchsia">
            <Seleccion
              etiqueta="Cuando el bot pasa la conversaciÃ³n a una persona"
              valor={reparto}
              alCambiar={(v) => poner({ reparto: v })}
              opciones={REPARTOS.map((r) => ({ valor: r.valor, etiqueta: r.etiqueta }))}
              ayuda={repartoActual?.ayuda}
            />
            {reparto !== 'mantener' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Â¿Entre quiÃ©nes?</p>
                <SelectorAsesores valor={idsDe(datos.equipo)} alCambiar={(ids) => poner({ equipo: ids })} />
              </div>
            ) : null}
            <Nota>
              Cada paso Â«Pasar a un asesorÂ» puede tener su propia regla (por ejemplo, <b>Ventas</b> con unos asesores y <b>Soporte</b> con otros). Lo
              que pongas aquÃ­ se usa cuando el paso no dice otra cosa, y tambiÃ©n cuando el cliente pide hablar con una persona.
            </Nota>
          </Seccion>

          <Seccion icono={MessageSquareReply} titulo="Si el cliente pide hablar con una persona" tono="sky">
            <Palabras
              etiqueta="Palabras que lo pasan a un asesor"
              valores={palabrasAsesor}
              alCambiar={(v) => poner({ palabras_asesor: v })}
              ayuda="Funciona en cualquier momento del flujo, solo si escribe exactamente eso."
              ejemplo="Ej: asesor"
            />
            <Area
              etiqueta="Mensaje al pasarlo"
              valor={texto(datos, 'mensaje_asesor')}
              alCambiar={(v) => poner({ mensaje_asesor: v })}
              variables={['asesor']}
              max={1000}
              opcional
              ayuda="Si lo dejas vacÃ­o se envÃ­a: Â«Perfecto, un asesor te atenderÃ¡ en breve.Â»"
            />
          </Seccion>

          <Seccion icono={Hourglass} titulo="Cuando el cliente no entiende" tono="zinc">
            <Numero
              etiqueta="Intentos antes de pasarlo a un asesor"
              valor={Number(datos.max_intentos ?? 3)}
              min={1}
              max={5}
              alCambiar={(v) => poner({ max_intentos: v })}
              ayuda="Si responde algo que el bot no entiende, se le vuelve a preguntar. Al llegar a este nÃºmero pasa con una persona."
            />
          </Seccion>
        </div>

        <DialogFooter className="m-0 rounded-none">
          <Button onClick={alCerrar}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const TONOS = {
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
  sky: 'bg-sky-100 text-sky-700',
  zinc: 'bg-zinc-200 text-zinc-700',
} as const

function Seccion({ icono: Icono, titulo, tono, children }: { icono: LucideIcon; titulo: string; tono: keyof typeof TONOS; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-white p-4 shadow-xs">
      <h3 className="flex items-center gap-2.5 text-sm font-semibold">
        <span className={`flex size-8 items-center justify-center rounded-lg ${TONOS[tono]}`}>
          <Icono className="size-4" />
        </span>
        {titulo}
      </h3>
      {children}
    </section>
  )
}
