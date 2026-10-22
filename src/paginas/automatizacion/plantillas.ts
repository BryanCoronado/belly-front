import type { DefinicionFlujo } from '@/api'

export type PlantillaFlujo = {
  id: 'blanco' | 'menu' | 'horario' | 'seguimiento'
  titulo: string
  descripcion: string
  /** null = usa el flujo básico que crea el servidor. */
  definicion: DefinicionFlujo | null
}

const s = 'siguiente'

export const PLANTILLAS: PlantillaFlujo[] = [
  {
    id: 'menu',
    titulo: 'Menú de bienvenida',
    descripcion: 'Saluda y deja elegir entre ventas, soporte u otra consulta con botones.',
    definicion: {
      nodos: [
        { id: 'inicio', tipo: 'inicio', x: 0, y: 140, datos: { disparador: 'primer_mensaje', palabras: [], exacta: false, audiencia: 'nuevos', repetir: 'una_vez' } },
        {
          id: 'menu',
          tipo: 'botones',
          x: 340,
          y: 60,
          datos: {
            texto: '¡Hola {{nombre}}! 👋 Gracias por escribirnos. ¿En qué te podemos ayudar?',
            botones: [
              { id: 'ventas', titulo: 'Quiero comprar' },
              { id: 'soporte', titulo: 'Necesito soporte' },
              { id: 'consulta', titulo: 'Otra consulta' },
            ],
          },
        },
        {
          id: 'info',
          tipo: 'mensaje',
          x: 760,
          y: -60,
          datos: { texto: 'Genial 🙌 Te comparto nuestra información y enseguida te atiende un asesor.', media: 'ninguno' },
        },
        { id: 'asesor1', tipo: 'asesor', x: 1160, y: -60, datos: { texto: 'Un asesor de ventas te escribirá en unos minutos.' } },
        {
          id: 'correo',
          tipo: 'pregunta',
          x: 760,
          y: 190,
          datos: { texto: 'Lamentamos el inconveniente 🙏 ¿Cuál es tu correo para ubicar tu caso?', variable: 'correo', validacion: 'email', error: 'Ese correo no parece válido. ¿Puedes escribirlo de nuevo?' },
        },
        { id: 'asesor2', tipo: 'asesor', x: 1160, y: 190, datos: { texto: 'Gracias {{nombre}}. Un asesor de soporte revisará tu caso con {{correo}}.' } },
        { id: 'asesor3', tipo: 'asesor', x: 760, y: 440, datos: { texto: 'Cuéntanos tu consulta y un asesor te responderá enseguida.' } },
      ],
      conexiones: [
        { id: 'c1', desde: 'inicio', salida: s, hacia: 'menu' },
        { id: 'c2', desde: 'menu', salida: 'ventas', hacia: 'info' },
        { id: 'c3', desde: 'info', salida: s, hacia: 'asesor1' },
        { id: 'c4', desde: 'menu', salida: 'soporte', hacia: 'correo' },
        { id: 'c5', desde: 'correo', salida: s, hacia: 'asesor2' },
        { id: 'c6', desde: 'menu', salida: 'consulta', hacia: 'asesor3' },
      ],
    },
  },
  {
    id: 'horario',
    titulo: 'Aviso fuera de turno',
    descripcion: 'Si escriben cuando no hay ningún turno de tus grupos, les avisa que los atenderás después.',
    definicion: {
      nodos: [
        { id: 'inicio', tipo: 'inicio', x: 0, y: 100, datos: { disparador: 'cualquier_mensaje', palabras: [], exacta: false, audiencia: 'todos', repetir: 'cada_horas', repetir_horas: 12 } },
        { id: 'horario', tipo: 'horario', x: 320, y: 60, datos: {} },
        { id: 'aviso', tipo: 'fin', x: 700, y: 170, datos: { texto: 'Hola {{nombre}} 👋 Ahora estamos fuera de horario. Te responderemos apenas volvamos.' } },
        { id: 'enhorario', tipo: 'fin', x: 700, y: -40, datos: { texto: '' } },
      ],
      conexiones: [
        { id: 'c1', desde: 'inicio', salida: s, hacia: 'horario' },
        { id: 'c2', desde: 'horario', salida: 'cerrado', hacia: 'aviso' },
        { id: 'c3', desde: 'horario', salida: 'abierto', hacia: 'enhorario' },
      ],
    },
  },
  {
    id: 'seguimiento',
    titulo: 'Seguimiento si no responde',
    descripcion: 'Pregunta con botones; si el cliente no contesta, le recuerda y luego pasa a un asesor.',
    definicion: {
      nodos: [
        { id: 'inicio', tipo: 'inicio', x: 0, y: 140, datos: { disparador: 'primer_mensaje', palabras: [], exacta: false, audiencia: 'nuevos', repetir: 'una_vez' } },
        {
          id: 'saludo',
          tipo: 'botones',
          x: 340,
          y: 60,
          datos: {
            texto: '¡Hola {{nombre}}! 👋 ¿Te gustaría recibir nuestro catálogo?',
            pausa: 2,
            timeout_min: 30,
            timeout_unidad: 1,
            botones: [
              { id: 'si', titulo: 'Sí, envíalo' },
              { id: 'no', titulo: 'Ahora no' },
            ],
          },
        },
        { id: 'catalogo', tipo: 'mensaje', x: 760, y: -60, datos: { texto: 'Aquí tienes nuestro catálogo 📄', media: 'ninguno', pausa: 2 } },
        { id: 'fin1', tipo: 'asesor', x: 1160, y: -60, datos: { texto: 'Un asesor te escribirá para resolver tus dudas.' } },
        { id: 'despedida', tipo: 'fin', x: 760, y: 170, datos: { texto: 'Sin problema 😊 Aquí estamos cuando nos necesites.' } },
        { id: 'recordatorio', tipo: 'mensaje', x: 760, y: 380, datos: { texto: 'Hola {{nombre}}, ¿pudiste ver nuestro mensaje? Estamos para ayudarte 🙌', media: 'ninguno' } },
        { id: 'fin2', tipo: 'asesor', x: 1160, y: 380, datos: { texto: '' } },
      ],
      conexiones: [
        { id: 'c1', desde: 'inicio', salida: s, hacia: 'saludo' },
        { id: 'c2', desde: 'saludo', salida: 'si', hacia: 'catalogo' },
        { id: 'c3', desde: 'catalogo', salida: s, hacia: 'fin1' },
        { id: 'c4', desde: 'saludo', salida: 'no', hacia: 'despedida' },
        { id: 'c5', desde: 'saludo', salida: 'sin_respuesta', hacia: 'recordatorio' },
        { id: 'c6', desde: 'recordatorio', salida: s, hacia: 'fin2' },
      ],
    },
  },
  {
    id: 'blanco',
    titulo: 'Empezar de cero',
    descripcion: 'Un saludo sencillo para que lo armes a tu manera.',
    definicion: null,
  },
]
