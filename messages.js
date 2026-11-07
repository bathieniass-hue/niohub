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

const styleMessagerie=document.createElement('style');
styleMessagerie.textContent=`
.retour-carre{width:44px;height:44px;border-radius:12px;border:1px solid #E6DECB;background:#fff;font-size:22px;padding:0;flex-shrink:0;color:#1E1A14}
.entete-ecran{display:flex;align-items:center;gap:14px;padding:14px 0 10px;position:sticky;top:0;background:#FBF7EE;z-index:20}
.entete-ecran .titre-ecran{font-size:20px;font-weight:bold;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#chat .entete-ecran{gap:10px}
#chat .entete-ecran .titre-ecran{font-size:17px}
.conv{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #EDE5D3;cursor:pointer}
.conv-img{width:52px;height:52px;border-radius:26px;flex-shrink:0;background:#F2B233;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;color:#1E1A14}
.chat-avatar{width:40px;height:40px;border-radius:20px;flex-shrink:0;background:#F2B233;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;color:#1E1A14}
.chat-actions{display:flex;gap:8px;flex-shrink:0}
.chat-action{width:44px;height:44px;border-radius:12px;border:1px solid #E6DECB;background:#fff;display:flex;align-items:center;justify-content:center;padding:0;text-decoration:none}
.chat-action svg{width:22px;height:22px}
.chat-action.appel svg{fill:none;stroke:#0E6B47;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.chat-action.whatsapp svg{fill:#25A55F}
.chat-sujet{display:flex;justify-content:center;margin:16px 0 6px}
.chat-sujet span{font-size:12px;color:#0E6B47;background:#EAF3EE;border-radius:12px;padding:5px 12px;max-width:85%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-sujet.cliquable span{cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.conv-corps{flex:1;min-width:0}
.conv-haut{display:flex;justify-content:space-between;gap:8px}
.conv-nom{color:#1E1A14;font-weight:bold;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.conv-heure{font-size:12px;color:#6B6254;flex-shrink:0}
.conv-produit{font-size:12px;color:#0E6B47;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.conv-apercu{font-size:13px;color:#6B6254;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.conv.nonlu .conv-apercu{color:#1E1A14;font-weight:bold}
.conv:last-child{border-bottom:0}
.conv-nonlus{min-width:22px;height:22px;border-radius:11px;background:#0E6B47;color:#fff;font-size:12px;font-weight:bold;text-align:center;line-height:22px;padding:0 6px;flex-shrink:0}
.chat-produit{display:flex;gap:14px;align-items:center;background:#fff;border:1px solid #EDE5D3;border-radius:18px;padding:12px;margin:4px 0 8px}
.chat-produit.cliquable{cursor:pointer}
.cp-img{width:56px;height:56px;border-radius:14px;flex-shrink:0;background:#D9B26F}
.cp-txt{flex:1;min-width:0}
.cp-nom{font-weight:bold;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp-prix{font-weight:bold;font-size:16px;color:#0E6B47}
.cp-voir{font-weight:bold;font-size:14px;color:#0E6B47;flex-shrink:0}
.chat-jour{text-align:center;font-size:12px;color:#6B6254;margin:14px 0 4px}
.bulle{max-width:80%;padding:12px 16px;border-radius:20px;margin:8px 0;font-size:16px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere}
.bulle.moi{background:#0E6B47;color:#fff;margin-left:auto;border-bottom-right-radius:6px}
.bulle.autre{background:#fff;border:1px solid #E6DECB;margin-right:auto;border-bottom-left-radius:6px}
.bulle .heure{font-size:12px;opacity:.7;text-align:right;margin-top:4px}
.bulle.attente{opacity:.6}
.chat-vide{text-align:center;color:#6B6254;font-size:14px;padding:40px 20px}
.chat-saisie{position:fixed;left:50%;transform:translateX(-50%);bottom:var(--clavier,0px);width:100%;max-width:430px;background:#FBF7EE;border-top:1px solid #E6DECB;padding:12px 16px calc(12px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:10px;align-items:center;z-index:40}
.chat-saisie .chat-erreur{flex:0 0 100%;color:#B4291A;font-size:13px}
.chat-saisie .chat-erreur:empty{display:none}
#chat .chat-saisie input{flex:1;min-width:0;width:auto;height:52px;border-radius:26px;border:1px solid #E6DECB;background:#fff;padding:0 18px;font-size:16px}
.chat-envoyer{width:52px;height:52px;border-radius:26px;border:0;background:#0E6B47;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0}
.chat-envoyer svg{width:24px;height:24px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.chat-envoyer:disabled{opacity:.5}
`;
document.head.appendChild(styleMessagerie);

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
p.innerHTML=`<div class="entete-ecran"><button class="retour-carre" onclick="fermerChat()" aria-label="Retour">←</button><div class="chat-avatar" id="chat-avatar"></div><span class="titre-ecran" id="chat-titre"></span><div class="chat-actions" id="chat-actions"></div></div>
<div id="chat-produit"></div>
<div id="chat-fil"></div>
<div class="chat-saisie"><div class="chat-erreur" id="chat-erreur"></div><input id="chat-texte" type="text" placeholder="Écrire un message…" maxlength="1000" enterkeyhint="send" autocomplete="off"><button id="chat-envoyer" class="chat-envoyer" onpointerdown="event.preventDefault()" onclick="envoyerChat()" aria-label="Envoyer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>`;
document.body.appendChild(p);
document.getElementById('chat-texte').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();envoyerChat();}});
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
function avatarHTML(classe,personne){
const img=urlSure(personne.photo);
const initiale=(String(personne.nom||'').trim().charAt(0)||'N').toUpperCase();
return `<div class="${classe}" style="background:${fondImage(personne.photo,'#F2B233')}">${img?'':esc(initiale)}</div>`;
}
// Pour le vendeur : nom, téléphone et photo des acheteurs qui lui ont écrit (fonction Supabase contacts_acheteurs)
async function chargerContactsAcheteurs(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/contacts_acheteurs',{method:'POST',headers:entetesAuth(s,true),body:'{}'});
if(!r.ok) return;
const liste=await r.json();
const m={};
(liste||[]).forEach(p=>{if(p&&p.user_id) m[p.user_id]=p;});
contactsAcheteurs=m;
}catch(e){}
}
const ICONE_APPEL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const ICONE_WHATSAPP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>';
function boutonsContact(personne,c){
const n=chiffresTelephone(personne.telephone);
if(!telephoneValide(n)) return '';
const sujet=c&&c.produitNom?' au sujet de « '+c.produitNom+' »':'';
const texte=encodeURIComponent('Bonjour, je vous contacte depuis NioHub'+sujet+'.');
return `<a class="chat-action appel" href="tel:+221${n}" aria-label="Appeler">${ICONE_APPEL}</a><a class="chat-action whatsapp" href="https://wa.me/221${n}?text=${texte}" target="_blank" rel="noopener" aria-label="Continuer sur WhatsApp">${ICONE_WHATSAPP}</a>`;
}
function dessinerEnteteChat(){
const c=chatCourant;
if(!c) return;
const pers=interlocuteur(c,chatMoi);
document.getElementById('chat-titre').textContent=pers.nom;
document.getElementById('chat-avatar').outerHTML=avatarHTML('chat-avatar',pers).replace('class="chat-avatar"','class="chat-avatar" id="chat-avatar"');
document.getElementById('chat-actions').innerHTML=boutonsContact(pers,c);
}

