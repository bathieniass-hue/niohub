let boutiqueActuelle=null;
let logoBoutique="";
let commandesCache=[];
let messagesCache=[];
let origineDetail='boutique';

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
const intl=num.length===9?'221'+num:num;
return 'https://wa.me/'+intl;
}

function ajouterChampTel2(){
const tel=document.getElementById('bt-tel');
if(!tel||document.getElementById('bt-tel2')) return;
const bloc=document.createElement('div');
bloc.innerHTML='<label>Autre numéro (facultatif)</label><input id="bt-tel2" type="tel" inputmode="tel">';
tel.insertAdjacentElement('afterend',bloc);
}
ajouterChampTel2();

function construireBoutique(){
document.getElementById('boutique').innerHTML=`
<header><span style="font-weight:bold;font-size:20px">Ma boutique</span><button id="bt-action" class="petit" style="display:none" onclick="ouvrirFormBoutique()">Modifier</button></header>
<div id="infos-boutique">Chargement…</div>
<div id="boutique-actions"></div>`;
}

async function chargerMaBoutique(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+s.user_id+'&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return lignes[0]||null;
}catch(e){return null;}
}

function afficherBoutiqueEtat(connecte){
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
if(!b){
bouton.style.display='none';
zone.innerHTML='<div class="liste" style="margin-top:0">Vous n\'avez pas encore de boutique.</div>';
actions.innerHTML='<button class="btn" onclick="ouvrirFormBoutique()">Ouvrir ma boutique</button>';
return;
}
bouton.style.display='';
zone.innerHTML=`<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar" style="background:${b.logo?'url('+b.logo+') center/cover':'#F2B233'}">${b.logo?'':'N'}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div><div style="font-size:13px;color:#6B6254">${telephonesBoutique(b)}</div><div style="font-size:13px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')}</div></div></div><div class="liste" style="margin-top:10px">${esc(b.description||'Pas de description.')}</div>`;
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
boutiqueActuelle=connecte?await chargerMaBoutique(s):null;
afficherBoutiqueEtat(connecte);
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
?commandesCache.map((c,i)=>`<div class="ligne" style="cursor:pointer" onclick="voirCommandeDetail(${i})"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div style="font-size:13px;color:#6B6254">${esc(c.nom_client)}</div></div><span>›</span></div>`).join('')
:"Aucune commande pour l'instant.";
}catch(e){document.getElementById('liste-commandes').textContent='Erreur de chargement.';}
}

function voirCommandeDetail(i){
const c=commandesCache[i];
if(!c) return;
const tel=c.telephone||'';
ouvrirDetail('commandes-page','Commande',[
['Produit',c.produit],
['Quantité',String(c.quantite)],
['Client',c.nom_client],
['Téléphone',tel],
['Adresse',c.adresse||'Non indiquée'],
['Paiement',c.paiement||'Non indiqué'],
['Date',new Date(c.created_at).toLocaleString('fr-FR')]
],
`<div style="display:flex;gap:10px;margin-top:14px"><a class="btn" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block" href="tel:${esc(tel)}">Appeler</a><a class="btn2" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block;margin-top:0" href="${lienWhatsapp(tel)}" target="_blank">WhatsApp</a></div>`);
}

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
?messagesCache.map((m,i)=>`<div class="ligne" style="cursor:pointer" onclick="voirMessageDetail(${i})"><div style="flex:1"><div class="name">${esc(m.expediteur)}</div><div style="font-size:13px;color:#6B6254">${esc(m.produit)}</div></div><span>›</span></div>`).join('')
:"Aucun message pour l'instant.";
}catch(e){document.getElementById('liste-messages').textContent='Erreur de chargement.';}
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
if(src){el.textContent='';el.style.background=`url(${src}) center/cover no-repeat`;}
else{el.textContent='+ Logo';el.style.background='#fff';}
}

function choisirLogo(e){
const f=e.target.files[0];
if(!f) return;
const lecteur=new FileReader();
lecteur.onload=()=>{
const img=new Image();
img.onload=()=>{
const echelle=Math.min(1,400/img.width);
const c=document.createElement('canvas');
c.width=img.width*echelle;
c.height=img.height*echelle;
c.getContext('2d').drawImage(img,0,0,c.width,c.height);
logoBoutique=c.toDataURL('image/jpeg',0.7);
apercuLogo(logoBoutique);
};
img.src=lecteur.result;
};
lecteur.readAsDataURL(f);
}

async function enregistrerBoutique(){
const msg=document.getElementById('bt-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){msg.textContent='Connectez-vous dans Profil avant d\'enregistrer.';return;}
const saisi=document.getElementById('bt-nom').value.trim();
const suggestion=nomComplet();
const nom=saisi||(!boutiqueActuelle&&suggestion?'Chez '+suggestion:'');
const tel=document.getElementById('bt-tel').value.trim();
if(!nom||!tel){msg.textContent='Indiquez le nom et le téléphone.';return;}
const corps={
user_id:s.user_id,
nom:nom,
telephone:tel,
telephone2:document.getElementById('bt-tel2').value.trim()||null,
adresse:document.getElementById('bt-adresse').value.trim()||null,
description:document.getElementById('bt-desc').value.trim()||null,
logo:logoBoutique||null
};
const entetes={apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'};
try{
let r;
if(boutiqueActuelle){
r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?id=eq.'+boutiqueActuelle.id,{method:'PATCH',headers:entetes,body:JSON.stringify(corps)});
}else{
r=await fetch(SUPABASE_URL+'/rest/v1/boutiques',{method:'POST',headers:entetes,body:JSON.stringify(corps)});
}
if(!r.ok) throw new Error(r.status);
}catch(e){
msg.textContent='Erreur, enregistrement impossible. Réessayez.';
return;
}
await voirBoutique();
}

async function afficherBoutiqueFiche(userId){
const zone=document.querySelector('#fiche .boutique');
if(!zone) return;
if(!userId){zone.innerHTML='<b>Produit de démonstration</b>';return;}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+userId+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
const b=lignes[0];
zone.innerHTML=b
?`<b>${esc(b.nom)}</b><br><span style="font-size:12px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')} · Tél : ${telephonesBoutique(b)}</span>`
:'<b>Boutique non ouverte</b>';
}catch(e){zone.innerHTML='<b>Boutique</b>';}
}
