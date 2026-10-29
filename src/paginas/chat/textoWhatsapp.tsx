import type { ReactNode } from 'react'

/** WhatsApp: *negrita* _cursiva_ ~tachado~ ```mono```. También entiende **negrita**. */
export function aFormatoWhatsapp(texto: string): string {
  return texto.replace(/\*\*(.+?)\*\*/g, '*$1*')
}

export function TextoWhatsapp({ texto, className }: { texto: string; className?: string }) {
  return <span className={className}>{partir(texto)}</span>
}

function partir(texto: string): ReactNode[] {
  const partes: ReactNode[] = []
  const regex = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|_[^_\n]+?_|~[^~\n]+?~|```[\s\S]+?```)/g
  let ultimo = 0
  let i = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimo) {
      partes.push(texto.slice(ultimo, match.index))
    }
    partes.push(envolver(match[0], i))
    ultimo = match.index + match[0].length
    i += 1
  }
  if (ultimo < texto.length) {
    partes.push(texto.slice(ultimo))
  }
  return partes
}

function envolver(token: string, clave: number): ReactNode {
  if (token.startsWith('```') && token.endsWith('```')) {
    return (
      <code key={clave} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[12.5px]">
        {token.slice(3, -3)}
      </code>
    )
  }
  if (token.startsWith('**') && token.endsWith('**')) {
    return <strong key={clave}>{token.slice(2, -2)}</strong>
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return <strong key={clave}>{token.slice(1, -1)}</strong>
  }
  if (token.startsWith('_') && token.endsWith('_')) {
    return <em key={clave}>{token.slice(1, -1)}</em>
  }
  if (token.startsWith('~') && token.endsWith('~')) {
    return <s key={clave}>{token.slice(1, -1)}</s>
  }
  return token
}
