import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // exposes on your local network too, handy for testing on a phone
    port: 5173,
  },
})
