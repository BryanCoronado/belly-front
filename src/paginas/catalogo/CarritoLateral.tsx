import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Minus, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { IconoRed } from '@/paginas/catalogo/redes'
import { formatearMoneda, mensajePedido, totalCarrito, unidadesCarrito, type LineaCarrito } from '@/paginas/catalogo/carrito'
import { useTienda } from '@/paginas/catalogo/tienda'

export function CarritoLateral({
  abierto,
  lineas,
  alCerrar,
  alCambiar,
  alVaciar,
}: {
  abierto: boolean
  lineas: LineaCarrito[]
  alCerrar: () => void
  alCambiar: (clave: string, cantidad: number) => void
  alVaciar: () => void
}) {
  const { catalogo } = useTienda()
  const [nombre, setNombre] = useState('')
  const [nota, setNota] = useState('')
  const total = totalCarrito(lineas)
  const moneda = lineas[0]?.moneda || 'PEN'
  const pedido = catalogo.whatsapp
    ? `https://wa.me/${catalogo.whatsapp}?text=${encodeURIComponent(mensajePedido(catalogo.titulo, lineas, catalogo.mostrar_precios, { nombre, nota }))}`
    : null

  return (
    <AnimatePresence>
      {abierto ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#0B1026]/50 backdrop-blur-[2px]" onClick={alCerrar} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#0B1026]/8 px-5 py-4">
              <div>
                <h2 className="font-heading text-lg font-bold tracking-[-0.03em]">Tu pedido</h2>
                <p className="text-xs text-[#0B1026]/50">
                  {unidadesCarrito(lineas)} {unidadesCarrito(lineas) === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              <button type="button" onClick={alCerrar} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full bg-[#F4F1EA] transition hover:rotate-90">
                <X className="size-4" />
              </button>
            </header>

            {lineas.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex size-20 items-center justify-center rounded-full"
                  style={{ background: `${catalogo.color}12`, color: catalogo.color }}
                >
                  <ShoppingBag className="size-8" />
                </motion.span>
                <p className="font-semibold">Tu pedido está vacío</p>
                <p className="text-sm text-[#0B1026]/55">Agrega productos y envíanos tu pedido por WhatsApp.</p>
                <button type="button" onClick={alCerrar} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ background: catalogo.color }}>
                  Seguir mirando
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-1 overflow-y-auto px-5 py-3">
                  <AnimatePresence initial={false}>
                    {lineas.map((linea) => (
                      <motion.div
                        key={linea.clave}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60, height: 0 }}
                        className="flex gap-3 border-b border-[#0B1026]/6 py-3"
                      >
                        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#F2F1EC]">
                          {linea.imagen_url ? (
                            <img src={linea.imagen_url} alt="" className="size-full object-cover" />
                          ) : (
                            <Package className="m-5 size-6 text-[#0B1026]/20" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-semibold">{linea.nombre}</p>
                            <button type="button" onClick={() => alCambiar(linea.clave, 0)} aria-label="Quitar" className="text-[#0B1026]/35 hover:text-[#E11D48]">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          {linea.variante ? <p className="text-xs text-[#0B1026]/50">{linea.variante}</p> : null}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-[#0B1026]/10">
                              <button type="button" className="flex size-7 items-center justify-center" onClick={() => alCambiar(linea.clave, linea.cantidad - 1)} aria-label="Menos">
                                <Minus className="size-3" />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums">{linea.cantidad}</span>
                              <button type="button" className="flex size-7 items-center justify-center" onClick={() => alCambiar(linea.clave, linea.cantidad + 1)} aria-label="Más">
                                <Plus className="size-3" />
                              </button>
                            </div>
                            {catalogo.mostrar_precios && linea.precio !== null ? (
                              <p className="text-sm font-bold">{formatearMoneda(linea.precio * linea.cantidad, linea.moneda)}</p>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button type="button" onClick={alVaciar} className="mt-2 text-xs font-medium text-[#0B1026]/45 hover:text-[#E11D48]">
                    Vaciar pedido
                  </button>
                </div>

                <footer className="space-y-3 border-t border-[#0B1026]/8 bg-[#FAFAF7] px-5 py-4">
                  <input
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                    placeholder="Tu nombre (opcional)"
                    maxLength={60}
                    className="h-10 w-full rounded-xl border border-[#0B1026]/10 bg-white px-3 text-sm outline-none focus:border-[#0B1026]/30"
                  />
                  <textarea
                    value={nota}
                    onChange={(evento) => setNota(evento.target.value)}
                    placeholder="Nota: dirección, hora de entrega… (opcional)"
                    rows={2}
                    maxLength={300}
                    className="w-full resize-none rounded-xl border border-[#0B1026]/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1026]/30"
                  />
                  {catalogo.mostrar_precios && total !== null ? (
                    <p className="flex items-center justify-between text-base font-bold">
                      <span>Total</span>
                      <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }}>
                        {formatearMoneda(total, moneda)}
                      </motion.span>
                    </p>
                  ) : null}
                  {pedido ? (
                    <motion.a
                      href={pedido}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white shadow-lg"
                    >
                      <IconoRed red="whatsapp" className="size-5" />
                      Enviar pedido por WhatsApp
                    </motion.a>
                  ) : (
                    <p className="text-center text-sm text-[#0B1026]/55">Este catálogo aún no tiene un WhatsApp para recibir pedidos.</p>
                  )}
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
