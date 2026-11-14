// Service worker de NioHub : l'application s'ouvre même avec un réseau lent ou coupé.
// Stratégie : réseau d'abord (toujours la dernière version), copie gardée en secours.
// Les données (Supabase) et Google ne passent jamais par ce cache.
const VERSION='niohub-f6d3dcde61'; // remplacé automatiquement à chaque livraison
const FICHIERS=[
'./','index.html','style.css','manifest.json','conditions.html',
'icones-nav.png','icones-accueil.png','icones-favoris.png','icones-boutique.png','icones-liste.png','icones-categories.png','icones-liste-clair.png','icones-categories-clair.png','icone-crayon.png','icone-retour.png','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','logo-n.png',
'donnees-hors-ligne.js','bandeau.js','app.js','commande.js','boutique.js','compte.js','messages.js','avis.js','statut.js','achats.js',
'vitrine.js','profil.js','parametres.js','notifications.js','favoris.js','raccourcis.js','boutique-fiche.js','details-produit.js','ajout-produit.js','fiche-details.js','pwa.js'
];
const DELAI_RESEAU=5000;
const CACHE_PHOTOS='niohub-photos';   // photos des produits, boutiques et profils : gardées dans le téléphone
const MAX_PHOTOS=400;

function estPhoto(url,req){
if(req.destination!=='image') return false;
return (url.hostname.endsWith('.supabase.co')&&url.pathname.indexOf('/storage/v1/object/public/')===0)||url.hostname.endsWith('googleusercontent.com');
}
async function elaguerPhotos(cache){
try{
const cles=await cache.keys();
if(cles.length>MAX_PHOTOS) for(const k of cles.slice(0,cles.length-MAX_PHOTOS)) await cache.delete(k);
}catch(e){}
}
// Une photo ne change pas (même adresse = même image) : copie d'abord, réseau ensuite
async function photoEnCache(req){
const cache=await caches.open(CACHE_PHOTOS);
const copie=await cache.match(req);
if(copie) return copie;
try{
// Demande « normale » (CORS) : réponse lisible et peu coûteuse à garder
const rep=await fetch(req.url,{mode:'cors',credentials:'omit'});
if(rep&&rep.ok){cache.put(req,rep.clone());elaguerPhotos(cache);return rep;}
}catch(e){}
try{return await fetch(req);}catch(e){return Response.error();}
}

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
await Promise.all(noms.filter(n=>n!==VERSION&&n!==CACHE_PHOTOS).map(n=>caches.delete(n)));
await self.clients.claim();
})());
});

self.addEventListener('fetch',e=>{
const req=e.request;
if(req.method!=='GET') return;
const url=new URL(req.url);
if(url.origin!==self.location.origin){
if(estPhoto(url,req)) e.respondWith(photoEnCache(req));
return;
}
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

// Pastille sur l'icône de l'application : nombre de notifications encore affichées (iPhone, et Android quand c'est possible)
async function majPastilleApp(){
try{
const n=(await self.registration.getNotifications()).length;
const nav=self.navigator;
if(nav&&nav.setAppBadge){
if(n>0) await nav.setAppBadge(n); else await nav.clearAppBadge();
}
}catch(e){}
}

// Photo de la discussion avec le logo NioHub en bas à droite (Android ; l'iPhone affiche toujours le logo de l'application)
async function iconeComposee(urlPhoto){
try{
if(!urlPhoto||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined') return null;
const [rp,rl]=await Promise.all([fetch(urlPhoto,{mode:'cors'}),fetch('icon-192.png')]);
if(!rp.ok||!rl.ok) return null;
const [bp,bl]=await Promise.all([createImageBitmap(await rp.blob()),createImageBitmap(await rl.blob())]);
const T=192;
const c=new OffscreenCanvas(T,T);
const g=c.getContext('2d');
const m=Math.min(bp.width,bp.height);
g.save();
g.beginPath();g.arc(T/2,T/2,T/2,0,Math.PI*2);g.clip();
g.drawImage(bp,(bp.width-m)/2,(bp.height-m)/2,m,m,0,0,T,T);
g.restore();
const L=76,x=T-L-4,y=T-L-4;
g.beginPath();g.arc(x+L/2,y+L/2,L/2+4,0,Math.PI*2);g.fillStyle='#ffffff';g.fill();
g.save();
g.beginPath();g.arc(x+L/2,y+L/2,L/2,0,Math.PI*2);g.clip();
g.drawImage(bl,x,y,L,L);
g.restore();
const blob=await c.convertToBlob({type:'image/png'});
return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>res(null);fr.readAsDataURL(blob);});
}catch(e){return null;}
}

// Pastille sur l'icône de l'application : nombre de notifications encore affichées (iPhone, et Android quand c'est possible)
async function majPastilleApp(){
try{
const n=(await self.registration.getNotifications()).length;
const nav=self.navigator;
if(nav&&nav.setAppBadge){
if(n>0) await nav.setAppBadge(n); else await nav.clearAppBadge();
}
}catch(e){}
}

// Notification reçue du serveur (même application fermée)
self.addEventListener('push',e=>{
let d={};
try{d=e.data?e.data.json():{};}catch(err){d={titre:'NioHub',corps:e.data?e.data.text():''};}
e.waitUntil((async()=>{
const fenetres=await clients.matchAll({type:'window',includeUncontrolled:true});
const ios=/iPhone|iPad|iPod/.test(self.navigator.userAgent||'');
// Application ouverte devant l'utilisateur : elle s'affiche déjà elle-même (sauf sur iPhone, qui exige toujours une notification)
if(!ios&&fenetres.some(f=>f.visibilityState==='visible')) return;
const icone=(await iconeComposee(d.photo))||'icon-192.png';
// Chaque notification est séparée : les anciennes ne sont plus remplacées
await self.registration.showNotification(d.titre||'NioHub',{body:d.corps||'',icon:icone,badge:'icon-192.png',tag:(d.tag||'niohub')+'-'+Date.now(),timestamp:Date.now(),data:{ouvrir:d.ouvrir||'',conv:d.conv||null}});
await majPastilleApp();
})());
});

self.addEventListener('notificationclose',e=>{e.waitUntil(majPastilleApp());});

// Appui sur une notification : on ramène l'application au premier plan, sur le bon écran (la bonne discussion pour un message)
self.addEventListener('notificationclick',e=>{
e.notification.close();
const data=e.notification.data||{};
const cible=data.ouvrir||'';
const conv=data.conv||null;
let url='./';
if(cible){
url+='?ouvrir='+encodeURIComponent(cible);
if(conv&&conv.v&&conv.a) url+='&p='+encodeURIComponent(conv.p==null?'':conv.p)+'&v='+encodeURIComponent(conv.v)+'&a='+encodeURIComponent(conv.a);
}
e.waitUntil((async()=>{
await majPastilleApp();
const fenetres=await clients.matchAll({type:'window',includeUncontrolled:true});
const f=fenetres.find(x=>x.visibilityState==='visible')||fenetres[0];
if(f){
if(f.visibilityState==='visible'){
if(cible) f.postMessage({ouvrir:cible,conv:conv});
try{await f.focus();}catch(err){}
return;
}
// Application en arrière-plan : on la recharge directement sur le bon écran (plus fiable qu'un simple message)
try{await f.focus();}catch(err){}
try{if(f.navigate&&cible){await f.navigate(url);return;}}catch(err){}
if(cible) f.postMessage({ouvrir:cible,conv:conv});
return;
}
if(clients.openWindow) return clients.openWindow(url);
})());
});
