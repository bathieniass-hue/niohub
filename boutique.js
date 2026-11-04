let boutiqueActuelle=null;
let logoBoutique="";
let logoBlob=null;
let logoApercuUrl=null;
let commandesCache=[];
let messagesCache=[];
let origineDetail='boutique';
let boutiqueEnCours=false;

const LOGO_MAX=290000;
const PAGES_BOUTIQUE=['commandes-page','messages-page','detail-vente'];

const montrerAvantBoutique=montrer;
montrer=function(vue){
PAGES_BOUTIQUE.forEach(id=>{const el=document.getElementById(id);if(el&&id!==vue) el.style.display='none';});
montrerAvantBoutique(vue);
};

function creerPage(id){
let p=document.getElementById(id);
if(!p){
p=document.createElement('div');
p.id=id;
p.className='page';
document.body.appendChild(p);
}
return p;
}

function afficherPage(id){
montrer(id);
const el=document.getElementById(id);
if(el) el.style.display='block';
window.scrollTo(0,0);
}

function telephonesBoutique(b){
return [b.telephone,b.telephone2].filter(Boolean).map(esc).join(' · ');
}

function lienWhatsapp(tel){
const num=String(tel||'').replace(/\D/g,'');
if(!num) return '#';
const intl=num.length===9?'221'+num:num;
return 'https://wa.me/'+intl;
}

function ajouterChampTel2(){
const tel=document.getElementById('bt-tel');
if(!tel||document.getElementById('bt-tel2')) return;
const bloc=document.createElement('div');
bloc.innerHTML='<label>Autre numéro (facultatif)</label><input id="bt-tel2" type="tel" inputmode="tel" maxlength="20">';
tel.insertAdjacentElement('afterend',bloc);
}
ajouterChampTel2();

function construireBoutique(){
document.getElementById('boutique').innerHTML=`
<header><span style="font-weight:bold;font-size:20px">Ma boutique</span><button id="bt-action" class="petit" style="display:none" onclick="ouvrirFormBoutique()">Modifier</button></header>
<div id="infos-boutique">Chargement…</div>
<div id="boutique-actions"></div>`;
}

// Distingue "pas de boutique" d'une "erreur réseau" pour ne jamais proposer d'en recréer une qui existe déjà
async function chargerMaBoutique(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+s.user_id+'&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return {boutique:lignes[0]||null};
}catch(e){return {erreur:true};}
}

function afficherBoutiqueEtat(connecte,erreur){
const zone=document.getElementById('infos-boutique');
const actions=document.getElementById('boutique-actions');
const bouton=document.getElementById('bt-action');
const b=boutiqueActuelle;
if(!connecte){
bouton.style.display='none';
zone.innerHTML='<div class="liste" style="margin-top:0">Connectez-vous dans Profil pour gérer votre boutique.</div>';
actions.innerHTML='';
return;
}
if(erreur){
bouton.style.display='none';
zone.innerHTML='<div class="liste" style="margin-top:0">Impossible de charger votre boutique. Vérifiez votre connexion.</div>';
actions.innerHTML='<button class="btn" onclick="voirBoutique()">Réessayer</button>';
return;
}
if(!b){
bouton.style.display='none';
zone.innerHTML='<div class="liste" style="margin-top:0">Vous n\'avez pas encore de boutique.</div>';
actions.innerHTML='<button class="btn" onclick="ouvrirFormBoutique()">Ouvrir ma boutique</button>';
return;
}
bouton.style.display='';
zone.innerHTML=`<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar" style="background:${fondImage(b.logo,'#F2B233')}">${urlSure(b.logo)?'':'N'}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div><div style="font-size:13px;color:#6B6254">${telephonesBoutique(b)}</div><div style="font-size:13px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')}</div></div></div><div class="liste" style="margin-top:10px">${esc(b.description||'Pas de description.')}</div>`;
actions.innerHTML=`<button class="btn" style="margin-top:14px" onclick="voirMesProduits()">Mes produits</button>
<button class="btn2" onclick="voirAjout('boutique')">Ajouter un produit</button>
<button class="btn2" onclick="voirCommandes()">Commandes</button>
<button class="btn2" onclick="voirMessages()">Messages</button>`;
}

async function voirBoutique(){
construireBoutique();
montrer('boutique');
const s=await sessionValide();
const connecte=!!(s&&s.user_id);
let erreur=false;
boutiqueActuelle=null;
if(connecte){
const res=await chargerMaBoutique(s);
if(res.erreur) erreur=true; else boutiqueActuelle=res.boutique;
}
afficherBoutiqueEtat(connecte,erreur);
}

