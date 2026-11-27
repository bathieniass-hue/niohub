// Notifications : pastilles de nouveautés sur les icônes, cloche avec la liste, et notifications du téléphone.
// Une pastille compte ce qui est nouveau depuis la dernière ouverture de l'écran correspondant, puis disparaît.

let brutNotif={messages:[],avis:[],commandes:[],achats:[],boutique:null,support:[],nio:[]};
let compteursNotif={messages:0,avis:0,commandes:0,achats:0,favoris:0,boutique:0,boutiqueNav:0,support:0,nio:0,total:0};
let itemsNotif=[];
let notifAutresLe=0;
let notifPremiere=true;
let notifPret=false;
let notifDernierAbonnement=0;
let notifPrecedent={messages:0,avis:0,commandes:0,achats:0,boutique:0};
let notifEnCours=false;
let notifRedemande=false;

// ---------- ce que l'utilisateur a déjà vu ----------
function notifUid(){const s=(typeof lireSession==='function')?lireSession():null;return (s&&s.user_id)||null;}
function lireVu(uid){try{return JSON.parse(localStorage.getItem('niohub_vu_v1_'+uid)||'{}')||{};}catch(e){return {};}}
function ecrireVu(uid,v){try{localStorage.setItem('niohub_vu_v1_'+uid,JSON.stringify(v));}catch(e){}}
function statutsAchats(){const m={};brutNotif.achats.forEach(c=>{m[c.id]=c.statut||'À préparer';});return m;}
function derniereDate(liste){return liste.reduce((m,x)=>String(x.created_at)>m?String(x.created_at):m,'');}
function plusRecent(a,b){return String(a||'')>String(b||'')?String(a||''):String(b||'');}
function noterVu(vu,section){
if(section==='messages') vu.messages=plusRecent(vu.messages,derniereDate(brutNotif.messages));
else if(section==='avis') vu.avis=plusRecent(vu.avis,derniereDate(brutNotif.avis));
else if(section==='commandes') vu.commandes=plusRecent(vu.commandes,derniereDate(brutNotif.commandes));
else if(section==='support') vu.support=plusRecent(vu.support,derniereDate(brutNotif.support));
else if(section==='achats') vu.achats=statutsAchats();
else if(section==='favoris') vu.favoris=lireFavoris();
else if(section==='boutique'&&brutNotif.boutique) vu.boutique=brutNotif.boutique.statut||'validee';
}
function marquerVu(section){
fermerNotifsSysteme(d=>d.ouvrir===section);
const uid=notifUid();
if(!uid) return;
const vu=lireVu(uid);
noterVu(vu,section);
ecrireVu(uid,vu);
recalculerNotif();
}
function marquerToutVu(){
const uid=notifUid();
if(!uid) return;
const vu=lireVu(uid);
['messages','avis','commandes','achats','boutique','support'].forEach(k=>noterVu(vu,k));
ecrireVu(uid,vu);
recalculerNotif();
if(typeof voirNotifications==='function'&&vueCourante==='notifications') dessinerNotifications();
}
function sectionOuverte(){
const v=(typeof vueCourante!=='undefined')?vueCourante:'';
return ({conversations:'messages',chat:'messages','avis-recus':'avis','commandes-page':'commandes','achats-page':'achats',favoris:'favoris',boutique:'boutique',contact:'support'})[v]||null;
}

// ---------- notifications du téléphone : on les retire quand l'écran correspondant est ouvert ----------
async function fermerNotifsSysteme(filtre){
try{
if(!('serviceWorker' in navigator)) return;
const reg=await navigator.serviceWorker.ready;
const liste=await reg.getNotifications();
liste.forEach(n=>{if(filtre(n.data||{})) n.close();});
}catch(e){}
}
function memeDiscussion(conv,ctx){
return !!(conv&&ctx&&String(conv.v)===String(ctx.vendeurId)&&String(conv.a)===String(ctx.acheteurId)&&(!ctx.produitId||String(conv.p)===String(ctx.produitId)));
}

