import { expulsarPorTokenVencido, leerSesion, type Sesion } from '@/sesion'

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
  codigo_pais: string
  celular: string
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
  aviso?: string | null
}

export async function entrar(identificador: string, password: string): Promise<Sesion> {
  const cuerpo = identificador.includes('@')
    ? { correo: identificador, password }
    : { username: identificador, password }
  const datos = await solicitar('/v1/auth/login', { method: 'POST', cuerpo })
  if (!datos.token || !datos.usuario) {
    throw new Error('No se pudo iniciar sesión.')
  }
  return { token: datos.token, usuario: datos.usuario }
}

export async function registrar(datos: DatosRegistro): Promise<void> {
  await solicitar('/v1/auth/registro', { method: 'POST', cuerpo: datos })
}

export type DestinoAviso = {
  id: number
  nombre: string
  foto: string | null
  admin: boolean
}

export type PerfilCuenta = {
  nombres: string
  apellidos: string
  correo: string
  celular: string
  foto: string | null
  usuario: string
  empresa: { nombre: string; correo: string; id_aviso_ia: number | null; modo_ahorro?: boolean }
  destinos_aviso?: DestinoAviso[]
}

export async function leerPerfil(): Promise<PerfilCuenta> {
  const datos = await solicitar('/v1/perfil', { method: 'GET', conToken: true })
  return datos.data as PerfilCuenta
}

export async function guardarPerfil(cuerpo: {
  nombres: string
  apellidos: string
  correo: string
  celular: string
  password_actual?: string
  password_nueva?: string
}): Promise<PerfilCuenta> {
  const datos = await solicitar('/v1/perfil', { method: 'PUT', cuerpo, conToken: true })
  return datos.data as PerfilCuenta
}

export async function subirFotoPerfil(archivo: File): Promise<PerfilCuenta> {
  const formulario = new FormData()
  formulario.append('foto', archivo)
  const datos = await solicitar('/v1/perfil/foto', { method: 'POST', formulario, conToken: true })
  return datos.data as PerfilCuenta
}

export async function guardarEmpresaPerfil(cuerpo: {
  nombre: string
  correo: string
  id_aviso_ia?: number | null
  modo_ahorro?: boolean
}): Promise<PerfilCuenta> {
  const datos = await solicitar('/v1/perfil/empresa', { method: 'PUT', cuerpo, conToken: true })
  return datos.data as PerfilCuenta
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
  id_usuario?: number | null
  usuario_es_bot?: number | string | null
  id_cliente: number | null
  telefono: string | null
  nombre_cliente: string | null
  apellido_cliente: string | null
  nombre_completo_cliente: string | null
  nombre_app: string | null
  etiqueta_nombre: string | null
  etiqueta_color: string | null
  etapa_nombre: string | null
  etapa_color: string | null
  tipo_nombre: string | null
  tipo_color: string | null
  mensajes_no_leidos: number
  texto_ultimo_mensaje: string | null
  ultimo_mensaje_fecha: string | null
  ultimo_mensaje_contesta: 'cliente' | 'usuario' | 'bot' | null
}

export type FiltrosChat = {
  id_etapa?: number | null
  id_tipo?: number | null
  id_etiqueta_cliente?: number | null
}

export type InteractivoChat = {
  tipo: 'botones' | 'lista'
  boton?: string
  opciones: { titulo: string; descripcion?: string }[]
}

export type AutorMensaje = {
  id: number
  nombre: string
  foto: string | null
}

export type MensajeChat = {
  id: number
  id_conversacion: number
  id_estado: number
  mensaje: string | null
  contesta: 'cliente' | 'usuario' | 'bot'
  id_usuario?: number | null
  autor?: AutorMensaje | null
  media_type: string | null
  media_url: string | null
  cod_error: string | null
  created_at: string
  id_mensaje_whatsapp?: string | null
  mensaje_responde_contenido?: { id?: number; mensaje: string | null; contesta: string; media_type: string | null } | null
  /** Botones o lista que envió el bot (se dibujan igual que en WhatsApp). */
  interactivo?: InteractivoChat
  pendiente?: boolean
}

export type ComponentePlantilla = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: string
  text?: string
  example?: { header_handle?: string | string[]; header_text?: string[] }
  buttons?: { type: string; text?: string; url?: string }[]
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
  imagen_url?: string | null
}

