import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { leerSesion } from '@/sesion'

type Aviso = { id_conversacion?: number }

const URL_SOCKET = import.meta.env.VITE_SOCKET_URL || undefined

/** Mantiene el chat al día: el servidor avisa qué cambió y aquí se vuelven a pedir solo esos datos. */
export function useTiempoReal() {
  const consultas = useQueryClient()

  useEffect(() => {
    const token = leerSesion()?.token
    if (!token) {
      return
    }

    const refrescarListas = () => {
      consultas.invalidateQueries({ queryKey: ['chats'] })
      consultas.invalidateQueries({ queryKey: ['chats-contadores'] })
      consultas.invalidateQueries({ queryKey: ['supervision'] })
    }

    const socket = io(URL_SOCKET, { auth: { token }, transports: ['websocket', 'polling'] })

    socket.on('mensaje', ({ id_conversacion }: Aviso) => {
      if (id_conversacion) {
        void consultas.invalidateQueries({ queryKey: ['mensajes', id_conversacion] })
      }
      refrescarListas()
    })
    socket.on('conversacion', ({ id_conversacion }: Aviso) => {
      if (id_conversacion) {
        void consultas.invalidateQueries({ queryKey: ['conversacion', id_conversacion] })
      }
      refrescarListas()
    })
    socket.on('contadores', refrescarListas)
    socket.io.on('reconnect', () => {
      void consultas.invalidateQueries({ queryKey: ['mensajes'] })
      refrescarListas()
    })

    return () => {
      socket.disconnect()
    }
  }, [consultas])
}
