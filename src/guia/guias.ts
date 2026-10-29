import type { PasoGuia } from './motor'

const PESTANAS_EQUIPO: PasoGuia = {
  en: 'pestanas-equipo',
  titulo: 'Equipo tiene 3 partes',
  texto:
    '<b>Usuarios</b>: las personas que entran a Belly.<br><b>Grupos</b>: cómo se organizan, por ejemplo Ventas o Soporte.<br><b>Roles</b>: qué puede hacer cada una (los permisos).',
  lado: 'bottom',
}

export const GUIAS: Record<string, PasoGuia[]> = {
  inicio: [
    {
      titulo: '¡Bienvenido a Belly! 👋',
      texto: 'Te muestro en un minuto dónde está cada cosa. Puedes cerrar cuando quieras y volver a verlo con el ícono de ayuda <b>?</b> de arriba a la derecha.',
    },
    {
      en: 'menu',
      titulo: 'Menú',
      texto: 'Aquí están todos los módulos, ordenados por grupos. Toca un grupo para desplegarlo y ver sus opciones.',
      lado: 'right',
    },
    {
      en: 'boton-guia',
      titulo: 'Ayuda siempre a mano',
      texto: 'Si no sabes qué hace una pantalla, pulsa este ícono y elige <b>Ver la guía de esta pantalla</b>.',
      lado: 'bottom',
    },
    {
      en: 'metricas',
      titulo: 'Tu resumen',
      texto: 'Mensajes sin leer, chats por responder, clientes y personas del equipo, de un vistazo.',
      lado: 'bottom',
    },
    {
      en: 'primeros-pasos',
      titulo: 'Primeros pasos',
      texto: 'Conecta tu WhatsApp desde el menú y arma el reparto de chats. La lista desaparece cuando terminas.',
      lado: 'top',
    },
  ],

  'equipo-usuarios': [
    PESTANAS_EQUIPO,
    {
      en: 'lista',
      titulo: 'Tus usuarios',
      texto: 'Aquí ves a cada persona con su grupo, su rol y si está activa.',
      lado: 'top',
    },
    {
      en: 'acciones-fila',
      titulo: 'Editar o desactivar',
      texto: '<b>Editar</b> cambia sus datos, su rol o su grupo.<br><b>Desactivar</b> le quita el acceso sin borrar su historial.',
      lado: 'left',
    },
    {
      en: 'nuevo',
      titulo: 'Crear un usuario',
      texto:
        'Pulsa aquí y llena solo tres datos: <b>nombre</b>, <b>usuario</b> y <b>contraseña</b>.<br>Si no eliges rol ni grupo, se asignan solos. Correo, celular y documento son opcionales.',
      lado: 'bottom',
      probar: 'Probar ahora',
    },
  ],

  'equipo-grupos': [
    {
      en: 'explicacion',
      titulo: '¿Para qué sirve un grupo?',
      texto:
        'Junta a las personas que trabajan juntas, por ejemplo Ventas o Sucursal Norte. Sirve para <b>organizar</b> al equipo: los grupos no dan permisos, eso lo hace el <b>rol</b>.',
      lado: 'bottom',
    },
    {
      en: 'tarjeta-grupo',
      titulo: 'Cada tarjeta es un grupo',
      texto: 'Muestra quiénes están dentro. Los grupos <b>Base</b> vienen con tu empresa y no se pueden borrar.',
      lado: 'bottom',
    },
    {
      en: 'editar-grupo',
      titulo: 'Editar miembros',
      texto: 'Aquí agregas o quitas personas del grupo. Cada persona está en un solo grupo.',
      lado: 'top',
    },
    {
      en: 'nuevo',
      titulo: 'Crear un grupo',
      texto:
        '1. Ponle un nombre, por ejemplo <i>Ventas</i>.<br>2. Marca a las personas que forman parte.<br>3. Guarda.',
      lado: 'bottom',
      probar: 'Crear uno ahora',
    },
  ],

  'equipo-roles': [
    {
      en: 'explicacion',
      titulo: '¿Para qué sirve un rol?',
      texto:
        'Define <b>todo</b> lo que una persona puede ver y hacer, por ejemplo Asesor o Supervisor.<br>El grupo solo organiza; los permisos salen únicamente del rol.',
      lado: 'bottom',
    },
    {
      en: 'lista',
      titulo: 'Roles de tu empresa',
      texto: 'El rol <b>Administrador</b> siempre puede hacerlo todo, incluso en módulos nuevos, y no se puede borrar.',
      lado: 'top',
    },
    {
      en: 'acciones-fila',
      titulo: 'Editar permisos',
      texto:
        'Abre la lista de módulos. En cada uno marca <b>Ver</b>, <b>Crear</b>, <b>Editar</b> o <b>Eliminar</b>. Con <b>Marcar todo</b> das una sección completa.',
      lado: 'left',
    },
    {
      en: 'nuevo',
      titulo: 'Crear un rol',
      texto: 'Ponle un nombre, enciende los módulos que podrá usar (y qué puede hacer dentro de cada uno) y guarda. Después asígnalo a las personas desde la pestaña Usuarios.',
      lado: 'bottom',
      probar: 'Crear uno ahora',
    },
  ],

  chats: [
    {
      en: 'lista-chats',
      titulo: 'Tus conversaciones',
      texto: 'Aquí llegan los clientes que te asignaron. El número verde indica cuántos mensajes no has leído. Toca uno para abrirlo.',
      lado: 'right',
    },
    {
      en: 'bandejas-chat',
      titulo: 'Bandejas',
      texto: '<b>Activos</b>: todo lo que atiendes. <b>No leídos</b>: mensajes nuevos. <b>Por responder</b>: el cliente escribió último y espera tu respuesta. <b>Finalizados</b>: conversaciones cerradas.',
      lado: 'bottom',
    },
    {
      en: 'buscar-chat',
      titulo: 'Buscar',
      texto: 'Encuentra un cliente por su nombre o número de teléfono.',
      lado: 'bottom',
    },
    {
      en: 'mensajes-chat',
      titulo: 'La conversación',
      texto: 'Los mensajes del cliente van a la izquierda y los tuyos a la derecha. ✓ enviado, ✓✓ entregado, ✓✓ azul leído.',
      lado: 'left',
    },
    {
      en: 'redactor',
      titulo: 'Responder',
      texto: 'Escribe y pulsa Enter. Con el clip adjuntas fotos o documentos. Pasadas 24 horas sin que el cliente escriba, WhatsApp solo permite enviarle una plantilla aprobada.',
      lado: 'top',
    },
    {
      en: 'respuestas-rapidas',
      titulo: 'Respuestas rápidas',
      texto: 'Inserta textos que usas seguido sin escribirlos cada vez. También puedes enviar una plantilla de WhatsApp desde aquí.',
      lado: 'top',
    },
    {
      en: 'finalizar-chat',
      titulo: 'Finalizar',
      texto: 'Cuando terminas de atender, finaliza la conversación indicando el motivo. Así tus métricas quedan ordenadas.',
      lado: 'bottom',
    },
  ],

  clientes: [
    {
      en: 'cabecera',
      titulo: 'Clientes',
      texto: 'Las personas que te escribieron. Se crean solas con su primer mensaje, no tienes que registrarlas.',
      lado: 'bottom',
    },
    { en: 'lista', titulo: 'Tu cartera', texto: 'Nombre, teléfono y correo de cada cliente.', lado: 'top' },
  ],

  plantillas: [
    {
      en: 'cabecera',
      titulo: 'Plantillas rápidas',
      texto: 'Respuestas guardadas para las preguntas de siempre: precios, horarios, ubicación. Responden en un clic desde el chat.',
      lado: 'bottom',
    },
    { en: 'lista', titulo: 'Tus respuestas', texto: 'El título te ayuda a encontrarla; el mensaje es lo que se inserta en el chat. Puedes crear, editar o borrar.', lado: 'top' },
  ],

  whatsapp: [
    {
      en: 'cabecera',
      titulo: 'Conectar WhatsApp',
      texto: 'Tres pasos con datos de Meta. Sin conexión, el chat queda desactivado.',
      lado: 'bottom',
    },
    { en: 'pasos-lista', titulo: 'Los pasos', texto: 'Se desbloquean en orden: no puedes avanzar hasta terminar el anterior.', lado: 'right' },
    { en: 'paso-contenido', titulo: 'Paso actual', texto: 'Completa los datos y pulsa Continuar. A la derecha te decimos dónde encontrarlos en Meta.', lado: 'left' },
  ],

  'lista-negra': [
    {
      en: 'cabecera',
      titulo: 'Bloqueos',
      texto: 'Números que tu empresa no atenderá: spam, bromas o personas que pidieron no ser contactadas.',
      lado: 'bottom',
    },
    { en: 'lista', titulo: 'Números bloqueados', texto: 'Los mensajes de estos números no crean conversaciones.', lado: 'top' },
  ],
}
