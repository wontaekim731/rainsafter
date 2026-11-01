/* QLEAR 오프라인 지원: 인터넷이 끊겨도 앱을 열고 이 기기에 저장된 문제집·BLOCK·기출 팩으로 공부할 수 있게.
   - 앱 화면(html): 인터넷이 되면 늘 새 버전(네트워크 먼저), 끊기면 마지막으로 받아 둔 버전
   - 도구(pdf.js·글자 인식·글꼴): 한 번 받으면 저장해 두고 그것을 쓴다(버전이 주소에 들어 있어 바뀌지 않음) */
const CACHE = 'qlear-v1';
const PRE = ['./', './index.html', './fillin.html', './beta.html', './lib/pdf.min.js', './lib/pdf.worker.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRE.map(u => fetch(u, { cache: 'reload' }).then(r => { if (r.ok) return c.put(u, r) }).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('qlear-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const TOOL = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    const page = r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/');
    if (page) {   // 네트워크 먼저, 4초 넘게 응답이 없으면 저장본
      e.respondWith((async () => {
        const c = await caches.open(CACHE), key = u.pathname.endsWith('/') ? './index.html' : u.pathname;
        const net = fetch(r).then(res => { if (res.ok) c.put(key, res.clone()); return res });
        const old = await c.match(key, { ignoreSearch: true });
        if (!old) return net.catch(async () => (await c.match('./index.html')) || Response.error());
        return Promise.race([net.catch(() => old), new Promise(ok => setTimeout(() => ok(old), 4000))]);
      })());
      return;
    }
    if (u.pathname.includes('/lib/')) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(r, res.clone())); return res }))); }
    return;
  }
  if (TOOL.test(u.hostname)) {   // 도구: 저장본 먼저, 없으면 받아서 저장
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)) } return res })));
  }
});
