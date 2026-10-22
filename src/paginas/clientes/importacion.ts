import type { CampoImportacion, FilaImportacion } from '@/api'

export const MAX_FILAS = 10_000
export const TAMANO_TANDA = 500

export const CAMPOS: { id: CampoImportacion; titulo: string; ayuda: string }[] = [
  { id: 'telefono', titulo: 'Teléfono', ayuda: 'Obligatorio. Con código de país, por ejemplo +51 987 654 321.' },
  { id: 'nombre', titulo: 'Nombres', ayuda: 'Opcional.' },
  { id: 'apellido', titulo: 'Apellidos', ayuda: 'Opcional.' },
  { id: 'correo', titulo: 'Correo', ayuda: 'Opcional.' },
  { id: 'distrito', titulo: 'Ubicación', ayuda: 'Ciudad o distrito. Opcional.' },
  { id: 'etiquetas', titulo: 'Etiquetas', ayuda: 'Separadas por coma. Las que no existan se crean.' },
  { id: 'notas', titulo: 'Notas', ayuda: 'Opcional.' },
]

const SINONIMOS: Record<CampoImportacion, string[]> = {
  telefono: ['telefono', 'tel', 'celular', 'movil', 'whatsapp', 'wsp', 'numero', 'phone', 'mobile', 'contacto'],
  nombre: ['nombre', 'nombres', 'name', 'first name', 'firstname', 'primer nombre'],
  apellido: ['apellido', 'apellidos', 'last name', 'lastname', 'surname'],
  correo: ['correo', 'email', 'e-mail', 'mail', 'correo electronico'],
  distrito: ['ubicacion', 'distrito', 'ciudad', 'direccion', 'provincia', 'zona', 'city', 'address'],
  etiquetas: ['etiquetas', 'etiqueta', 'tags', 'tag', 'grupo', 'segmento'],
  notas: ['notas', 'nota', 'comentario', 'comentarios', 'observacion', 'observaciones', 'notes'],
}

const ENCABEZADOS = ['telefono', 'nombres', 'apellidos', 'correo', 'ubicacion', 'etiquetas', 'notas']
const ORDEN_PLANTILLA: CampoImportacion[] = ['telefono', 'nombre', 'apellido', 'correo', 'distrito', 'etiquetas', 'notas']
const EJEMPLOS = [
  ['+51 987 654 321', 'María', 'Pérez', 'maria@correo.com', 'Miraflores', 'VIP, Feria 2026', 'Prefiere que le escriban por la tarde'],
  ['+51 912 345 678', 'Juan', 'Gómez', '', 'Arequipa', 'Interesado', ''],
]

export type Separador = '\t' | ';' | ',' | '|'

export type ArchivoLeido = { nombre: string; separador: Separador; filas: string[][] }

/** Lee el texto probando UTF-8 y, si trae caracteres raros, como Windows-1252 (lo que guarda Excel). */
export async function leerArchivo(archivo: File): Promise<ArchivoLeido> {
  const bytes = await archivo.arrayBuffer()
  let texto: string
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    texto = new TextDecoder('windows-1252').decode(bytes)
  }
  texto = texto.replace(/^\uFEFF/, '')
  const separador = detectarSeparador(texto)
  const filas = separar(texto, separador).filter((fila) => fila.some((celda) => celda.trim() !== ''))
  return { nombre: archivo.name, separador, filas }
}

function detectarSeparador(texto: string): Separador {
  const lineas = texto.split(/\r?\n/).filter((linea) => linea.trim() !== '').slice(0, 5)
  const candidatos: Separador[] = ['\t', ';', ',', '|']
  let mejor: Separador = ','
  let puntos = 0
  for (const candidato of candidatos) {
    const cuentas = lineas.map((linea) => linea.split(candidato).length - 1)
    const minimo = cuentas.length ? Math.min(...cuentas) : 0
    if (minimo > puntos) {
      mejor = candidato
      puntos = minimo
    }
  }
  return mejor
}

