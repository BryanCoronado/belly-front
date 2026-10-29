import { useEffect, useState } from 'react'
import { EVENTO_AVISOS, leerPrefsAviso, type PrefsAviso } from '@/lib/preferencias-aviso'

export function useAvisos(): PrefsAviso {
  const [prefs, setPrefs] = useState(leerPrefsAviso)

  useEffect(() => {
    const refrescar = () => setPrefs(leerPrefsAviso())
    window.addEventListener(EVENTO_AVISOS, refrescar)
    window.addEventListener('storage', refrescar)
    return () => {
      window.removeEventListener(EVENTO_AVISOS, refrescar)
      window.removeEventListener('storage', refrescar)
    }
  }, [])

  return prefs
}
