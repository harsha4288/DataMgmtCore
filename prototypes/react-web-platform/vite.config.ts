import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tokenPlugin } from './src/design-system/build/vite-token-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tokenPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
