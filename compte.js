const CLE_SESSION='niohub_session_v2';
const GOOGLE_CLIENT_ID='50169831108-3s06f0e470g65mepslf0a54ht49hjaci.apps.googleusercontent.com';

function lireSession(){try{return JSON.parse(localStorage.getItem(CLE_SESSION)||'null');}catch(e){return null;}}
function enregistrerSession(s){localStorage.setItem(CLE_SESSION,JSON.stringify(s));}
function oublierSession(){localStorage.removeItem(CLE_SESSION);}

function nomComplet(){
const s=lireSession();
return (s&&s.nom)||'';
}

function sauverTokens(j){
const anc=lireSession()||{};
const meme=!j.user||anc.user_id===j.user.id;
const s={
access_token:j.access_token,
refresh_token:j.refresh_token||anc.refresh_token,
expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),
user_id:(j.user&&j.user.id)||anc.user_id||null,
email:(j.user&&j.user.email)||anc.email||'',
nom:meme?(anc.nom||null):null,
telephone:meme?(anc.telephone||null):null,
quartier:meme?(anc.quartier||null):null
};
enregistrerSession(s);
return s;
}

function traduire(j){
return String(j.msg||j.error_description||j.error||'Connexion impossible. Réessayez.');
}

async function chargerUtilisateur(token){
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});
if(!r.ok) return null;
return await r.json();
}catch(e){return null;}
}

async function sessionValide(){
const s=lireSession();
if(!s||!s.access_token) return null;
if(s.expires_at-60>Date.now()/1000) return s;
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
if(!r.ok){oublierSession();return null;}
return sauverTokens(await r.json());
}catch(e){return s;}
}

async function chargerProfil(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/profils?select=*&user_id=eq.'+s.user_id,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) return null;
const lignes=await r.json();
return lignes[0]||null;
}catch(e){return null;}
}

let googleInitialise=false;

function construireCompte(){
const profil=document.getElementById('profil');
const avatar=profil.querySelector(':scope > .boutique');
if(avatar) avatar.style.display='none';
const zone=document.createElement('div');
zone.id='compte-zone';
profil.querySelector('header').insertAdjacentElement('afterend',zone);
}

function chargerGoogle(){
return new Promise((ok,ko)=>{
if(window.google&&google.accounts&&google.accounts.id) return ok();
const s=document.createElement('script');
s.src='https://accounts.google.com/gsi/client';
s.onload=()=>ok();
s.onerror=()=>ko();
document.head.appendChild(s);
});
}

async function rendrerBoutonGoogle(){
const zone=document.getElementById('g-bouton');
if(!zone) return;
try{
await chargerGoogle();
if(!googleInitialise){
google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:connexionGoogle});
googleInitialise=true;
}
zone.innerHTML='';
google.accounts.id.renderButton(zone,{theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width:300});
}catch(e){
zone.textContent='Connexion Google indisponible pour le moment.';
}
}

function afficherConnexion(){
const zone=document.getElementById('compte-zone');
zone.innerHTML=`<div class="liste" style="margin-top:0">Connectez-vous avec Google. Si vous avez déjà un profil NioHub, il s'affichera automatiquement.</div><div id="g-bouton" style="display:flex;justify-content:center;margin-top:10px"></div><div id="c-msg" class="msg"></div>`;
rendrerBoutonGoogle();
}

function afficherInscription(){
const zone=document.getElementById('compte-zone');
zone.innerHTML=`<div class="liste" style="margin-top:0">Créez votre profil NioHub pour continuer.</div>
<label>Nom</label>
<input id="p-nom" placeholder="Ex. Fatou Diop">
<label>Téléphone</label>
<input id="p-tel" type="tel" inputmode="tel" placeholder="Ex. 77 123 45 67">
<label>Quartier</label>
<input id="p-quartier" placeholder="Ex. Médina">
<div id="c-msg" class="msg"></div>
<button class="btn" style="margin-top:14px" onclick="creerProfil()">Créer mon profil</button>
<button class="btn2" onclick="seDeconnecter()">Annuler</button>`;
}

function afficherProfil(s){
const zone=document.getElementById('compte-zone');
const initiale=(s.nom||'N').trim().charAt(0).toUpperCase();
zone.innerHTML=`<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar">${esc(initiale)}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(s.nom)}</div><div style="font-size:13px;color:#6B6254">${esc(s.telephone||'')}</div><div style="font-size:13px;color:#6B6254">${esc(s.quartier||'Quartier non indiqué')}</div></div></div><button class="btn" style="margin-top:12px" onclick="seDeconnecter()">Se déconnecter</button>`;
}

async function afficherCompte(){
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
if(!s.nom){
const p=await chargerProfil(s);
if(!p){afficherInscription();return;}
s.nom=p.nom;
s.telephone=p.telephone;
s.quartier=p.quartier||null;
enregistrerSession(s);
}
afficherProfil(s);
}

async function connexionGoogle(reponse){
const msg=document.getElementById('c-msg');
if(msg) msg.textContent='';
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=id_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({provider:'google',id_token:reponse.credential})});
const j=await r.json();
if(!r.ok){if(msg) msg.textContent=traduire(j);return;}
const s=sauverTokens(j);
if(!s.user_id){
const u=await chargerUtilisateur(s.access_token);
if(u){s.user_id=u.id;s.email=u.email||'';enregistrerSession(s);}
}
await afficherCompte();
}catch(e){
if(msg) msg.textContent='Connexion Google impossible. Réessayez.';
}
}

async function creerProfil(){
const msg=document.getElementById('c-msg');
msg.textContent='';
const nom=document.getElementById('p-nom').value.trim();
const tel=document.getElementById('p-tel').value.trim();
const quartier=document.getElementById('p-quartier').value.trim();
if(!nom||!tel){msg.textContent='Indiquez votre nom et votre téléphone.';return;}
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/profils',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:s.user_id,nom:nom,telephone:tel,quartier:quartier||null})});
if(!r.ok) throw new Error(r.status);
}catch(e){
msg.textContent='Profil non enregistré. Réessayez.';
return;
}
s.nom=nom;
s.telephone=tel;
s.quartier=quartier||null;
enregistrerSession(s);
afficherProfil(s);
}

function seDeconnecter(){
oublierSession();
if(window.google&&google.accounts&&google.accounts.id) google.accounts.id.disableAutoSelect();
afficherCompte();
}

const voirProfilAvant=voirProfil;
voirProfil=function(){voirProfilAvant();afficherCompte();};

construireCompte();
afficherCompte();
