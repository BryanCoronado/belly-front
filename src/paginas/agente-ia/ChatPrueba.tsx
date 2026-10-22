import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Hand, LoaderCircle, RotateCcw, SendHorizontal } from 'lucide-react'
import { probarAgenteIa, type LineaCharla } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { LIMITES } from './claves'

type Linea = LineaCharla | { rol: 'aviso'; texto: string }

export function ChatPrueba({ idAgente, conectada, nombre }: { idAgente: number; conectada: boolean; nombre: string }) {
  const [lineas, setLineas] = useState<Linea[]>([])
  const [texto, setTexto] = useState('')
  const fondo = useRef<HTMLDivElement>(null)

  const enviar = useMutation({
    mutationFn: (charla: LineaCharla[]) => probarAgenteIa(idAgente, charla),
    onSuccess: (r) => {
      setLineas((actual) => [
        ...actual,
        ...(r.respuesta ? [{ rol: 'asistente' as const, texto: r.respuesta }] : []),
        ...(r.traspaso ? [{ rol: 'aviso' as const, texto: `Aquí pasaría el chat a una persona: ${r.traspaso.toLowerCase()}.` }] : []),
      ])
    },
    onError: (error) => setLineas((actual) => [...actual, { rol: 'aviso', texto: error instanceof Error ? error.message : 'No respondió. Intenta de nuevo.' }]),
  })

  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lineas, enviar.isPending])

  const mandar = (e: FormEvent) => {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio || enviar.isPending) return
    const nuevas: Linea[] = [...lineas, { rol: 'cliente', texto: limpio }]
    setLineas(nuevas)
    setTexto('')
    enviar.mutate(nuevas.filter((l): l is LineaCharla => l.rol !== 'aviso').slice(-LIMITES.lineasPrueba))
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl border">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <Bot className="size-4 text-zinc-500" />
        <p className="flex-1 truncate text-sm font-medium">Escríbele como si fueras un cliente</p>
        <Button variant="ghost" size="sm" onClick={() => setLineas([])} disabled={!lineas.length || enviar.isPending}>
          <RotateCcw />
          Empezar de nuevo
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#efeae2] p-3 dark:bg-zinc-900">
        {!conectada ? (
          <p className="mx-auto max-w-sm rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-800">Primero conecta tu cuenta de OpenAI arriba para poder probarlo.</p>
        ) : null}
        {conectada && !lineas.length ? (
          <p className="mx-auto max-w-sm rounded-lg bg-white/80 p-3 text-center text-sm text-muted-foreground dark:bg-zinc-800">
            Prueba preguntas reales: «¿Hacen envíos?», «¿Cuánto cuesta…?», «Quiero hablar con alguien». Nada de esto se envía por WhatsApp.
          </p>
        ) : null}
        {lineas.map((linea, i) =>
          linea.rol === 'aviso' ? (
            <p key={i} className="mx-auto flex max-w-md items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
              <Hand className="size-3.5 shrink-0" />
              {linea.texto}
            </p>
          ) : (
            <div key={i} className={cn('flex', linea.rol === 'cliente' ? 'justify-end' : 'justify-start')}>
              <p
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line shadow-sm',
                  linea.rol === 'cliente' ? 'bg-[#d9fdd3] text-zinc-900' : 'bg-white text-zinc-900',
                )}
              >
                {linea.rol === 'asistente' ? <span className="mb-0.5 block text-[11px] font-semibold text-zinc-600">{nombre}</span> : null}
                {linea.texto}
              </p>
            </div>
          ),
        )}
        {enviar.isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            {nombre} está escribiendo…
          </p>
        ) : null}
        <div ref={fondo} />
      </div>

      <form onSubmit={mandar} className="flex gap-2 border-t p-2">
        <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje" maxLength={LIMITES.mensajePrueba} disabled={!conectada} className="h-10" />
        <Button type="submit" size="icon" className="size-10" disabled={!conectada || !texto.trim() || enviar.isPending} aria-label="Enviar">
          <SendHorizontal />
        </Button>
      </form>
    </div>
  )
}
