/* lmaaify service worker
   Shell is cached so the launcher opens instantly and works with no signal.
   HTML is network-first so a deploy is picked up on the next online load. */
var CACHE = "lmaaify-v1";
var SHELL = [
  "./ask/",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./favicon.svg"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){})
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE) return caches["delete"](k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // never touch Google or the fonts CDN

  if (req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then(function(res){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
          return res;
        })
        .catch(function(){
          return caches.match(req).then(function(hit){
            return hit || caches.match("./ask/");
          });
        })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        if (res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    }).catch(function(){ return fetch(req); })
  );
});
