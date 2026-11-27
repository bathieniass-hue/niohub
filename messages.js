// Messagerie : une seule discussion par acheteur et par vendeur.
// Chaque message garde le produit dont il parle ; le fil affiche « À propos de … » quand le produit change.
VUES.push('conversations','chat');

let conversations=[];
let origineListe='accueil';
let chatCourant=null;     // {vendeurId, acheteurId, produitId, produitNom} : produit dont on parle en ce moment
let contactsAcheteurs={}; // pour le vendeur : {user_id: {nom, telephone, photo}} des acheteurs qui lui ont écrit
let chatMoi=null;         // identifiant de la personne connectée
let chatMessages=[];
let chatOrigine='liste';  // 'liste' ou 'fiche' : où revient la flèche
let chatSignature='';
let chatTimer=null;
let envoiEnCours=false;
let chatLignes=[];            // messages du serveur pour la discussion ouverte
let dernierChargementChat=0;
const CLE_FILE='niohub_file_messages_v1';
let fileMessages=[];          // messages écrits mais pas encore envoyés (gardés même si on ferme l'appli)
try{fileMessages=JSON.parse(localStorage.getItem(CLE_FILE)||'[]')||[];}catch(e){fileMessages=[];}

function creerPagesMessagerie(){
if(!document.getElementById('conversations')){
const p=document.createElement('div');
p.id='conversations';
p.className='page';
p.style.display='none';
document.body.appendChild(p);
}
if(!document.getElementById('chat')){
const p=document.createElement('div');
p.id='chat';
p.className='page';
p.style.display='none';
p.innerHTML=vueChatPage();
document.body.appendChild(p);
document.getElementById('chat-texte').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();envoyerChat();}});
// Garde le clavier ouvert quand on touche « Envoyer »
document.getElementById('chat-envoyer').addEventListener('pointerdown',e=>e.preventDefault());
}
}

creerPagesMessagerie();

// Le clavier ne doit pas cacher la zone de saisie (iPhone surtout)
function majClavier(){
const v=window.visualViewport;
if(!v) return;
document.documentElement.style.setProperty('--clavier',Math.max(0,Math.round(window.innerHeight-v.height-v.offsetTop))+'px');
}
if(window.visualViewport){
visualViewport.addEventListener('resize',majClavier);
visualViewport.addEventListener('scroll',majClavier);
}

