const CLE_SESSION='niohub_session_v2';
const GOOGLE_CLIENT_ID='50169831108-3s06f0e470g65mepslf0a54ht49hjaci.apps.googleusercontent.com';

function lireSession(){try{return JSON.parse(localStorage.getItem(CLE_SESSION)||'null');}catch(e){return null;}}
function enregistrerSession(s){localStorage.setItem(CLE_SESSION,JSON.stringify(s));}
function oublierSession(){localStorage.removeItem(CLE_SESSION);}
function nomComplet(){const s=lireSession();return (s&&s.nom)||'';}

// Met à jour le profil gardé en mémoire sur le téléphone (nom, téléphone, adresse)
function mettreAJourSession(champs){
const s=lireSession();
if(!s) return;
Object.assign(s,champs);
enregistrerSession(s);
}

const MESSAGE_TEL='Numéro sénégalais invalide : 9 chiffres commençant par 7 (ex. 77 123 45 67).';

// Tous les chiffres d'un numéro, sans l'indicatif +221 / 00221 s'il a été collé
function normaliserTelephone(t){
let n=String(t||'').replace(/\D/g,'');
if(n.startsWith('00221')) n=n.slice(5);
else if(n.startsWith('221')&&(n.length>9||n[3]==='7')) n=n.slice(3);
return n;
}
// Les 9 premiers chiffres (pour l'affichage dans le champ)
function chiffresTelephone(t){return normaliserTelephone(t).slice(0,9);}
// 771234567 -> "77 123 45 67"
function formaterTelephone(t){
const n=chiffresTelephone(t);
return [n.slice(0,2),n.slice(2,5),n.slice(5,7),n.slice(7,9)].filter(Boolean).join(' ');
}
// Numéro sénégalais : toujours 9 chiffres, commençant par 7
function telephoneValide(t){return /^7\d{8}$/.test(normaliserTelephone(t));}
function lienAppel(t){const n=chiffresTelephone(t);return n?'tel:+221'+n:'#';}

// Les espaces s'écrivent tout seuls dans tous les champs téléphone, sans déplacer le curseur
document.addEventListener('input',e=>{
const el=e.target;
if(!el||el.tagName!=='INPUT'||el.type!=='tel') return;
const f=formaterTelephone(el.value);
if(f===el.value) return;
const pos=el.selectionStart;
const chiffresAvant=pos==null?null:el.value.slice(0,pos).replace(/\D/g,'').length;
el.value=f;
if(chiffresAvant!==null){
let i=0,c=0;
while(i<f.length&&c<chiffresAvant){if(/\d/.test(f[i])) c++;i++;}
try{el.setSelectionRange(i,i);}catch(err){}
}
});

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
adresse:meme?(anc.adresse||null):null
};
enregistrerSession(s);
return s;
}

function traduire(j){return String(j.msg||j.error_description||j.error||'Connexion impossible. Réessayez.');}

async function sessionValide(){
const s=lireSession();
if(!s||!s.access_token) return null;
if(s.expires_at-60>Date.now()/1000) return s;
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
if(!r.ok){
// On ne déconnecte que si le jeton est vraiment refusé, pas pour une panne passagère du serveur
if(r.status===400||r.status===401||r.status===403){oublierSession();return null;}
return s;
}
return sauverTokens(await r.json());
}catch(e){return s;}
}

// Distingue "pas de profil" d'une "erreur réseau" pour ne jamais redemander un profil qui existe déjà
async function chargerProfil(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/profils?select=*&user_id=eq.'+s.user_id,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) return {erreur:true};
const lignes=await r.json();
return {profil:lignes[0]||null};
}catch(e){return {erreur:true};}
}

// Retourne 'ok', 'creer' (aucun profil) ou 'erreur' (réseau)
async function assurerProfil(s){
if(s.nom) return 'ok';
const res=await chargerProfil(s);
if(res.erreur) return 'erreur';
if(!res.profil) return 'creer';
s.nom=res.profil.nom;
s.telephone=res.profil.telephone;
s.adresse=res.profil.adresse||null;
enregistrerSession(s);
return 'ok';
}

