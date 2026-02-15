import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Load .env, .env.local, etc. so BACKEND_URL and VITE_API_URL are available
  const env = loadEnv(mode, process.cwd(), '')

  const backendTarget = env.BACKEND_URL || env.VITE_API_URL || 'https://localhost:8080'

  return defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
    server: {
      host: '0.0.0.0',
      port: 3000,
      https: {
        key: fs.readFileSync(path.resolve(__dirname, './certs/192.168.1.91-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, './certs/192.168.1.91-cert.pem')),
      },
      proxy: {
        '/api': {
          // Use BACKEND_URL or VITE_API_URL from env files; fallback to localhost
          target: backendTarget,
          changeOrigin: true,
          // Accept self-signed certs when proxying to HTTPS backend in dev
          secure: false,
        },
      },
    },
  })
}
