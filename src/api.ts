import { leerSesion, type Sesion } from '@/sesion'

const BASE = import.meta.env.VITE_API_URL || '/api'

export type Fila = Record<string, unknown>

export type Lista = {
  filas: Fila[]
  total: number
}

export type PermisoRol = {
  id: number
  id_padre?: number | null
  nombre: string
  descripcion: string
  grupo?: string
  alias?: string
  tipo?: 'modulo' | 'accion'
  requiere_whatsapp?: boolean
  solo_admin?: boolean
  acc_lectura: number
  acc_crear: number
  acc_actualizar: number
  acc_eliminar: number
}

export type Rol = {
  id: number
  rol: string
  descripcion: string
  es_admin: number
  permisos?: PermisoRol[]
}

export type DatosUsuario = {
  usuario: string
  password?: string
  nombres: string
  apellidos: string
  correo: string
  celular: string
  nro_documento: string
  id_rol: number
  id_grupo_usuario?: number
}

export type MiembroGrupo = {
  id: number
  nombre: string
}

export type GrupoUsuario = {
  id: number
  grupo: string
  descripcion: string
  es_base?: number
  miembros?: MiembroGrupo[]
}

export type DetalleGrupo = Omit<GrupoUsuario, 'miembros'> & {
  miembros: number[]
}

export type DatosGrupo = {
  grupo: string
  descripcion: string
  miembros: number[]
}

export type DatosRegistro = {
  empresa: string
  nombre: string
  nombres: string
  apellidos: string
  correo: string
  username: string
  password: string
}

type Respuesta = {
  success?: boolean
  token?: string
  usuario?: Sesion['usuario']
  data?: unknown
  mensajes?: unknown
  pagination?: { total?: number }
  messages?: string | { error?: string }
  message?: string
  error?: string
}

export async function entrar(empresa: string, username: string, password: string): Promise<Sesion> {
  const datos = await solicitar('/v1/auth/login', { method: 'POST', cuerpo: { empresa, username, password } })
  if (!datos.token || !datos.usuario) {
    throw new Error('No se pudo iniciar sesión.')
  }
  return { token: datos.token, usuario: datos.usuario }
}

export async function registrar(datos: DatosRegistro): Promise<void> {
  await solicitar('/v1/auth/registro', { method: 'POST', cuerpo: datos })
}

export type ModuloMenu = {
  id: number
  nombre: string
  url: string
  icon: string
  descripcion: string
  alias: string
  hijos: ModuloMenu[]
}

export type GrupoMenu = {
  id: number
  grupo: string
  modulos: ModuloMenu[]
}

export async function crearUsuario(datos: DatosUsuario): Promise<void> {
  await solicitar('/v1/usuario/crear', { method: 'POST', cuerpo: datos, conToken: true })
}

export async function editarUsuario(id: number, datos: DatosUsuario): Promise<void> {
  await solicitar(`/v1/usuario/editar/${id}`, { method: 'PUT', cuerpo: datos, conToken: true })
}

