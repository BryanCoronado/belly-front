import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

type TarjetaSeo = {
  titulo?: string
  descripcion?: string
  imagen_url?: string | null
  logo_url?: string | null
  color?: string
  url?: string
}

function escapar(valor: string) {
  return valor.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function inyectarSeo(html: string, tarjeta: TarjetaSeo) {
  const titulo = escapar(tarjeta.titulo || '')
  const descripcion = escapar(tarjeta.descripcion || '')
  const imagen = escapar(tarjeta.imagen_url || '')
  const logo = escapar(tarjeta.logo_url || '')
  const url = escapar(tarjeta.url || '')
  const color = escapar(tarjeta.color || '#0B1026')
  const metas = [
    `<title>${titulo}</title>`,
    `<meta name="description" content="${descripcion}" />`,
    `<meta name="theme-color" content="${color}" />`,
    logo ? `<link rel="icon" href="${logo}" />` : '',
    logo ? `<link rel="apple-touch-icon" href="${logo}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${titulo}" />`,
    `<meta property="og:description" content="${descripcion}" />`,
    imagen ? `<meta property="og:image" content="${imagen}" />` : '',
    url ? `<meta property="og:url" content="${url}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${titulo}" />`,
    `<meta name="twitter:description" content="${descripcion}" />`,
    imagen ? `<meta name="twitter:image" content="${imagen}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<link rel="icon"[^>]*>/, '')
    .replace(/<link rel="apple-touch-icon"[^>]*>/, '')
    .replace('</head>', `    ${metas}\n  </head>`)
}

function seoTienda(): Plugin {
  return {
    name: 'seo-tienda',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        const ruta = ctx.originalUrl ?? ctx.path
        const match = ruta.match(/^\/c\/([a-z0-9-]+)(?:\/p\/(\d+))?/i)
        if (!match) return html
        try {
          const api = process.env.BELLY_API_URL || 'http://belly-api.test'
          const consulta = `${api.replace(/\/$/, '')}/v1/publico/catalogo/${encodeURIComponent(match[1])}/seo${match[2] ? `?producto=${match[2]}` : ''}`
          const respuesta = await fetch(consulta)
          if (!respuesta.ok) return html
          const json = (await respuesta.json()) as { data?: TarjetaSeo }
          if (!json.data?.titulo) return html
          return inyectarSeo(html, json.data)
        } catch {
          return html
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoTienda()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://belly-api.test',
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
      // Fotos de productos, logos y media (mismo disco que writable/uploads).
      '/uploads': {
        target: 'http://belly-api.test',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:4000',
        ws: true,
      },
    },
  },
})
