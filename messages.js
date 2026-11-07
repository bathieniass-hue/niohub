// Messagerie : de vraies conversations entre un acheteur et un vendeur, au sujet d'un produit.
VUES.push('conversations','chat');

let conversations=[];
let origineListe='accueil';
let chatCourant=null;     // {produitId, produitNom, vendeurId, acheteurId, titre}
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
.conv{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #EDE5D3;cursor:pointer}
.conv-img{width:52px;height:52px;border-radius:14px;flex-shrink:0;background:#D9B26F}
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
p.innerHTML=`<div class="entete-ecran"><button class="retour-carre" onclick="fermerChat()" aria-label="Retour">←</button><span class="titre-ecran" id="chat-titre"></span></div>
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
const cle=(m.produit_id?'p'+m.produit_id:'n:'+m.produit)+'|'+m.acheteur_id;
let c=map.get(cle);
if(!c){
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
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour voir vos messages.');montrer('profil');return;}
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
conversations=grouperConversations(await r.json(),s.user_id);
afficherBadge(conversations.reduce((t,c)=>t+c.nonLus,0));
const cible=document.getElementById('conv-corps');
if(!cible) return;
cible.style.padding='0 14px';
cible.innerHTML=conversations.length
?conversations.map((c,i)=>{
const moiAcheteur=c.acheteurId===s.user_id;
const titre=moiAcheteur?nomBoutiqueDe(c.vendeurId):(c.nomAcheteur||'Client');
const p=produitDe(c);
const d=c.dernier;
return `<div class="conv${c.nonLus?' nonlu':''}" onclick="ouvrirConversation(${i})"><div class="conv-img" style="background:${fondImage(urlMiniature(p&&p.photo),'#D9B26F')}"></div><div class="conv-corps"><div class="conv-haut"><span class="conv-nom">${esc(titre)}</span><span class="conv-heure">${esc(quandMsg(d.created_at))}</span></div><div class="conv-produit">${esc(c.produitNom||'')}</div><div class="conv-apercu">${d.expediteur_id===s.user_id?'Vous : ':''}${esc(d.texte)}</div></div>${c.nonLus?`<span class="conv-nonlus">${c.nonLus}</span>`:''}</div>`;
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
ouvrirChat({produitId:c.produitId||(p&&p.id)||null,produitNom:c.produitNom||(p&&p.nom)||'',vendeurId:c.vendeurId,acheteurId:c.acheteurId},'liste');
}

// ---------- Écran de discussion ----------
// Depuis la fiche produit : bouton « Message »
async function voirMessage(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id||!produitOuvert.id){alert('Ce produit de démonstration ne peut pas recevoir de message.');return;}
if(produitOuvert.user_id===s.user_id){alert('C\'est votre produit : ouvrez Messages pour répondre à vos clients.');return;}
await ouvrirChat({produitId:produitOuvert.id,produitNom:produitOuvert.nom,vendeurId:produitOuvert.user_id,acheteurId:s.user_id},'fiche');
}

async function ouvrirChat(ctx,origine){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
chatMoi=s.user_id;
chatCourant=Object.assign({},ctx);
chatOrigine=origine;
chatMessages=[];
chatSignature='';
const moiAcheteur=ctx.acheteurId===s.user_id;
document.getElementById('chat-titre').textContent=moiAcheteur?nomBoutiqueDe(ctx.vendeurId):'Client';
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

function filtreConversation(c){
let f='acheteur_id=eq.'+c.acheteurId+'&vendeur_id=eq.'+c.vendeurId;
f+=c.produitId?'&produit_id=eq.'+c.produitId:'&produit_id=is.null&produit=eq.'+encodeURIComponent(c.produitNom||'');
return f;
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
if(a) document.getElementById('chat-titre').textContent=a.expediteur||'Client';
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
let html='',jourPrec='';
chatMessages.forEach(m=>{
const j=jourMsg(m.created_at);
if(j!==jourPrec){html+=`<div class="chat-jour">${esc(j)}</div>`;jourPrec=j;}
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
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
const c=chatCourant;
if(!c.produitId){erreur.textContent='Ce message est trop ancien pour recevoir une réponse ici. Contactez la personne par téléphone.';return;}
envoiEnCours=true;
champ.value='';
const temp={id:'attente-'+Date.now(),texte:texte,created_at:new Date().toISOString(),expediteur_id:s.user_id,_attente:true};
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
