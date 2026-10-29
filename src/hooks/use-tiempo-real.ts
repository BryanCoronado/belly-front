import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { leerPerfil } from '@/api'
import { avisoConversacion } from '@/lib/avisos'
import { pedirPermisoAvisos, tocarAviso } from '@/lib/sonido-aviso'
import { esAdministrador, leerSesion } from '@/sesion'

type Aviso = {
  id_conversacion?: number
  id_usuario?: number | null
  es_bot?: number
  id_aviso_ia?: number | null
  nombre?: string | null
  preview?: string | null
  contesta?: 'cliente' | 'usuario' | 'bot' | null
  motivo?: 'mensaje' | 'asignada' | 'estado' | 'actualizacion'
}

const URL_SOCKET = import.meta.env.VITE_SOCKET_URL || undefined

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
      avisarSiCorresponde(aviso)
    })
    socket.on('conversacion', (aviso: Aviso) => {
      if (aviso.id_conversacion) {
        void consultas.invalidateQueries({ queryKey: ['conversacion', aviso.id_conversacion] })
      }
      refrescarListas()
      avisarSiCorresponde(aviso)
    })
    socket.on('contadores', refrescarListas)
    socket.io.on('reconnect', () => {
      void consultas.invalidateQueries({ queryKey: ['mensajes'] })
      refrescarListas()
    })

    function avisarSiCorresponde(aviso: Aviso) {
      const id = Number(aviso.id_conversacion)
      const yo = leerSesion()?.usuario
      if (!id || !yo) return

      const ahora = Date.now()
      if (ultimo.current.id === id && ahora - ultimo.current.cuando < 1_400) return

      const paraMi = meCorresponde(aviso, yo.id, idAvisoIa.current ?? aviso.id_aviso_ia ?? null)
      if (!paraMi) return

      const viendoEsteChat =
        (abierto.current.ruta === '/chats' || abierto.current.ruta === '/supervision') &&
        abierto.current.chat === id &&
        document.visibilityState === 'visible'
      if (viendoEsteChat) return

      ultimo.current = { id, cuando: ahora }

      const titulo = aviso.motivo === 'asignada' ? `Te pasaron un chat · ${aviso.nombre || 'Cliente'}` : aviso.nombre || 'Nuevo mensaje'
      const descripcion = aviso.preview || (aviso.motivo === 'asignada' ? 'Conversación asignada' : 'Escribió un mensaje')
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

function meCorresponde(aviso: Aviso, miId: number, idAvisoIa: number | null): boolean {
  if (aviso.motivo === 'estado' || aviso.motivo === 'actualizacion') {
    return false
  }
  if (aviso.motivo === 'asignada') {
    if (Number(aviso.es_bot) === 1) {
      return destinatarioIa(miId, idAvisoIa, aviso.id_aviso_ia)
    }
    return Number(aviso.id_usuario) === miId
  }

  if (aviso.contesta && aviso.contesta !== 'cliente') {
    return false
  }

  if (Number(aviso.es_bot) === 1) {
    return destinatarioIa(miId, idAvisoIa, aviso.id_aviso_ia)
  }

  return Number(aviso.id_usuario) === miId
}

function destinatarioIa(miId: number, idAvisoIa: number | null, idSocket: number | null | undefined): boolean {
  const destino = Number(idAvisoIa || idSocket || 0)
  if (destino > 0) return destino === miId
  return esAdministrador(leerSesion()?.usuario)
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