// ---------- récupération des données ----------
async function recupererNotif(forcer){
if(notifEnCours){notifRedemande=true;return;}
notifEnCours=true;
try{
const s=await sessionValide();
if(!s||!s.user_id){
brutNotif={messages:[],avis:[],commandes:[],achats:[],boutique:null,support:[],nio:[]};
recalculerNotif();
return;
}
const uid=s.user_id;
notifPret=true;
if(notifSysActive()&&pushPossible()&&!pushServeurActif()&&Date.now()-notifDernierAbonnement>60000){notifDernierAbonnement=Date.now();abonnerPush().catch(()=>{});}
try{
const r=await Donnees.messages.nonLusDetail(s,uid);
if(r.ok) brutNotif.messages=await r.json();
}catch(e){}
try{
const r=await Donnees.support.reponsesNonLues(s,uid);
if(r.ok) brutNotif.support=await r.json();
}catch(e){}
try{
const r=await Donnees.notifications.nonLues(s,uid);
if(r.ok) brutNotif.nio=await r.json();
}catch(e){}
const maintenant=Date.now();
if(forcer||maintenant-notifAutresLe>60000){
notifAutresLe=maintenant;
const get=async(chemin)=>{try{const r=await Donnees.lire(s,chemin);return r.ok?await r.json():null;}catch(e){return null;}};
const [avis,commandes,achats,boutique]=await Promise.all([
get('avis?select=id,auteur,note,commentaire,created_at&vendeur_id=eq.'+uid+'&order=created_at.desc&limit=50'),
get('commandes?select=id,produit,quantite,statut,created_at&vendeur_id=eq.'+uid+'&order=created_at.desc&limit=50'),
get('commandes?select=id,produit,quantite,statut,created_at&acheteur_id=eq.'+uid+'&order=created_at.desc&limit=100'),
get('boutiques?select=nom,statut&user_id=eq.'+uid+'&limit=1')
]);
if(avis) brutNotif.avis=avis;
if(commandes) brutNotif.commandes=commandes;
if(achats) brutNotif.achats=achats;
if(boutique) brutNotif.boutique=(boutique[0]&&boutique[0].statut)?boutique[0]:null;
// Premier passage de ce compte : on ne montre pas tout l'ancien comme « nouveau »
const vu=lireVu(uid);
let change=false;
if(avis&&vu.avis===undefined){vu.avis=derniereDate(avis)||'1970-01-01T00:00:00Z';change=true;}
if(commandes&&vu.commandes===undefined){vu.commandes=derniereDate(commandes)||'1970-01-01T00:00:00Z';change=true;}
if(achats&&vu.achats===undefined){vu.achats=statutsAchats();change=true;}
if(vu.favoris===undefined){vu.favoris=lireFavoris();change=true;}
if(boutique&&vu.boutique===undefined&&brutNotif.boutique){vu.boutique=brutNotif.boutique.statut;change=true;}
if(change) ecrireVu(uid,vu);
}
recalculerNotif();
}finally{
notifEnCours=false;
if(notifRedemande){notifRedemande=false;recupererNotif(false);}
}
}

