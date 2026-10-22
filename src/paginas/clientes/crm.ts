import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { iniciarChatCliente, leerAjustesCrm, type ClienteCrm, type FiltrosClientes } from '@/api'
import { avisoError } from '@/lib/avisos'
import { leerFecha } from '../chat/formato'

export const CLAVE_CRM = ['crm']
export const CLAVE_AJUSTES = ['crm', 'ajustes']

export function useAjustesCrm() {
  return useQuery({ queryKey: CLAVE_AJUSTES, queryFn: leerAjustesCrm, staleTime: 60_000 })
}

/** Lleva al chat del cliente; si no tiene uno abierto, lo crea primero. */
export function useEscribirCliente() {
  const navegar = useNavigate()
  const consultas = useQueryClient()
  const abrir = useMutation({
    mutationFn: (id: number) => iniciarChatCliente(id),
    onSuccess: ({ id_conversacion, nueva }) => {
      if (nueva) consultas.invalidateQueries({ queryKey: CLAVE_CRM })
      navegar(`/chats?c=${id_conversacion}`)
    },
    onError: (error) => avisoError(error, 'No se pudo abrir el chat'),
  })

  return {
    escribir: (cliente: Pick<ClienteCrm, 'id' | 'id_conversacion' | 'conversacion_activa'>) =>
      cliente.id_conversacion && cliente.conversacion_activa ? navegar(`/chats?c=${cliente.id_conversacion}`) : abrir.mutate(cliente.id),
    abriendo: abrir.isPending ? abrir.variables : null,
  }
}

export const COLORES = ['#64748b', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#14b8a6']

export const CLASE_SELECT =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export const PAISES = [
  { codigo: '51', nombre: 'Perú' },
  { codigo: '52', nombre: 'México' },
  { codigo: '57', nombre: 'Colombia' },
  { codigo: '56', nombre: 'Chile' },
  { codigo: '54', nombre: 'Argentina' },
  { codigo: '593', nombre: 'Ecuador' },
  { codigo: '591', nombre: 'Bolivia' },
  { codigo: '58', nombre: 'Venezuela' },
  { codigo: '595', nombre: 'Paraguay' },
  { codigo: '598', nombre: 'Uruguay' },
  { codigo: '55', nombre: 'Brasil' },
  { codigo: '502', nombre: 'Guatemala' },
  { codigo: '503', nombre: 'El Salvador' },
  { codigo: '504', nombre: 'Honduras' },
  { codigo: '505', nombre: 'Nicaragua' },
  { codigo: '506', nombre: 'Costa Rica' },
  { codigo: '507', nombre: 'Panamá' },
  { codigo: '53', nombre: 'Cuba' },
  { codigo: '1', nombre: 'EE. UU., Canadá, R. Dominicana, Puerto Rico' },
  { codigo: '34', nombre: 'España' },
]

const CLAVE_PAIS = 'belly.codigo_pais'

export function codigoPaisGuardado(): string {
  return localStorage.getItem(CLAVE_PAIS) || '51'
}

export function recordarCodigoPais(codigo: string) {
  localStorage.setItem(CLAVE_PAIS, codigo)
}

/** Igual que el API: solo dígitos y con código de país; null si no parece un número válido. */
export function normalizarTelefono(crudo: string, codigoPais: string): string | null {
  const texto = crudo.trim()
  const internacional = texto.startsWith('+') || texto.startsWith('00')
  let digitos = texto.replace(/\D/g, '')
  if (texto.startsWith('00')) digitos = digitos.slice(2)
  if (!internacional && codigoPais && digitos && !digitos.startsWith(codigoPais)) {
    digitos = codigoPais + digitos.replace(/^0+/, '')
  }
  return digitos.length >= 8 && digitos.length <= 15 ? digitos : null
}

export function hayFiltros(filtros: FiltrosClientes): boolean {
  return Boolean(filtros.q?.trim() || filtros.id_etapa || (filtros.id_tipo ?? null) !== null || filtros.id_etiqueta || filtros.ventana)
}

export function haceCuanto(valor: string | null | undefined): string {
  const fecha = leerFecha(valor)
  if (!fecha) return 'Nunca escribió'
  const minutos = Math.max(0, Math.round((Date.now() - fecha.getTime()) / 60_000))
  if (minutos < 1) return 'Hace un momento'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 30) return dias === 1 ? 'Ayer' : `Hace ${dias} días`
  return fecha.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}
