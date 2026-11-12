// Notifications : pastilles de nouveautés sur les icônes, cloche avec la liste, et notifications du téléphone.
// Une pastille compte ce qui est nouveau depuis la dernière ouverture de l'écran correspondant, puis disparaît.

let brutNotif={messages:[],avis:[],commandes:[],achats:[],boutique:null};
let compteursNotif={messages:0,avis:0,commandes:0,achats:0,favoris:0,boutique:0,total:0};
let itemsNotif=[];
let notifAutresLe=0;
let notifPremiere=true;
let notifPret=false;
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
else if(section==='achats') vu.achats=statutsAchats();
else if(section==='favoris') vu.favoris=lireFavoris();
else if(section==='boutique'&&brutNotif.boutique) vu.boutique=brutNotif.boutique.statut||'validee';
}
function marquerVu(section){
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
['messages','avis','commandes','achats','boutique'].forEach(k=>noterVu(vu,k));
ecrireVu(uid,vu);
recalculerNotif();
if(typeof voirNotifications==='function'&&vueCourante==='notifications') dessinerNotifications();
}
function sectionOuverte(){
const v=(typeof vueCourante!=='undefined')?vueCourante:'';
return ({conversations:'messages',chat:'messages','avis-recus':'avis','commandes-page':'commandes','achats-page':'achats',favoris:'favoris',boutique:'boutique'})[v]||null;
}