// ---------- calcul des nouveautés ----------
function recalculerNotif(){
const uid=notifUid();
if(!uid){compteursNotif={messages:0,avis:0,commandes:0,achats:0,favoris:0,boutique:0,boutiqueNav:0,support:0,nio:0,total:0};itemsNotif=[];afficherCompteursNotif();return;}
const vu=lireVu(uid);
// Si l'écran concerné est ouvert en ce moment, ce qui arrive est déjà vu
const ouverte=sectionOuverte();
if(ouverte){
noterVu(vu,ouverte);
ecrireVu(uid,vu);
if(ouverte==='messages'&&vueCourante==='chat'&&typeof chatCourant!=='undefined'&&chatCourant) fermerNotifsSysteme(d=>d.ouvrir==='messages'&&memeDiscussion(d.conv,chatCourant));
else fermerNotifsSysteme(d=>d.ouvrir===ouverte);
}
const msg=brutNotif.messages.filter(m=>String(m.created_at)>(vu.messages||''));
const avis=brutNotif.avis.filter(a=>vu.avis!==undefined&&String(a.created_at)>vu.avis);
const cmd=brutNotif.commandes.filter(c=>vu.commandes!==undefined&&String(c.created_at)>vu.commandes);
const ach=brutNotif.achats.filter(c=>vu.achats!==undefined&&vu.achats[c.id]!==(c.statut||'À préparer'));
const fav=lireFavoris().filter(id=>vu.favoris!==undefined&&!vu.favoris.includes(id));
const bou=(brutNotif.boutique&&vu.boutique!==undefined&&vu.boutique!==brutNotif.boutique.statut)?[brutNotif.boutique]:[];
const sup=brutNotif.support.filter(m=>String(m.created_at)>(vu.support||''));
const c={messages:msg.length,avis:avis.length,commandes:cmd.length,achats:ach.length,favoris:fav.length,boutique:bou.length,support:sup.length,nio:brutNotif.nio.length};
c.total=c.messages+c.avis+c.commandes+c.achats+c.boutique+c.support+c.nio;
// Pastille de l'icône Boutique (barre du bas) : tout ce qui arrive vers MA boutique
c.boutiqueNav=c.avis+c.commandes+msg.filter(m=>String(m.vendeur_id)===String(uid)).length;
// Liste pour la cloche
const items=[];
const parExp=new Map();
msg.forEach(m=>{const k=m.expediteur_id||m.expediteur;if(!parExp.has(k)) parExp.set(k,[]);parExp.get(k).push(m);});
parExp.forEach(l=>{const d=l[0];items.push({cle:'messages',titre:d.expediteur||'Nouveau message',texte:(l.length>1?l.length+' nouveaux messages · ':'')+(d.texte||''),date:d.created_at,aller:()=>{if(d.vendeur_id&&d.acheteur_id) ouvrirDiscussion({p:d.produit_id,v:d.vendeur_id,a:d.acheteur_id}); else voirConversations();}});});
avis.forEach(a=>items.push({cle:'avis',titre:'Nouvel avis · '+(a.note||'?')+'/5',texte:(a.auteur?a.auteur+' : ':'')+(a.commentaire||''),date:a.created_at,aller:()=>voirAvisRecus()}));
cmd.forEach(o=>items.push({cle:'commandes',titre:'Nouvelle commande',texte:(o.produit||'')+(o.quantite?' × '+o.quantite:''),date:o.created_at,aller:()=>voirCommandes()}));
ach.forEach(o=>items.push({cle:'achats',titre:'Votre commande a changé',texte:(o.produit||'')+' : '+(o.statut||'À préparer'),date:o.created_at,aller:()=>voirAchats()}));
brutNotif.nio.length&&items.push({cle:'nio',titre:brutNotif.nio[0].titre||'Message de NioHub',texte:(brutNotif.nio.length>1?brutNotif.nio.length+' nouveaux messages · ':'')+(brutNotif.nio[0].texte||''),date:brutNotif.nio[0].created_at,aller:()=>ouvrirDetailNio(brutNotif.nio[0].id)});
sup.length&&items.push({cle:'support',titre:'Service client NioHub',texte:(sup.length>1?sup.length+' nouvelles réponses · ':'')+(sup[0].texte||''),date:sup[0].created_at,aller:()=>voirContact()});
bou.forEach(b=>items.push({cle:'boutique',titre:b.statut==='validee'?'Votre boutique est validée':b.statut==='suspendue'?'Votre boutique est suspendue':'Votre boutique est en attente de validation',texte:b.nom||'',date:new Date().toISOString(),aller:()=>voirBoutique()}));
items.sort((x,y)=>String(y.date).localeCompare(String(x.date)));
// Annonce de ce qui vient d'arriver (pas au premier chargement)
if(notifPret&&!notifPremiere){
['messages','avis','commandes','achats','boutique','support','nio'].forEach(k=>{
if(c[k]>(notifPrecedent[k]||0)) annoncerNotif(k,items.find(i=>i.cle===k));
});
}
if(notifPret) notifPremiere=false;
['messages','avis','commandes','achats','boutique','support','nio'].forEach(k=>{notifPrecedent[k]=c[k];});
compteursNotif=c;
itemsNotif=items;
afficherCompteursNotif();
if(typeof vueCourante!=='undefined'&&vueCourante==='notifications'&&detailNioId===null) dessinerNotifications();
}

function afficherCompteursNotif(){
// Pastille sur l'icône de l'application (iPhone installé, Android…)
try{
if(navigator.setAppBadge){
if((compteursNotif.total||0)>0) navigator.setAppBadge(compteursNotif.total).catch(()=>{});
else if(navigator.clearAppBadge) navigator.clearAppBadge().catch(()=>{});
}
}catch(e){}
document.querySelectorAll('[data-compteur]').forEach(el=>{
const n=compteursNotif[el.getAttribute('data-compteur')]||0;
el.textContent=n>99?'99+':String(n);
el.style.display=n>0?'block':'none';
});
}

