import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAvisos } from '@/hooks/use-avisos'
import { guardarPrefsAviso, marcarAvisosLeidos } from '@/lib/preferencias-aviso'

export function BandejaAvisos() {
  const prefs = useAvisos()
  const ir = useNavigate()
  const pendientes = prefs.bandeja.filter((aviso) => !aviso.leido).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="relative border-border bg-background"
            aria-label={pendientes ? `${pendientes} avisos sin leer` : 'Avisos'}
            title="Avisos"
          />
        }
      >
        <Bell />
        {pendientes > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
            {pendientes > 9 ? '9+' : pendientes}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Avisos</span>
            {pendientes > 0 ? (
              <button type="button" className="text-xs font-normal text-muted-foreground hover:text-foreground" onClick={() => marcarAvisosLeidos()}>
                Marcar leídos
              </button>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {prefs.bandeja.length ? (
          prefs.bandeja.slice(0, 8).map((aviso) => (
            <DropdownMenuItem
              key={aviso.id}
              className="flex-col items-start gap-0.5"
              onClick={() => {
                marcarAvisosLeidos(aviso.idConversacion)
                ir(`/chats?c=${aviso.idConversacion}`)
              }}
            >
              <span className="flex w-full items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">{aviso.titulo}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{hace(aviso.cuando)}</span>
                {aviso.leido ? null : <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />}
              </span>
              <span className="line-clamp-2 w-full text-xs text-muted-foreground">{aviso.descripcion}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>Todavía no tienes avisos</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => guardarPrefsAviso({ sonido: !prefs.sonido })}
        >
          {prefs.sonido ? <Volume2 /> : <VolumeX />}
          {prefs.sonido ? 'Sonido encendido' : 'Sonido apagado'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => guardarPrefsAviso({ escritorio: !prefs.escritorio })}
        >
          {prefs.escritorio ? <Bell /> : <BellOff />}
          {prefs.escritorio ? 'Avisos del navegador' : 'Sin avisos del navegador'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function hace(cuando: number): string {
  const segundos = Math.max(0, Math.round((Date.now() - cuando) / 1000))
  if (segundos < 45) return 'ahora'
  if (segundos < 3600) return `${Math.round(segundos / 60)} min`
  if (segundos < 86400) return `${Math.round(segundos / 3600)} h`
  return `${Math.round(segundos / 86400)} d`
}
