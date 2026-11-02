let boutiqueActuelle=null;
let logoBoutique="";

function telephonesBoutique(b){
return [b.telephone,b.telephone2].filter(Boolean).map(esc).join(' · ');
}

function ajouterChampTel2(){
const tel=document.getElementById('bt-tel');
if(!tel||document.getElementById('bt-tel2')) return;
const bloc=document.createElement('div');
bloc.innerHTML='<label>Autre numéro (facultatif)</label><input id="bt-tel2" type="tel" inputmode="tel">';
tel.insertAdjacentElement('afterend',bloc);
}
ajouterChampTel2();

async function chargerMaBoutique(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+s.user_id+'&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return lignes[0]||null;
}catch(e){return null;}
}

function afficherInfosBoutique(connecte){
const zone=document.getElementById('infos-boutique');
const bouton=document.getElementById('bt-action');
const b=boutiqueActuelle;
if(!connecte){
bouton.style.display='none';
zone.innerHTML='<div class="liste" style="margin-top:0">Connectez-vous dans Profil pour gérer votre boutique.</div>';
return;
}
if(!b){
bouton.style.display='none';
zone.innerHTML='<div class="liste" style="margin-top:0">Vous n\'avez pas encore de boutique.</div><button class="btn" onclick="ouvrirFormBoutique()">Ouvrir ma boutique</button>';
return;
}
bouton.style.display='';
bouton.textContent='Modifier';
zone.innerHTML=`<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar" style="background:${b.logo?'url('+b.logo+') center/cover':'#F2B233'}">${b.logo?'':'N'}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div><div style="font-size:13px;color:#6B6254">${telephonesBoutique(b)}</div><div style="font-size:13px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')}</div></div></div><div class="liste" style="margin-top:10px">${esc(b.description||'Pas de description.')}</div>`;
}

function afficherSectionsVendeur(visible){
document.querySelectorAll('#boutique > .btn, #boutique > .btn2').forEach(el=>el.style.display=visible?'':'none');
['commandes-liste','messages-liste'].forEach(id=>{
const zone=document.getElementById(id);
if(!zone) return;
zone.style.display=visible?'block':'none';
const titre=zone.previousElementSibling;
if(titre&&titre.tagName==='LABEL') titre.style.display=visible?'block':'none';
});
}

async function chargerCommandes(s){
const zone=document.getElementById('commandes-liste');
zone.textContent='Chargement…';
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?select=*&vendeur_id=eq.'+s.user_id+'&order=created_at.desc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
zone.innerHTML=lignes.length
?lignes.map(c=>`<div class="ligne"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div class="price" style="font-size:13px">${esc(c.nom_client)} · ${esc(c.telephone)}</div><div style="font-size:12px;color:#6B6254">${esc(c.adresse||'Adresse non indiquée')} · ${esc(c.paiement||'')}</div></div></div>`).join('')
:"Aucune commande pour l'instant.";
}catch(e){zone.textContent='Erreur de chargement.';}
}

async function chargerMessages(s){
const zone=document.getElementById('messages-liste');
zone.textContent='Chargement…';
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=*&vendeur_id=eq.'+s.user_id+'&order=created_at.desc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
zone.innerHTML=lignes.length
?lignes.map(m=>`<div class="ligne" style="display:block"><div class="name">${esc(m.expediteur)} · <span style="font-weight:normal;color:#6B6254">${esc(m.produit)}</span></div><div style="font-size:14px;margin-top:4px">${esc(m.texte)}</div></div>`).join('')
:"Aucun message pour l'instant.";
}catch(e){zone.textContent='Erreur de chargement.';}
}

async function voirBoutique(){
montrer('boutique');
document.getElementById('infos-boutique').textContent='Chargement…';
const s=await sessionValide();
const connecte=!!(s&&s.user_id);
boutiqueActuelle=connecte?await chargerMaBoutique(s):null;
afficherInfosBoutique(connecte);
const ouverte=connecte&&!!boutiqueActuelle;
afficherSectionsVendeur(ouverte);
if(ouverte){chargerCommandes(s);chargerMessages(s);}
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
