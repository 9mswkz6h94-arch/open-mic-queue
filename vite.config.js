import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@dataClient': fileURLToPath(new URL(
        command === 'serve'
          ? './src/lib/supabaseClient.dev.js'
          : './src/lib/supabaseClient.production.js',
        import.meta.url,
      )),
      '@environmentBanner': fileURLToPath(new URL(
        command === 'serve'
          ? './src/components/EnvironmentBanner.jsx'
          : './src/components/EnvironmentBanner.production.jsx',
        import.meta.url,
      )),
    },
  },
}))
