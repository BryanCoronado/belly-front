import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Download, Link2, Lock, Share2, Smartphone, Unlock, Wifi } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  guardarAccesoAppAsesor,
  guardarAppAsesor,
  leerAccesosAppAsesor,
  type AppAsesorUsuario,
} from '@/api'
import { CabeceraPagina } from '@/components/CabeceraPagina'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { APK_ASESOR_PATH, APK_ASESOR_VERSION, urlApkAsesor } from './apkAsesor'

const CLAVE = ['empresa', 'app-asesor', 'accesos']

function haceCuanto(iso?: string | null): string {
  if (!iso) return 'Sin actividad reciente'
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return 'Sin actividad reciente'
  const seg = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (seg < 60) return 'Ahora'
  if (seg < 3600) return `Hace ${Math.floor(seg / 60)} min`
  if (seg < 86400) return `Hace ${Math.floor(seg / 3600)} h`
  return `Hace ${Math.floor(seg / 86400)} d`
}

/** Configuración de la app: activar, descargar APK, ver conectados y bloquear accesos. */
export function AppAsesor() {
  const consultas = useQueryClient()
  const estado = useQuery({ queryKey: CLAVE, queryFn: leerAccesosAppAsesor, refetchInterval: 20_000 })
  const [copiado, setCopiado] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'conectados' | 'bloqueados'>('todos')

  const guardar = useMutation({
    mutationFn: (activa: boolean) => guardarAppAsesor(activa),
    onSuccess: async () => {
      await consultas.invalidateQueries({ queryKey: CLAVE })
      avisoExito('Configuración de la app guardada')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  const acceso = useMutation({
    mutationFn: ({ id, bloqueada }: { id: number; bloqueada: boolean }) => guardarAccesoAppAsesor(id, bloqueada),
    onSuccess: (data, vars) => {
      consultas.setQueryData(CLAVE, data)
      avisoExito(vars.bloqueada ? 'Acceso a la app bloqueado' : 'Acceso a la app habilitado')
    },
    onError: (error) => avisoError(error, 'No se pudo cambiar el acceso'),
  })

  const activa = estado.data?.activa ?? true
  const apkUrl = urlApkAsesor()
  const version = estado.data?.version || APK_ASESOR_VERSION
  const conectados = estado.data?.conectados ?? 0
  const usuarios = estado.data?.usuarios ?? []

  const visibles = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtro === 'conectados') return u.conectado && !u.app_bloqueada
      if (filtro === 'bloqueados') return u.app_bloqueada
      return true
    })
  }, [filtro, usuarios])

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
    <div className="mx-auto max-w-3xl space-y-6">
      <CabeceraPagina
        titulo="App Belly Asesor"
        descripcion="Configura el acceso móvil, descarga el APK y controla quién puede usarla."
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
              <h2 className="text-base font-semibold">Acceso global a la app</h2>
              {estado.isLoading ? (
                <Skeleton className="h-5 w-20 rounded-full" />
              ) : (
                <Badge className={activa ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                  {activa ? 'Activa' : 'Desactivada'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Si la apagas, nadie de la empresa podrá entrar a Belly Asesor. El CRM web no cambia.
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
      </section>

      <section className="superficie space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Usuarios y dispositivos</h2>
            <p className="text-sm text-muted-foreground">
              Quién tiene la app instalada, quién está en línea y a quién le bloqueas el acceso.
            </p>
          </div>
          {estado.isLoading ? (
            <Skeleton className="h-5 w-24 rounded-full" />
          ) : (
            <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
              <Wifi className="size-3.5" />
              {conectados} conectado{conectados === 1 ? '' : 's'}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['todos', 'Todos'],
              ['conectados', 'Conectados'],
              ['bloqueados', 'Bloqueados'],
            ] as const
          ).map(([id, etiqueta]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                filtro === id ? 'bg-foreground text-background' : 'bg-muted/70 text-muted-foreground hover:bg-muted',
              )}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        {estado.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : visibles.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            {filtro === 'conectados'
              ? 'Nadie está conectado ahora. Cuando un asesor abra la app, aparecerá aquí.'
              : filtro === 'bloqueados'
                ? 'No hay usuarios bloqueados.'
                : 'Aún no hay usuarios para mostrar.'}
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {visibles.map((u) => (
              <UsuarioAppFila
                key={u.id}
                usuario={u}
                cargando={acceso.isPending}
                onBloquear={(bloqueada) => acceso.mutate({ id: u.id, bloqueada })}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function UsuarioAppFila({
  usuario,
  cargando,
  onBloquear,
}: {
  usuario: AppAsesorUsuario
  cargando: boolean
  onBloquear: (bloqueada: boolean) => void
}) {
  const iniciales = usuario.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
        {usuario.foto ? <img src={usuario.foto} alt="" className="size-full object-cover" /> : iniciales || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{usuario.nombre}</p>
          {usuario.app_bloqueada ? (
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">Bloqueado</Badge>
          ) : usuario.conectado ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">En línea</Badge>
          ) : usuario.dispositivos.length > 0 ? (
            <Badge className="border-slate-200 bg-slate-50 text-slate-600">Instaló la app</Badge>
          ) : (
            <Badge className="border-slate-200 bg-slate-50 text-slate-500">Sin app</Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {usuario.usuario}
          {usuario.dispositivos.length > 0
            ? ` · ${usuario.dispositivos.map((d) => d.plataforma).join(', ')} · ${haceCuanto(usuario.ultimo_visto)}`
            : null}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={usuario.app_bloqueada ? 'default' : 'outline'}
        className="gap-1.5"
        disabled={cargando}
        onClick={() => onBloquear(!usuario.app_bloqueada)}
      >
        {usuario.app_bloqueada ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
        {usuario.app_bloqueada ? 'Habilitar' : 'Bloquear app'}
      </Button>
    </li>
  )
}
