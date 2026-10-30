import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTransformacionModo } from '@/lib/modo-ahorro'

/** Un velo corto al cambiar de modo. Sin círculo ni texto: el CRM se reordena solo. */
export function TransformacionModo() {
  const transicion = useTransformacionModo()
  const reducido = useReducedMotion()

  return (
    <AnimatePresence>
      {transicion && !reducido ? (
        <motion.div
          key="velo-modo"
          className="pointer-events-auto fixed inset-0 z-[80] bg-background/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: transicion.fase === 'cubre' ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        />
      ) : null}
    </AnimatePresence>
  )
}
