import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export function TransicionPagina({
  id,
  children,
  suave = false,
  className,
}: {
  id: string
  suave?: boolean
  className?: string
  children: ReactNode
}) {
  const reducido = useReducedMotion()

  return (
    <motion.div
      key={id}
      className={cn('min-h-0 min-w-0', className)}
      initial={reducido ? false : { opacity: 0, y: suave ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
