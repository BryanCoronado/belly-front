import type { ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, BookImage, Bot, Check, Share2, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { leerEstadoIa, leerReparto, leerVitrina, listarFlujos } from '@/api'
import { IconoWhatsapp } from '@/components/IconoWhatsapp'
import { useWhatsappConectado } from '@/hooks/use-whatsapp'
import { cn } from '@/lib/utils'
import { CLAVE_IA } from '@/paginas/agente-ia/claves'
import { esAdministrador, leerSesion } from '@/sesion'

type Paso = {
  titulo: string
  ruta: string
  hecho: boolean
  Icono: ComponentType<{ className?: string }>
  tono: string
}

/** Línea de tiempo corta cuando aún no hay WhatsApp. */
export function LineaInicio() {
  const admin = esAdministrador(leerSesion()?.usuario)
  const { conectado } = useWhatsappConectado()
  const flujos = useQuery({ queryKey: ['flujos-resumen'], queryFn: listarFlujos, staleTime: 60_000, enabled: admin })
  const ia = useQuery({ queryKey: CLAVE_IA, queryFn: leerEstadoIa, staleTime: 60_000, enabled: admin })
  const vitrina = useQuery({
    queryKey: ['catalogo-vitrina'],
    queryFn: leerVitrina,
    enabled: admin,
    staleTime: 60_000,
    retry: false,
  })
  const reparto = useQuery({
    queryKey: ['reparto'],
    queryFn: leerReparto,
    staleTime: 60_000,
    enabled: admin,
  })

  if (!admin) {
    return (
      <section className="superficie overflow-hidden p-5 sm:p-6">
        <p className="font-heading text-lg font-bold tracking-[-0.03em]">Aún no hay chats</p>
        <p className="mt-1 text-sm text-muted-foreground">Cuando conecten WhatsApp, aquí aparecen tus números.</p>
      </section>
    )
  }

  const pasos: Paso[] = [
    {
      titulo: 'Conectar WhatsApp',
      ruta: '/integraciones/whatsapp',
      hecho: conectado,
      Icono: IconoWhatsapp,
      tono: 'bg-emerald-100 text-emerald-700',
    },
    {
      titulo: 'Reparto del equipo',
      ruta: '/asesores?tab=reparto',
      hecho: reparto.data?.configurado === true,
      Icono: Share2,
      tono: 'bg-sky-100 text-sky-700',
    },
    {
      titulo: 'Publicar catálogo',
      ruta: '/catalogo',
      hecho: vitrina.data?.publicado === true,
      Icono: BookImage,
      tono: 'bg-orange-100 text-orange-700',
    },
    {
      titulo: 'Automatizar',
      ruta: '/automatizacion',
      hecho: (flujos.data?.length ?? 0) > 0,
      Icono: Workflow,
      tono: 'bg-violet-100 text-violet-700',
    },
    {
      titulo: 'Asistente IA',
      ruta: '/agente-ia',
      hecho: Boolean(ia.data?.conexion.conectada && ia.data.agentes.some((a) => a.activo)),
      Icono: Bot,
      tono: 'bg-fuchsia-100 text-fuchsia-700',
    },
  ]

  const actual = pasos.findIndex((paso) => !paso.hecho)
  const indiceActivo = actual === -1 ? pasos.length - 1 : actual

  return (
    <section className="superficie overflow-hidden" data-tour="linea-inicio">
      <header className="px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">Empieza aquí</h2>
      </header>

      <ol className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <span className="absolute top-4 bottom-10 left-[2.15rem] w-px bg-border sm:left-[2.4rem]" aria-hidden />
        {pasos.map((paso, indice) => {
          const { Icono } = paso
          const activo = indice === indiceActivo
          return (
            <motion.li
              key={paso.ruta}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + indice * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Link
                to={paso.ruta}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl py-3 pr-2 pl-1 transition-colors sm:gap-4',
                  activo && !paso.hecho ? 'bg-primary/6' : 'hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11',
                    paso.hecho ? 'bg-emerald-500 text-white' : activo ? paso.tono : 'bg-muted text-muted-foreground',
                  )}
                >
                  {paso.hecho ? <Check className="size-4" strokeWidth={2.5} /> : <Icono className="size-4" />}
                  {activo && !paso.hecho ? (
                    <motion.span
                      className="absolute inset-0 rounded-full ring-2 ring-primary/35"
                      animate={{ scale: [1, 1.14, 1], opacity: [0.85, 0.25, 0.85] }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-[15px] font-medium tracking-[-0.01em]',
                      paso.hecho && 'text-muted-foreground line-through decoration-muted-foreground/50',
                    )}
                  >
                    {paso.titulo}
                  </span>
                  {activo && !paso.hecho ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground"
                    >
                      Empieza por aquí
                    </motion.span>
                  ) : null}
                </span>
                <ArrowRight
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5',
                    paso.hecho && 'opacity-30',
                  )}
                />
              </Link>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}
