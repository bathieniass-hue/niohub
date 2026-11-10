// Service worker de NioHub : l'application s'ouvre même avec un réseau lent ou coupé.
// Stratégie : réseau d'abord (toujours la dernière version), copie gardée en secours.
// Les données (Supabase) et Google ne passent jamais par ce cache.
const VERSION='niohub-20261110-a'; // remplacé automatiquement à chaque livraison
const FICHIERS=[
'./','index.html','style.css','manifest.json','conditions.html',
'icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','logo-n.png',
'bandeau.js','app.js','commande.js','boutique.js','compte.js','messages.js','avis.js','statut.js','achats.js',
'vitrine.js','profil.js','favoris.js','raccourcis.js','boutique-fiche.js','details-produit.js','fiche-details.js','pwa.js'
];
const DELAI_RESEAU=5000;

self.addEventListener('install',e=>{
e.waitUntil((async()=>{
const cache=await caches.open(VERSION);
await Promise.all(FICHIERS.map(f=>cache.add(new Request(f,{cache:'reload'})).catch(()=>{})));
await self.skipWaiting();
})());
});

self.addEventListener('activate',e=>{
e.waitUntil((async()=>{
const noms=await caches.keys();
await Promise.all(noms.filter(n=>n!==VERSION).map(n=>caches.delete(n)));
await self.clients.claim();
})());
});

self.addEventListener('fetch',e=>{
const req=e.request;
if(req.method!=='GET') return;
const url=new URL(req.url);
// Images Supabase : cache immédiat, mise à jour silencieuse en arrière-plan
if(url.hostname.endsWith('supabase.co')&&url.pathname.startsWith('/storage/v1/object/public/photos/')){
e.respondWith((async()=>{
const cache=await caches.open(VERSION);
const copie=await cache.match(req);
const miseAJour=fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r;}).catch(()=>null);
if(copie) return copie;
const r=await miseAJour;
return r||Response.error();
})());
return;
}
if(url.origin!==self.location.origin) return;
if(url.pathname.endsWith('/version.json')) return;
e.respondWith((async()=>{
const cache=await caches.open(VERSION);
try{
const rep=await Promise.race([
fetch(req,{cache:'no-cache'}),
new Promise((_,ko)=>setTimeout(()=>ko(new Error('delai')),DELAI_RESEAU))
]);
if(rep&&rep.ok) cache.put(req,rep.clone());
return rep;
}catch(err){
const copie=await cache.match(req);
if(copie) return copie;
if(req.mode==='navigate'){
const accueil=await cache.match('index.html');
if(accueil) return accueil;
}
return Response.error();
}
})());
});