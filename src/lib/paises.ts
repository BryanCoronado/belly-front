export type Pais = {
  codigo: string
  iso: string
  nombre: string
  bandera: string
  placeholder: string
  largo: number
}

export const PAISES_TELEFONO: Pais[] = [
  { codigo: '51', iso: 'PE', nombre: 'Perú', bandera: '🇵🇪', placeholder: '999 999 999', largo: 9 },
  { codigo: '57', iso: 'CO', nombre: 'Colombia', bandera: '🇨🇴', placeholder: '300 123 4567', largo: 10 },
  { codigo: '52', iso: 'MX', nombre: 'México', bandera: '🇲🇽', placeholder: '55 1234 5678', largo: 10 },
  { codigo: '54', iso: 'AR', nombre: 'Argentina', bandera: '🇦🇷', placeholder: '11 1234 5678', largo: 10 },
  { codigo: '56', iso: 'CL', nombre: 'Chile', bandera: '🇨🇱', placeholder: '9 1234 5678', largo: 9 },
  { codigo: '593', iso: 'EC', nombre: 'Ecuador', bandera: '🇪🇨', placeholder: '99 123 4567', largo: 9 },
  { codigo: '591', iso: 'BO', nombre: 'Bolivia', bandera: '🇧🇴', placeholder: '712 34567', largo: 8 },
  { codigo: '58', iso: 'VE', nombre: 'Venezuela', bandera: '🇻🇪', placeholder: '412 123 4567', largo: 10 },
  { codigo: '595', iso: 'PY', nombre: 'Paraguay', bandera: '🇵🇾', placeholder: '981 123456', largo: 9 },
  { codigo: '598', iso: 'UY', nombre: 'Uruguay', bandera: '🇺🇾', placeholder: '94 123 456', largo: 8 },
  { codigo: '55', iso: 'BR', nombre: 'Brasil', bandera: '🇧🇷', placeholder: '11 91234 5678', largo: 11 },
  { codigo: '502', iso: 'GT', nombre: 'Guatemala', bandera: '🇬🇹', placeholder: '5123 4567', largo: 8 },
  { codigo: '503', iso: 'SV', nombre: 'El Salvador', bandera: '🇸🇻', placeholder: '7123 4567', largo: 8 },
  { codigo: '504', iso: 'HN', nombre: 'Honduras', bandera: '🇭🇳', placeholder: '9123 4567', largo: 8 },
  { codigo: '505', iso: 'NI', nombre: 'Nicaragua', bandera: '🇳🇮', placeholder: '8123 4567', largo: 8 },
  { codigo: '506', iso: 'CR', nombre: 'Costa Rica', bandera: '🇨🇷', placeholder: '8123 4567', largo: 8 },
  { codigo: '507', iso: 'PA', nombre: 'Panamá', bandera: '🇵🇦', placeholder: '6123 4567', largo: 8 },
  { codigo: '53', iso: 'CU', nombre: 'Cuba', bandera: '🇨🇺', placeholder: '5 123 4567', largo: 8 },
  { codigo: '1', iso: 'US', nombre: 'EE. UU. / Canadá / Caribe', bandera: '🇺🇸', placeholder: '201 555 0123', largo: 10 },
  { codigo: '34', iso: 'ES', nombre: 'España', bandera: '🇪🇸', placeholder: '612 345 678', largo: 9 },
]

export function paisPorCodigo(codigo: string): Pais {
  return PAISES_TELEFONO.find((pais) => pais.codigo === codigo) ?? PAISES_TELEFONO[0]
}

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}
