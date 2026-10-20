import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { cursorApiProxy } from './vite-plugin-cursor-proxy.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cursorApiKey = env.VITE_API_TOKEN?.trim() || env.CURSOR_API_KEY?.trim()

  return {
    plugins: [react(), cursorApiProxy(cursorApiKey)],
  }
})