function produitDe(c){
return distants.find(p=>c.produitId&&p.id===c.produitId)||distants.find(p=>p.user_id===c.vendeurId&&p.nom===c.produitNom)||null;
}
// Typographie française : pas de coupure dans « 2 000 » ni avant ? ! : ;
function typoFr(t){
return t.replace(/(\d) (?=\d{3}(\D|$))/g,'$1\u00A0').replace(/ ([?!:;»])/g,'\u00A0$1').replace(/« /g,'«\u00A0');
}
function entetesAuth(s,json){
const h={apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token};
if(json) h['Content-Type']='application/json';
return h;
}

// ---------- Pastille de messages non lus (raccourci de l'accueil) ----------
function afficherBadge(n){
const b=document.getElementById('badge-messages');
if(!b) return;
b.textContent=n>=99?'99+':String(n);
b.style.display=n>0?'block':'none';
}
async function majNonLus(){
const s=await sessionValide();
if(!s||!s.user_id){afficherBadge(0);return;}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=id&lu=eq.false&expediteur_id=neq.'+s.user_id+'&limit=99',{headers:entetesAuth(s)});
if(!r.ok) return;
afficherBadge((await r.json()).length);
}catch(e){}
}
setTimeout(majNonLus,2500);
setInterval(()=>{if(document.visibilityState==='visible') majNonLus();},30000);
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
p.innerHTML=`<div class="entete-ecran"><button class="retour-carre" onclick="fermerListe()" aria-label="Retour">←</button><span class="titre-ecran">Messages</span></div><div id="conv-corps" class="liste" style="margin-top:6px">Chargement…</div>`;
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
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=*&order=created_at.desc&limit=500',{headers:entetesAuth(s)});
if(!r.ok) throw new Error(r.status);
const lignesMsg=await r.json();
if(lignesMsg.some(m=>m.vendeur_id===s.user_id)) await chargerContactsAcheteurs(s);
conversations=grouperConversations(lignesMsg,s.user_id);
afficherBadge(conversations.reduce((t,c)=>t+c.nonLus,0));
const cible=document.getElementById('conv-corps');
if(!cible) return;
cible.style.padding='0 14px';
cible.innerHTML=conversations.length
?conversations.map((c,i)=>{
const pers=interlocuteur(c,s.user_id);
const titre=pers.nom;
const d=c.dernier;
return `<div class="conv${c.nonLus?' nonlu':''}" onclick="ouvrirConversation(${i})">${avatarHTML('conv-img',pers)}<div class="conv-corps"><div class="conv-haut"><span class="conv-nom">${esc(titre)}</span><span class="conv-heure">${esc(quandMsg(d.created_at))}</span></div><div class="conv-produit">${c.produitNom?'À propos de : '+esc(c.produitNom):''}</div><div class="conv-apercu">${d.expediteur_id===s.user_id?'Vous : ':''}${esc(d.texte)}</div></div>${c.nonLus?`<span class="conv-nonlus">${c.nonLus}</span>`:''}</div>`;
}).join('')
:'<div class="chat-vide">Aucun message pour l\'instant.<br>Ouvrez un produit et touchez « Message » pour écrire au vendeur.</div>';
}catch(e){
const cible=document.getElementById('conv-corps');
if(cible) cible.innerHTML='Impossible de charger vos messages. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" onclick="rafraichirListe()">Réessayer</button>';
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
chatSignature='';
if(ctx.vendeurId===s.user_id&&!contactsAcheteurs[ctx.acheteurId]) chargerContactsAcheteurs(s).then(()=>{if(chatCourant&&chatCourant.acheteurId===ctx.acheteurId) dessinerEnteteChat();});
if(!boutiquesCache.length) await chargerBoutiquesCache();
dessinerEnteteChat();
dessinerProduitChat();
document.getElementById('chat-fil').innerHTML='<div class="chat-vide">Chargement…</div>';
document.getElementById('chat-erreur').textContent='';
document.getElementById('chat-texte').value='';
montrer('chat');
await chargerChat(true);
clearInterval(chatTimer);
chatTimer=setInterval(()=>{if(vueCourante==='chat'&&document.visibilityState==='visible'&&chatCourant) chargerChat(false);},5000);
}

