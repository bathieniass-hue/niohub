const CLE_SESSION='niohub_session';

function lireSession(){try{return JSON.parse(localStorage.getItem(CLE_SESSION)||'null');}catch(e){return null;}}
function enregistrerSession(s){localStorage.setItem(CLE_SESSION,JSON.stringify(s));}
function oublierSession(){localStorage.removeItem(CLE_SESSION);}

function sauverReponse(j,email){
const s={
access_token:j.access_token,
refresh_token:j.refresh_token,
expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),
email:email||(j.user&&j.user.email)||''
};
enregistrerSession(s);
return s;
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
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(r.ok){const u=await r.json();s.email=u.email||'';enregistrerSession(s);}
}catch(e){}
return true;
}

function construireCompte(){
const profil=document.getElementById('profil');
const avatar=profil.querySelector(':scope > .boutique');
if(avatar) avatar.style.display='none';
const bloc=document.createElement('div');
bloc.innerHTML=`
<div id="compte-infos"></div>
<div id="compte-form" style="display:none">
<label>E-mail</label>
<input id="c-email" type="email" inputmode="email" placeholder="vous@exemple.com">
<label>Mot de passe (6 caractères minimum)</label>
<input id="c-mdp" type="password">
<div id="c-msg" style="color:#B4291A;font-size:14px;margin-top:10px;min-height:20px"></div>
<button class="btn" style="margin-top:14px" onclick="seConnecter()">Se connecter</button>
<button class="btn" style="margin-top:10px;background:#fff;color:#0E6B47;border:1.5px solid #0E6B47" onclick="creerCompte()">Créer un compte</button>
<button class="btn" style="margin-top:10px;background:#fff;color:#6B6254;border:1px solid #E6DECB" onclick="afficherCompte()">Annuler</button>
</div>`;
profil.querySelector('header').insertAdjacentElement('afterend',bloc);
}

async function afficherCompte(){
const infos=document.getElementById('compte-infos');
document.getElementById('compte-form').style.display='none';
infos.style.display='block';
const s=await sessionValide();
if(s){
infos.innerHTML=`<div class="liste" style="margin-top:0"><b>Connecté</b><br><span style="font-size:13px;color:#6B6254">${esc(s.email||'Compte sans e-mail')}</span></div><button class="btn" onclick="seDeconnecter()">Se déconnecter</button>`;
}else{
infos.innerHTML=`<div class="liste" style="margin-top:0">Vous n'êtes pas connecté.</div><button class="btn" onclick="ouvrirFormCompte()">Se connecter ou créer un compte</button>`;
}
}

function ouvrirFormCompte(){
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
const email=document.getElementById('c-email').value.trim();
const mdp=document.getElementById('c-mdp').value;
const msg=document.getElementById('c-msg');
msg.textContent='';
if(!email||mdp.length<6){msg.textContent='Entrez un e-mail et un mot de passe de 6 caractères minimum.';return;}
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/signup',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:mdp})});
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
