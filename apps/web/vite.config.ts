import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths({ projects: ['tsconfig.app.json'] })],
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 5173
  }
})
