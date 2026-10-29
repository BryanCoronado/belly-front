let contexto: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  contexto ??= new Ctor()
  return contexto
}

/** Dos notas cortas, como un aviso de chat, sin archivo externo. */
export function tocarAviso() {
  const ctx = audio()
  if (!ctx) return
  void ctx.resume()
  const ahora = ctx.currentTime
  const osc = ctx.createOscillator()
  const ganancia = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ahora)
  osc.frequency.setValueAtTime(1174, ahora + 0.09)
  ganancia.gain.setValueAtTime(0.0001, ahora)
  ganancia.gain.exponentialRampToValueAtTime(0.14, ahora + 0.02)
  ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.32)
  osc.connect(ganancia)
  ganancia.connect(ctx.destination)
  osc.start(ahora)
  osc.stop(ahora + 0.34)
}

export function pedirPermisoAvisos() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
  void Notification.requestPermission()
}