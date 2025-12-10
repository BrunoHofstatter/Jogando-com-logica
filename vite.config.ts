import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    // Set the base path permanently to the root directory
    base: '/', 
    plugins: [react()],
  }
})