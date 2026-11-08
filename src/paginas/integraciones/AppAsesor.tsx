import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Download, Link2, Share2, Smartphone, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { guardarAppAsesor, leerAppAsesor, subirApkAsesor } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'

const CLAVE = ['empresa', 'app-asesor']

function formatoMb(bytes?: number | null) {
  if (!bytes || bytes <= 0) return null
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Activa la app, sube el APK y permite descargar / compartir en un clic. */
export function AppAsesor() {
  const consultas = useQueryClient()
  const inputApk = useRef<HTMLInputElement>(null)
  const estado = useQuery({ queryKey: CLAVE, queryFn: leerAppAsesor })
  const [copiado, setCopiado] = useState(false)

  const guardar = useMutation({
    mutationFn: (activa: boolean) => guardarAppAsesor(activa),
    onSuccess: (data) => {
      consultas.setQueryData(CLAVE, data)
      avisoExito(data.activa ? 'App de asesores activada' : 'App de asesores desactivada')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const subir = useMutation({
    mutationFn: (archivo: File) => subirApkAsesor(archivo),
    onSuccess: (data) => {
      consultas.setQueryData(CLAVE, data)
      avisoExito('APK publicado. Ya puedes descargar o compartir.')
    },
    onError: (error) => avisoError(error, 'No se pudo subir el APK'),
  })

  const activa = estado.data?.activa ?? true
  const apkUrl = estado.data?.apk_url ?? estado.data?.share_url ?? null
  const disponible = Boolean(estado.data?.apk_disponible && apkUrl)
  const version = estado.data?.version ?? '1.0.0'
  const tamano = formatoMb(estado.data?.apk_tamano)

  const copiarEnlace = async () => {
    if (!apkUrl) return
    try {
      await navigator.clipboard.writeText(apkUrl)
      setCopiado(true)
      avisoExito('Enlace copiado')
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      avisoError(new Error('No se pudo copiar'), 'Copia el enlace a mano')
    }
  }

  const compartir = async () => {
    if (!apkUrl) return
    const texto = `Instala Belly Asesor (v${version}):\n${apkUrl}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Belly Asesor', text: texto, url: apkUrl })
        return
      }
      await copiarEnlace()
    } catch {
      /* canceló */
    }
  }

  const alElegirApk = (lista: FileList | null) => {
    const archivo = lista?.[0]
    if (!archivo) return
    if (!archivo.name.toLowerCase().endsWith('.apk')) {
      avisoError(new Error('El archivo debe ser .apk'), 'Archivo inválido')
      return
    }
    subir.mutate(archivo)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <CabeceraPagina
        titulo="App Belly Asesor"
        descripcion="Activa el acceso, publica el APK y compártelo con tu equipo en un clic."
        acciones={
          <Link to="/integraciones" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Volver
          </Link>
        }
      />

      <section className="superficie space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Smartphone className="size-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">Acceso móvil</h2>
              {estado.isLoading ? (
                <Skeleton className="h-5 w-20 rounded-full" />
              ) : (
                <Badge className={activa ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                  {activa ? 'Activa' : 'Desactivada'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Si la desactivas, los asesores no podrán iniciar sesión en la app. El CRM web sigue igual.
            </p>
          </div>
          <Switch
            checked={activa}
            disabled={estado.isLoading || guardar.isPending}
            onCheckedChange={(valor) => guardar.mutate(valor)}
            aria-label="Activar app de asesores"
          />
        </div>
      </section>

      <section className="superficie space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Descargar y compartir</h2>
            <p className="text-sm text-muted-foreground">
              APK Android · v{version}
              {tamano ? ` · ${tamano}` : ''}
            </p>
          </div>
          {estado.isLoading ? null : disponible ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Lista para instalar</Badge>
          ) : (
            <Badge className="border-amber-200 bg-amber-50 text-amber-800">Sube el APK para activar el enlace</Badge>
          )}
        </div>

        {disponible && apkUrl ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href={apkUrl} className={cn(buttonVariants({ className: 'gap-2' }))}>
                <Download className="size-4" />
                Descargar APK
              </a>
              <Button type="button" variant="outline" className="gap-2" onClick={() => void compartir()}>
                <Share2 className="size-4" />
                Compartir
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => void copiarEnlace()}>
                {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiado ? 'Copiado' : 'Copiar enlace'}
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Link2 className="mt-0.5 size-4 shrink-0" />
              <p className="break-all font-mono text-xs text-foreground">{apkUrl}</p>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            Todavía no hay APK publicado. Genera el build (`eas build -p android --profile preview`) y súbelo aquí.
            Hasta entonces el enlace de descarga no existe (por eso veías 404).
          </p>
        )}

        <div className="rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{disponible ? 'Reemplazar APK' : 'Subir APK'}</p>
              <p className="text-xs text-muted-foreground">Archivo .apk (máx. 120 MB). Queda listo para descargar y compartir.</p>
            </div>
            <Button
              type="button"
              variant={disponible ? 'outline' : 'default'}
              className="gap-2"
              disabled={subir.isPending}
              onClick={() => inputApk.current?.click()}
            >
              <Upload className="size-4" />
              {subir.isPending ? 'Subiendo…' : 'Elegir APK'}
            </Button>
            <input
              ref={inputApk}
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              className="hidden"
              onChange={(e) => {
                alElegirApk(e.target.files)
                e.currentTarget.value = ''
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Cómo lo usan tus asesores</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Les compartes el enlace o les mandas el APK.</li>
            <li>En Android permiten instalar desde el navegador.</li>
            <li>Entran con el mismo correo y contraseña del CRM.</li>
          </ol>
        </div>
      </section>
    </div>
  )
}
