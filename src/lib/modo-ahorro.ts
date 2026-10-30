import { useEffect, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { guardarModoEmpresa, leerModoEmpresa } from '@/api'
import { actualizarUsuarioSesion, esAdministrador, leerSesion } from '@/sesion'

export const CLAVE_MODO = ['modo-ahorro'] as const

export const RUTAS_OCULTAS_AHORRO = ['/envios', '/agente-ia']

export function ocultaEnAhorro(ruta: string): boolean {
  return RUTAS_OCULTAS_AHORRO.some((base) => ruta === base || ruta.startsWith(`${base}/`))
}

export type TransicionModo = { hacia: 'ahorro' | 'libre'; fase: 'cubre' | 'revela' } | null

const oyentes = new Set<() => void>()
let transicion: TransicionModo = null
let ocupada = false

function avisar() {
  oyentes.forEach((fn) => fn())
}

function suscribir(fn: () => void) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

function esperar(ms: number) {
  return new Promise((resolver) => window.setTimeout(resolver, ms))
}

function aplicar(ahorro: boolean) {
  document.documentElement.dataset.ahorro = ahorro ? '1' : '0'
}

/** Reproduce el barrido al cambiar de modo (cubre → aplica → revela). */
export async function transformarModo(haciaAhorro: boolean, aplicarCambio: () => Promise<unknown>) {
  if (ocupada) {
    await aplicarCambio()
    return
  }
  ocupada = true
  transicion = { hacia: haciaAhorro ? 'ahorro' : 'libre', fase: 'cubre' }
  avisar()
  await esperar(160)
  await aplicarCambio()
  transicion = { hacia: haciaAhorro ? 'ahorro' : 'libre', fase: 'revela' }
  avisar()
  await esperar(220)
  transicion = null
  ocupada = false
  avisar()
}

export function useTransformacionModo() {
  return useSyncExternalStore(suscribir, () => transicion, () => null)
}

/** Modo de la empresa: Libre o Ahorro. Cambia el color y la estructura del CRM. */
export function useModoAhorro() {
  const consultas = useQueryClient()
  const sesion = leerSesion()
  const admin = esAdministrador(sesion?.usuario)
  const transicionActual = useTransformacionModo()

  const consulta = useQuery({
    queryKey: CLAVE_MODO,
    queryFn: leerModoEmpresa,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    initialData: sesion?.usuario.modo_ahorro != null ? { modo_ahorro: Boolean(sesion.usuario.modo_ahorro) } : undefined,
  })

  const ahorro = Boolean(consulta.data?.modo_ahorro)

  useEffect(() => {
    aplicar(ahorro)
    actualizarUsuarioSesion({ modo_ahorro: ahorro })
  }, [ahorro])

  const guardar = useMutation({
    mutationFn: guardarModoEmpresa,
    onSuccess: (datos) => {
      consultas.setQueryData(CLAVE_MODO, datos)
      actualizarUsuarioSesion({ modo_ahorro: datos.modo_ahorro })
      aplicar(datos.modo_ahorro)
    },
  })

  return {
    ahorro,
    admin,
    transicion: transicionActual,
    transformando: transicionActual !== null,
    cargando: consulta.isPending && consulta.data == null,
    cambiando: guardar.isPending || transicionActual !== null,
    error: guardar.error,
    cambiar: (valor: boolean) => transformarModo(valor, () => guardar.mutateAsync(valor)),
  }
}