function dessinerProduitChat(){
const c=chatCourant;
const p=produitDe(c);
const zone=document.getElementById('chat-produit');
if(!c||!zone) return;
const nom=(p&&p.nom)||c.produitNom||'Produit';
const prix=p?esc(p.prix):'';
const ouvrable=!!(p&&p.id);
zone.innerHTML=`<div class="chat-produit${ouvrable?' cliquable':''}"${ouvrable?' onclick="voirProduitDuChat()"':''}><div class="cp-img" style="background:${fondImage(urlMiniature(p&&p.photo),'#D9B26F')}"></div><div class="cp-txt"><div class="cp-nom">${esc(nom)}</div><div class="cp-prix">${prix}</div></div>${ouvrable?'<span class="cp-voir">Voir ›</span>':''}</div>`;
}

function voirProduitDuChat(){
const p=chatCourant&&produitDe(chatCourant);
if(p&&p.id) ouvrirParId(p.id);
}

// Toute la discussion entre cet acheteur et ce vendeur, tous produits confondus
function filtreConversation(c){
return 'acheteur_id=eq.'+c.acheteurId+'&vendeur_id=eq.'+c.vendeurId;
}

async function chargerChat(initial){
const c=chatCourant;
if(!c) return;
const s=await sessionValide();
if(!s||!s.user_id) return;
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=*&'+filtreConversation(c)+'&order=created_at.asc&limit=300',{headers:entetesAuth(s)});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
if(c!==chatCourant) return; // on a changé de conversation entre-temps
chatMessages=lignes.concat(chatMessages.filter(m=>m._attente));
const sig=lignes.map(m=>m.id+':'+m.lu).join(',');
if(initial||sig!==chatSignature){
chatSignature=sig;
dessinerFil(initial);
}
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
document.getElementById('chat-fil').innerHTML='<div class="chat-vide">Impossible de charger la conversation. Vérifiez votre connexion.<br><button class="auth-lien" style="width:auto" onclick="chargerChat(true)">Réessayer</button></div>';
}
}
}

