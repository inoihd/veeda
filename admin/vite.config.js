import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/admin/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/admin/',
      scope: '/admin/',
      manifest: {
        name: 'Veeda Admin',
        short_name: 'VeedaAdmin',
        description: 'Painel de administração do Veeda',
        theme_color: '#7c3aed',
        background_color: '#1e1b2e',
        display: 'standalone',
        start_url: '/admin/',
        scope: '/admin/',
        icons: [
          {
            src: '/admin/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/admin/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/admin/index.html',
        navigateFallbackAllowlist: [/^\/admin/]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5174
  }
})
