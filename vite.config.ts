import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'production' ? '/AI-Board/' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      crypto: fileURLToPath(new URL('./src/polyfills/crypto-polyfill.js', import.meta.url)),
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['buffer', 'crypto-browserify', 'stream-browserify']
  }
})
