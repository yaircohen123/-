const CACHE_NAME = 'maaser-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon-apple-180.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  var isPage = event.request.mode === 'navigate' || event.request.url.endsWith('/index.html') || event.request.url.endsWith('.html');

  if (isPage){
    /* דף ה-HTML עצמו: תמיד לנסות רשת קודם (כדי שעדכונים יגיעו מיד). אם הרשת
       לא עונה תוך זמן סביר (נפוץ כשפותחים אפליקציה מותקנת אחרי שהייתה
       ברקע) — או נכשלת לגמרי — נופלים לגרסה השמורה במקום להראות מסך ריק. */
    event.respondWith(
      Promise.race([
        fetch(event.request).then(function(response){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
          return response;
        }).catch(function(){ return null; }),
        new Promise(function(resolve){
          setTimeout(function(){ resolve(null); }, 4000);
        })
      ]).then(function(response){
        if (response) return response;
        return caches.match(event.request).then(function(cached){ return cached || caches.match('./index.html'); });
      }).catch(function(){
        return caches.match(event.request).then(function(cached){ return cached || caches.match('./index.html'); });
      })
    );
    return;
  }

  /* קבצים סטטיים (אייקונים, manifest): קאש קודם, מהיר ולא משתנה כמעט. */
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request).then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return response;
      }).catch(function(){ return cached; });
    })
  );
});
