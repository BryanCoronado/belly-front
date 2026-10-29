import { Camera, RefreshCcw, Square, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { avisoError } from '@/lib/avisos'

type Modo = 'foto' | 'video'

type Props = {
  modo: Modo | null
  alCerrar: () => void
  alCapturar: (archivo: File) => void
}

export function CapturaCamara({ modo, alCerrar, alCapturar }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const grabador = useRef<MediaRecorder | null>(null)
  const trozos = useRef<Blob[]>([])
  const [listo, setListo] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [camara, setCamara] = useState<'user' | 'environment'>('user')
  const reloj = useRef<number>(0)

  useEffect(() => {
    if (!modo) {
      cortar()
      return
    }
    void encender(camara)
    return () => cortar()
  }, [modo, camara])

  async function encender(facing: 'user' | 'environment') {
    cortar()
    setListo(false)
    try {
      const actual = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: modo === 'video',
      })
      stream.current = actual
      if (video.current) {
        video.current.srcObject = actual
        await video.current.play()
      }
      setListo(true)
    } catch {
      avisoError(new Error('No se pudo abrir la cámara. Revisa el permiso del navegador.'), 'Cámara')
      alCerrar()
    }
  }

  function cortar() {
    window.clearInterval(reloj.current)
    setGrabando(false)
    setSegundos(0)
    if (grabador.current && grabador.current.state !== 'inactive') {
      grabador.current.ondataavailable = null
      grabador.current.onstop = null
      grabador.current.stop()
    }
    grabador.current = null
    stream.current?.getTracks().forEach((pista) => pista.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }

  function tomarFoto() {
    const nodo = video.current
    if (!nodo || nodo.videoWidth < 2) return
    const lienzo = document.createElement('canvas')
    lienzo.width = nodo.videoWidth
    lienzo.height = nodo.videoHeight
    const ctx = lienzo.getContext('2d')
    if (!ctx) return
    ctx.drawImage(nodo, 0, 0)
    lienzo.toBlob((blob) => {
      if (!blob) return
      alCapturar(new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      alCerrar()
    }, 'image/jpeg', 0.9)
  }

  function empezarVideo() {
    const actual = stream.current
    if (!actual) return
    const tipo = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((opcion) =>
      MediaRecorder.isTypeSupported(opcion),
    )
    const recorder = new MediaRecorder(actual, tipo ? { mimeType: tipo } : undefined)
    trozos.current = []
    recorder.ondataavailable = (evento) => {
      if (evento.data.size > 0) trozos.current.push(evento.data)
    }
    recorder.onstop = () => {
      const mime = recorder.mimeType.includes('mp4') ? 'video/mp4' : 'video/webm'
      const blob = new Blob(trozos.current, { type: mime })
      if (blob.size < 1200) return
      const ext = mime.includes('mp4') ? 'mp4' : 'webm'
      alCapturar(new File([blob], `video-${Date.now()}.${ext}`, { type: mime }))
      alCerrar()
    }
    grabador.current = recorder
    recorder.start()
    setGrabando(true)
    setSegundos(0)
    reloj.current = window.setInterval(() => {
      setSegundos((n) => {
        if (n >= 59) {
          detenerVideo()
          return n
        }
        return n + 1
      })
    }, 1000)
  }

  function detenerVideo() {
    window.clearInterval(reloj.current)
    setGrabando(false)
    grabador.current?.stop()
  }

  return (
    <Dialog open={modo !== null} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{modo === 'video' ? 'Grabar video' : 'Tomar foto'}</DialogTitle>
          <DialogDescription>Usa la cámara de esta computadora. El archivo se adjunta al mensaje.</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl bg-black">
          <video ref={video} playsInline muted className="aspect-video w-full object-cover" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => setCamara((v) => (v === 'user' ? 'environment' : 'user'))} disabled={!listo || grabando}>
            <RefreshCcw />
            Cambiar cámara
          </Button>
          {modo === 'foto' ? (
            <Button type="button" disabled={!listo} onClick={tomarFoto}>
              <Camera />
              Tomar foto
            </Button>
          ) : grabando ? (
            <Button type="button" variant="destructive" onClick={detenerVideo}>
              <Square />
              Detener {formatoTiempo(segundos)}
            </Button>
          ) : (
            <Button type="button" disabled={!listo} onClick={empezarVideo}>
              <Video />
              Grabar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatoTiempo(segundos: number): string {
  return `0:${String(segundos).padStart(2, '0')}`
}