// ---------- récupération des données ----------
async function recupererNotif(forcer){
if(notifEnCours){notifRedemande=true;return;}
notifEnCours=true;
try{
const s=await sessionValide();
if(!s||!s.user_id){
brutNotif={messages:[],avis:[],commandes:[],achats:[],boutique:null};
recalculerNotif();
return;
}
const uid=s.user_id;
notifPret=true;
const h=entetesAuth(s);
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=id,expediteur,expediteur_id,texte,produit,created_at&lu=eq.false&expediteur_id=neq.'+uid+'&order=created_at.desc&limit=99',{headers:h});
if(r.ok) brutNotif.messages=await r.json();
}catch(e){}
const maintenant=Date.now();
if(forcer||maintenant-notifAutresLe>60000){
notifAutresLe=maintenant;
const get=async(chemin)=>{try{const r=await fetch(SUPABASE_URL+'/rest/v1/'+chemin,{headers:h});return r.ok?await r.json():null;}catch(e){return null;}};
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
if(!uid){compteursNotif={messages:0,avis:0,commandes:0,achats:0,favoris:0,boutique:0,total:0};itemsNotif=[];afficherCompteursNotif();return;}
const vu=lireVu(uid);
// Si l'écran concerné est ouvert en ce moment, ce qui arrive est déjà vu
const ouverte=sectionOuverte();
if(ouverte){noterVu(vu,ouverte);ecrireVu(uid,vu);}
const msg=brutNotif.messages.filter(m=>String(m.created_at)>(vu.messages||''));
const avis=brutNotif.avis.filter(a=>vu.avis!==undefined&&String(a.created_at)>vu.avis);
const cmd=brutNotif.commandes.filter(c=>vu.commandes!==undefined&&String(c.created_at)>vu.commandes);
const ach=brutNotif.achats.filter(c=>vu.achats!==undefined&&vu.achats[c.id]!==(c.statut||'À préparer'));
const fav=lireFavoris().filter(id=>vu.favoris!==undefined&&!vu.favoris.includes(id));
const bou=(brutNotif.boutique&&vu.boutique!==undefined&&vu.boutique!==brutNotif.boutique.statut)?[brutNotif.boutique]:[];
const c={messages:msg.length,avis:avis.length,commandes:cmd.length,achats:ach.length,favoris:fav.length,boutique:bou.length};
c.total=c.messages+c.avis+c.commandes+c.achats+c.boutique;
// Liste pour la cloche
const items=[];
const parExp=new Map();
msg.forEach(m=>{const k=m.expediteur_id||m.expediteur;if(!parExp.has(k)) parExp.set(k,[]);parExp.get(k).push(m);});
parExp.forEach(l=>{const d=l[0];items.push({cle:'messages',titre:d.expediteur||'Nouveau message',texte:(l.length>1?l.length+' nouveaux messages · ':'')+(d.texte||''),date:d.created_at,aller:()=>voirConversations()});});
avis.forEach(a=>items.push({cle:'avis',titre:'Nouvel avis · '+(a.note||'?')+'/5',texte:(a.auteur?a.auteur+' : ':'')+(a.commentaire||''),date:a.created_at,aller:()=>voirAvisRecus()}));
cmd.forEach(o=>items.push({cle:'commandes',titre:'Nouvelle commande',texte:(o.produit||'')+(o.quantite?' × '+o.quantite:''),date:o.created_at,aller:()=>voirCommandes()}));
ach.forEach(o=>items.push({cle:'achats',titre:'Votre commande a changé',texte:(o.produit||'')+' : '+(o.statut||'À préparer'),date:o.created_at,aller:()=>voirAchats()}));
bou.forEach(b=>items.push({cle:'boutique',titre:b.statut==='validee'?'Votre boutique est validée':b.statut==='suspendue'?'Votre boutique est suspendue':'Votre boutique est en attente de validation',texte:b.nom||'',date:new Date().toISOString(),aller:()=>voirBoutique()}));
items.sort((x,y)=>String(y.date).localeCompare(String(x.date)));
// Annonce de ce qui vient d'arriver (pas au premier chargement)
if(notifPret&&!notifPremiere){
['messages','avis','commandes','achats','boutique'].forEach(k=>{
if(c[k]>notifPrecedent[k]) annoncerNotif(k,items.find(i=>i.cle===k));
});
}
if(notifPret) notifPremiere=false;
['messages','avis','commandes','achats','boutique'].forEach(k=>{notifPrecedent[k]=c[k];});
compteursNotif=c;
itemsNotif=items;
afficherCompteursNotif();
if(typeof vueCourante!=='undefined'&&vueCourante==='notifications') dessinerNotifications();
}

function afficherCompteursNotif(){
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
}else if(notifSysActive()&&navigator.serviceWorker){
navigator.serviceWorker.ready.then(reg=>reg.showNotification(titre,{body:corps,icon:'icon-192.png',badge:'icon-192.png',tag:'niohub-'+cle,renotify:true,data:{url:'./'}})).catch(()=>{});
}
}
async function basculerNotifSysteme(){
if(typeof Notification==='undefined'){bandeau('Les notifications ne sont pas disponibles sur ce navigateur.');return;}
try{
if(localStorage.getItem('niohub_notif_sys')==='1'){
localStorage.removeItem('niohub_notif_sys');
}else{
let p=Notification.permission;
if(p==='default') p=await Notification.requestPermission();
if(p!=='granted'){bandeau('Notifications refusées. Autorisez-les dans les réglages du téléphone.','erreur');return;}
localStorage.setItem('niohub_notif_sys','1');
}
}catch(e){}
if(typeof dessinerParametres==='function') dessinerParametres();
}
function blocNotificationsReglage(){
const dispo=typeof Notification!=='undefined';
const actif=notifSysActive();
return '<div class="titre-section" style="margin-top:22px">Notifications</div>'
+(dispo
?'<button type="button" class="theme-opt'+(actif?' on':'')+'" style="width:100%" onclick="basculerNotifSysteme()">'+(actif?'Notifications du téléphone : activées':'Activer les notifications du téléphone')+'</button>'
:'<div style="font-size:13px;color:#6B6254">Les notifications du téléphone ne sont pas disponibles sur ce navigateur.</div>')
+'<div style="font-size:13px;color:#6B6254;margin-top:10px">Vous êtes prévenu d\'un nouveau message, d\'un avis ou d\'une commande quand l\'application est ouverte ou en arrière-plan.</div>';
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
function dessinerNotifications(){
const page=document.getElementById('notifications');
page.replaceChildren();
const entete=document.createElement('header');
const retour=document.createElement('button');
retour.className='retour';retour.textContent='←';retour.setAttribute('aria-label','Retour');
retour.onclick=()=>voirAccueil();
const titre=document.createElement('span');
titre.style.cssText='font-weight:bold;font-size:20px';
titre.textContent='Notifications';
entete.append(retour,titre);
page.append(entete);
if(!itemsNotif.length){
const v=document.createElement('div');
v.className='liste';v.style.marginTop='14px';
v.textContent='Aucune nouvelle notification.';
page.append(v);
return;
}
const tout=document.createElement('button');
tout.className='notif-tout';tout.type='button';tout.textContent='Tout marquer comme lu';
tout.onclick=marquerToutVu;
page.append(tout);
itemsNotif.forEach(it=>{
const l=document.createElement('div');
l.className='ligne notif-item';
l.style.cursor='pointer';
const point=document.createElement('span');point.className='notif-point';
const corps=document.createElement('div');corps.style.cssText='flex:1;min-width:0';
const t=document.createElement('div');t.className='name';t.textContent=it.titre;
const x=document.createElement('div');x.className='notif-texte';x.textContent=it.texte;
corps.append(t,x);
const hr=document.createElement('div');hr.className='notif-heure';hr.textContent=heureRelative(it.date);
l.append(point,corps,hr);
l.onclick=()=>it.aller();
page.append(l);
});
}
function voirNotifications(){
dessinerNotifications();
montrer('notifications');
}

// ---------- branchements ----------
function envelopperOuverture(nom,section){
const f=window[nom];
if(typeof f!=='function'||f.__notif) return;
const w=function(){marquerVu(section);return f.apply(this,arguments);};
w.__notif=true;
window[nom]=w;
}
function demarrerNotif(){
envelopperOuverture('voirConversations','messages');
envelopperOuverture('voirAvisRecus','avis');
envelopperOuverture('voirCommandes','commandes');
envelopperOuverture('voirAchats','achats');
envelopperOuverture('voirFavoris','favoris');
envelopperOuverture('voirBoutique','boutique');
// la pastille « messages » existante est désormais gérée ici
majCompteurs=function(){return recupererNotif(false);};
recupererNotif(true);
}
function majCompteurs(){return recupererNotif(false);}
if(document.readyState==='complete') demarrerNotif();
else window.addEventListener('load',demarrerNotif);
