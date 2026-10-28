import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      includeAssets: ['logo.png'], // 아이콘 파일을 확실하게 포함시킴
      manifest: {
        name: '신뢰성시험 관리대장', 
        short_name: '신뢰성대장', 
        description: '부서 신뢰성시험 일정 및 데이터 관리 앱',
        theme_color: '#ffffff', 
        background_color: '#f9fafb', 
        display: 'standalone', 
        icons: [
          {
            src: 'logo.png', // 앞의 슬래시(/)를 빼는 것이 더 안정적입니다.
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})