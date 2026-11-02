self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // PWA 설치 요건을 충족하기 위한 빈 파일입니다.
});
