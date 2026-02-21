/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    // @ts-expect-error -- environmentMatchGlobs is a valid Vitest config but not in the TS types
    environmentMatchGlobs: [
      ['src/**/*.test.tsx', 'jsdom'],
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  },
  build: {
    rollupOptions: {
        output: {
            manualChunks: {
                'vendor-react': ['react', 'react-dom'],
                'vendor-ui': ['@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot', 'lucide-react'],
                'vendor-utils': ['class-variance-authority', 'clsx', 'tailwind-merge', 'zod'],
            }
        }
    }
  }
})
