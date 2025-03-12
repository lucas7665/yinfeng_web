import { defineConfig } from 'vite'
import vue from '@vue/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        ws: false  // 禁用 WebSocket
      }
    }
  }
}) 