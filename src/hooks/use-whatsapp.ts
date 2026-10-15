import { useQuery } from '@tanstack/react-query'
import { leerWhatsappConectado } from '@/api'

export const CLAVE_WHATSAPP_CONECTADO = ['whatsapp-conectado'] as const

export function useWhatsappConectado() {
  const consulta = useQuery({
    queryKey: CLAVE_WHATSAPP_CONECTADO,
    queryFn: leerWhatsappConectado,
    staleTime: 60_000,
  })
  return { conectado: consulta.data === true, cargando: consulta.isPending }
}
