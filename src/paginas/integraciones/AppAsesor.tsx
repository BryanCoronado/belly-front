import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Download, Link2, Share2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { guardarAppAsesor, leerAppAsesor } from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { APK_ASESOR_PATH, APK_ASESOR_VERSION, urlApkAsesor } from './apkAsesor'

const CLAVE = ['empresa', 'app-asesor']

/** Activa la app y descarga / comparte el APK publicado con el front. */
export function AppAsesor() {
  const consultas = useQueryClient()
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

  const activa = estado.data?.activa ?? true
  const apkUrl = urlApkAsesor()
  const version = estado.data?.version || APK_ASESOR_VERSION

  const copiarEnlace = async () => {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <CabeceraPagina
        titulo="App Belly Asesor"
        descripcion="Activa el acceso móvil y descarga o comparte el instalador Android con tu equipo."
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
            <p className="text-sm text-muted-foreground">APK Android · v{version}</p>
          </div>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Lista para instalar</Badge>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={APK_ASESOR_PATH} download="belly-asesor.apk" className={cn(buttonVariants({ className: 'gap-2' }))}>
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
