import { MessagesSquare } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useGuia } from '@/guia/useGuia'
import { useTiempoReal } from '@/hooks/use-tiempo-real'
import { cn } from '@/lib/utils'
import { ListaChats } from './ListaChats'
import { PanelConversacion } from './PanelConversacion'

export function Chats() {
  const [parametros, setParametros] = useSearchParams()
  const seleccionado = Number(parametros.get('c')) || null
  useGuia('chats')
  useTiempoReal()

  return (
    <div className="chat-wa flex h-[calc(100dvh-4rem)] overflow-hidden bg-white">
      <ListaChats
        seleccionado={seleccionado}
        alSeleccionar={(chat) => setParametros({ c: String(chat.id) })}
        className={cn('w-full md:w-80 lg:w-96 md:shrink-0', seleccionado && 'hidden md:flex')}
      />
      {seleccionado ? (
        <PanelConversacion
          key={seleccionado}
          idConversacion={seleccionado}
          alVolver={() => setParametros({})}
          className="flex-1"
        />
      ) : (
        <div className="chat-wa-fondo hidden flex-1 flex-col items-center justify-center gap-3 px-8 text-center md:flex">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/80 text-[var(--wa-verde)] shadow-sm">
            <MessagesSquare className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-[var(--wa-texto)]">WhatsApp</p>
            <p className="max-w-sm text-sm text-[var(--wa-muted)]">Elige una conversación para empezar a chatear</p>
          </div>
        </div>
      )}
    </div>
  )
}
