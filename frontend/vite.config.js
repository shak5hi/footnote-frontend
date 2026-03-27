import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // CHANGE THIS IP to the exact IP address of your other laptop!
        // Example: 'http://192.168.1.25:5000'
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
