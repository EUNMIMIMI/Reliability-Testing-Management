import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 앱에 새로운 변경사항이 생기면 자동으로 업데이트
      manifest: {
        name: '신뢰성시험 관리대장', // 앱 설치 시 나타날 긴 이름
        short_name: '신뢰성대장', // 스마트폰 바탕화면에 표시될 짧은 이름
        description: '부서 신뢰성시험 일정 및 데이터 관리 앱',
        theme_color: '#ffffff', // 앱 상단바 색상
        background_color: '#f9fafb', // 앱 로딩 화면 배경색
        display: 'standalone', // 인터넷 주소창을 숨기고 진짜 앱처럼 보이게 하는 마법의 설정
        icons: [
          {
            src: '/vite.svg', // 기본 아이콘 (임시)
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})