function ouvrirDetail(origine,titre,lignes,actions){
origineDetail=origine;
const p=creerPage('detail-vente');
p.innerHTML=`<header><button class="retour" onclick="afficherPage('${origine}')">←</button><span style="font-weight:bold;font-size:18px">${esc(titre)}</span><span></span></header><div class="liste" style="margin-top:0">${lignes.map(([k,v])=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-size:12px;color:#6B6254">${esc(k)}</div><div style="font-size:15px;font-weight:bold">${esc(v)}</div></div>`).join('')}</div>${actions||''}`;
afficherPage('detail-vente');
}

async function voirCommandes(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil.');montrer('profil');return;}
const p=creerPage('commandes-page');
p.innerHTML=`<header><button class="retour" onclick="voirBoutique()">←</button><span style="font-weight:bold;font-size:20px">Commandes</span><span></span></header><div id="liste-commandes" class="liste" style="margin-top:0">Chargement…</div>`;
afficherPage('commandes-page');
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?select=*&vendeur_id=eq.'+s.user_id+'&order=created_at.desc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
commandesCache=await r.json();
document.getElementById('liste-commandes').innerHTML=commandesCache.length
?commandesCache.map((c,i)=>{
const st=c.statut||'À préparer';
const total=c.total?' · '+Number(c.total).toLocaleString('fr-FR')+' FCFA':'';
return `<div class="ligne" style="cursor:pointer" onclick="voirCommandeDetail(${i})"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div style="font-size:13px;color:#6B6254">${esc(c.nom_client)}${esc(total)}</div></div><span style="font-size:12px;font-weight:bold;color:${couleurStatut(st)}">${esc(st)}</span><span style="margin-left:6px">›</span></div>`;
}).join('')
:"Aucune commande pour l'instant.";
}catch(e){document.getElementById('liste-commandes').textContent='Erreur de chargement. Vérifiez votre connexion.';}
}

// voirCommandeDetail() est définie dans statut.js (détail + changement de statut).

async function voirMessages(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil.');montrer('profil');return;}
const p=creerPage('messages-page');
p.innerHTML=`<header><button class="retour" onclick="voirBoutique()">←</button><span style="font-weight:bold;font-size:20px">Messages</span><span></span></header><div id="liste-messages" class="liste" style="margin-top:0">Chargement…</div>`;
afficherPage('messages-page');
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=*&vendeur_id=eq.'+s.user_id+'&order=created_at.desc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
messagesCache=await r.json();
document.getElementById('liste-messages').innerHTML=messagesCache.length
?messagesCache.map((m,i)=>`<div class="ligne" style="cursor:pointer" onclick="voirMessageDetail(${i})"><div style="flex:1"><div class="name">${esc(m.expediteur)}</div><div style="font-size:13px;color:#6B6254">${esc(m.produit)} · ${esc(new Date(m.created_at).toLocaleDateString('fr-FR'))}</div></div><span>›</span></div>`).join('')
:"Aucun message pour l'instant.";
}catch(e){document.getElementById('liste-messages').textContent='Erreur de chargement. Vérifiez votre connexion.';}
}

function voirMessageDetail(i){
const m=messagesCache[i];
if(!m) return;
ouvrirDetail('messages-page','Message',[
['De',m.expediteur],
['Produit',m.produit],
['Date',new Date(m.created_at).toLocaleString('fr-FR')]
],
`<div style="background:#fff;border:1px solid #EDE5D3;border-radius:14px;padding:14px;margin-top:14px;font-size:15px;line-height:1.5">${esc(m.texte)}</div>`);
}

async function ouvrirFormBoutique(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous d\'abord dans Profil.');montrer('profil');return;}
const b=boutiqueActuelle||{};
logoBoutique=b.logo||"";
logoBlob=null;
const champNom=document.getElementById('bt-nom');
const suggestion=nomComplet();
champNom.placeholder=suggestion?'Chez '+suggestion:'Nom de la boutique';
champNom.value=b.nom||"";
document.getElementById('bt-tel').value=b.telephone||"";
document.getElementById('bt-tel2').value=b.telephone2||"";
document.getElementById('bt-adresse').value=b.adresse||"";
document.getElementById('bt-desc').value=b.description||"";
document.getElementById('bt-msg').textContent="";
apercuLogo(logoBoutique);
montrer('boutique-form');
}

function apercuLogo(src){
const el=document.getElementById('bt-logo');
const sur=urlSure(src)||urlLocale(src);
if(sur){el.textContent='';el.style.background='url('+sur+') center/cover no-repeat';}
else{el.textContent='+ Logo';el.style.background='#fff';}
}

async function choisirLogo(e){
const f=e.target.files[0];
e.target.value='';
if(!f) return;
if(!f.type.startsWith('image/')){alert('Choisissez une image pour le logo.');return;}
try{
const img=await chargerImageDepuis(f);
logoBlob=await reduireImage(img,300,0.75);
if(!logoBlob) throw new Error('image');
}catch(err){
logoBlob=null;
alert('Ce logo ne peut pas être lu. Essayez une autre image.');
return;
}
if(logoApercuUrl) URL.revokeObjectURL(logoApercuUrl);
logoApercuUrl=URL.createObjectURL(logoBlob);
apercuLogo(logoApercuUrl);
}

async function enregistrerBoutique(){
if(boutiqueEnCours) return;
const msg=document.getElementById('bt-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){msg.textContent='Connectez-vous dans Profil avant d\'enregistrer.';return;}
const saisi=document.getElementById('bt-nom').value.trim();
const suggestion=nomComplet();
const nom=saisi||(!boutiqueActuelle&&suggestion?'Chez '+suggestion:'');
const tel=document.getElementById('bt-tel').value.trim();
const tel2=document.getElementById('bt-tel2').value.trim();
const adresse=document.getElementById('bt-adresse').value.trim();
const description=document.getElementById('bt-desc').value.trim();
if(!nom||!tel){msg.textContent='Indiquez le nom et le téléphone.';return;}
if(nom.length>100){msg.textContent='Le nom de la boutique est trop long (100 caractères maximum).';return;}
if(!telephoneValide(tel)){msg.textContent='Numéro de téléphone invalide (9 chiffres, ex. 77 123 45 67).';return;}
if(tel2&&!telephoneValide(tel2)){msg.textContent='Le deuxième numéro est invalide.';return;}
if(adresse.length>200){msg.textContent='L\'adresse est trop longue (200 caractères maximum).';return;}
if(description.length>1000){msg.textContent='La description est trop longue (1000 caractères maximum).';return;}
if(logoBlob&&logoBlob.size>LOGO_MAX){msg.textContent='Ce logo est trop lourd. Choisissez-en un plus léger.';return;}
const corps={
nom:nom,
telephone:tel,
telephone2:tel2||null,
adresse:adresse||null,
description:description||null,
logo:logoBoutique||null
};
const modification=!!boutiqueActuelle;
if(!modification) corps.user_id=s.user_id;
const entetes={apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:modification?'return=representation':'return=minimal'};
const bouton=document.querySelector('#boutique-form .btn');
const texteBouton=bouton?bouton.textContent:'';
boutiqueEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Enregistrement…';}
const fin=()=>{boutiqueEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}};
let nouveauLogo=null;
try{
// Le logo part d'abord dans Supabase Storage ; la base ne garde que son adresse
if(logoBlob){
nouveauLogo=await televerserPhoto(logoBlob,null,s);
corps.logo=nouveauLogo;
}
let r;
if(modification){
r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?id=eq.'+encodeURIComponent(boutiqueActuelle.id)+'&user_id=eq.'+s.user_id,{method:'PATCH',headers:entetes,body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
// Supabase répond "OK" même si la règle de sécurité bloque : on vérifie qu'une ligne a bien été modifiée
if(!lignes.length) throw new Error('refusé');
}else{
r=await fetch(SUPABASE_URL+'/rest/v1/boutiques',{method:'POST',headers:entetes,body:JSON.stringify(corps)});
if(r.status===409){
// Une boutique existe déjà pour ce compte : on la recharge au lieu d'en créer une 2e
if(nouveauLogo) await supprimerPhotoStockee(nouveauLogo,s);
fin();
await voirBoutique();
return;
}
if(!r.ok) throw new Error(r.status);
}
}catch(e){
if(nouveauLogo) await supprimerPhotoStockee(nouveauLogo,s);
fin();
msg.textContent='Erreur, enregistrement impossible. Vérifiez votre connexion et réessayez.';
return;
}
// Logo remplacé : l'ancien est supprimé de Storage
if(modification&&nouveauLogo&&boutiqueActuelle&&boutiqueActuelle.logo) await supprimerPhotoStockee(boutiqueActuelle.logo,s);
fin();
await voirBoutique();
}

// afficherBoutiqueFiche() est définie dans avis.js (boutique + note sur la fiche produit).
