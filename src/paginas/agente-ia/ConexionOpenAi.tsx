import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, ExternalLink, KeyRound, LoaderCircle } from 'lucide-react'
import { conectarOpenAi, desconectarOpenAi, type ConexionIa } from '@/api'
import { ConfirmarAccion } from '@/components/ConfirmarAccion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { avisoError, avisoExito } from '@/lib/avisos'
import { CLAVE_IA, PATRON_LLAVE } from './claves'

export function ConexionOpenAi({ conexion }: { conexion: ConexionIa }) {
  const cliente = useQueryClient()
  const [cambiando, setCambiando] = useState(false)
  const [quitar, setQuitar] = useState(false)
  const [llave, setLlave] = useState('')
  const limpia = llave.replace(/\s+/g, '')
  const errorLlave = !limpia ? null : !limpia.startsWith('sk-') ? 'La llave debe empezar con «sk-».' : !PATRON_LLAVE.test(limpia) ? 'La llave parece incompleta. Cópiala de nuevo completa.' : null

  const refrescar = () => {
    void cliente.invalidateQueries({ queryKey: CLAVE_IA })
    void cliente.invalidateQueries({ queryKey: ['reparto'] })
  }

  const conectar = useMutation({
    mutationFn: () => conectarOpenAi(limpia),
    onSuccess: () => {
      avisoExito('Cuenta de OpenAI conectada', 'Tus asistentes ya pueden responder.')
      setLlave('')
      setCambiando(false)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo conectar'),
  })

  const desconectar = useMutation({
    mutationFn: desconectarOpenAi,
    onSuccess: () => {
      avisoExito('Cuenta desconectada', 'Los asistentes dejarán de responder y los chats irán a tu equipo.')
      setQuitar(false)
      refrescar()
    },
    onError: (error) => avisoError(error, 'No se pudo desconectar'),
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (limpia && !errorLlave) conectar.mutate()
  }

  const verificada = conexion.verificada_at ? new Date(conexion.verificada_at.replace(' ', 'T')).toLocaleDateString() : null

  return (
    <section className="rounded-xl border bg-white p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <KeyRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-semibold">Cuenta de OpenAI</h2>
          {conexion.conectada ? (
            <p className="flex flex-wrap items-center gap-2 text-sm text-emerald-700">
              <CircleCheck className="size-4" />
              Conectada · llave <span className="font-mono">{conexion.pista}</span>
              {verificada ? <span className="text-muted-foreground">· {verificada}</span> : null}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pega una llave de tu cuenta de OpenAI. El consumo lo cobra OpenAI a ti, no Belly.
            </p>
          )}
        </div>
        {conexion.conectada && !cambiando ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCambiando(true)}>
              Cambiar llave
            </Button>
            <Button variant="outline" className="w-full text-rose-600 hover:text-rose-700 sm:w-auto" onClick={() => setQuitar(true)}>
              Desconectar
            </Button>
          </div>
        ) : null}
      </div>

      {!conexion.conectada || cambiando ? (
        <form onSubmit={enviar} className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-8">
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              1. Entra a{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-800 underline underline-offset-2">
                platform.openai.com/api-keys <ExternalLink className="size-3" />
              </a>
            </li>
            <li>2. Crea una llave («Create new secret key») y cópiala. Empieza con sk-.</li>
            <li>3. Revisa que tengas saldo en Billing.</li>
            <li>4. Pégala aquí y pulsa Conectar.</li>
          </ol>
          <div className="grid min-w-0 content-start gap-2">
            <Label htmlFor="llave-openai">Llave de OpenAI</Label>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <Input
                id="llave-openai"
                type="password"
                autoComplete="off"
                value={llave}
                onChange={(e) => setLlave(e.target.value)}
                placeholder="sk-…"
                className="h-10 min-w-0 font-mono"
                aria-invalid={errorLlave ? true : undefined}
                maxLength={400}
                spellCheck={false}
                required
              />
              <Button type="submit" className="h-10 w-full shrink-0 sm:w-auto" disabled={conectar.isPending || !limpia || errorLlave !== null}>
                {conectar.isPending ? <LoaderCircle className="animate-spin" /> : null}
                {conectar.isPending ? 'Comprobando…' : 'Conectar'}
              </Button>
            </div>
            {errorLlave ? <p className="text-xs text-rose-600">{errorLlave}</p> : null}
            <p className="text-xs text-muted-foreground">La guardamos cifrada y nadie puede volver a verla, ni siquiera tú: solo se muestran sus últimos 4 caracteres.</p>
            {cambiando ? (
              <button type="button" className="justify-self-start text-xs font-medium text-muted-foreground hover:underline" onClick={() => setCambiando(false)}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <ConfirmarAccion
        abierto={quitar}
        titulo="¿Desconectar OpenAI?"
        texto="Los asistentes dejarán de responder. Los chats nuevos seguirán por la salida «Cuando pase a una persona» del reparto."
        etiqueta="Desconectar"
        cargando={desconectar.isPending}
        alCerrar={() => setQuitar(false)}
        alConfirmar={() => desconectar.mutate()}
      />
    </section>
  )
}
