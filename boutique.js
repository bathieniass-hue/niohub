let boutiqueActuelle=null;
let logoBoutique="";

function construireBoutique(){
const page=document.getElementById('boutique');
const ancien=page.querySelector(':scope > .boutique');
if(ancien) ancien.style.display='none';
const zone=document.createElement('div');
zone.innerHTML=`
<div id="infos-boutique"></div>
<div id="form-boutique" style="display:none">
<label>Logo (photo)</label>
<div class="apercu" id="bt-logo" style="width:120px;height:120px;border-radius:60px;margin:0 auto" onclick="document.getElementById('bt-photo').click()">+ Logo</div>
<input type="file" id="bt-photo" accept="image/*" style="display:none" onchange="choisirLogo(event)">
<label>Nom de la boutique</label>
<input id="bt-nom">
<label>Téléphone</label>
<input id="bt-tel" type="tel" inputmode="tel">
<label>Adresse</label>
<input id="bt-adresse" placeholder="Quartier, repère">
<label>Description</label>
<textarea id="bt-desc"></textarea>
<div id="bt-msg" style="color:#B4291A;font-size:14px;margin-top:10px;min-height:20px"></div>
<button class="btn" style="margin-top:14px" onclick="enregistrerBoutique()">Enregistrer ma boutique</button>
<button class="btn" style="margin-top:10px;background:#fff;color:#0E6B47;border:1.5px solid #0E6B47" onclick="fermerFormBoutique()">Annuler</button>
</div>`;
page.querySelector('header').insertAdjacentElement('afterend',zone);
}

async function chargerBoutique(){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&order=created_at.asc&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return lignes[0]||null;
}catch(e){
return null;
}
}

function afficherBoutique(){
const zone=document.getElementById('infos-boutique');
const b=boutiqueActuelle;
if(!b){
zone.innerHTML='<div class="liste">Votre boutique n\'est pas encore ouverte.</div><button class="btn" onclick="ouvrirFormBoutique()">Ouvrir ma boutique</button>';
return;
}
zone.innerHTML=`
<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center">
<div class="avatar" style="background:${b.logo?'url('+b.logo+') center/cover':'#F2B233'}">${b.logo?'':'N'}</div>
<div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div><div style="font-size:13px;color:#6B6254">${esc(b.telephone)}</div><div style="font-size:13px;color:#6B6254">${esc(b.adresse||'Adresse non indiquée')}</div></div>
</div>
<div class="liste" style="margin-top:10px">${esc(b.description||'Pas de description.')}</div>
<button class="btn" onclick="ouvrirFormBoutique()">Modifier ma boutique</button>`;
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
document.getElementById('infos-boutique').style.display='none';
document.getElementById('form-boutique').style.display='block';
window.scrollTo(0,0);
}

function fermerFormBoutique(){
document.getElementById('form-boutique').style.display='none';
document.getElementById('infos-boutique').style.display='block';
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
await rafraichirBoutique();
fermerFormBoutique();
}

async function rafraichirBoutique(){
boutiqueActuelle=await chargerBoutique();
afficherBoutique();
}

construireBoutique();
const voirBoutiqueAvantBoutique=voirBoutique;
voirBoutique=function(){
voirBoutiqueAvantBoutique();
fermerFormBoutique();
rafraichirBoutique();
};
