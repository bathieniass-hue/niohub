const CLE_SESSION='niohub_session';

function lireSession(){try{return JSON.parse(localStorage.getItem(CLE_SESSION)||'null');}catch(e){return null;}}
function enregistrerSession(s){localStorage.setItem(CLE_SESSION,JSON.stringify(s));}
function oublierSession(){localStorage.removeItem(CLE_SESSION);}

function nomComplet(){
const s=lireSession();
if(!s||!s.prenom) return '';
return (s.prenom+' '+(s.nom||'')).trim();
}

function appliquerUtilisateur(s,u){
if(!u) return s;
const m=u.user_metadata||{};
if(u.email) s.email=u.email;
s.prenom=m.prenom||s.prenom||'';
s.nom=m.nom||s.nom||'';
return s;
}

function sauverReponse(j,email){
const s={
access_token:j.access_token,
refresh_token:j.refresh_token,
expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),
email:email||''
};
appliquerUtilisateur(s,j.user);
enregistrerSession(s);
return s;
}

async function chargerUtilisateur(token){
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});
if(!r.ok) return null;
return await r.json();
}catch(e){return null;}
}

function traduire(j){
const t=String(j.msg||j.error_description||j.error||'');
if(t.includes('Invalid login')) return 'E-mail ou mot de passe incorrect.';
if(t.includes('not confirmed')) return "Confirmez d'abord votre e-mail en ouvrant le lien reçu.";
if(t.includes('already')) return 'Cet e-mail a déjà un compte. Connectez-vous.';
return t||'Erreur, réessayez.';
}

async function sessionValide(){
const s=lireSession();
if(!s) return null;
if(s.expires_at-60>Date.now()/1000) return s;
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
if(!r.ok){oublierSession();return null;}
return sauverReponse(await r.json(),s.email);
}catch(e){
return s;
}
}

async function recupererSessionDuLien(){
const h=location.hash.replace(/^#/,'');
if(!h.includes('access_token=')) return false;
const p=new URLSearchParams(h);
const s=sauverReponse({access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_in:parseInt(p.get('expires_in'),10)||3600},'');
history.replaceState(null,'',location.pathname+location.search);
const u=await chargerUtilisateur(s.access_token);
appliquerUtilisateur(s,u);
enregistrerSession(s);
return true;
}

let modeInscription=false;

function construireCompte(){
const profil=document.getElementById('profil');
const avatar=profil.querySelector(':scope > .boutique');
if(avatar) avatar.style.display='none';
const bloc=document.createElement('div');
bloc.innerHTML=`
<div id="compte-infos"></div>
<div id="compte-form" style="display:none">
<div id="c-inscription" style="display:none">
<label>Prénom</label>
<input id="c-prenom" placeholder="Ex. Fatou">
<label>Nom</label>
<input id="c-nom" placeholder="Ex. Diop">
<label>Téléphone (facultatif)</label>
<input id="c-tel" type="tel" inputmode="tel" placeholder="Ex. 77 123 45 67">
<label>Adresse (facultatif)</label>
<input id="c-adresse" placeholder="Quartier, repère">
</div>
<label>E-mail</label>
<input id="c-email" type="email" inputmode="email" placeholder="vous@exemple.com">
<label>Mot de passe (6 caractères minimum)</label>
<input id="c-mdp" type="password">
<div id="c-msg" class="msg"></div>
<button id="c-action" class="btn" style="margin-top:14px" onclick="validerFormulaire()">Se connecter</button>
<button id="c-bascule" class="btn2" onclick="basculerMode()">Pas encore de compte ? Créer un compte</button>
<button class="btn2" style="color:#6B6254;border-color:#E6DECB" onclick="afficherCompte()">Annuler</button>
</div>`;
profil.querySelector('header').insertAdjacentElement('afterend',bloc);
}

function basculerMode(){
modeInscription=!modeInscription;
document.getElementById('c-inscription').style.display=modeInscription?'block':'none';
document.getElementById('c-action').textContent=modeInscription?'Créer mon compte':'Se connecter';
document.getElementById('c-bascule').textContent=modeInscription?'Déjà un compte ? Se connecter':'Pas encore de compte ? Créer un compte';
document.getElementById('c-msg').textContent='';
}

function validerFormulaire(){
if(modeInscription) return creerCompte();
return seConnecter();
}

async function afficherCompte(){
const infos=document.getElementById('compte-infos');
document.getElementById('compte-form').style.display='none';
infos.style.display='block';
const s=await sessionValide();
if(s){
const nom=nomComplet();
infos.innerHTML=`<div class="liste" style="margin-top:0"><b>${esc(nom||'Compte connecté')}</b><br><span style="font-size:13px;color:#6B6254">${esc(s.email||'')}</span></div><button class="btn" onclick="seDeconnecter()">Se déconnecter</button>`;
}else{
infos.innerHTML=`<div class="liste" style="margin-top:0">Vous n'êtes pas connecté.</div><button class="btn" onclick="ouvrirFormCompte()">Se connecter ou créer un compte</button>`;
}
}

function ouvrirFormCompte(){
modeInscription=false;
document.getElementById('c-inscription').style.display='none';
document.getElementById('c-action').textContent='Se connecter';
document.getElementById('c-bascule').textContent='Pas encore de compte ? Créer un compte';
document.getElementById('compte-infos').style.display='none';
document.getElementById('compte-form').style.display='block';
document.getElementById('c-msg').textContent='';
}

async function seConnecter(){
const email=document.getElementById('c-email').value.trim();
const mdp=document.getElementById('c-mdp').value;
const msg=document.getElementById('c-msg');
msg.textContent='';
if(!email||mdp.length<6){msg.textContent='Entrez un e-mail et un mot de passe de 6 caractères minimum.';return;}
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:mdp})});
const j=await r.json();
if(!r.ok){msg.textContent=traduire(j);return;}
sauverReponse(j,email);
await afficherCompte();
}catch(e){msg.textContent='Erreur réseau, réessayez.';}
}

async function creerCompte(){
const prenom=document.getElementById('c-prenom').value.trim();
const nom=document.getElementById('c-nom').value.trim();
const tel=document.getElementById('c-tel').value.trim();
const adresse=document.getElementById('c-adresse').value.trim();
const email=document.getElementById('c-email').value.trim();
const mdp=document.getElementById('c-mdp').value;
const msg=document.getElementById('c-msg');
msg.textContent='';
if(!prenom||!nom){msg.textContent='Indiquez votre prénom et votre nom.';return;}
if(!email||mdp.length<6){msg.textContent='Entrez un e-mail et un mot de passe de 6 caractères minimum.';return;}
const corps={email:email,password:mdp,data:{prenom:prenom,nom:nom,telephone:tel||null,adresse:adresse||null}};
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/signup',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(corps)});
const j=await r.json();
if(!r.ok){msg.textContent=traduire(j);return;}
if(j.access_token){sauverReponse(j,email);await afficherCompte();return;}
msg.textContent='Compte créé. Ouvrez le lien reçu par e-mail pour le confirmer : vous serez alors connecté.';
}catch(e){msg.textContent='Erreur réseau, réessayez.';}
}

function seDeconnecter(){
oublierSession();
afficherCompte();
}

const voirProfilAvant=voirProfil;
voirProfil=function(){voirProfilAvant();afficherCompte();};

async function demarrerCompte(){
construireCompte();
const venuDuLien=await recupererSessionDuLien();
if(venuDuLien){montrer('profil');}
await afficherCompte();
}
demarrerCompte();
