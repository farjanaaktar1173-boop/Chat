/* sw.js — Network-first: সবসময় নতুন ফাইল নেয়, নেট না থাকলে শেষ সংরক্ষিত কপি দেখায় (আপডেট আটকে থাকবে না) */
const CACHE = 'moi-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   /* Firebase/অন্য সাইট ছুঁই না */
    e.respondWith(
        fetch(req).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
            return res;
        }).catch(() => caches.match(req))
    );
});
