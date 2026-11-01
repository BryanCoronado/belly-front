import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BannerVitrina } from '@/api'

export function CarruselBanners({
  banners,
  color,
  compacto = false,
  onAccion,
}: {
  banners: BannerVitrina[]
  color: string
  compacto?: boolean
  onAccion?: (banner: BannerVitrina) => void
}) {
  const [[indice, direccion], setPosicion] = useState<[number, number]>([0, 1])
  const [pausado, setPausado] = useState(false)
  const varios = banners.length > 1

  function mover(paso: number) {
    if (!varios) return
    setPosicion(([actual]) => [(actual + paso + banners.length) % banners.length, paso])
  }

  useEffect(() => {
    if (!varios || pausado) return
    const id = window.setInterval(() => setPosicion(([actual]) => [(actual + 1) % banners.length, 1]), 5000)
    return () => window.clearInterval(id)
  }, [varios, pausado, banners.length])

  const banner = banners[indice]
  if (!banner) return null

  if (compacto) {
    return (
      <div className="relative aspect-[16/8] max-h-64 overflow-hidden rounded-2xl select-none" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
        <Lamina banner={banner} color={color} compacto onAccion={onAccion} />
        {varios ? <Controles banners={banners} indice={indice} pausado={pausado} compacto color={color} alMover={mover} alIr={setPosicion} /> : null}
      </div>
    )
  }

  return (
    <div className="relative w-full select-none" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      <AnimatePresence initial={false} custom={direccion} mode="wait">
        <motion.div
          key={`${indice}-${banner.imagen_url}`}
          custom={direccion}
          initial={{ opacity: 0, x: direccion * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direccion * -40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          drag={varios ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50 || info.velocity.x < -400) mover(1)
            else if (info.offset.x > 50 || info.velocity.x > 400) mover(-1)
          }}
          className="relative cursor-grab overflow-hidden bg-[#111] active:cursor-grabbing"
        >
          <img
            src={banner.imagen_url}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
          />
          <img
            src={banner.imagen_url}
            alt={banner.titulo || ''}
            draggable={false}
            className="relative z-10 mx-auto block h-auto w-full object-contain"
          />
        </motion.div>
      </AnimatePresence>
      {varios ? <Controles banners={banners} indice={indice} pausado={pausado} compacto={false} color={color} alMover={mover} alIr={setPosicion} /> : null}
    </div>
  )
}

function Controles({
  banners,
  indice,
  pausado,
  compacto,
  color,
  alMover,
  alIr,
}: {
  banners: BannerVitrina[]
  indice: number
  pausado: boolean
  compacto: boolean
  color: string
  alMover: (paso: number) => void
  alIr: (posicion: [number, number]) => void
}) {
  const banner = banners[indice]
  const completo = banner?.estilo === 'completo'

  return (
    <>
      <div className={`absolute z-20 flex gap-1.5 ${compacto ? 'bottom-3 left-4' : 'bottom-3 left-1/2 -translate-x-1/2'}`}>
        {banners.map((_, posicion) => (
          <button
            key={posicion}
            type="button"
            aria-label={`Banner ${posicion + 1}`}
            onClick={() => alIr([posicion, posicion > indice ? 1 : -1])}
            className="relative h-1.5 overflow-hidden rounded-full bg-white/50 shadow-sm transition-all sm:h-2"
            style={{ width: posicion === indice ? 22 : 7 }}
          >
            {posicion === indice ? (
              <motion.span
                key={`${indice}-${pausado}`}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: compacto || completo ? '#fff' : color }}
                initial={{ width: pausado ? '100%' : '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: pausado ? 0 : 5, ease: 'linear' }}
              />
            ) : null}
          </button>
        ))}
      </div>
      <div className={`absolute z-20 flex gap-2 ${compacto ? 'right-3 bottom-3 hidden sm:flex' : 'inset-x-3 top-1/2 -translate-y-1/2 justify-between'}`}>
        <Flecha alPulsar={() => alMover(-1)} etiqueta="Anterior">
          <ChevronLeft className="size-4" />
        </Flecha>
        <Flecha alPulsar={() => alMover(1)} etiqueta="Siguiente">
          <ChevronRight className="size-4" />
        </Flecha>
      </div>
    </>
  )
}

function Lamina({
  banner,
  color,
  onAccion,
}: {
  banner: BannerVitrina
  color: string
  compacto: boolean
  onAccion?: (banner: BannerVitrina) => void
}) {
  const completo = banner.estilo === 'completo'

  return (
    <div className="absolute inset-0" style={{ background: completo ? '#0B1026' : banner.fondo }}>
      <img
        src={banner.imagen_url}
        alt=""
        draggable={false}
        className={`pointer-events-none absolute object-contain ${
          completo ? 'inset-0 size-full object-cover' : 'inset-x-0 bottom-0 h-[42%] w-full object-bottom sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[50%] sm:object-center'
        }`}
      />
      {completo ? <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" /> : null}
      <div className={`relative z-10 flex h-full max-w-[16rem] flex-col justify-center px-4 sm:max-w-xl sm:px-5 ${completo ? 'text-white' : 'text-[#0B1026]'}`}>
        {banner.etiqueta ? (
          <p className="mb-1.5 text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: completo ? '#fff' : color }}>
            {banner.etiqueta}
          </p>
        ) : null}
        {banner.titulo ? <h2 className="font-heading text-2xl leading-[1.1] font-bold tracking-[-0.04em]">{banner.titulo}</h2> : null}
        {banner.texto ? <p className={`mt-2 text-xs leading-relaxed ${completo ? 'text-white/80' : 'text-[#0B1026]/65'}`}>{banner.texto}</p> : null}
        {banner.boton ? (
          <button type="button" onClick={() => onAccion?.(banner)} className="mt-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg" style={{ background: color }}>
            {banner.boton}
            <ArrowRight className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Flecha({ alPulsar, etiqueta, children }: { alPulsar: () => void; etiqueta: string; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={alPulsar}
      aria-label={etiqueta}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="flex size-8 items-center justify-center rounded-full bg-white/90 text-[#0B1026] shadow-md backdrop-blur sm:size-10"
    >
      {children}
    </motion.button>
  )
}
