/* QLEAR 오프라인 지원: 인터넷이 끊겨도 앱을 열고 이 기기에 저장된 문제집·BLOCK·기출 팩으로 공부할 수 있게.
   - 앱 화면(html): 인터넷이 되면 늘 새 버전(네트워크 먼저), 끊기면 마지막으로 받아 둔 버전
   - 도구(pdf.js·글자 인식·글꼴): 한 번 받으면 저장해 두고 그것을 쓴다(버전이 주소에 들어 있어 바뀌지 않음) */
const CACHE = 'qlear-v3';   /* v3: 새 버전을 받아 두기 전에 일꾼이 꺼져 계속 예전 화면이 나오던 것 고침 */
/* 처음 한 번 인터넷이 될 때 모두 받아 둔다: 앱 화면 + PDF 도구 + 글자 인식(영어·한글) + 보안 PDF 풀기 + 손글씨 엔진 */
const PRE = ['./', './index.html', './fillin.html', './beta.html', './lib/pdf.min.js', './lib/pdf.worker.min.js',
  './lib/tess/tesseract.min.js', './lib/tess/worker.min.js', './lib/tess/core/tesseract-core-simd-lstm.wasm.js', './lib/tess/core/tesseract-core-lstm.wasm.js',
  './lib/tess/eng/eng.traineddata.gz', './lib/tess/kor/kor.traineddata.gz', './lib/qpdf/qpdf.js', './lib/qpdf/qpdf.wasm',
  './lib/engine-v2.json', './lib/packinfo-v3.json'];
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
        const old = await c.match(key, { ignoreSearch: true });
        const net = fetch(r, { cache: 'no-cache' }).then(async res => {   /* 브라우저 저장본(최대 10분)도 건너뛰고 서버에 새 버전 확인 */
          if (res.ok) { await c.put(key, res.clone());
            /* 저장본을 먼저 보여 줬는데 서버 것이 다르면 화면에 '새 버전' 알림 */
            if (old && (old.headers.get('etag') || old.headers.get('last-modified')) !== (res.headers.get('etag') || res.headers.get('last-modified'))) {
              const cl = await self.clients.matchAll({ type: 'window' }); cl.forEach(x => x.postMessage({ type: 'qlear-new' })) } }
          return res });
        e.waitUntil(net.then(() => {}, () => {}));   /* 화면을 넘겨준 뒤에도 끝까지 받아 저장하게 (전엔 일꾼이 먼저 꺼져 저장이 안 됨 → 계속 예전 버전) */
        if (!old) return net.catch(async () => (await c.match('./index.html')) || Response.error());
        return Promise.race([net.catch(() => old), new Promise(ok => setTimeout(() => ok(old), self.navigator && navigator.onLine === false ? 0 : 8000))]);
      })());
      return;
    }
    if (u.pathname.includes('/lib/') && !u.pathname.includes('/lib/pack/')) {   // 기출 팩 조각은 저장하지 않음(앱이 IndexedDB에 넣음)
       e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(r, res.clone())); return res }))); }
    return;
  }
  if (TOOL.test(u.hostname)) {   // 도구: 저장본 먼저, 없으면 받아서 저장
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)) } return res })));
  }
});
