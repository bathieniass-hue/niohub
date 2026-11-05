// Service worker de NioHub : l'application s'ouvre même avec un réseau lent ou coupé.
// Stratégie : réseau d'abord (toujours la dernière version), copie gardée en secours.
// Les données (Supabase) et Google ne passent jamais par ce cache.
const VERSION='niohub-v1';
const FICHIERS=[
'./','index.html','style.css','manifest.json',
'icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','logo-n.png','conditions.html',
'app.js','commande.js','boutique.js','compte.js','messages.js','avis.js','statut.js','achats.js',
'vitrine.js','profil.js','favoris.js','raccourcis.js','boutique-fiche.js','details-produit.js','fiche-details.js','pwa.js'
];
const DELAI_RESEAU=5000;

self.addEventListener('install',e=>{
e.waitUntil((async()=>{
const cache=await caches.open(VERSION);
// Un fichier manquant n'empêche pas l'installation des autres
await Promise.all(FICHIERS.map(f=>cache.add(f).catch(()=>{})));
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
if(url.origin!==self.location.origin) return;
e.respondWith((async()=>{
const cache=await caches.open(VERSION);
try{
const rep=await Promise.race([
fetch(req),
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
