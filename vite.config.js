import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// [https://vite.dev/config/](https://vite.dev/config/)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/smart-queue/', // 👈 ADD THIS LINE (use your GitHub repo name here)
})