export type MotivoCierre = {
  id: number
  nombre: string
  color?: string
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

export async function leerChats(bandeja: BandejaChat, busqueda: string, filtros: FiltrosChat = {}): Promise<ConversacionChat[]> {
  const parametros = new URLSearchParams({ page: '1' })
  if (busqueda.trim() !== '') {
    parametros.set('search', busqueda.trim())
  }
  if (filtros.id_etapa) parametros.set('id_etapa', String(filtros.id_etapa))
  if (filtros.id_tipo !== undefined && filtros.id_tipo !== null) parametros.set('id_tipo', String(filtros.id_tipo))
  if (filtros.id_etiqueta_cliente) parametros.set('id_etiqueta_cliente', String(filtros.id_etiqueta_cliente))
  const datos = await solicitar(`${RUTAS_BANDEJA[bandeja]}?${parametros}`, { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as ConversacionChat[]) : []
}

type DetalleConversacion = {
  conversacion: { id: number; id_app: number; id_estado: number; id_usuario?: number | null }
  usuario?: { id: number | null; es_bot?: number }
  cliente: { id: number | null; nombre: string | null; apellido: string | null; nombre_completo: string | null; telefono: string | null }
  app: { nombre: string | null }
  detalle: { etiqueta: { nombre: string | null; color: string | null } }
}

export async function leerDestinoAviso(id: number): Promise<{
  id_usuario: number | null
  es_bot: boolean
  nombre: string | null
}> {
  const datos = await solicitar(`/v1/conversacion/ver/${id}`, { method: 'GET', conToken: true })
  const cuerpo = datos.data as DetalleConversacion
  return {
    id_usuario: cuerpo.usuario?.id ?? cuerpo.conversacion.id_usuario ?? null,
    es_bot: Number(cuerpo.usuario?.es_bot) === 1,
    nombre: cuerpo.cliente.nombre_completo || cuerpo.cliente.nombre || null,
  }
}

export async function leerConversacion(id: number): Promise<ConversacionChat> {
  const datos = await solicitar(`/v1/conversacion/ver/${id}`, { method: 'GET', conToken: true })
  const { conversacion, cliente, app, detalle, usuario } = datos.data as DetalleConversacion
  return {
    id: Number(conversacion.id),
    id_app: Number(conversacion.id_app),
    id_estado: Number(conversacion.id_estado),
    id_usuario: usuario?.id ?? conversacion.id_usuario ?? null,
    usuario_es_bot: usuario?.es_bot ?? null,
    id_cliente: cliente.id ? Number(cliente.id) : null,
    telefono: cliente.telefono,
    nombre_cliente: cliente.nombre,
    apellido_cliente: cliente.apellido,
    nombre_completo_cliente: cliente.nombre_completo,
    nombre_app: app.nombre,
    etiqueta_nombre: detalle.etiqueta.nombre,
    etiqueta_color: detalle.etiqueta.color,
    etapa_nombre: null,
    etapa_color: null,
    tipo_nombre: null,
    tipo_color: null,
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

export type StickerTienda = {
  id: string
  titulo: string
  preview: string
  url: string
}

export async function leerStickers(busqueda = ''): Promise<{ lista: StickerTienda[]; aviso: string | null }> {
  const parametros = new URLSearchParams()
  if (busqueda.trim() !== '') {
    parametros.set('q', busqueda.trim())
  }
  const datos = await solicitar(`/v1/mensaje/stickers?${parametros}`, { method: 'GET', conToken: true })
  return {
    lista: Array.isArray(datos.data) ? (datos.data as StickerTienda[]) : [],
    aviso: typeof datos.aviso === 'string' ? datos.aviso : null,
  }
}

export async function leerMensajes(idConversacion: number): Promise<MensajeChat[]> {
  const datos = await solicitar(`/v1/mensaje/listar-conversacion/${idConversacion}`, { method: 'GET', conToken: true })
  return Array.isArray(datos.mensajes) ? (datos.mensajes as MensajeChat[]) : []
}

export async function abrirChat(idConversacion: number): Promise<void> {
  await solicitar(`/v1/conversacion/abrir/${idConversacion}`, { method: 'PUT', conToken: true })
}

export type ExtraMensaje = {
  idMensajeResponde?: string
  tipo?: 'sticker' | 'location' | 'audio'
  latitude?: number
  longitude?: number
  name?: string
  address?: string
}

export async function enviarMensaje(
  idConversacion: number,
  mensaje: string,
  archivo?: File,
  extra?: ExtraMensaje | string,
): Promise<void> {
  const datos: ExtraMensaje = typeof extra === 'string' ? { idMensajeResponde: extra } : extra ?? {}

  if (datos.tipo === 'location' && datos.latitude != null && datos.longitude != null) {
    await solicitar('/v1/mensaje/enviar', {
      method: 'POST',
      cuerpo: {
        id_conversacion: idConversacion,
        media_type: 'location',
        latitude: String(datos.latitude),
        longitude: String(datos.longitude),
        name: datos.name ?? 'Ubicación',
        address: datos.address ?? '',
        ...(datos.idMensajeResponde ? { id_mensaje_responde: datos.idMensajeResponde } : {}),
      },
      conToken: true,
    })
    return
  }

  if (!archivo) {
    await solicitar('/v1/mensaje/enviar', {
      method: 'POST',
      cuerpo: {
        id_conversacion: idConversacion,
        mensaje,
        ...(datos.idMensajeResponde ? { id_mensaje_responde: datos.idMensajeResponde } : {}),
      },
      conToken: true,
    })
    return
  }
  const formulario = new FormData()
  formulario.append('id_conversacion', String(idConversacion))
  formulario.append('file', archivo)
  if (mensaje.trim() !== '') {
    formulario.append('mensaje', mensaje.trim())
  }
  if (datos.idMensajeResponde) {
    formulario.append('id_mensaje_responde', datos.idMensajeResponde)
  }
  if (datos.tipo) {
    formulario.append('media_type', datos.tipo)
  } else if (archivo.type.startsWith('audio/') || archivo.name.toLowerCase().includes('nota-de-voz')) {
    formulario.append('media_type', 'audio')
  } else if (archivo.type.startsWith('video/')) {
    formulario.append('media_type', 'video')
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

export async function guardarRespuestaRapida(
  datos: { nombre: string; contenido: string; imagen?: File; quitarImagen?: boolean },
  id?: number,
): Promise<RespuestaRapida> {
  const formulario = new FormData()
  formulario.append('nombre', datos.nombre)
  formulario.append('contenido', datos.contenido)
  if (datos.imagen) formulario.append('imagen', datos.imagen)
  if (datos.quitarImagen) formulario.append('eliminar_imagen', '1')
  const ruta = id ? `/v1/plantilla-rapida/editar/${id}` : '/v1/plantilla-rapida/crear'
  const respuesta = await solicitar(ruta, { method: 'POST', formulario, conToken: true })
  return respuesta.data as RespuestaRapida
}

export async function eliminarRespuestaRapida(id: number): Promise<void> {
  await solicitar(`/v1/plantilla-rapida/eliminar/${id}`, { method: 'DELETE', conToken: true })
}

export async function leerMotivosCierre(): Promise<MotivoCierre[]> {
  const datos = await solicitar('/v1/motivo-conversacion/listar', { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as MotivoCierre[]) : []
}

export async function finalizarChat(idConversacion: number, idMotivo: number): Promise<void> {
  await solicitar(`/v1/conversacion/finalizar/${idConversacion}`, { method: 'PUT', cuerpo: { id_motivo: idMotivo }, conToken: true })
}

export type EstadoSupervision = 'activos' | 'sin_responder' | 'finalizados'

export type ConversacionSupervision = ConversacionChat & {
  id_usuario: number | null
  asesor_nombre: string | null
  asesor_usuario: string | null
  asesor_foto: string | null
  usuario_es_bot: number | string | null
}

export type FiltrosSupervision = { estado: EstadoSupervision; idUsuario: number | null; busqueda: string }

export async function leerSupervision({ estado, idUsuario, busqueda }: FiltrosSupervision): Promise<ConversacionSupervision[]> {
  const parametros = new URLSearchParams({ page: '1', estado })
  if (idUsuario) {
    parametros.set('id_usuario', String(idUsuario))
  }
  if (busqueda.trim() !== '') {
    parametros.set('search', busqueda.trim())
  }
  const datos = await solicitar(`/v1/conversacion/supervision?${parametros}`, { method: 'GET', conToken: true })
  return Array.isArray(datos.data) ? (datos.data as ConversacionSupervision[]) : []
}

export async function transferirChat(idConversacion: number, idUsuarioDestino: number): Promise<void> {
  await solicitar(`/v1/conversacion/transferir/${idConversacion}`, {
    method: 'PUT',
    cuerpo: { id_usuario_destino: idUsuarioDestino },
    conToken: true,
  })
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

export type CategoriaCostoWhatsapp = {
  categoria: string
  tipo: string
  volumen: number
  costo: number
}

export type DiaCostoWhatsapp = {
  fecha: string
  gratis: number
  cobrados: number
  costo: number
}

export type CostosWhatsapp = {
  numero: string
  nombre: string
  mes: string
  cupo: number
  usados_gratis: number
  restantes: number
  cobrados: number
  costo_usd: number
  categorias: CategoriaCostoWhatsapp[]
  dias: DiaCostoWhatsapp[]
  aviso: string | null
  fuente: 'meta' | 'local' | 'entregas'
  actualizado_at?: string | null
  modo_ahorro?: boolean
}

export type ModoEmpresa = {
  modo_ahorro: boolean
}

export async function leerModoEmpresa(): Promise<ModoEmpresa> {
  const datos = await solicitar('/v1/empresa/modo', { method: 'GET', conToken: true })
  return datos.data as ModoEmpresa
}

export async function guardarModoEmpresa(modo_ahorro: boolean): Promise<ModoEmpresa> {
  const datos = await solicitar('/v1/empresa/modo', { method: 'PUT', cuerpo: { modo_ahorro }, conToken: true })
  return datos.data as ModoEmpresa
}

export async function leerCostosWhatsapp(): Promise<CostosWhatsapp> {
  const datos = await solicitar(`${RUTA_WHATSAPP}/costos`, { method: 'GET', conToken: true })
  return datos.data as CostosWhatsapp
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
  | 'formulario'
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
  mensajes?: number
  disparador: { tipo: string; palabras: string[]; audiencia: 'nuevos' | 'todos'; repetir: 'una_vez' | 'cada_horas' | 'siempre' }
  conversaciones_activas: number
  estadisticas: { total: number; derivadas: number; terminadas: number }
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
  | { tipo: 'asignar'; modo: 'mantener' | 'elegir'; asesor_id: number }
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

export async function cambiarEstadoFlujo(id: number, activo: boolean, forzar = false): Promise<Flujo> {
  const datos = await solicitar(`${RUTA_FLUJOS}/${id}/estado`, { method: 'PUT', cuerpo: { activo, forzar }, conToken: true })
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

const RUTA_ASESORES = '/v1/asesores'

export type Asesor = {
  id: number
  usuario: string
  nombre: string
  correo: string | null
  celular: string | null
  foto: string | null
  rol: string | null
  estado: string | null
  activo: boolean
  chats_abiertos: number
  creado: string | null
}

export type DatosAsesor = {
  nombres: string
  apellidos: string
  usuario: string
  password: string
  correo: string
  celular: string
}

export async function leerAsesores(): Promise<Asesor[]> {
  const datos = await solicitar(RUTA_ASESORES, { method: 'GET', conToken: true })
  return (datos.data as Asesor[] | undefined) ?? []
}

export async function crearAsesor(datos: DatosAsesor): Promise<Asesor> {
  const respuesta = await solicitar(RUTA_ASESORES, { method: 'POST', cuerpo: datos, conToken: true })
  return respuesta.data as Asesor
}

export async function cambiarEstadoAsesor(id: number, activo: boolean): Promise<Asesor> {
  const respuesta = await solicitar(`${RUTA_ASESORES}/${id}/estado`, { method: 'PUT', cuerpo: { activo }, conToken: true })
  return respuesta.data as Asesor
}

export async function subirFotoAsesor(id: number, archivo: File): Promise<Asesor> {
  const formulario = new FormData()
  formulario.append('foto', archivo)
  const respuesta = await solicitar(`${RUTA_ASESORES}/${id}/foto`, { method: 'POST', formulario, conToken: true })
  return respuesta.data as Asesor
}

const RUTA_REPARTO = '/v1/reparto'

export type EstrategiaReparto = 'equitativo' | 'rotativo' | 'menos_carga' | 'prioridad'

export type TipoNodoReparto =
  | 'inicio'
  | 'asesor_previo'
  | 'horario'
  | 'cliente'
  | 'origen'
  | 'palabras'
  | 'dividir'
  | 'turnos_grupos'
  | 'repartir'
  | 'persona'
  | 'agente_ia'

export type TramoHorario = { id: string; nombre: string; dias: number[]; desde: string; hasta: string }

export type NodoReparto = {
  id: string
  tipo: TipoNodoReparto
  x: number
  y: number
  datos: Record<string, unknown>
}

export type ConexionReparto = { id: string; desde: string; salida: string; hacia: string }

export type DefinicionReparto = { nodos: NodoReparto[]; conexiones: ConexionReparto[] }

export type ProblemaReparto = { nodo: string | null; mensaje: string }

export type RevisionReparto = { errores: ProblemaReparto[]; avisos: ProblemaReparto[] }

export type TipoGrupoAtencion = 'general' | 'turno'

export type GrupoAtencion = {
  id: number
  nombre: string
  descripcion: string | null
  color: string
  tipo: TipoGrupoAtencion
  turno_dias: number[]
  turno_desde: string | null
  turno_hasta: string | null
  miembros: number[]
}

export type DatosGrupoAtencion = {
  nombre: string
  descripcion: string
  color: string
  tipo: TipoGrupoAtencion
  turno_dias: number[]
  turno_desde: string
  turno_hasta: string
  miembros: number[]
}

export type ResumenAgente = { id: number; nombre: string; activo: boolean; listo: boolean }

export type RepartoCompleto = {
  definicion: DefinicionReparto
  revision: RevisionReparto
  grupos: GrupoAtencion[]
  asesores: { id: number; nombre: string; activo: boolean }[]
  personas: { id: number; nombre: string; es_admin: boolean }[]
  agentes: ResumenAgente[]
}

export type PruebaReparto = {
  cliente: 'nuevo' | 'recurrente'
  origen: 'anuncio' | 'directo'
  texto: string
  cuando: string
  definicion?: DefinicionReparto
}

export type ResultadoPrueba = {
  tipo: 'asesor' | 'agente' | 'ninguno'
  id_usuario: number | null
  id_agente: number | null
  nombre: string | null
  nodo: string | null
  motivo: 'asesor_previo' | 'repartir' | 'persona' | 'agente' | 'respaldo' | 'nadie'
  grupo_reparto?: string | null
  ruta: string[]
  pasos: string[]
}

export async function leerReparto(): Promise<RepartoCompleto> {
  const respuesta = await solicitar(RUTA_REPARTO, { method: 'GET', conToken: true })
  return respuesta.data as RepartoCompleto
}

export async function guardarReparto(definicion: DefinicionReparto): Promise<{ definicion: DefinicionReparto; revision: RevisionReparto }> {
  const respuesta = await solicitar(RUTA_REPARTO, { method: 'PUT', cuerpo: { definicion }, conToken: true })
  return respuesta.data as { definicion: DefinicionReparto; revision: RevisionReparto }
}

export async function revisarReparto(definicion: DefinicionReparto): Promise<RevisionReparto> {
  const respuesta = await solicitar(`${RUTA_REPARTO}/revisar`, { method: 'POST', cuerpo: { definicion }, conToken: true })
  return respuesta.data as RevisionReparto
}

export async function probarReparto(datos: PruebaReparto): Promise<ResultadoPrueba> {
  const respuesta = await solicitar(`${RUTA_REPARTO}/probar`, { method: 'POST', cuerpo: datos, conToken: true })
  return respuesta.data as ResultadoPrueba
}

export async function leerGruposAtencion(): Promise<GrupoAtencion[]> {
  const respuesta = await solicitar(`${RUTA_REPARTO}/grupos`, { method: 'GET', conToken: true })
  return (respuesta.data as GrupoAtencion[] | undefined) ?? []
}

export async function guardarGrupoAtencion(datos: DatosGrupoAtencion, id?: number): Promise<GrupoAtencion> {
  const respuesta = await solicitar(id ? `${RUTA_REPARTO}/grupos/${id}` : `${RUTA_REPARTO}/grupos`, {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return respuesta.data as GrupoAtencion
}

export async function eliminarGrupoAtencion(id: number): Promise<void> {
  await solicitar(`${RUTA_REPARTO}/grupos/${id}`, { method: 'DELETE', conToken: true })
}

const RUTA_IA = '/v1/ia'

export type TonoAgente = 'amable' | 'formal' | 'directo' | 'divertido'

export type ConexionIa = { conectada: boolean; pista: string | null; verificada_at: string | null }

export type AgenteIa = {
  id: number
  nombre: string
  activo: boolean
  modelo: string
  instrucciones: string
  tono: TonoAgente
  usar_catalogo: boolean
  max_respuestas: number
  palabras_traspaso: string[]
  mensaje_traspaso: string
  temperatura: number
}

export type ResumenAgenteIa = AgenteIa & { conocimientos: number; atendidos_hoy: number }

export type FichaConocimiento = { id: number; titulo: string; contenido: string; actualizado: string | null }

export type DetalleAgenteIa = AgenteIa & { conocimiento: FichaConocimiento[] }

export type DatosAgenteIa = Omit<AgenteIa, 'id'>

export type EstadoIa = { conexion: ConexionIa; agentes: ResumenAgenteIa[]; modelos: string[]; tonos: TonoAgente[] }

export type LineaCharla = { rol: 'cliente' | 'asistente'; texto: string }

export type RespuestaPruebaIa = { respuesta: string | null; traspaso: string | null }

export async function leerEstadoIa(): Promise<EstadoIa> {
  const respuesta = await solicitar(RUTA_IA, { method: 'GET', conToken: true })
  return respuesta.data as EstadoIa
}

export async function conectarOpenAi(apiKey: string): Promise<ConexionIa> {
  const respuesta = await solicitar(`${RUTA_IA}/conexion`, { method: 'PUT', cuerpo: { api_key: apiKey }, conToken: true })
  return respuesta.data as ConexionIa
}

export async function desconectarOpenAi(): Promise<void> {
  await solicitar(`${RUTA_IA}/conexion`, { method: 'DELETE', conToken: true })
}

export async function leerAgenteIa(id: number): Promise<DetalleAgenteIa> {
  const respuesta = await solicitar(`${RUTA_IA}/agentes/${id}`, { method: 'GET', conToken: true })
  return respuesta.data as DetalleAgenteIa
}

export async function guardarAgenteIa(datos: Partial<DatosAgenteIa>, id?: number): Promise<DetalleAgenteIa> {
  const respuesta = await solicitar(id ? `${RUTA_IA}/agentes/${id}` : `${RUTA_IA}/agentes`, {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return respuesta.data as DetalleAgenteIa
}

export async function eliminarAgenteIa(id: number): Promise<void> {
  await solicitar(`${RUTA_IA}/agentes/${id}`, { method: 'DELETE', conToken: true })
}

export async function guardarFichaConocimiento(
  idAgente: number,
  datos: { titulo: string; contenido: string },
  id?: number,
): Promise<FichaConocimiento[]> {
  const respuesta = await solicitar(id ? `${RUTA_IA}/agentes/${idAgente}/conocimiento/${id}` : `${RUTA_IA}/agentes/${idAgente}/conocimiento`, {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return (respuesta.data as FichaConocimiento[] | undefined) ?? []
}

export async function eliminarFichaConocimiento(idAgente: number, id: number): Promise<FichaConocimiento[]> {
  const respuesta = await solicitar(`${RUTA_IA}/agentes/${idAgente}/conocimiento/${id}`, { method: 'DELETE', conToken: true })
  return (respuesta.data as FichaConocimiento[] | undefined) ?? []
}

export async function probarAgenteIa(id: number, charla: LineaCharla[]): Promise<RespuestaPruebaIa> {
  const respuesta = await solicitar(`${RUTA_IA}/agentes/${id}/probar`, { method: 'POST', cuerpo: { charla }, conToken: true })
  return respuesta.data as RespuestaPruebaIa
}

const RUTA_CATALOGO = '/v1/catalogo'

export type FamiliaProducto = {
  id: number
  nombre: string
  descripcion: string | null
  orden: number
  activo: boolean
  total_productos: number
}

export type DetalleProducto = { nombre: string; valor: string }

export type Producto = {
  id: number
  id_familia: number | null
  familia: string | null
  nombre: string
  descripcion: string | null
  codigo: string | null
  precio: number | null
  moneda: string
  unidad: string | null
  imagen_url: string | null
  detalles: DetalleProducto[]
  activo: boolean
}

export type DatosFamilia = { nombre: string; descripcion: string }

export type DatosProducto = {
  nombre: string
  id_familia: number | null
  precio: string
  moneda: string
  unidad: string
  codigo: string
  descripcion: string
  imagen_url: string
  detalles: DetalleProducto[]
}

export async function leerFamilias(): Promise<FamiliaProducto[]> {
  const datos = await solicitar(`${RUTA_CATALOGO}/familias`, { method: 'GET', conToken: true })
  return (datos.data as FamiliaProducto[] | undefined) ?? []
}

export async function guardarFamilia(datos: DatosFamilia, id?: number): Promise<FamiliaProducto> {
  const respuesta = await solicitar(id ? `${RUTA_CATALOGO}/familias/${id}` : `${RUTA_CATALOGO}/familias`, {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return respuesta.data as FamiliaProducto
}

export async function eliminarFamilia(id: number): Promise<void> {
  await solicitar(`${RUTA_CATALOGO}/familias/${id}`, { method: 'DELETE', conToken: true })
}

export async function leerProductos(): Promise<Producto[]> {
  const datos = await solicitar(`${RUTA_CATALOGO}/productos`, { method: 'GET', conToken: true })
  return (datos.data as Producto[] | undefined) ?? []
}

export async function guardarProducto(datos: DatosProducto, id?: number): Promise<Producto> {
  const respuesta = await solicitar(id ? `${RUTA_CATALOGO}/productos/${id}` : `${RUTA_CATALOGO}/productos`, {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return respuesta.data as Producto
}

export async function cambiarEstadoProducto(id: number, activo: boolean): Promise<Producto> {
  const respuesta = await solicitar(`${RUTA_CATALOGO}/productos/${id}/estado`, { method: 'PUT', cuerpo: { activo }, conToken: true })
  return respuesta.data as Producto
}

export async function eliminarProducto(id: number): Promise<void> {
  await solicitar(`${RUTA_CATALOGO}/productos/${id}`, { method: 'DELETE', conToken: true })
}

export async function subirImagenProducto(archivo: File): Promise<string> {
  const formulario = new FormData()
  formulario.append('imagen', archivo)
  const respuesta = await solicitar(`${RUTA_CATALOGO}/productos/imagen`, { method: 'POST', formulario, conToken: true })
  return (respuesta.data as { url: string }).url
}

const RUTA_CRM = '/v1/crm'

export type ResultadoEtapa = 'abierta' | 'ganada' | 'perdida'

export type EtapaEmbudo = { id: number; nombre: string; color: string; orden: number; resultado: ResultadoEtapa; total_clientes: number }

export type TipoCliente = { id: number; nombre: string; color: string; orden: number; total_clientes: number }

export type EtiquetaCliente = { id: number; nombre: string; color: string; total_clientes?: number }

export type MotivoCierreCrm = { id: number; nombre: string; color: string; orden: number; total_conversaciones: number }

export type AjustesCrm = { etapas: EtapaEmbudo[]; tipos: TipoCliente[]; etiquetas: EtiquetaCliente[]; motivos: MotivoCierreCrm[] }

export type ClienteCrm = {
  id: number
  nombre: string
  nombres: string | null
  apellidos: string | null
  telefono: string | null
  correo: string | null
  distrito: string | null
  notas: string | null
  id_etapa: number | null
  id_tipo: number | null
  etiquetas: EtiquetaCliente[]
  asesor_nombre: string | null
  id_responsable: number | null
  origen: OrigenCliente
  id_conversacion: number | null
  conversacion_activa: boolean
  ultimo_mensaje_cliente: string | null
  ventana_abierta: boolean
  creado: string
}

export type OrigenCliente = 'whatsapp' | 'manual' | 'importado'

export type FichaCliente = ClienteCrm & {
  conversaciones: { id: number; id_estado: number; created_at: string; updated_at: string | null; asesor_nombre: string | null }[]
}

export type ColumnaEmbudo = EtapaEmbudo & { total: number; clientes: ClienteCrm[] }

export type FiltrosClientes = {
  q?: string
  id_etapa?: number | null
  id_tipo?: number | null
  id_etiqueta?: number | null
  ventana?: '' | 'abierta' | 'cerrada'
  /** Solo los clientes que atiende o atendió esa persona. */
  id_asesor?: number | null
}

export type CambiosCliente = Partial<{
  nombre: string
  apellido: string
  correo: string
  distrito: string
  notas: string
  id_etapa: number | null
  id_tipo: number | null
  etiquetas: number[]
}>

export type CambiosVarios = Partial<{ id_etapa: number | null; id_tipo: number | null; agregar_etiqueta: number; quitar_etiqueta: number }>

function parametrosFiltros(filtros: FiltrosClientes): URLSearchParams {
  const parametros = new URLSearchParams()
  if (filtros.q?.trim()) parametros.set('q', filtros.q.trim())
  if (filtros.id_etapa) parametros.set('id_etapa', String(filtros.id_etapa))
  if (filtros.id_tipo !== undefined && filtros.id_tipo !== null) parametros.set('id_tipo', String(filtros.id_tipo))
  if (filtros.id_etiqueta) parametros.set('id_etiqueta', String(filtros.id_etiqueta))
  if (filtros.ventana) parametros.set('ventana', filtros.ventana)
  if (filtros.id_asesor) parametros.set('id_asesor', String(filtros.id_asesor))
  return parametros
}

export async function leerAjustesCrm(): Promise<AjustesCrm> {
  const datos = await solicitar(`${RUTA_CRM}/ajustes`, { method: 'GET', conToken: true })
  const ajustes = datos.data as AjustesCrm
  return { ...ajustes, motivos: ajustes.motivos ?? [] }
}

export type DiasDashboard = 7 | 14 | 30

export type CuadrosDashboard = {
  sin_leer: number
  por_responder: number
  abiertos: number
  cerrados: number
  clientes: number
  nuevos: number
  ventana_abierta: number
  ganados: number
  perdidos: number
  equipo_activo?: number
  sin_asignar?: number
}

export type PuntoActividad = { fecha: string; recibidos: number; enviados: number; cerrados: number }

export type ParteDashboard = { id: number; nombre: string; color: string; total: number }

export type PendienteDashboard = {
  id: number
  nombre: string
  telefono: string | null
  preview: string | null
  fecha: string | null
  sin_leer: number
}

export type MiembroEquipoDashboard = {
  id: number
  nombre: string
  foto: string | null
  activo: boolean
  abiertos: number
  cerrados: number
  sin_leer: number
  clientes: number
}

export type DashboardCrm = {
  rol: 'admin' | 'asesor'
  dias: number
  cuadros: CuadrosDashboard
  actividad: PuntoActividad[]
  embudo: ParteDashboard[]
  tipos: ParteDashboard[]
  motivos: ParteDashboard[]
  pendientes: PendienteDashboard[]
  equipo: MiembroEquipoDashboard[]
}

export async function leerDashboard(dias: DiasDashboard): Promise<DashboardCrm> {
  const datos = await solicitar(`${RUTA_CRM}/dashboard?dias=${dias}`, { method: 'GET', conToken: true })
  return datos.data as DashboardCrm
}

export async function leerClientesCrm(filtros: FiltrosClientes, pagina: number, porPagina = 25): Promise<{ filas: ClienteCrm[]; total: number }> {
  const parametros = parametrosFiltros(filtros)
  parametros.set('page', String(pagina))
  parametros.set('perPage', String(porPagina))
  const datos = await solicitar(`${RUTA_CRM}/clientes?${parametros}`, { method: 'GET', conToken: true })
  const filas = (datos.data as ClienteCrm[] | undefined) ?? []
  return { filas, total: datos.pagination?.total ?? filas.length }
}

export async function leerEmbudo(filtros: FiltrosClientes): Promise<ColumnaEmbudo[]> {
  const datos = await solicitar(`${RUTA_CRM}/clientes/tablero?${parametrosFiltros(filtros)}`, { method: 'GET', conToken: true })
  return (datos.data as ColumnaEmbudo[] | undefined) ?? []
}

export async function leerFichaCliente(id: number): Promise<FichaCliente> {
  const datos = await solicitar(`${RUTA_CRM}/clientes/${id}`, { method: 'GET', conToken: true })
  return datos.data as FichaCliente
}

export async function actualizarClienteCrm(id: number, cambios: CambiosCliente): Promise<FichaCliente> {
  const datos = await solicitar(`${RUTA_CRM}/clientes/${id}`, { method: 'PUT', cuerpo: cambios, conToken: true })
  return datos.data as FichaCliente
}

export async function actualizarVariosClientes(ids: number[], cambios: CambiosVarios): Promise<number> {
  const datos = await solicitar(`${RUTA_CRM}/clientes/varios`, { method: 'POST', cuerpo: { ids, cambios }, conToken: true })
  return (datos.data as { actualizados: number }).actualizados
}

export type NuevoCliente = {
  telefono: string
  codigo_pais: string
  nombre?: string
  apellido?: string
  correo?: string
  distrito?: string
  notas?: string
  id_etapa?: number | null
  id_tipo?: number | null
  etiquetas?: number[]
  id_responsable?: number | null
  abrir_chat?: boolean
}

export async function crearClienteCrm(cliente: NuevoCliente): Promise<FichaCliente & { aviso?: string }> {
  const datos = await solicitar(`${RUTA_CRM}/clientes`, { method: 'POST', cuerpo: cliente, conToken: true })
  return datos.data as FichaCliente & { aviso?: string }
}

export async function iniciarChatCliente(id: number): Promise<{ id_conversacion: number; nueva: boolean }> {
  const datos = await solicitar(`${RUTA_CRM}/clientes/${id}/chat`, { method: 'POST', conToken: true })
  return datos.data as { id_conversacion: number; nueva: boolean }
}

export type CampoImportacion = 'telefono' | 'nombre' | 'apellido' | 'correo' | 'distrito' | 'etiquetas' | 'notas'

export type FilaImportacion = Partial<Record<CampoImportacion, string>> & { fila: number }

export type OpcionesImportacion = {
  codigo_pais: string
  duplicados: 'omitir' | 'actualizar'
  id_etapa?: number | null
  id_tipo?: number | null
  etiquetas?: number[]
  id_responsable?: number | null
}

export type ResultadoImportacion = {
  creados: number
  actualizados: number
  omitidos: number
  problemas: { fila: number; telefono: string; motivo: string }[]
}

export async function importarClientes(filas: FilaImportacion[], opciones: OpcionesImportacion): Promise<ResultadoImportacion> {
  const datos = await solicitar(`${RUTA_CRM}/clientes/importar`, { method: 'POST', cuerpo: { filas, opciones }, conToken: true })
  return datos.data as ResultadoImportacion
}

export type ClaseAjuste = 'etapas' | 'tipos' | 'etiquetas' | 'motivos'

export type DatosAjuste = { nombre: string; color: string; resultado?: ResultadoEtapa }

export async function guardarAjusteCrm<T>(clase: ClaseAjuste, datos: DatosAjuste, id?: number): Promise<T[]> {
  const respuesta = await solicitar(id ? `${RUTA_CRM}/${clase}/${id}` : `${RUTA_CRM}/${clase}`, {
    method: id ? 'PUT' : 'POST',
    cuerpo: datos,
    conToken: true,
  })
  return (respuesta.data as T[] | undefined) ?? []
}

export async function ordenarAjusteCrm<T>(clase: 'etapas' | 'tipos' | 'motivos', ids: number[]): Promise<T[]> {
  const respuesta = await solicitar(`${RUTA_CRM}/${clase}/orden`, { method: 'PUT', cuerpo: { ids }, conToken: true })
  return (respuesta.data as T[] | undefined) ?? []
}

export async function eliminarAjusteCrm<T>(clase: ClaseAjuste, id: number, moverA?: number): Promise<T[]> {
  const sufijo = moverA ? `?mover_a=${moverA}` : ''
  const respuesta = await solicitar(`${RUTA_CRM}/${clase}/${id}${sufijo}`, { method: 'DELETE', conToken: true })
  return (respuesta.data as T[] | undefined) ?? []
}

const RUTA_ENVIOS = '/v1/envios'

export type ModoEnvio = 'texto' | 'plantilla'

export type EstadoEnvio = 'enviando' | 'terminado' | 'cancelado'

export type EstadoDestinatario = 'pendiente' | 'enviando' | 'enviado' | 'fallido' | 'omitido'

export type PlantillaEnvio = { id: string; name: string; language: string; parametros: string[]; vista: string }

export type ResumenEnvio = {
  id: number
  nombre: string
  modo: ModoEnvio
  mensaje: string | null
  plantilla: PlantillaEnvio | null
  filtros: FiltrosClientes
  estado: EstadoEnvio
  creador: string | null
  creado: string
  terminado: string | null
  total: number
  resumen: { pendiente: number; enviado: number; fallido: number; omitido: number }
}

export type DestinatarioEnvio = {
  id: number
  id_cliente: number
  id_conversacion: number | null
  nombre: string
  telefono: string | null
  estado: EstadoDestinatario
  detalle: string | null
  enviado_at: string | null
}

export type DetalleEnvio = ResumenEnvio & { destinatarios: DestinatarioEnvio[] }

export type AudienciaEnvio = { total: number; en_ventana: number; fuera_ventana: number; bloqueados: number }

export type DatosEnvio = {
  nombre: string
  modo: ModoEnvio
  mensaje?: string
  plantilla?: PlantillaEnvio
  filtros: FiltrosClientes
}

export async function leerEnvios(): Promise<ResumenEnvio[]> {
  const datos = await solicitar(RUTA_ENVIOS, { method: 'GET', conToken: true })
  return (datos.data as ResumenEnvio[] | undefined) ?? []
}

export async function leerEnvio(id: number): Promise<DetalleEnvio> {
  const datos = await solicitar(`${RUTA_ENVIOS}/${id}`, { method: 'GET', conToken: true })
  return datos.data as DetalleEnvio
}

export async function leerAudienciaEnvio(filtros: FiltrosClientes): Promise<AudienciaEnvio> {
  const datos = await solicitar(`${RUTA_ENVIOS}/audiencia`, { method: 'POST', cuerpo: { filtros }, conToken: true })
  return datos.data as AudienciaEnvio
}

export async function leerPlantillasEnvio(): Promise<PlantillaWhatsapp[]> {
  const datos = await solicitar(`${RUTA_ENVIOS}/plantillas`, { method: 'GET', conToken: true })
  return (datos.data as PlantillaWhatsapp[] | undefined) ?? []
}

export async function crearEnvio(envio: DatosEnvio): Promise<DetalleEnvio> {
  const datos = await solicitar(RUTA_ENVIOS, { method: 'POST', cuerpo: envio, conToken: true })
  return datos.data as DetalleEnvio
}

export async function cancelarEnvio(id: number): Promise<DetalleEnvio> {
  const datos = await solicitar(`${RUTA_ENVIOS}/${id}/cancelar`, { method: 'PUT', conToken: true })
  return datos.data as DetalleEnvio
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
  if (conToken && respuesta.status === 401) {
    expulsarPorTokenVencido()
  }
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
