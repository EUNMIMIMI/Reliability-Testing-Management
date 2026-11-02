const CACHE_NAME = 'reliability-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// 1. 앱 설치 시 필수 파일들 캐시(저장)하기
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 필수 파일 캐싱 완료');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 오프라인 상태에서도 앱이 켜지도록 fetch 이벤트 응답하기 (중요)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then((response) => {
        // 캐시에 있으면 캐시된 것을 주고, 없으면 인터넷에서 가져옵니다.
        return response || fetch(e.request);
      })
  );
});
