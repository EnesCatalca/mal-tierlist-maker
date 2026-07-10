import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api/mal': {
        target: 'https://myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => {
          const qs = path.includes('?') ? path.split('?')[1] : ''
          const params = new URLSearchParams(qs)
          const username = params.get('username') || ''
          params.delete('username')
          return `/animelist/${encodeURIComponent(username)}/load.json?${params}`
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
        },
      },
    },
  },
})