function injecterStyle(){
const st=document.createElement('style');
st.textContent=`
#auth{display:none;position:fixed;top:0;bottom:0;left:0;right:0;max-width:430px;margin:0 auto;overflow-y:auto;background:#FBF7EE;z-index:50}
.auth-haut{background:linear-gradient(160deg,#0E6B47 0%,#0A4D33 100%);color:#fff;padding:60px 24px 90px;text-align:center;border-radius:0 0 32px 32px}
.auth-logo{display:block;width:96px;height:96px;margin:0 auto 10px;object-fit:contain}
.auth-titre{margin:0;font-size:28px;font-weight:800;color:#fff}
.auth-sous{margin-top:8px;font-size:14px;line-height:1.5;opacity:.92}
.auth-carte{background:#fff;margin:-60px 20px 30px;padding:24px 20px;border-radius:24px;border:1px solid #EDE5D3;box-shadow:0 12px 32px rgba(30,26,20,.12)}
.auth-carte h2{margin:0 0 6px;font-size:20px;color:#1E1A14}
.auth-carte p{margin:0 0 16px;font-size:14px;line-height:1.5;color:#6B6254}
.g-enveloppe{display:flex;justify-content:center;padding:16px 10px;border-radius:18px;background:#F7F4EC;border:1px solid #EDE5D3}
.auth-pied{margin-top:16px;text-align:center;font-size:12px;line-height:1.5;color:#8A8170}
.auth-champs label{display:block;margin:12px 0 6px;font-size:13px;font-weight:bold}
.auth-champs input{width:100%;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif}
.btn-plein{width:100%;height:52px;margin-top:16px;border:0;border-radius:14px;background:#0E6B47;color:#fff;font-size:15px;font-weight:bold;box-shadow:0 6px 16px rgba(14,107,71,.3)}
.auth-lien{width:100%;margin-top:12px;border:0;background:none;color:#0E6B47;font-size:13px;font-weight:bold}
`;
document.head.appendChild(st);
}

function construireAuth(){
const a=document.createElement('div');
a.id='auth';
a.innerHTML=`<div class="auth-haut"><img class="auth-logo" src="logo-n.png" alt="NioHub"><h1 class="auth-titre">NioHub</h1><div class="auth-sous">Achetez et vendez près de chez vous, en toute confiance.</div></div><div class="auth-carte" id="auth-corps"><p>Chargement…</p></div>`;
document.body.appendChild(a);
}

function construireZoneProfil(){
const profil=document.getElementById('profil');
const avatar=profil.querySelector(':scope > .boutique');
if(avatar) avatar.style.display='none';
const zone=document.createElement('div');
zone.id='compte-zone';
profil.querySelector('header').insertAdjacentElement('afterend',zone);
}

const montrerOriginal=montrer;
montrer=function(vue){
const estAuth=vue==='auth';
const auth=document.getElementById('auth');
if(auth) auth.style.display=estAuth?'block':'none';
montrerOriginal(estAuth?'__aucune__':vue);
};

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

let googleInitialise=false;

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
google.accounts.id.renderButton(zone,{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:300});
}catch(e){
zone.textContent='Connexion Google indisponible pour le moment.';
}
}

function afficherConnexion(){
document.getElementById('auth-corps').innerHTML=`
<h2>Bienvenue</h2>
<p>Connectez-vous pour acheter, vendre et gérer votre boutique en toute sécurité.</p>
<div class="g-enveloppe"><div id="g-bouton"></div></div>
<div id="c-msg" class="msg"></div>
<div class="auth-pied">En continuant, vous acceptez les <a href="conditions.html" target="_blank" rel="noopener" style="color:#0E6B47;font-weight:bold">conditions d'utilisation et la politique de confidentialité</a> de NioHub.</div>`;
montrer('auth');
rendrerBoutonGoogle();
}

function afficherErreurReseau(){
document.getElementById('auth-corps').innerHTML=`
<h2>Connexion impossible</h2>
<p>Nous n'arrivons pas à joindre le serveur. Vérifiez votre connexion internet puis réessayez.</p>
<button class="btn-plein" onclick="verifierAcces()">Réessayer</button>
<button class="auth-lien" onclick="seDeconnecter()">Changer de compte</button>`;
montrer('auth');
}

function afficherCompletion(){
document.getElementById('auth-corps').innerHTML=`
<h2>Presque terminé</h2>
<p>Complétez votre profil pour commencer. Ces informations serviront à vos achats et à votre boutique.</p>
<div class="auth-champs">
<label>Prénom</label><input id="p-prenom" placeholder="Ex. Fatou" maxlength="40">
<label>Nom</label><input id="p-nom" placeholder="Ex. Diop" maxlength="40">
<label>Téléphone</label><div class="champ-tel"><span class="indicatif">+221</span><input id="p-tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>
<label>Adresse (facultatif)</label><input id="p-adresse" placeholder="Quartier, repère" maxlength="200">
</div>
<div id="c-msg" class="msg"></div>
<button id="p-valider" class="btn-plein" onclick="creerProfil()">Enregistrer mon profil</button>
<button class="auth-lien" onclick="seDeconnecter()">Changer de compte</button>`;
montrer('auth');
}

