/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// base 用相对路径,便于在 GitHub Pages 子路径下部署;如部署到自定义域名根路径可改为 '/'
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '简历投递管理',
        short_name: '投递管理',
        description: '本地优先的简历投递与面试管理工具',
        lang: 'zh-CN',
        theme_color: '#1E293B',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