// ---------- annonces : message dans l'appli, ou notification du téléphone ----------
function notifSysActive(){
try{return typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('niohub_notif_sys')==='1';}catch(e){return false;}
}
function annoncerNotif(cle,item){
const titre=item?item.titre:'Nouveauté';
const corps=item?item.texte:'';
if(document.visibilityState==='visible'){
if(typeof bandeau==='function') bandeau(titre+(corps?' : '+String(corps).slice(0,60):''));
}else if(notifSysActive()&&!pushServeurActif()&&navigator.serviceWorker){
navigator.serviceWorker.ready.then(reg=>reg.showNotification(titre,{body:corps,icon:'icon-192.png',badge:'icon-192.png',tag:'niohub-'+cle,renotify:true,data:{url:'./'}})).catch(()=>{});
}
}
// ---------- Notifications même application fermée (Web Push) ----------
const CLE_VAPID_PUBLIQUE='BGD0O90eHTnvelySaEXAcYBIZaTuUHTJtWFq9-82yw69R5m8xYYGODcLS97dChL6C13Rrax90-h8VKOCAzluTdg';
function pushPossible(){return 'serviceWorker' in navigator&&'PushManager' in window&&typeof Notification!=='undefined';}
function pushServeurActif(){try{return localStorage.getItem('niohub_push_actif')==='1';}catch(e){return false;}}
function cleVersOctets(b64){
const rempli=(b64+'='.repeat((4-b64.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/');
const brut=atob(rempli);
const sortie=new Uint8Array(brut.length);
for(let i=0;i<brut.length;i++) sortie[i]=brut.charCodeAt(i);
return sortie;
}
async function abonnerPush(){
const reg=await navigator.serviceWorker.ready;
let sub=await reg.pushManager.getSubscription();
if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:cleVersOctets(CLE_VAPID_PUBLIQUE)});
const j=sub.toJSON();
const s=await sessionValide();
if(!s||!s.user_id) throw new Error('session');
const r=await Donnees.push.abonner(s,j.endpoint,j.keys.p256dh,j.keys.auth);
if(!r.ok) throw new Error('serveur '+r.status);
try{localStorage.setItem('niohub_push_actif','1');}catch(e){}
}
async function desabonnerPush(){
try{
const reg=await navigator.serviceWorker.ready;
const sub=await reg.pushManager.getSubscription();
if(sub){
const s=await sessionValide();
if(s&&s.user_id){
try{await Donnees.push.desabonner(s,sub.endpoint);}catch(e){}
}
await sub.unsubscribe();
}
}catch(e){}
try{localStorage.removeItem('niohub_push_actif');}catch(e){}
}
// À la déconnexion : ce téléphone ne reçoit plus les notifications de ce compte
function retirerPushAuDepart(){
try{
const s=lireSession();
if(!s||!s.access_token||!pushPossible()) return;
navigator.serviceWorker.ready.then(reg=>reg.pushManager.getSubscription()).then(sub=>{
if(!sub) return;
return Donnees.push.desabonner(s,sub.endpoint);
}).catch(()=>{});
}catch(e){}
}
// Touche sur une notification : on ouvre l'écran concerné
function ouvrirDiscussion(conv){
const nombre=x=>/^\d+$/.test(String(x))?Number(x):x;
ouvrirChat({produitId:conv.p?nombre(conv.p):null,produitNom:'',vendeurId:conv.v,acheteurId:conv.a},'liste');
}
function ouvrirDepuisNotif(cible,conv,nid){
if(cible==='nio'){if(nid) ouvrirDetailNio(nid); else voirNotifications();return;}
if(cible==='messages'&&conv&&conv.v&&conv.a&&typeof ouvrirChat==='function'){ouvrirDiscussion(conv);return;}
const f={messages:'voirConversations',commandes:'voirCommandes',achats:'voirAchats',avis:'voirAvisRecus',boutique:'voirBoutique',support:'voirContact'}[cible];
if(f&&typeof window[f]==='function') window[f]();
}

async function basculerNotifSysteme(){
if(typeof Notification==='undefined'){bandeau('Les notifications ne sont pas disponibles sur ce navigateur.');return;}
try{
if(localStorage.getItem('niohub_notif_sys')==='1'){
localStorage.removeItem('niohub_notif_sys');
await desabonnerPush();
}else{
let p=Notification.permission;
if(p==='default') p=await Notification.requestPermission();
if(p!=='granted'){bandeau('Notifications refusées. Autorisez-les dans les réglages du téléphone.','erreur');return;}
localStorage.setItem('niohub_notif_sys','1');
if(pushPossible()){
try{await abonnerPush();bandeau('Notifications activées, même application fermée.');}
catch(e){bandeau('Activées quand l\'application est ouverte. Le serveur de notifications n\'est pas encore prêt.','erreur');}
}
}
}catch(e){}
if(typeof dessinerParametres==='function') dessinerParametres();
}
function blocNotificationsReglage(){
return vueReglageNotif({dispo:typeof Notification!=='undefined',actif:notifSysActive(),serveurActif:pushServeurActif()});
}

// ---------- écran Notifications (la cloche) ----------
VUES.push('notifications');
VUES_MENU['notifications']=0;
creerPage('notifications');

function heureRelative(iso){
const t=Date.parse(iso);
if(isNaN(t)) return '';
const m=Math.round((Date.now()-t)/60000);
if(m<1) return 'à l\'instant';
if(m<60) return 'il y a '+m+' min';
const hh=Math.round(m/60);
if(hh<24) return 'il y a '+hh+' h';
return new Date(t).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}
let inboxNio=[];
let detailNioId=null;
async function chargerInboxNio(){
try{
const s=await sessionValide();
if(!s||!s.user_id) return false;
const r=await Donnees.notifications.liste(s,100);
if(!r.ok) return false;
inboxNio=await r.json();
return true;
}catch(e){return false;}
}
function dateNio(iso){
const d=new Date(iso);
return isNaN(d.getTime())?'':d.toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
}
async function marquerNioLue(id){
const m=inboxNio.find(x=>String(x.id)===String(id));
if(m&&m.lu) return;
if(m){m.lu=true;m.lu_le=new Date().toISOString();}
brutNotif.nio=brutNotif.nio.filter(x=>String(x.id)!==String(id));
recalculerNotif();
try{
const s=await sessionValide();
if(s&&s.user_id) await Donnees.notifications.marquerLue(s,id);
}catch(e){}
fermerNotifsSysteme(d=>d.ouvrir==='nio'&&String(d.nid)===String(id));
}
async function ouvrirDetailNio(id){
if(typeof montrer==='function'&&vueCourante!=='notifications') montrer('notifications');
detailNioId=id;
if(!inboxNio.some(x=>String(x.id)===String(id))) await chargerInboxNio();
dessinerNotifications();
marquerNioLue(id);
}
let autresNotif=[];   // nouveautés affichées dans la cloche (pour retrouver celle qu'on touche)
function dessinerNotifications(){
const page=document.getElementById('notifications');
// ----- détail d'un message de NioHub -----
if(detailNioId!==null){
const m=inboxNio.find(x=>String(x.id)===String(detailNioId));
page.innerHTML=vueNotifDetail(m?{titre:m.titre||'Message de NioHub',date:dateNio(m.created_at),texte:m.texte}:null);
return;
}
// ----- liste : messages de NioHub (ils restent) + nouveautés (elles disparaissent quand on les ouvre) -----
autresNotif=itemsNotif.filter(i=>i.cle!=='nio');
page.innerHTML=vueNotifications({
nio:inboxNio.map(m=>({id:m.id,lu:!!m.lu,titre:m.titre||'Message de NioHub',texte:m.texte,heure:heureRelative(m.created_at)})),
autres:autresNotif.map((it,i)=>({i:i,titre:it.titre,texte:it.texte,heure:heureRelative(it.date)}))
});
}
// Flèche ← : du détail vers la liste, de la liste vers l'accueil
function retourNotifications(){
if(detailNioId!==null){detailNioId=null;dessinerNotifications();}
else voirAccueil();
}
function allerNotif(i){
const it=autresNotif[i];
if(it&&typeof it.aller==='function') it.aller();
}

async function voirNotifications(){
detailNioId=null;
dessinerNotifications();
montrer('notifications');
if(await chargerInboxNio()&&vueCourante==='notifications'&&detailNioId===null) dessinerNotifications();
}


// ---------- Fenêtre « Activez les notifications » ----------
// Affichée dès la première visite (sur l'accueil), puis de temps en temps tant que les notifications ne sont pas activées.
const CLE_DEMANDE='niohub_notif_demande';
function etatDemande(){
try{return JSON.parse(localStorage.getItem(CLE_DEMANDE)||'null')||{n:0,prochaine:0};}catch(e){return {n:0,prochaine:0};}
}
function reporterDemande(){
const e=etatDemande();
e.n=(e.n||0)+1;
e.prochaine=Date.now()+86400000; // les notifications sont importantes : on redemande tous les jours
try{localStorage.setItem(CLE_DEMANDE,JSON.stringify(e));}catch(x){}
}
function estIphone(){return /iPhone|iPad|iPod/.test(navigator.userAgent||'');}
function estInstallee(){
try{return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;}catch(e){return false;}
}
function demandeNecessaire(){
const iphoneNonInstalle=estIphone()&&!estInstallee();
if(typeof Notification==='undefined'&&!iphoneNonInstalle) return false; // navigateur sans notifications
if(!iphoneNonInstalle){
if(notifSysActive()) return false;
if(Notification.permission==='denied') return false; // refusé dans les réglages : inutile de redemander
}
return Date.now()>=etatDemande().prochaine;
}
function conditionsDemandeOk(){
if(document.visibilityState!=='visible') return false;
const auth=document.getElementById('auth');
if(auth&&auth.style.display==='block') return false; // écran de connexion en cours
return typeof vueCourante!=='undefined'&&vueCourante==='accueil';
}
function fermerDemandeNotif(){
const f=document.getElementById('demande-notif');
if(f) f.remove();
}
function afficherDemandeNotif(){
if(document.getElementById('demande-notif')) return;
const fond=document.createElement('div');
fond.id='demande-notif';
fond.className='dnotif-fond';
fond.innerHTML=vueDemandeNotif(estIphone()&&!estInstallee());
document.body.append(fond);
}
function reporterEtFermerDemande(){
reporterDemande();
fermerDemandeNotif();
}
async function accepterDemandeNotif(){
if(estIphone()&&!estInstallee()){reporterEtFermerDemande();return;}
const oui=document.querySelector('#demande-notif .dnotif-oui');
if(oui) oui.disabled=true;
try{await basculerNotifSysteme();}catch(e){}
if(!notifSysActive()) reporterDemande();
fermerDemandeNotif();
}

setInterval(()=>{
if(document.getElementById('demande-notif')) return;
if(!demandeNecessaire()||!conditionsDemandeOk()) return;
afficherDemandeNotif();
},4000);

// ---------- branchements ----------
function envelopperOuverture(nom,section){
const f=window[nom];
if(typeof f!=='function'||f.__notif) return;
const w=function(){marquerVu(section);return f.apply(this,arguments);};
w.__notif=true;
window[nom]=w;
}
function demarrerNotif(){
const ouvrirChatAvant=window.ouvrirChat;
if(typeof ouvrirChatAvant==='function'&&!ouvrirChatAvant.__notif){
const w=function(ctx){try{fermerNotifsSysteme(d=>d.ouvrir==='messages'&&memeDiscussion(d.conv,ctx));}catch(e){}return ouvrirChatAvant.apply(this,arguments);};
w.__notif=true;
window.ouvrirChat=w;
}
envelopperOuverture('voirConversations','messages');
envelopperOuverture('voirAvisRecus','avis');
envelopperOuverture('voirCommandes','commandes');
envelopperOuverture('voirAchats','achats');
envelopperOuverture('voirFavoris','favoris');
envelopperOuverture('voirBoutique','boutique');
envelopperOuverture('voirContact','support');
// la pastille « messages » existante est désormais gérée ici
majCompteurs=function(){return recupererNotif(false);};
recupererNotif(true);
// Un téléphone qui avait activé les notifications avant la mise en place du serveur (ou dont l'abonnement a été perdu) se réabonne tout seul
if(notifSysActive()&&pushPossible()) abonnerPush().catch(()=>{});
// Ouverture depuis une notification (application fermée ou déjà ouverte)
try{
const q=new URLSearchParams(location.search);
const cible=q.get('ouvrir');
const conv=(q.get('v')&&q.get('a'))?{p:q.get('p'),v:q.get('v'),a:q.get('a')}:null;
const nid=q.get('nid');
if(cible){history.replaceState(null,'',location.pathname);setTimeout(()=>ouvrirDepuisNotif(cible,conv,nid),700);setTimeout(()=>{if(cible==='nio'||!conv||typeof vueCourante==='undefined'||vueCourante!=='chat') ouvrirDepuisNotif(cible,conv,nid);},1800);}
}catch(e){}
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',ev=>{if(ev.data&&ev.data.ouvrir) ouvrirDepuisNotif(ev.data.ouvrir,ev.data.conv||null,ev.data.nid||null);});
}
function majCompteurs(){return recupererNotif(false);}
// Le calcul des pastilles et des notifications attend que l'accueil soit affiché
if(document.readyState==='complete') apresAccueil(demarrerNotif,1200);
else window.addEventListener('load',()=>apresAccueil(demarrerNotif,1200));
