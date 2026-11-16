// Données hors ligne : chaque lecture faite sur le serveur est gardée dans le téléphone (IndexedDB).
// Sans connexion, ou si la connexion est très lente, l'appli affiche la dernière copie : discussions, commandes, avis, boutique, profil…
// Ce fichier doit être chargé AVANT les autres : il enveloppe la fonction fetch.

(function(){
const NOM_BASE='niohub_donnees';
const MAX_ENTREES=250;
const DELAI_LENT=6000;      // au-delà, on montre la copie gardée pendant que le serveur répond encore
const derniereSauvegarde={};
let basePromesse=null;

function ouvrirBase(){
if(basePromesse) return basePromesse;
basePromesse=new Promise((ok,ko)=>{
try{
const r=indexedDB.open(NOM_BASE,1);
r.onupgradeneeded=()=>{r.result.createObjectStore('reponses',{keyPath:'cle'});};
r.onsuccess=()=>ok(r.result);
r.onerror=()=>ko(r.error);
}catch(e){ko(e);}
});
basePromesse.catch(()=>{basePromesse=null;});
return basePromesse;
}
async function lire(cle){
const db=await ouvrirBase();
return new Promise(res=>{
const q=db.transaction('reponses','readonly').objectStore('reponses').get(cle);
q.onsuccess=()=>res(q.result||null);
q.onerror=()=>res(null);
});
}
async function ecrire(entree){
const db=await ouvrirBase();
return new Promise(res=>{
const t=db.transaction('reponses','readwrite');
t.objectStore('reponses').put(entree);
t.oncomplete=()=>res(true);
t.onerror=()=>res(false);
});
}
async function elaguer(){
try{
const db=await ouvrirBase();
const toutes=await new Promise(res=>{const q=db.transaction('reponses','readonly').objectStore('reponses').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([]);});
if(toutes.length<=MAX_ENTREES) return;
toutes.sort((a,b)=>a.date-b.date);
const t=db.transaction('reponses','readwrite');
toutes.slice(0,toutes.length-MAX_ENTREES).forEach(x=>t.objectStore('reponses').delete(x.cle));
}catch(e){}
}
function uidCourant(){
try{const s=JSON.parse(localStorage.getItem('niohub_session_v2')||'null');return (s&&s.user_id)||'anon';}catch(e){return 'anon';}
}
function estLectureApi(url){
return typeof SUPABASE_URL!=='undefined'&&url.indexOf(SUPABASE_URL+'/rest/v1/')===0&&url.indexOf('/rpc/')===-1&&url.indexOf('created_at=gte.')===-1;
}
function reponseDepuis(c){
return new Response(c.corps,{status:200,headers:{'Content-Type':'application/json','x-niohub-cache':'1'}});
}
async function sauvegarder(cle,uid,rep){
try{
const maintenant=Date.now();
if(derniereSauvegarde[cle]&&maintenant-derniereSauvegarde[cle]<20000) return; // pas plus d'une copie toutes les 20 s
derniereSauvegarde[cle]=maintenant;
const corps=await rep.text();
if(await ecrire({cle:cle,uid:uid,corps:corps,date:maintenant})&&Math.random()<0.05) elaguer();
}catch(e){}
}

const fetchOrigine=window.fetch.bind(window);
window.fetch=function(entree,options){
const url=typeof entree==='string'?entree:((entree&&entree.url)||'');
const methode=String((options&&options.method)||(entree&&entree.method)||'GET').toUpperCase();
if(methode!=='GET'||!estLectureApi(url)) return fetchOrigine(entree,options);
const uid=uidCourant();
const cle=uid+'|'+url;
return new Promise((resolve,reject)=>{
let fini=false;
const minuteur=setTimeout(async()=>{
if(fini) return;
const c=await lire(cle).catch(()=>null);
if(c&&!fini){fini=true;resolve(reponseDepuis(c));}
},DELAI_LENT);
fetchOrigine(entree,options).then(rep=>{
if(rep.ok) sauvegarder(cle,uid,rep.clone());
if(!fini){fini=true;clearTimeout(minuteur);resolve(rep);}
}).catch(async err=>{
if(fini) return;
clearTimeout(minuteur);
const c=await lire(cle).catch(()=>null);
fini=true;
if(c) resolve(reponseDepuis(c)); else reject(err);
});
});
};

// À la déconnexion : on efface toutes les copies privées de ce téléphone
window.effacerDonneesHorsLigne=async function(){
try{
const db=await ouvrirBase();
await new Promise(res=>{
const t=db.transaction('reponses','readwrite');
const st=t.objectStore('reponses');
const cur=st.openCursor();
cur.onsuccess=()=>{const c=cur.result;if(c){if(c.value.uid!=='anon') c.delete();c.continue();}};
t.oncomplete=()=>res();
t.onerror=()=>res();
});
}catch(e){}
};

// Chargement automatique en arrière-plan : une fois l'accueil affiché, on télécharge les écrans de l'utilisateur
// (discussions, commandes, achats, avis, boutique, profil, service client) pour qu'ils s'ouvrent aussi sans connexion.
// Les adresses sont les mêmes que celles des écrans, pour que la copie soit retrouvée hors ligne.
let derniereCopie=0;
window.prechargerHorsLigne=async function(forcer){
try{
if(!navigator.onLine) return;
const c=navigator.connection;
if(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||''))) return; // on économise la connexion lente
if(typeof sessionValide!=='function'||typeof entetesAuth!=='function') return;
const maintenant=Date.now();
if(!forcer&&maintenant-derniereCopie<300000) return; // au plus une fois toutes les 5 minutes
derniereCopie=maintenant;
const s=await sessionValide();
if(!s||!s.user_id) return;
const uid=s.user_id;
const h=entetesAuth(s);
const B=SUPABASE_URL+'/rest/v1/';
const lire=async chemin=>{try{const r=await fetch(B+chemin,{headers:h});return r.ok?await r.json():null;}catch(e){return null;}};
const [msgs]=await Promise.all([
lire('messages?select=*&order=created_at.desc&limit=500'),
lire('commandes?select=*&acheteur_id=eq.'+uid+'&order=created_at.desc'),
lire('commandes?select=*&vendeur_id=eq.'+uid+'&order=created_at.desc'),
lire('boutiques?select=*&user_id=eq.'+uid+'&limit=1'),
lire('profils?select=*&user_id=eq.'+uid),
lire('avis?select=*&vendeur_id=eq.'+uid+'&order=created_at.desc&limit=200'),
lire('support_messages?select=*&user_id=eq.'+uid+'&order=created_at.asc&limit=300')
]);
// chaque discussion (les 30 plus récentes), pour qu'elles s'ouvrent avec tous leurs messages
if(msgs&&typeof filtreConversation==='function'){
const vues=new Set();
for(const m of msgs){
const k=m.acheteur_id+'|'+m.vendeur_id;
if(vues.has(k)||vues.size>=30) continue;
vues.add(k);
await lire('messages?select=*&'+filtreConversation({acheteurId:m.acheteur_id,vendeurId:m.vendeur_id})+'&order=created_at.asc&limit=300');
}
}
}catch(e){}
};
window.addEventListener('online',()=>{setTimeout(()=>{if(typeof window.prechargerHorsLigne==='function') window.prechargerHorsLigne();},3000);});
})();
