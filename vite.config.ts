import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cursorApiKey = env.VITE_API_TOKEN?.trim() || env.CURSOR_API_KEY?.trim()

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/cursor': {
          target: 'https://api.cursor.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cursor/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (cursorApiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${cursorApiKey}`)
              }
            })
          },
        },
      },
    },
    preview: {
      proxy: {
        '/api/cursor': {
          target: 'https://api.cursor.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cursor/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (cursorApiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${cursorApiKey}`)
              }
            })
          },
        },
      },
    },
  }
})