export async function leerMenu(): Promise<GrupoMenu[]> {
  const datos = await solicitar('/v1/acceso/menu', { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as GrupoMenu[]) : []
}

export async function leerRoles(): Promise<Rol[]> {
  const datos = await solicitar('/v1/acceso/roles', { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as Rol[]) : []
}

export async function leerRol(id: number): Promise<Rol> {
  const datos = await solicitar(`/v1/acceso/roles/${id}`, { method: 'GET', conToken: true })
  return datos.data as Rol
}

export async function guardarRol(datos: { rol: string; descripcion: string; permisos: PermisoRol[] }, id?: number): Promise<Rol> {
  const respuesta = await solicitar(id ? `/v1/acceso/roles/${id}` : '/v1/acceso/roles', {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return respuesta.data as Rol
}

export async function eliminarRol(id: number): Promise<void> {
  await solicitar(`/v1/acceso/roles/${id}`, { method: 'DELETE', conToken: true })
}

export async function leerGrupos(): Promise<GrupoUsuario[]> {
  const datos = await solicitar('/v1/acceso/grupos', { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as GrupoUsuario[]) : []
}

export async function leerGrupo(id: number): Promise<DetalleGrupo> {
  const datos = await solicitar(`/v1/acceso/grupos/${id}`, { method: 'GET', conToken: true })
  return datos.data as DetalleGrupo
}

export async function guardarGrupo(datos: DatosGrupo, id?: number): Promise<GrupoUsuario> {
  const respuesta = await solicitar(id ? `/v1/acceso/grupos/${id}` : '/v1/acceso/grupos', {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return respuesta.data as GrupoUsuario
}

export async function eliminarGrupo(id: number): Promise<void> {
  await solicitar(`/v1/acceso/grupos/${id}`, { method: 'DELETE', conToken: true })
}

export async function leerCatalogo(): Promise<PermisoRol[]> {
  const datos = await solicitar('/v1/acceso/permisos', { method: 'GET', conToken: true })
  const filas = Array.isArray(datos.data) ? (datos.data as PermisoRol[]) : []
  return filas.map((modulo) => ({
    ...modulo,
    acc_lectura: 0,
    acc_crear: 0,
    acc_actualizar: 0,
    acc_eliminar: 0,
  }))
}

export async function cambiarEstadoUsuario(id: number, estado: 0 | 1): Promise<void> {
  await solicitar(`/v1/usuario/estado/${id}`, { method: 'PUT', cuerpo: { estado }, conToken: true })
}

export async function leerLista(ruta: string): Promise<Lista> {
  const datos = await solicitar(ruta, { method: 'GET', conToken: true })
  const filas = Array.isArray(datos.data) ? (datos.data as Fila[]) : []
  return { filas, total: datos.pagination?.total ?? filas.length }
}

export function texto(fila: Fila, ...claves: string[]): string {
  for (const clave of claves) {
    const valor = fila[clave]
    if (typeof valor === 'string' && valor.trim() !== '') {
      return valor.trim()
    }
    if (typeof valor === 'number') {
      return String(valor)
    }
  }
  return ''
}

export type BandejaChat = 'activos' | 'no_leidos' | 'pendientes' | 'finalizados'

export type ConversacionChat = {
  id: number
  id_app: number
  id_estado: number
  telefono: string | null
  nombre_cliente: string | null
  apellido_cliente: string | null
  nombre_completo_cliente: string | null
  nombre_app: string | null
  etiqueta_nombre: string | null
  etiqueta_color: string | null
  mensajes_no_leidos: number
  texto_ultimo_mensaje: string | null
  ultimo_mensaje_fecha: string | null
  ultimo_mensaje_contesta: 'cliente' | 'usuario' | 'bot' | null
}

export type InteractivoChat = {
  tipo: 'botones' | 'lista'
  boton?: string
  opciones: { titulo: string; descripcion?: string }[]
}

export type MensajeChat = {
  id: number
  id_conversacion: number
  id_estado: number
  mensaje: string | null
  contesta: 'cliente' | 'usuario' | 'bot'
  media_type: string | null
  media_url: string | null
  cod_error: string | null
  created_at: string
  mensaje_responde_contenido?: { mensaje: string | null; contesta: string; media_type: string | null } | null
  /** Botones o lista que envió el bot (se dibujan igual que en WhatsApp). */
  interactivo?: InteractivoChat
  pendiente?: boolean
}

export type ComponentePlantilla = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: string
  text?: string
}

export type PlantillaWhatsapp = {
  id: string
  name: string
  language: string
  category?: string
  components?: ComponentePlantilla[]
}

export type RespuestaRapida = {
  id: number
  nombre: string
  contenido: string
}

export type MotivoCierre = {
  id: number
  nombre: string
}

export type ContadoresChat = {
  mensajes_no_leidos: number
  falta_responder: number
  badge_chat: number
}

const RUTAS_BANDEJA: Record<BandejaChat, string> = {
  activos: '/v1/conversacion/listar',
  no_leidos: '/v1/conversacion/no-leidos',
  pendientes: '/v1/conversacion/falta-responder',
  finalizados: '/v1/conversacion/finalizadas',
}

export async function leerChats(bandeja: BandejaChat, busqueda: string): Promise<ConversacionChat[]> {
  const parametros = new URLSearchParams({ page: '1' })
  if (busqueda.trim() !== '') {
    parametros.set('search', busqueda.trim())
  }
  const datos = await solicitar(`${RUTAS_BANDEJA[bandeja]}?${parametros}`, { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as ConversacionChat[]) : []
}

type DetalleConversacion = {
  conversacion: { id: number; id_app: number; id_estado: number }
  cliente: { nombre: string | null; apellido: string | null; nombre_completo: string | null; telefono: string | null }
  app: { nombre: string | null }
  detalle: { etiqueta: { nombre: string | null; color: string | null } }
}

export async function leerConversacion(id: number): Promise<ConversacionChat> {
  const datos = await solicitar(`/v1/conversacion/ver/${id}`, { method: 'GET', conToken: true })
  const { conversacion, cliente, app, detalle } = datos.data as DetalleConversacion
  return {
    id: Number(conversacion.id),
    id_app: Number(conversacion.id_app),
    id_estado: Number(conversacion.id_estado),
    telefono: cliente.telefono,
    nombre_cliente: cliente.nombre,
    apellido_cliente: cliente.apellido,
    nombre_completo_cliente: cliente.nombre_completo,
    nombre_app: app.nombre,
    etiqueta_nombre: detalle.etiqueta.nombre,
    etiqueta_color: detalle.etiqueta.color,
    mensajes_no_leidos: 0,
    texto_ultimo_mensaje: null,
    ultimo_mensaje_fecha: null,
    ultimo_mensaje_contesta: null,
  }
}

export async function leerContadoresChat(): Promise<ContadoresChat> {
  const datos = await solicitar('/v1/conversacion/contadores-sidebar', { method: 'GET', conToken: true })
  return datos.data as ContadoresChat
}

export async function leerMensajes(idConversacion: number): Promise<MensajeChat[]> {
  const datos = await solicitar(`/v1/mensaje/listar-conversacion/${idConversacion}`, { method: 'GET', conToken: true })
  return Array.isArray(datos.mensajes) ? (datos.mensajes as MensajeChat[]) : []
}

export async function abrirChat(idConversacion: number): Promise<void> {
  await solicitar(`/v1/conversacion/abrir/${idConversacion}`, { method: 'PUT', conToken: true })
}

export async function enviarMensaje(idConversacion: number, mensaje: string, archivo?: File): Promise<void> {
  if (!archivo) {
    await solicitar('/v1/mensaje/enviar', { method: 'POST', cuerpo: { id_conversacion: idConversacion, mensaje }, conToken: true })
    return
  }
  const formulario = new FormData()
  formulario.append('id_conversacion', String(idConversacion))
  formulario.append('file', archivo)
  if (mensaje.trim() !== '') {
    formulario.append('mensaje', mensaje.trim())
  }
  await solicitar('/v1/mensaje/enviar', { method: 'POST', formulario, conToken: true })
}

export async function leerPlantillasWhatsapp(idApp: number): Promise<PlantillaWhatsapp[]> {
  const datos = await solicitar(`/v1/plantilla/listar-activas?id_app=${idApp}`, { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as PlantillaWhatsapp[]) : []
}

export async function enviarPlantilla(idConversacion: number, plantilla: PlantillaWhatsapp, variables: string[]): Promise<void> {
  await solicitar('/v1/mensaje/enviar-plantilla', {
    method: 'POST',
    cuerpo: {
      id_conversacion: idConversacion,
      template_id: plantilla.id,
      template_name: plantilla.name,
      language: plantilla.language,
      parameters: variables.map((valor) => ({ type: 'text', text: valor })),
    },
    conToken: true,
  })
}

export async function leerRespuestasRapidas(): Promise<RespuestaRapida[]> {
  const datos = await solicitar('/v1/plantilla-rapida/listar-por-usuario?page=1&perPage=100', { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as RespuestaRapida[]) : []
}

export async function leerMotivosCierre(): Promise<MotivoCierre[]> {
  const datos = await solicitar('/v1/motivo-conversacion/listar', { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as MotivoCierre[]) : []
}

export async function finalizarChat(idConversacion: number, idMotivo: number): Promise<void> {
  await solicitar(`/v1/conversacion/finalizar/${idConversacion}`, { method: 'PUT', cuerpo: { id_motivo: idMotivo }, conToken: true })
}

export type NumeroWhatsapp = {
  id: number
  nombre: string
  telefono: string
  phone_number_id: string
  whatsapp_business_account_id: string
  tiene_token: boolean
  verificado: boolean
  verificado_at: string | null
}

export type EstadoWhatsapp = {
  conectado: boolean
  pasos: { app_meta: boolean; webhook: boolean; numero: boolean }
  app_meta: { meta_app_id: string | null; tiene_app_secret: boolean }
  webhook: {
    url: string
    verify_token: string
    url_configurada: boolean
    url_https: boolean
    verificado_at: string | null
    ultimo_evento_at: string | null
  }
  numeros: NumeroWhatsapp[]
}

export type DatosNumeroWhatsapp = {
  nombre: string
  phone_number_id: string
  whatsapp_business_account_id: string
  access_token: string
}

const RUTA_WHATSAPP = '/v1/integraciones/whatsapp'

export async function leerWhatsappConectado(): Promise<boolean> {
  const datos = await solicitar(`${RUTA_WHATSAPP}/conectado`, { method: 'GET', conToken: true })
  return Boolean((datos.data as { conectado?: boolean } | undefined)?.conectado)
}

export async function leerEstadoWhatsapp(): Promise<EstadoWhatsapp> {
  const datos = await solicitar(RUTA_WHATSAPP, { method: 'GET', conToken: true })
  return datos.data as EstadoWhatsapp
}

export async function guardarAppMeta(metaAppId: string, appSecret: string): Promise<EstadoWhatsapp> {
  const datos = await solicitar(`${RUTA_WHATSAPP}/app-meta`, {
    method: 'PUT',
    cuerpo: { meta_app_id: metaAppId, app_secret: appSecret },
    conToken: true,
  })
  return datos.data as EstadoWhatsapp
}

export async function regenerarTokenWebhook(): Promise<EstadoWhatsapp> {
  const datos = await solicitar(`${RUTA_WHATSAPP}/regenerar-token`, { method: 'POST', conToken: true })
  return datos.data as EstadoWhatsapp
}

export async function desconectarWhatsapp(): Promise<EstadoWhatsapp> {
  const datos = await solicitar(RUTA_WHATSAPP, { method: 'DELETE', conToken: true })
  return datos.data as EstadoWhatsapp
}

export async function conectarNumeroWhatsapp(numero: DatosNumeroWhatsapp): Promise<EstadoWhatsapp> {
  const datos = await solicitar(`${RUTA_WHATSAPP}/numeros`, { method: 'POST', cuerpo: numero, conToken: true })
  return datos.data as EstadoWhatsapp
}

export async function desconectarNumeroWhatsapp(id: number): Promise<EstadoWhatsapp> {
  const datos = await solicitar(`${RUTA_WHATSAPP}/numeros/${id}`, { method: 'DELETE', conToken: true })
  return datos.data as EstadoWhatsapp
}

export type TipoPaso =
  | 'inicio'
  | 'mensaje'
  | 'botones'
  | 'lista'
  | 'pregunta'
  | 'condicion'
  | 'horario'
  | 'variable'
  | 'asesor'
  | 'fin'
  | 'espera'
  | 'ubicacion'
  | 'temperatura'
  | 'dividir'

export type DatosPaso = Record<string, unknown>

export type PasoFlujo = {
  id: string
  tipo: TipoPaso
  x: number
  y: number
  datos: DatosPaso
}

export type ConexionFlujo = {
  id: string
  desde: string
  salida: string
  hacia: string
}

export type DefinicionFlujo = {
  nodos: PasoFlujo[]
  conexiones: ConexionFlujo[]
}

export type ResumenFlujo = {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  pasos: number
  disparador: { tipo: string; palabras: string[]; audiencia: 'nuevos' | 'todos'; repetir: 'una_vez' | 'cada_horas' | 'siempre' }
  conversaciones_activas: number
  estadisticas: { total: number; derivadas: number; terminadas: number }
  equipo: { reparto: 'mantener' | 'equitativo' | 'menos_carga'; asesores: number }
  actualizado: string | null
}

export type Flujo = {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  definicion: DefinicionFlujo
  actualizado: string | null
  pausado_por_errores?: boolean
}

export type ProblemaFlujo = { nodo: string | null; mensaje: string }

export type RevisionFlujo = { errores: ProblemaFlujo[]; avisos: ProblemaFlujo[] }

export type MensajeBot =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'imagen'; url: string; texto: string }
  | { tipo: 'video'; url: string; texto: string }
  | { tipo: 'audio'; url: string }
  | { tipo: 'documento'; url: string; nombre: string }
  | { tipo: 'ubicacion'; latitud: number; longitud: number; nombre: string; direccion: string }
  | { tipo: 'pausa'; segundos: number }
  | { tipo: 'espera'; segundos: number }
  | { tipo: 'botones'; texto: string; botones: { id: string; titulo: string }[] }
  | { tipo: 'lista'; texto: string; boton: string; opciones: { id: string; titulo: string; descripcion: string }[] }
  | { tipo: 'asignar'; modo: 'mantener' | 'elegir' | 'equitativo' | 'menos_carga'; asesor_id: number; equipo: number[] }
  | { tipo: 'temperatura'; valor: 'frio' | 'tibio' | 'caliente' }

export type EstadoBot = {
  estado: 'activa' | 'esperando' | 'terminada' | 'derivada'
  nodo: string | null
  variables: Record<string, string>
  intentos: number
  /** Segundos que faltan para que el flujo siga solo (espera o cliente que no responde). */
  reanudar_en?: number | null
}

export type ResultadoSimulacion = { mensajes: MensajeBot[]; estado: EstadoBot }

const RUTA_FLUJOS = '/v1/flujos'

export async function listarFlujos(): Promise<ResumenFlujo[]> {
  const datos = await solicitar(RUTA_FLUJOS, { method: 'GET', conToken: true })
  return (datos.data as ResumenFlujo[] | undefined) ?? []
}

export async function leerFlujo(id: number): Promise<Flujo> {
  const datos = await solicitar(`${RUTA_FLUJOS}/${id}`, { method: 'GET', conToken: true })
  return datos.data as Flujo
}

export async function crearFlujo(nombre: string, descripcion: string): Promise<Flujo> {
  const datos = await solicitar(RUTA_FLUJOS, { method: 'POST', cuerpo: { nombre, descripcion }, conToken: true })
  return datos.data as Flujo
}

export async function guardarFlujo(
  id: number,
  cambios: { nombre?: string; descripcion?: string; definicion?: DefinicionFlujo },
): Promise<Flujo> {
  const datos = await solicitar(`${RUTA_FLUJOS}/${id}`, { method: 'PUT', cuerpo: cambios, conToken: true })
  return datos.data as Flujo
}

export async function cambiarEstadoFlujo(id: number, activo: boolean): Promise<Flujo> {
  const datos = await solicitar(`${RUTA_FLUJOS}/${id}/estado`, { method: 'PUT', cuerpo: { activo }, conToken: true })
  return datos.data as Flujo
}

export async function duplicarFlujo(id: number): Promise<Flujo> {
  const datos = await solicitar(`${RUTA_FLUJOS}/${id}/duplicar`, { method: 'POST', conToken: true })
  return datos.data as Flujo
}

export async function eliminarFlujo(id: number): Promise<void> {
  await solicitar(`${RUTA_FLUJOS}/${id}`, { method: 'DELETE', conToken: true })
}

export async function revisarFlujo(definicion: DefinicionFlujo): Promise<RevisionFlujo> {
  const datos = await solicitar(`${RUTA_FLUJOS}/validar`, { method: 'POST', cuerpo: { definicion }, conToken: true })
  return datos.data as RevisionFlujo
}

export async function simularFlujo(cuerpo: {
  definicion: DefinicionFlujo
  estado?: EstadoBot
  entrada?: { texto?: string; respuesta_id?: string; reanudar?: boolean }
  nombre?: string
}): Promise<ResultadoSimulacion> {
  const datos = await solicitar(`${RUTA_FLUJOS}/simular`, { method: 'POST', cuerpo, conToken: true })
  return datos.data as ResultadoSimulacion
}

export type AsesorFlujo = { id: number; nombre: string; chats_abiertos: number }

/** Personas de la empresa que pueden atender chats (para elegirlas en el reparto). */
export async function listarAsesoresFlujo(): Promise<AsesorFlujo[]> {
  const datos = await solicitar(`${RUTA_FLUJOS}/asesores`, { method: 'GET', conToken: true })
  return (datos.data as AsesorFlujo[] | undefined) ?? []
}

export type ResumenBot = {
  flujo: string
  estado: 'activa' | 'esperando' | 'terminada' | 'derivada'
  ruta: string[]
  datos: { clave: string; valor: string }[]
  actualizado: string | null
}

/** Lo que el bot recogió en una conversación (null si el bot no participó). */
export async function leerResumenBot(idConversacion: number): Promise<ResumenBot | null> {
  const datos = await solicitar(`/v1/bot/conversaciones/${idConversacion}/resumen`, { method: 'GET', conToken: true })
  return (datos.data as ResumenBot | null | undefined) ?? null
}

export type TipoArchivoFlujo = 'imagen' | 'video' | 'audio' | 'documento'

export type ArchivoSubido = { url: string; nombre: string; tipo: TipoArchivoFlujo; tamano: number }

export async function subirArchivoFlujo(archivo: File, tipo: TipoArchivoFlujo): Promise<ArchivoSubido> {
  const formulario = new FormData()
  formulario.append('archivo', archivo)
  formulario.append('tipo', tipo)
  const datos = await solicitar(`${RUTA_FLUJOS}/archivos`, { method: 'POST', formulario, conToken: true })
  return datos.data as ArchivoSubido
}

type Opciones = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  cuerpo?: object
  formulario?: FormData
  conToken?: boolean
}

async function solicitar(ruta: string, { method, cuerpo, formulario, conToken = false }: Opciones): Promise<Respuesta> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (cuerpo) {
    headers['Content-Type'] = 'application/json'
  }
  const token = conToken ? leerSesion()?.token : undefined
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const respuesta = await fetch(`${BASE}${ruta}`, {
    method,
    headers,
    body: formulario ?? (cuerpo ? JSON.stringify(cuerpo) : undefined),
  })

  const datos = (await respuesta.json().catch(() => null)) as Respuesta | null
  if (!respuesta.ok || datos?.success === false) {
    throw new Error(mensajeError(datos) || 'No se pudo completar la solicitud.')
  }
  return datos ?? {}
}

function mensajeError(datos: Respuesta | null): string {
  if (!datos) {
    return ''
  }
  if (typeof datos.messages === 'string') {
    return datos.messages
  }
  if (typeof datos.data === 'string' && datos.data.trim() !== '') {
    return datos.data
  }
  return datos.messages?.error || datos.message || datos.error || ''
}
