import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@stellar/stellar-sdk')) {
            return 'stellar-sdk'
          }
          if (id.includes('@creit-tech/stellar-wallets-kit')) {
            return 'wallet-kit'
          }
          if (id.includes('react-router-dom')) {
            return 'router'
          }
        },
      },
    },
  },
})
