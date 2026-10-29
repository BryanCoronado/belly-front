import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { leerDestinoAviso, leerPerfil } from '@/api'
import { avisoConversacion } from '@/lib/avisos'
import { pedirPermisoAvisos, tocarAviso } from '@/lib/sonido-aviso'
import { esAdministrador, leerSesion } from '@/sesion'

type Aviso = {
  id_conversacion?: number
  id_usuario?: number | null
  es_bot?: number
  id_aviso_ia?: number | null
  para?: number[]
  nombre?: string | null
  preview?: string | null
  contesta?: 'cliente' | 'usuario' | 'bot' | null
  motivo?: 'mensaje' | 'asignada' | 'estado' | 'actualizacion'
}

const URL_SOCKET = import.meta.env.VITE_SOCKET_URL || undefined

function mismoId(a: unknown, b: unknown): boolean {
  const izq = Number(a)
  const der = Number(b)
  return izq > 0 && der > 0 && izq === der
}

/** Un solo socket para toda la app: refresca chats y avisa con sonido a quien corresponde. */
export function useTiempoReal() {
  const consultas = useQueryClient()
  const ubicacion = useLocation()
  const ir = useNavigate()
  const abierto = useRef({ ruta: '', chat: 0 })
  const ultimo = useRef({ id: 0, cuando: 0 })

  const perfil = useQuery({
    queryKey: ['perfil'],
    queryFn: leerPerfil,
    staleTime: 60_000,
    enabled: Boolean(leerSesion()?.token),
  })
  const idAvisoIa = useRef<number | null>(null)
  idAvisoIa.current = perfil.data?.empresa.id_aviso_ia ?? null

  abierto.current = {
    ruta: ubicacion.pathname,
    chat: Number(new URLSearchParams(ubicacion.search).get('c')) || 0,
  }

  useEffect(() => {
    const token = leerSesion()?.token
    if (!token) return

    const alInteractuar = () => pedirPermisoAvisos()
    window.addEventListener('pointerdown', alInteractuar, { once: true })

    const refrescarListas = () => {
      consultas.invalidateQueries({ queryKey: ['chats'] })
      consultas.invalidateQueries({ queryKey: ['chats-contadores'] })
      consultas.invalidateQueries({ queryKey: ['supervision'] })
    }

    const socket = io(URL_SOCKET, { auth: { token }, transports: ['websocket', 'polling'] })

    socket.on('mensaje', (aviso: Aviso) => {
      if (aviso.id_conversacion) {
        void consultas.invalidateQueries({ queryKey: ['mensajes', aviso.id_conversacion] })
      }
      refrescarListas()
      void avisarSiCorresponde(aviso)
    })
    socket.on('conversacion', (aviso: Aviso) => {
      if (aviso.id_conversacion) {
        void consultas.invalidateQueries({ queryKey: ['conversacion', aviso.id_conversacion] })
      }
      refrescarListas()
      void avisarSiCorresponde(aviso)
    })
    socket.on('contadores', refrescarListas)
    socket.io.on('reconnect', () => {
      void consultas.invalidateQueries({ queryKey: ['mensajes'] })
      refrescarListas()
    })

    async function avisarSiCorresponde(aviso: Aviso) {
      const id = Number(aviso.id_conversacion)
      const yo = leerSesion()?.usuario
      if (!id || !yo) return
      if (aviso.motivo === 'estado' || aviso.motivo === 'actualizacion') return

      const ahora = Date.now()
      if (ultimo.current.id === id && ahora - ultimo.current.cuando < 1_400) return

      const resuelto = await completarAviso(aviso)
      if (!esParaMi(resuelto, yo.id, idAvisoIa.current)) return

      const viendoEsteChat =
        (abierto.current.ruta === '/chats' || abierto.current.ruta === '/supervision') &&
        abierto.current.chat === id &&
        document.visibilityState === 'visible'
      if (viendoEsteChat) return

      ultimo.current = { id, cuando: ahora }

      const titulo =
        resuelto.motivo === 'asignada'
          ? `Nuevo chat · ${resuelto.nombre || 'Cliente'}`
          : resuelto.nombre || 'Nuevo mensaje'
      const descripcion = resuelto.preview || (resuelto.motivo === 'asignada' ? 'Conversación asignada' : 'Escribió un mensaje')
      const abrir = () => ir(`/chats?c=${id}`)

      tocarAviso()
      avisoConversacion(titulo, descripcion, abrir)
      mostrarAvisoSistema(id, titulo, descripcion, abrir)
    }

    return () => {
      window.removeEventListener('pointerdown', alInteractuar)
      socket.disconnect()
    }
  }, [consultas, ir])
}

async function completarAviso(aviso: Aviso): Promise<Aviso> {
  if (Number(aviso.id_usuario) > 0 || Number(aviso.es_bot) === 1 || (aviso.para && aviso.para.length > 0)) {
    return aviso
  }

  const id = Number(aviso.id_conversacion)
  if (!id) return aviso

  try {
    const destino = await leerDestinoAviso(id)
    return {
      ...aviso,
      id_usuario: destino.id_usuario,
      es_bot: destino.es_bot ? 1 : 0,
      nombre: aviso.nombre || destino.nombre,
    }
  } catch {
    return aviso
  }
}

function esParaMi(aviso: Aviso, miId: number, idAvisoIa: number | null): boolean {
  if (aviso.para?.some((id) => mismoId(id, miId))) {
    return true
  }

  if (aviso.contesta && aviso.contesta !== 'cliente' && aviso.motivo !== 'asignada') {
    return false
  }

  if (Number(aviso.es_bot) === 1) {
    const destino = Number(idAvisoIa || aviso.id_aviso_ia || 0)
    if (destino > 0) return mismoId(destino, miId)
    return esAdministrador(leerSesion()?.usuario)
  }

  return mismoId(aviso.id_usuario, miId)
}

function mostrarAvisoSistema(idChat: number, titulo: string, cuerpo: string, alAbrir: () => void) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    const n = new Notification(titulo, { body: cuerpo, tag: `chat-${idChat}` })
    n.onclick = () => {
      window.focus()
      alAbrir()
      n.close()
    }
  } catch {
    // el navegador puede bloquearlo si la pestaña no está activa
  }
}
