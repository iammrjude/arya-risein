process.env.NODE_ENV = 'development'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
  },
})
