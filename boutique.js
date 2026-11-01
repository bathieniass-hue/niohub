let boutiqueActuelle=null;
let logoBoutique="";

async function chargerBoutique(){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&order=created_at.asc&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return lignes[0]||null;
}catch(e){return null;}
}

function afficherInfosBoutique(){
const zone=document.getElementById('infos-boutique');
const bouton=document.getElementById('bt-action');
const b=boutiqueActuelle;
if(!b){
bouton.textContent='Ouvrir';
zone.innerHTML='<div class="liste" style="margin-top:0">Votre boutique n\'est pas encore ouverte.</div>';
return;
}
bouton.textContent='Modifier';
zone.innerHTML=`<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar" style="background:${b.logo?'url('+b.logo+') center/cover':'#F2B233'}">${b.logo?'':'N'}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div><div style="font-size:13px;color:#6B6254">${esc(b.telephone)}</div><div style="font-size:13px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')}</div></div></div><div class="liste" style="margin-top:10px">${esc(b.description||'Pas de description.')}</div>`;
}

async function voirBoutique(){
montrer('boutique');
document.getElementById('infos-boutique').textContent='Chargement…';
boutiqueActuelle=await chargerBoutique();
afficherInfosBoutique();
chargerCommandes();
}

function ouvrirFormBoutique(){
const b=boutiqueActuelle||{};
logoBoutique=b.logo||"";
document.getElementById('bt-nom').value=b.nom||"";
document.getElementById('bt-tel').value=b.telephone||"";
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
const nom=document.getElementById('bt-nom').value.trim();
const tel=document.getElementById('bt-tel').value.trim();
const msg=document.getElementById('bt-msg');
if(!nom||!tel){msg.textContent='Indiquez le nom et le téléphone.';return;}
const corps={
nom:nom,
telephone:tel,
adresse:document.getElementById('bt-adresse').value.trim()||null,
description:document.getElementById('bt-desc').value.trim()||null,
logo:logoBoutique||null
};
const entetes={apikey:SUPABASE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'};
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

async function chargerCommandes(){
const zone=document.getElementById('commandes-liste');
zone.textContent='Chargement…';
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?select=*&order=created_at.desc',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
zone.innerHTML=lignes.length
?lignes.map(c=>`<div class="ligne"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div class="price" style="font-size:13px">${esc(c.nom_client)} · ${esc(c.telephone)}</div><div style="font-size:12px;color:#6B6254">${esc(c.adresse||'Adresse non indiquée')} · ${esc(c.paiement||'')}</div></div></div>`).join('')
:"Aucune commande pour l'instant.";
}catch(e){
zone.textContent='Erreur de chargement.';
}
}

async function afficherBoutiqueFiche(){
const b=await chargerBoutique();
const zone=document.querySelector('#fiche .boutique');
if(!zone) return;
zone.innerHTML=b
?`<b>${esc(b.nom)}</b><br><span style="font-size:12px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')} · Tél : ${esc(b.telephone)}</span>`
:`<b>Boutique non ouverte</b>`;
}
afficherBoutiqueFiche();