// ---------- Petits outils ----------
function heureMsg(iso){return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
function memeJour(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function jourMsg(iso){
const d=new Date(iso),auj=new Date(),hier=new Date(Date.now()-86400000);
if(memeJour(d,auj)) return 'Aujourd\'hui';
if(memeJour(d,hier)) return 'Hier';
return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
}
function quandMsg(iso){
const d=new Date(iso);
if(memeJour(d,new Date())) return heureMsg(iso);
if(memeJour(d,new Date(Date.now()-86400000))) return 'Hier';
return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
}
function nomBoutiqueDe(vendeurId){
const b=boutiquesCache.find(x=>x.user_id===vendeurId);
return (b&&b.nom)||'Vendeur';
}
// La personne avec qui on discute : la boutique pour l'acheteur, le profil de l'acheteur pour le vendeur
function interlocuteur(c,moi){
if(c.acheteurId===moi){
const b=boutiquesCache.find(x=>x.user_id===c.vendeurId)||{};
return {nom:b.nom||'Vendeur',photo:b.logo||'',telephone:b.telephone||''};
}
const p=contactsAcheteurs[c.acheteurId]||{};
return {nom:p.nom||c.nomAcheteur||'Client',photo:p.photo||'',telephone:p.telephone||''};
}
// Données prêtes pour vueAvatar : fond (photo ou couleur) et initiale
function donneesAvatar(personne){
const img=urlSure(personne.photo);
return {fond:fondImage(personne.photo,'#F2B233'),initiale:img?'':(String(personne.nom||'').trim().charAt(0)||'N').toUpperCase()};
}

// Pour le vendeur : nom, téléphone et photo des acheteurs qui lui ont écrit (fonction Supabase contacts_acheteurs)
async function chargerContactsAcheteurs(s){
try{
const r=await Donnees.messages.contactsAcheteurs(s);
if(!r.ok) return;
const liste=await r.json();
const m={};
(liste||[]).forEach(p=>{if(p&&p.user_id) m[p.user_id]=p;});
contactsAcheteurs=m;
}catch(e){}
}
function boutonsContact(personne,c){
const n=chiffresTelephone(personne.telephone);
if(!telephoneValide(n)) return '';
const sujet=c&&c.produitNom?' au sujet de « '+c.produitNom+' »':'';
const texte=encodeURIComponent('Bonjour, je vous contacte depuis NioHub'+sujet+'.');
return vueBoutonsContact({tel:'tel:+221'+n,wa:'https://wa.me/221'+n+'?text='+texte});
}

function dessinerEnteteChat(){
const c=chatCourant;
if(!c) return;
const pers=interlocuteur(c,chatMoi);
document.getElementById('chat-titre').textContent=pers.nom;
document.getElementById('chat-avatar').outerHTML=vueAvatar('chat-avatar',donneesAvatar(pers),'chat-avatar');
document.getElementById('chat-actions').innerHTML=boutonsContact(pers,c);
}

function produitDe(c){
return distants.find(p=>c.produitId&&p.id===c.produitId)||distants.find(p=>p.user_id===c.vendeurId&&p.nom===c.produitNom)||null;
}
// Typographie française : pas de coupure dans « 2 000 » ni avant ? ! : ;
function typoFr(t){
return t.replace(/(\d) (?=\d{3}(\D|$))/g,'$1\u00A0').replace(/ ([?!:;»])/g,'\u00A0$1').replace(/« /g,'«\u00A0');
}

// ---------- Pastille de messages non lus (raccourci de l'accueil) ----------
function afficherBadge(n){
const b=document.getElementById('badge-messages');
if(!b) return;
b.textContent=n>=99?'99+':String(n);
b.style.display=n>0?'block':'none';
}
async function majNonLus(){
if(typeof majCompteurs==='function') return majCompteurs();
const s=await sessionValide();
if(!s||!s.user_id){afficherBadge(0);return;}
try{
const r=await Donnees.messages.nonLus(s);
if(!r.ok) return;
afficherBadge((await r.json()).length);
}catch(e){}
}
apresAccueil(majNonLus,2500);
setInterval(()=>{if(document.visibilityState==='visible'){majNonLus();assurerTempsReel();}},12000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible') majNonLus();});

// ---------- Liste des conversations ----------
function grouperConversations(lignes,moi){
const map=new Map();
lignes.forEach(m=>{
const cle=m.vendeur_id+'|'+m.acheteur_id;
let c=map.get(cle);
if(!c){
// Les messages arrivent du plus récent au plus ancien : le premier donne le produit dont on parle en dernier
c={cle:cle,produitId:m.produit_id||null,produitNom:m.produit,vendeurId:m.vendeur_id,acheteurId:m.acheteur_id,dernier:m,nonLus:0,nomAcheteur:null};
map.set(cle,c);
}
if(m.expediteur_id!==moi&&!m.lu) c.nonLus++;
if(!c.nomAcheteur&&m.expediteur_id===m.acheteur_id) c.nomAcheteur=m.expediteur;
});
return Array.from(map.values());
}

async function voirConversations(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour voir vos messages.');montrer('profil');return;}
if(vueCourante!=='chat'&&vueCourante!=='conversations') origineListe=(vueCourante==='boutique')?'boutique':'accueil';
const p=document.getElementById('conversations');
p.innerHTML=vueConversationsPage();
montrer('conversations');
await rafraichirListe();
}
// Ancien nom, utilisé par le bouton « Messages » de la boutique
function voirMessages(){return voirConversations();}

function fermerListe(){
if(origineListe==='boutique') montrer('boutique'); else voirAccueil();
}

async function rafraichirListe(){
const s=await sessionValide();
const zone=document.getElementById('conv-corps');
if(!s||!s.user_id||!zone) return;
try{
if(!distants.length) await chargerProduits();
const r=await Donnees.messages.toutes(s);
if(!r.ok) throw new Error(r.status);
const lignesMsg=await r.json();
if(lignesMsg.some(m=>m.vendeur_id===s.user_id)) await chargerContactsAcheteurs(s);
conversations=grouperConversations(lignesMsg,s.user_id);
afficherBadge(conversations.reduce((t,c)=>t+c.nonLus,0));
const cible=document.getElementById('conv-corps');
if(!cible) return;
cible.style.padding='0 14px';
cible.innerHTML=vueConversationsListe(conversations.map((c,i)=>{
const pers=interlocuteur(c,s.user_id);
const d=c.dernier;
return {i:i,nonLus:c.nonLus,avatar:donneesAvatar(pers),titre:pers.nom,quand:quandMsg(d.created_at),produit:c.produitNom||'',vous:d.expediteur_id===s.user_id,apercu:d.texte};
}));
}catch(e){
const cible=document.getElementById('conv-corps');
if(cible) cible.innerHTML=vueConversationsErreur();
}
}

function ouvrirConversation(i){
const c=conversations[i];
if(!c) return;
const p=produitDe(c);
ouvrirChat({produitId:c.produitId||(p&&p.id)||null,produitNom:c.produitNom||(p&&p.nom)||'',vendeurId:c.vendeurId,acheteurId:c.acheteurId,nomAcheteur:c.nomAcheteur},'liste');
}

// ---------- Écran de discussion ----------
// Depuis la fiche produit : bouton « Message »
async function voirMessage(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id||!produitOuvert.id){bandeau('Ce produit de démonstration ne peut pas recevoir de message.');return;}
if(produitOuvert.user_id===s.user_id){bandeau('C\'est votre produit : ouvrez Messages pour répondre à vos clients.');return;}
await ouvrirChat({produitId:produitOuvert.id,produitNom:produitOuvert.nom,vendeurId:produitOuvert.user_id,acheteurId:s.user_id},'fiche');
}

async function ouvrirChat(ctx,origine){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
chatMoi=s.user_id;
chatCourant=Object.assign({},ctx);
chatOrigine=origine;
chatMessages=[];
chatLignes=[];
chatSignature='';
assurerTempsReel();
if(ctx.vendeurId===s.user_id&&!contactsAcheteurs[ctx.acheteurId]) chargerContactsAcheteurs(s).then(()=>{if(chatCourant&&chatCourant.acheteurId===ctx.acheteurId) dessinerEnteteChat();});
if(!boutiquesCache.length) await chargerBoutiquesCache();
dessinerEnteteChat();
dessinerProduitChat();
document.getElementById('chat-fil').innerHTML=vueChatVide('Chargement…');
document.getElementById('chat-erreur').textContent='';
document.getElementById('chat-texte').value='';
montrer('chat');
await chargerChat(true);
clearInterval(chatTimer);
chatTimer=setInterval(()=>{
if(vueCourante!=='chat'||document.visibilityState!=='visible'||!chatCourant) return;
if(rtOk&&Date.now()-dernierChargementChat<15000) return; // le direct fonctionne : simple vérification de temps en temps
chargerChat(false);
},2500);
}

function dessinerProduitChat(){
const c=chatCourant;
const p=produitDe(c);
const zone=document.getElementById('chat-produit');
if(!c||!zone) return;
zone.innerHTML=vueProduitChat({nom:(p&&p.nom)||c.produitNom||'Produit',prix:p?p.prix:'',ouvrable:!!(p&&p.id),fond:fondImage(urlMiniature(p&&p.photo),'#D9B26F')});
}

function voirProduitDuChat(){
const p=chatCourant&&produitDe(chatCourant);
if(p&&p.id) ouvrirParId(p.id);
}

// Toute la discussion entre cet acheteur et ce vendeur, tous produits confondus
function filtreConversation(c){
return 'acheteur_id=eq.'+c.acheteurId+'&vendeur_id=eq.'+c.vendeurId;
}

function cleCacheChat(c){return 'niohub_chat_'+c.acheteurId+'_'+c.vendeurId;}
function sauverCacheChat(c){try{localStorage.setItem(cleCacheChat(c),JSON.stringify(chatLignes.slice(-60)));}catch(e){}}
function lireCacheChat(c){try{return JSON.parse(localStorage.getItem(cleCacheChat(c))||'null');}catch(e){return null;}}

function pendingPourChat(){
const c=chatCourant;
if(!c) return [];
return fileMessages.filter(q=>q.acheteur_id===c.acheteurId&&q.vendeur_id===c.vendeurId).map(q=>({id:'attente-'+q.cle,texte:q.texte,created_at:q.created_at,expediteur_id:q.expediteur_id,produit_id:q.produit_id,produit:q.produit,_attente:true}));
}
function recomposerChat(descendre){
chatMessages=chatLignes.concat(pendingPourChat());
dessinerFil(descendre);
}

async function chargerChat(initial){
const c=chatCourant;
if(!c) return;
const s=await sessionValide();
if(!s||!s.user_id) return;
try{
// Après le premier chargement, on ne demande que les messages récents (plus rapide, moins de données)
// Après le premier chargement : on relit les 40 derniers messages (nouveaux, lus, supprimés) et on les fusionne
const incremental=!initial&&chatLignes.length>0;
const r=await Donnees.messages.conversation(s,filtreConversation(c),incremental);
if(!r.ok) throw new Error(r.status);
const recus=await r.json();
if(c!==chatCourant) return; // on a changé de conversation entre-temps
dernierChargementChat=Date.now();
if(!incremental) chatLignes=recus;
else{
const parId=new Map(chatLignes.map(m=>[m.id,m]));
recus.forEach(m=>{parId.set(m.id,m);});
chatLignes=[...parId.values()].sort((x,y)=>String(x.created_at).localeCompare(String(y.created_at)));
}
const lignes=chatLignes;
const sig=lignes.map(m=>m.id+':'+m.lu+':'+(m.supprime?1:0)).join(',');
if(initial||sig!==chatSignature){
chatSignature=sig;
recomposerChat(initial);
}
if(initial) sauverCacheChat(c);
if(c.acheteurId!==s.user_id){
const a=lignes.find(m=>m.expediteur_id===c.acheteurId);
if(a&&!c.nomAcheteur){c.nomAcheteur=a.expediteur;dessinerEnteteChat();}
}
// Ouvert depuis la liste sans produit connu : on prend celui du dernier message
if(!c.produitId&&lignes.length){
const der=[...lignes].reverse().find(m=>m.produit_id);
if(der){c.produitId=der.produit_id;c.produitNom=der.produit;dessinerProduitChat();dessinerEnteteChat();}
}
if(lignes.some(m=>m.expediteur_id!==s.user_id&&!m.lu)) await marquerLus(s,c,lignes);
}catch(e){
if(initial&&c===chatCourant){
// Pas de connexion : on montre la dernière version gardée sur le téléphone, avec les messages en attente
const cache=lireCacheChat(c);
if(cache&&cache.length) chatLignes=cache;
if(chatLignes.length||pendingPourChat().length) recomposerChat(true);
else document.getElementById('chat-fil').innerHTML=vueChatErreur();
}
}
}

async function marquerLus(s,c,lignes){
try{
const r=await Donnees.messages.marquerLus(s,filtreConversation(c));
if(r.ok){
lignes.forEach(m=>{if(m.expediteur_id!==s.user_id) m.lu=true;});
chatSignature=lignes.map(m=>m.id+':'+m.lu+':'+(m.supprime?1:0)).join(',');
majNonLus();
}
}catch(e){}
}

function dessinerFil(descendre){
const zone=document.getElementById('chat-fil');
if(!zone) return;
const proche=window.innerHeight+window.scrollY>=document.body.scrollHeight-140;
const lignes=[];
let jourPrec='',sujetPrec=null;
chatMessages.forEach(m=>{
const j=jourMsg(m.created_at);
if(j!==jourPrec){lignes.push({type:'jour',texte:j});jourPrec=j;}
const sujet=m.produit_id?'p'+m.produit_id:'n:'+(m.produit||'');
if(sujet!==sujetPrec&&(m.produit_id||m.produit)){
const pr=m.produit_id&&distants.find(x=>x.id===m.produit_id);
lignes.push({type:'sujet',texte:(pr&&pr.nom)||m.produit||'Produit',produitId:pr?String(m.produit_id):''});
}
sujetPrec=sujet;
const miens=m.expediteur_id===chatMoi;
const cle=m._attente?String(m.id).replace('attente-',''):String(m.id);
if(m.supprime){
lignes.push({type:'supprime',miens:miens,heure:heureMsg(m.created_at)});
}else{
lignes.push({type:'bulle',miens:miens,attente:!!m._attente,actionnable:miens,mid:cle,texte:typoFr(esc(m.texte)),heure:m._attente?(navigator.onLine?'Envoi…':'En attente de connexion'):heureMsg(m.created_at)});
}
});
if(!chatMessages.length){
const moiAcheteur=chatCourant&&chatCourant.acheteurId===chatMoi;
zone.innerHTML=vueChatVide(moiAcheteur?'Écrivez votre premier message au vendeur.':'Aucun message.');
}else{
zone.innerHTML=vueFilChat(lignes);
}
if(descendre||proche) window.scrollTo(0,document.body.scrollHeight);
}

async function envoyerChat(){
if(!chatCourant) return;
const champ=document.getElementById('chat-texte');
const erreur=document.getElementById('chat-erreur');
const texte=champ.value.trim();
if(!texte) return;
erreur.textContent='';
const c=chatCourant;
if(!c.produitId){erreur.textContent='Cette discussion est trop ancienne pour recevoir une réponse ici. Utilisez les boutons Appel ou WhatsApp en haut.';return;}
if(!chatMoi){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
chatMoi=s.user_id;
}
const session=lireSession()||{};
champ.value='';
fileMessages.push({cle:Date.now()+'-'+Math.random().toString(36).slice(2,7),texte:texte,created_at:new Date().toISOString(),expediteur_id:chatMoi,expediteur:session.nom||'Client',produit_id:c.produitId,produit:c.produitNom||'',vendeur_id:c.vendeurId,acheteur_id:c.acheteurId});
sauverFile();
recomposerChat(true);
champ.focus();
viderFile();
}

function sauverFile(){try{localStorage.setItem(CLE_FILE,JSON.stringify(fileMessages));}catch(e){}}

let fileEnCours=false;
let minuteurFile=null;
function planifierFile(){clearTimeout(minuteurFile);minuteurFile=setTimeout(viderFile,4000);}

// Envoie les messages en attente, dans l'ordre. Si la connexion est mauvaise, ils restent en attente et on réessaie.
async function viderFile(){
if(fileEnCours||!fileMessages.length) return;
if(!navigator.onLine){planifierFile();return;}
fileEnCours=true;
let reessayer=false;
try{
while(fileMessages.length){
const q=fileMessages[0];
const s=await sessionValide();
if(!s||!s.user_id||s.user_id!==q.expediteur_id){reessayer=true;break;}
let r;
try{
r=await Donnees.messages.envoyer(s,{produit_id:q.produit_id,produit:q.produit||'',vendeur_id:q.vendeur_id,acheteur_id:q.acheteur_id,expediteur_id:q.expediteur_id,expediteur:q.expediteur||'Client',texte:q.texte});
}catch(e){reessayer=true;break;}
if(r.ok){
let ligne=null;
try{ligne=(await r.json())[0]||null;}catch(e){}
fileMessages.shift();
sauverFile();
const c=chatCourant;
if(ligne&&c&&c.acheteurId===q.acheteur_id&&c.vendeurId===q.vendeur_id&&!chatLignes.some(m=>m.id===ligne.id)) chatLignes.push(ligne);
chatSignature='';
if(chatCourant) recomposerChat(false);
}else if(r.status>=400&&r.status<500&&r.status!==408&&r.status!==429&&r.status!==401){
// Refusé pour de bon : inutile de réessayer
fileMessages.shift();
sauverFile();
bandeau('Un message n\'a pas pu être envoyé.','erreur');
if(chatCourant) recomposerChat(false);
}else{reessayer=true;break;}
}
}finally{
fileEnCours=false;
}
if(reessayer||fileMessages.length) planifierFile();
}
window.addEventListener('online',()=>{viderFile();assurerTempsReel();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){viderFile();assurerTempsReel();}});
apresAccueil(viderFile,3000);

function fermerChat(){
clearInterval(chatTimer);
chatTimer=null;
chatCourant=null;
if(chatOrigine==='fiche') montrer('fiche');
else{montrer('conversations');rafraichirListe();}
}

// ---------- Messages en direct (Supabase Realtime) ----------
// Dès qu'un message arrive pour moi, on actualise tout de suite (discussion, liste, pastille).
// Si le direct n'est pas disponible, l'appli continue de vérifier toute seule toutes les quelques secondes.
let rtSocket=null;
let rtOk=false;
let rtHb=null;
let rtEssais=0;
let rtRelance=null;
let rtDeclenche=null;

function declencherMajMessages(){
clearTimeout(rtDeclenche);
rtDeclenche=setTimeout(()=>{
if(vueCourante==='chat'&&chatCourant) chargerChat(false);
majNonLus();
if(vueCourante==='conversations') rafraichirListe();
},120);
}

async function assurerTempsReel(){
if(rtSocket&&(rtSocket.readyState===0||rtSocket.readyState===1)) return;
if(typeof WebSocket==='undefined'||!navigator.onLine) return;
const s=await sessionValide();
if(!s||!s.user_id) return;
let ws;
try{ws=Donnees.messages.ouvrirTempsReel();}catch(e){return;}
rtSocket=ws;
rtOk=false;
const envoyer=(topic,event,payload,ref)=>{try{ws.send(JSON.stringify({topic:topic,event:event,payload:payload,ref:String(ref)}));}catch(e){}};
ws.onopen=()=>{
envoyer('realtime:niohub-messages','phx_join',{config:{broadcast:{ack:false,self:false},presence:{key:''},postgres_changes:[
{event:'INSERT',schema:'public',table:'messages',filter:'acheteur_id=eq.'+s.user_id},
{event:'INSERT',schema:'public',table:'messages',filter:'vendeur_id=eq.'+s.user_id}
]},access_token:s.access_token},1);
clearInterval(rtHb);
rtHb=setInterval(()=>envoyer('phoenix','heartbeat',{},'hb'),25000);
};
ws.onmessage=ev=>{
let m;
try{m=JSON.parse(ev.data);}catch(e){return;}
if(m.event==='phx_reply'&&m.topic==='realtime:niohub-messages'){
if(m.payload&&m.payload.status==='ok'){rtOk=true;rtEssais=0;}else rtOk=false;
}else if(m.event==='postgres_changes'){
declencherMajMessages();
}else if(m.event==='system'&&m.payload&&m.payload.status==='error'){
rtOk=false; // la table n'est pas ouverte au direct : on garde la vérification rapide
}else if(m.event==='phx_error'||m.event==='phx_close'){
rtOk=false;
}
};
ws.onclose=()=>{
rtOk=false;
clearInterval(rtHb);
if(rtSocket===ws) rtSocket=null;
rtEssais++;
clearTimeout(rtRelance);
rtRelance=setTimeout(assurerTempsReel,Math.min(30000,2000*rtEssais));
};
ws.onerror=()=>{try{ws.close();}catch(e){}};
}
apresAccueil(assurerTempsReel,3000);

// ---------- supprimer un de ses messages ----------
function menuMessage(bulle){
const deja=bulle.nextElementSibling&&bulle.nextElementSibling.classList.contains('bulle-actions');
document.querySelectorAll('.bulle-actions').forEach(x=>x.remove());
if(deja) return; // un second appui referme le menu
const attente=bulle.getAttribute('data-attente')==='1';
bulle.insertAdjacentHTML('afterend',vueMenuMessage(bulle.getAttribute('data-mid'),attente));
}

async function supprimerMessage(id,attente){
document.querySelectorAll('.bulle-actions').forEach(x=>x.remove());
if(attente){
// message pas encore parti : on le retire simplement de la file d'attente
fileMessages=fileMessages.filter(q=>q.cle!==id);
sauverFile();
recomposerChat(false);
return;
}
if(!(await confirmer('Ce message sera supprimé pour vous et pour votre interlocuteur.',{titre:'Supprimer le message ?',ok:'Supprimer',danger:true}))) return;
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous pour supprimer un message.');return;}
try{
const r=await Donnees.messages.supprimer(s,id);
if(!r.ok) throw new Error(r.status);
const m=chatLignes.find(x=>String(x.id)===String(id));
if(m){m.supprime=true;m.texte='Message supprimé';}
chatSignature='';
recomposerChat(false);
if(chatCourant) sauverCacheChat(chatCourant);
}catch(e){
bandeau('Suppression impossible. Vérifiez votre connexion.','erreur');
}
}