async function marquerLus(s,c,lignes){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?'+filtreConversation(c)+'&expediteur_id=neq.'+s.user_id+'&lu=eq.false',{method:'PATCH',headers:Object.assign(entetesAuth(s,true),{Prefer:'return=minimal'}),body:JSON.stringify({lu:true})});
if(r.ok){
lignes.forEach(m=>{if(m.expediteur_id!==s.user_id) m.lu=true;});
chatSignature=lignes.map(m=>m.id+':'+m.lu).join(',');
majNonLus();
}
}catch(e){}
}

function dessinerFil(descendre){
const zone=document.getElementById('chat-fil');
if(!zone) return;
const proche=window.innerHeight+window.scrollY>=document.body.scrollHeight-140;
let html='',jourPrec='',sujetPrec=null;
chatMessages.forEach(m=>{
const j=jourMsg(m.created_at);
if(j!==jourPrec){html+=`<div class="chat-jour">${esc(j)}</div>`;jourPrec=j;}
const sujet=m.produit_id?'p'+m.produit_id:'n:'+(m.produit||'');
if(sujet!==sujetPrec&&(m.produit_id||m.produit)){
const pr=m.produit_id&&distants.find(x=>x.id===m.produit_id);
html+=`<div class="chat-sujet${pr?' cliquable':''}"><span${pr?` onclick="ouvrirParId(${JSON.stringify(m.produit_id).replace(/"/g,'&quot;')})"`:''}>À propos de : ${esc((pr&&pr.nom)||m.produit||'Produit')}</span></div>`;
}
sujetPrec=sujet;
const miens=m.expediteur_id===chatMoi;
html+=`<div class="bulle ${miens?'moi':'autre'}${m._attente?' attente':''}">${typoFr(esc(m.texte))}<div class="heure">${m._attente?'…':esc(heureMsg(m.created_at))}</div></div>`;
});
if(!chatMessages.length){
const moiAcheteur=chatCourant&&chatCourant.acheteurId===chatMoi;
html='<div class="chat-vide">'+(moiAcheteur?'Écrivez votre premier message au vendeur.':'Aucun message.')+'</div>';
}
zone.innerHTML=html;
if(descendre||proche) window.scrollTo(0,document.body.scrollHeight);
}

async function envoyerChat(){
if(envoiEnCours||!chatCourant) return;
const champ=document.getElementById('chat-texte');
const erreur=document.getElementById('chat-erreur');
const texte=champ.value.trim();
if(!texte) return;
erreur.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
const c=chatCourant;
if(!c.produitId){erreur.textContent='Cette discussion est trop ancienne pour recevoir une réponse ici. Utilisez les boutons Appel ou WhatsApp en haut.';return;}
envoiEnCours=true;
champ.value='';
const temp={id:'attente-'+Date.now(),texte:texte,created_at:new Date().toISOString(),expediteur_id:s.user_id,produit_id:c.produitId,produit:c.produitNom||'',_attente:true};
chatMessages.push(temp);
dessinerFil(true);
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages',{method:'POST',headers:Object.assign(entetesAuth(s,true),{Prefer:'return=representation'}),body:JSON.stringify({produit_id:c.produitId,produit:c.produitNom||'',vendeur_id:c.vendeurId,acheteur_id:c.acheteurId,expediteur_id:s.user_id,expediteur:s.nom||'Client',texte:texte})});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
const i=chatMessages.indexOf(temp);
if(i>=0&&lignes[0]) chatMessages[i]=lignes[0];
else if(i>=0) temp._attente=false;
chatSignature='';
dessinerFil(true);
}catch(e){
const i=chatMessages.indexOf(temp);
if(i>=0) chatMessages.splice(i,1);
dessinerFil(false);
champ.value=texte;
erreur.textContent='Message non envoyé. Vérifiez votre connexion et réessayez.';
}
envoiEnCours=false;
champ.focus();
}

function fermerChat(){
clearInterval(chatTimer);
chatTimer=null;
chatCourant=null;
if(chatOrigine==='fiche') montrer('fiche');
else{montrer('conversations');rafraichirListe();}
}
