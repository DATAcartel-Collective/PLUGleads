import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // This is the v4 way

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})