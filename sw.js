// Service worker de NioHub : l'application s'ouvre même avec un réseau lent ou coupé.
// Stratégie : réseau d'abord (toujours la dernière version), copie gardée en secours.
// Les données (Supabase) et Google ne passent jamais par ce cache.
const VERSION='niohub-1bdf0581e5'; // remplacé automatiquement à chaque livraison
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
// Un fichier manquant n'empêche pas l'installation des autres
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
if(url.origin!==self.location.origin) return;
// Le contrôle de version va toujours directement sur le réseau
if(url.pathname.endsWith('/version.json')) return;
e.respondWith((async()=>{
const cache=await caches.open(VERSION);
try{
// "no-cache" : on vérifie toujours auprès du serveur (et pas dans le cache de 10 minutes de GitHub)
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
