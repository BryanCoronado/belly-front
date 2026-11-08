import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, LoaderCircle, Redo2, Undo2 } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { guardarVitrina, leerVitrina, type BloqueHtmlVitrina, type DatosVitrina, type Vitrina } from '@/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { avisoError, avisoExito } from '@/lib/avisos'
import { cn } from '@/lib/utils'
import { EditorHtmlCatalogo } from '@/paginas/catalogo/EditorHtmlCatalogo'
import { normalizarBloque } from '@/paginas/catalogo/bloques'
import { seoVacio } from '@/paginas/catalogo/seoTienda'
import { esAdministrador, leerSesion } from '@/sesion'

const CLAVE = ['catalogo-vitrina']

const PAGINA_VACIA = {
  banners: [],
  promos: [],
  oferta: { activa: false, titulo: 'Ofertas de la semana', termina: '' },
  secciones: { categorias: true, ofertas: true, destacados: true, nosotros: true },
  aviso: '',
  sobre: '',
  horario: '',
  direccion: '',
  entrega: '',
  devoluciones: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  carrito: true,
  bloques: [],
  seo: { descripcion: '', imagen_url: '' },
}

function desdeVitrina(vitrina: Vitrina): DatosVitrina {
  const pagina = vitrina.pagina ?? PAGINA_VACIA
  return {
    slug: vitrina.slug,
    titulo: vitrina.titulo,
    eslogan: vitrina.eslogan,
    color: vitrina.color || '#0B1026',
    logo_url: vitrina.logo_url ?? '',
    whatsapp: vitrina.whatsapp ?? '',
    mostrar_precios: vitrina.mostrar_precios,
    publicado: vitrina.publicado,
    pagina: {
      ...PAGINA_VACIA,
      ...pagina,
      banners: pagina.banners ?? [],
      promos: pagina.promos ?? [],
      oferta: { ...PAGINA_VACIA.oferta, ...pagina.oferta },
      secciones: { ...PAGINA_VACIA.secciones, ...pagina.secciones },
      bloques: (pagina.bloques ?? []).map(normalizarBloque),
      seo: { ...seoVacio(), ...pagina.seo },
    },
  }
}