async function connexionGoogle(reponse){
const msg=document.getElementById('c-msg');
if(msg) msg.textContent='';
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=id_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({provider:'google',id_token:reponse.credential})});
const j=await r.json();
if(!r.ok){if(msg) msg.textContent=traduire(j);return;}
sauverTokens(j);
await verifierAcces();
}catch(e){
if(msg) msg.textContent='Connexion impossible. Réessayez.';
}
}

async function verifierAcces(){
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const etat=await assurerProfil(s);
if(etat==='erreur'){afficherErreurReseau();return;}
if(etat==='creer'){afficherCompletion();return;}
montrer('accueil');
}

let profilEnCours=false;

async function creerProfil(){
if(profilEnCours) return;
const msg=document.getElementById('c-msg');
msg.textContent='';
const prenom=document.getElementById('p-prenom').value.trim();
const nom=document.getElementById('p-nom').value.trim();
const tel=formaterTelephone(document.getElementById('p-tel').value);
const adresse=document.getElementById('p-adresse').value.trim();
if(!prenom||!nom||!tel){msg.textContent='Indiquez votre prénom, votre nom et votre téléphone.';return;}
if(!telephoneValide(tel)){msg.textContent=MESSAGE_TEL;return;}
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const complet=prenom+' '+nom;
const bouton=document.getElementById('p-valider');
profilEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Enregistrement…';}
const fin=()=>{profilEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent='Enregistrer mon profil';}};
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/profils',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:s.user_id,nom:complet,telephone:tel,adresse:adresse||null})});
if(r.status===409){
// Le profil existe déjà (double envoi ou autre appareil) : on le récupère au lieu d'échouer
const res=await chargerProfil(s);
if(res.profil){
enregistrerSession(Object.assign(s,{nom:res.profil.nom,telephone:res.profil.telephone,adresse:res.profil.adresse||null}));
fin();
montrer('accueil');
return;
}
}
if(!r.ok) throw new Error(r.status);
}catch(e){
fin();
msg.textContent='Profil non enregistré. Vérifiez votre connexion et réessayez.';
return;
}
fin();
s.nom=complet;
s.telephone=tel;
s.adresse=adresse||null;
enregistrerSession(s);
montrer('accueil');
}

async function afficherProfilCarte(){
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const zone=document.getElementById('compte-zone');
const etat=await assurerProfil(s);
if(etat==='creer'){afficherCompletion();return;}
if(etat==='erreur'){
zone.innerHTML='<div class="liste" style="margin-top:0">Impossible de charger votre profil. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" onclick="afficherProfilCarte()">Réessayer</button></div>';
return;
}
const initiale=(s.nom.trim().charAt(0)||'N').toUpperCase();
zone.innerHTML=`<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar">${esc(initiale)}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(s.nom)}</div><div style="font-size:13px;color:#6B6254">${esc(s.telephone?'+221 '+formaterTelephone(s.telephone):'')}</div><div style="font-size:13px;color:#6B6254">${esc(s.adresse||'Adresse non indiquée')}</div></div></div>`;
}

function seDeconnecter(){
oublierSession();
if(window.google&&google.accounts&&google.accounts.id) google.accounts.id.disableAutoSelect();
verifierAcces();
}

const ouvrirFormBoutiqueAvant=ouvrirFormBoutique;
ouvrirFormBoutique=async function(){
await ouvrirFormBoutiqueAvant();
const s=lireSession()||{};
const tel=document.getElementById('bt-tel');
const adr=document.getElementById('bt-adresse');
if(tel) tel.placeholder=s.telephone||'Téléphone';
if(adr) adr.placeholder=s.adresse||'Quartier, repère';
};

const enregistrerBoutiqueAvant=enregistrerBoutique;
enregistrerBoutique=async function(){
const s=lireSession()||{};
const tel=document.getElementById('bt-tel');
const adr=document.getElementById('bt-adresse');
if(tel&&!tel.value.trim()&&s.telephone) tel.value=formaterTelephone(s.telephone);
if(adr&&!adr.value.trim()&&s.adresse) adr.value=s.adresse;
return enregistrerBoutiqueAvant();
};

const voirProfilAvant=voirProfil;
voirProfil=function(){voirProfilAvant();afficherProfilCarte();};

injecterStyle();
construireAuth();
construireZoneProfil();
montrer('auth');
verifierAcces();