/** CSV con comillas: "a;b" cuenta como una sola celda y "" es una comilla. */
function separar(texto: string, separador: Separador): string[][] {
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let entreComillas = false
  for (let i = 0; i < texto.length; i++) {
    const letra = texto[i]
    if (entreComillas) {
      if (letra === '"' && texto[i + 1] === '"') {
        celda += '"'
        i++
      } else if (letra === '"') {
        entreComillas = false
      } else {
        celda += letra
      }
    } else if (letra === '"' && celda.trim() === '') {
      entreComillas = true
      celda = ''
    } else if (letra === separador) {
      fila.push(celda.trim())
      celda = ''
    } else if (letra === '\n' || letra === '\r') {
      if (letra === '\r' && texto[i + 1] === '\n') i++
      fila.push(celda.trim())
      filas.push(fila)
      fila = []
      celda = ''
    } else {
      celda += letra
    }
  }
  if (celda !== '' || fila.length) {
    fila.push(celda.trim())
    filas.push(fila)
  }
  return filas
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function campoDeEncabezado(encabezado: string): CampoImportacion | null {
  const limpio = normalizar(encabezado)
  if (!limpio) return null
  for (const [campo, sinonimos] of Object.entries(SINONIMOS) as [CampoImportacion, string[]][]) {
    if (sinonimos.includes(limpio)) return campo
  }
  for (const [campo, sinonimos] of Object.entries(SINONIMOS) as [CampoImportacion, string[]][]) {
    if (sinonimos.some((s) => s.length > 3 && limpio.includes(s))) return campo
  }
  return null
}

const PARECE_TELEFONO = /^\+?[\d\s().-]{8,20}$/
const PARECE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Adivina qué es cada columna. Si la primera fila trae títulos conocidos, se usan;
 * si no, se busca la columna que parezca teléfono (o se asume el orden de la plantilla).
 */
export function adivinarColumnas(filas: string[][]): { tieneTitulos: boolean; campos: (CampoImportacion | null)[] } {
  const primera = filas[0] ?? []
  const columnas = Math.max(0, ...filas.slice(0, 20).map((fila) => fila.length))
  const porTitulo = Array.from({ length: columnas }, (_, i) => campoDeEncabezado(primera[i] ?? ''))
  const usados = new Set<CampoImportacion>()
  const sinRepetir = porTitulo.map((campo) => {
    if (!campo || usados.has(campo)) return null
    usados.add(campo)
    return campo
  })
  if (sinRepetir.some(Boolean)) {
    return { tieneTitulos: true, campos: sinRepetir }
  }

  const indices = Array.from({ length: columnas }, (_, i) => i)
  const telefono = indices.find((i) => PARECE_TELEFONO.test(primera[i] ?? ''))
  if (telefono === undefined || telefono === 0) {
    return { tieneTitulos: false, campos: indices.map((i) => ORDEN_PLANTILLA[i] ?? null) }
  }

  const campos: (CampoImportacion | null)[] = indices.map(() => null)
  campos[telefono] = 'telefono'
  const correo = indices.find((i) => PARECE_CORREO.test(primera[i] ?? ''))
  if (correo !== undefined) campos[correo] = 'correo'
  const nombre = indices.find((i) => campos[i] === null && /\p{L}/u.test(primera[i] ?? ''))
  if (nombre !== undefined) campos[nombre] = 'nombre'
  return { tieneTitulos: false, campos }
}

export function armarFilas(filas: string[][], campos: (CampoImportacion | null)[], tieneTitulos: boolean): FilaImportacion[] {
  const desde = tieneTitulos ? 1 : 0
  return filas.slice(desde).map((celdas, indice) => {
    const fila: FilaImportacion = { fila: indice + desde + 1 }
    campos.forEach((campo, columna) => {
      const valor = celdas[columna]?.trim()
      if (campo && valor) fila[campo] = valor
    })
    return fila
  })
}

function escaparCsv(valor: string, separador: string): string {
  return /["\n\r]/.test(valor) || valor.includes(separador) ? `"${valor.replace(/"/g, '""')}"` : valor
}

export function descargarTexto(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([`\uFEFF${contenido}`], { type: `${tipo};charset=utf-8` }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** CSV con punto y coma (lo abre bien Excel en español) o TXT separado por tabulaciones. */
export function descargarPlantilla(formato: 'csv' | 'txt') {
  const separador = formato === 'csv' ? ';' : '\t'
  const lineas = [ENCABEZADOS, ...EJEMPLOS].map((fila) => fila.map((valor) => escaparCsv(valor, separador)).join(separador))
  descargarTexto(`plantilla-clientes.${formato}`, lineas.join('\r\n') + '\r\n', formato === 'csv' ? 'text/csv' : 'text/plain')
}

export function descargarProblemas(problemas: { fila: number; telefono: string; motivo: string }[]) {
  const lineas = [['fila', 'telefono', 'motivo'], ...problemas.map((p) => [String(p.fila), p.telefono, p.motivo])]
  descargarTexto('clientes-no-importados.csv', lineas.map((fila) => fila.map((v) => escaparCsv(v, ';')).join(';')).join('\r\n'), 'text/csv')
}