/** Constructor visual de la tienda de ESTA empresa (sesión). Cada tenant tiene el suyo. */
export function ConstructorCatalogo() {
  const usuario = leerSesion()?.usuario
  const admin = esAdministrador(usuario)
  const empresa = usuario?.empresa_nombre || usuario?.empresa || ''
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: CLAVE, queryFn: leerVitrina })
  const [editado, setEditado] = useState<DatosVitrina | null>(null)
  const [historial, setHistorial] = useState<{ pasado: BloqueHtmlVitrina[][]; futuro: BloqueHtmlVitrina[][] }>({ pasado: [], futuro: [] })
  const [sucio, setSucio] = useState(false)
  const ultimoCambio = useRef(0)
  const datos = editado ?? (consulta.data ? desdeVitrina(consulta.data) : null)

  const guardar = useMutation({
    mutationFn: () => {
      if (!datos) throw new Error('Sin catálogo')
      return guardarVitrina({ ...datos, publicado: datos.publicado || Boolean(consulta.data?.publicado) })
    },
    onSuccess: (vitrina) => {
      setEditado(desdeVitrina(vitrina))
      setSucio(false)
      void cliente.invalidateQueries({ queryKey: CLAVE })
      avisoExito(vitrina.publicado ? 'Publicado' : 'Guardado en borrador')
    },
    onError: (error) => avisoError(error, 'No se pudo guardar'),
  })

  function ponerBloques(bloques: BloqueHtmlVitrina[]) {
    setEditado((previo) => {
      const base = previo ?? datos
      return base ? { ...base, pagina: { ...base.pagina, bloques } } : base
    })
    setSucio(true)
  }

  function aplicar(bloques: BloqueHtmlVitrina[]) {
    if (!datos) return
    const ahora = Date.now()
    const agrupar = ahora - ultimoCambio.current < 600
    ultimoCambio.current = ahora
    const anterior = datos.pagina.bloques
    setHistorial((h) => (agrupar && h.pasado.length > 0 ? { pasado: h.pasado, futuro: [] } : { pasado: [...h.pasado.slice(-59), anterior], futuro: [] }))
    ponerBloques(bloques)
  }

  function deshacer() {
    if (!datos || historial.pasado.length === 0) return
    const previo = historial.pasado[historial.pasado.length - 1]
    setHistorial({ pasado: historial.pasado.slice(0, -1), futuro: [datos.pagina.bloques, ...historial.futuro] })
    ultimoCambio.current = 0
    ponerBloques(previo)
  }

  function rehacer() {
    if (!datos || historial.futuro.length === 0) return
    const [siguiente, ...resto] = historial.futuro
    setHistorial({ pasado: [...historial.pasado, datos.pagina.bloques], futuro: resto })
    ultimoCambio.current = 0
    ponerBloques(siguiente)
  }

  const acciones = useRef({ deshacer, rehacer, guardar: () => guardar.mutate() })
  useEffect(() => {
    acciones.current = { deshacer, rehacer, guardar: () => guardar.mutate() }
  })

  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (!(evento.ctrlKey || evento.metaKey)) return
      const tecla = evento.key.toLowerCase()
      if (tecla === 's') {
        evento.preventDefault()
        acciones.current.guardar()
        return
      }
      const destino = evento.target as HTMLElement | null
      if (destino && (destino.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName))) return
      if (tecla === 'z' && !evento.shiftKey) {
        evento.preventDefault()
        acciones.current.deshacer()
      } else if (tecla === 'y' || (tecla === 'z' && evento.shiftKey)) {
        evento.preventDefault()
        acciones.current.rehacer()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  useEffect(() => {
    if (!sucio) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio])

  if (!admin) {
    return <Navigate to="/catalogo" replace />
  }

  if (consulta.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-background">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (consulta.isError || !datos || !consulta.data?.existe) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div>
          <p className="font-heading text-xl font-bold tracking-[-0.03em]">Constructor</p>
          <p className="mt-1 text-sm text-muted-foreground">Primero guarda tu tienda en Mi Catálogo.</p>
        </div>
        <Link to="/catalogo" className={cn(buttonVariants())}>
          Ir a Mi Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background lg:overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 md:px-3">
        <Link
          to="/catalogo"
          onClick={(evento) => {
            if (sucio && !window.confirm('Tienes cambios sin guardar. ¿Salir igual?')) evento.preventDefault()
          }}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'shrink-0')}
          aria-label="Volver a Mi Catálogo"
        >
          <ArrowLeft />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{datos.titulo || empresa || 'Mi tienda'}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {guardar.isPending ? 'Guardando…' : sucio ? 'Sin guardar' : 'Guardado'}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon-sm" title="Deshacer (Ctrl+Z)" disabled={historial.pasado.length === 0} onClick={deshacer}>
            <Undo2 />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" title="Rehacer (Ctrl+Y)" disabled={historial.futuro.length === 0} onClick={rehacer}>
            <Redo2 />
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {consulta.data.slug && consulta.data.publicado ? (
            <a
              href={`/c/${consulta.data.slug}`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden h-8 sm:inline-flex')}
            >
              <ExternalLink />
              Ver
            </a>
          ) : null}
          <Button type="button" size="sm" className="h-8" disabled={guardar.isPending || !sucio} onClick={() => guardar.mutate()}>
            {guardar.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {datos.publicado || consulta.data.publicado ? 'Publicar' : 'Guardar'}
          </Button>
        </div>
      </header>

      <EditorHtmlCatalogo datos={datos} slugGuardado={consulta.data.slug} alCambiar={aplicar} />
    </div>
  )
}
