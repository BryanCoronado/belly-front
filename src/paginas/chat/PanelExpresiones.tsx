import { useQuery } from '@tanstack/react-query'
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'
import { useState } from 'react'
import { leerStickers, type StickerTienda } from '@/api'
import { useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'

type Props = {
  alEmoji: (emoji: string) => void
  alSticker: (sticker: StickerTienda) => void
}

export function PanelExpresiones({ alEmoji, alSticker }: Props) {
  const { oscuro } = useTema()
  const [pestaña, setPestaña] = useState<'emojis' | 'stickers'>('emojis')
  const [busqueda, setBusqueda] = useState('')
  const stickers = useQuery({
    queryKey: ['stickers', busqueda],
    queryFn: () => leerStickers(busqueda),
    enabled: pestaña === 'stickers',
    staleTime: 60_000,
  })

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex border-b">
        <button
          type="button"
          className={cn('flex-1 py-2 text-sm', pestaña === 'emojis' ? 'font-medium' : 'text-muted-foreground')}
          onClick={() => setPestaña('emojis')}
        >
          Emojis
        </button>
        <button
          type="button"
          className={cn('flex-1 py-2 text-sm', pestaña === 'stickers' ? 'font-medium' : 'text-muted-foreground')}
          onClick={() => setPestaña('stickers')}
        >
          Stickers
        </button>
      </div>

      {pestaña === 'emojis' ? (
        <EmojiPicker
          onEmojiClick={(dato) => alEmoji(dato.emoji)}
          theme={oscuro ? Theme.DARK : Theme.LIGHT}
          emojiStyle={EmojiStyle.APPLE}
          width="100%"
          height={320}
          searchPlaceHolder="Buscar emoji"
          previewConfig={{ showPreview: false }}
          lazyLoadEmojis
          skinTonesDisabled
        />
      ) : (
        <div className="p-2">
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar stickers (Giphy)"
            className="mb-2 h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none"
          />
          {stickers.isLoading ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Cargando tienda…</p>
          ) : stickers.data?.aviso ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{stickers.data.aviso}</p>
          ) : stickers.data?.lista.length ? (
            <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto">
              {stickers.data.lista.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  title={sticker.titulo}
                  className="flex aspect-square items-center justify-center rounded-lg bg-black/5 p-1 hover:bg-black/10"
                  onClick={() => alSticker(sticker)}
                >
                  <img src={sticker.preview || sticker.url} alt={sticker.titulo} className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">No hay stickers con eso.</p>
          )}
        </div>
      )}
    </div>
  )
}
