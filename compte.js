const CLE_SESSION='niohub_session_v2';
const GOOGLE_CLIENT_ID='50169831108-3s06f0e470g65mepslf0a54ht49hjaci.apps.googleusercontent.com';
function lireSession(){try{return JSON.parse(localStorage.getItem(CLE_SESSION)||'null');}catch(e){return null;}}
function enregistrerSession(s){localStorage.setItem(CLE_SESSION,JSON.stringify(s));}
function oublierSession(){
if(typeof retirerPushAuDepart==='function') retirerPushAuDepart();
if(typeof effacerDonneesHorsLigne==='function') effacerDonneesHorsLigne();
localStorage.removeItem(CLE_SESSION);
try{
Object.keys(localStorage).filter(k=>k.indexOf('niohub_chat_')===0||k==='niohub_file_messages_v1').forEach(k=>localStorage.removeItem(k));
if(typeof fileMessages!=='undefined') fileMessages=[];
}catch(e){}
}
function nomComplet(){const s=lireSession();return (s&&s.nom)||'';}
function mettreAJourSession(champs){
const s=lireSession();
if(!s) return;
Object.assign(s,champs);
enregistrerSession(s);
}
const MESSAGE_TEL='Numéro sénégalais invalide : 9 chiffres commençant par 7 (ex. 77 123 45 67).';
function normaliserTelephone(t){
let n=String(t||'').replace(/\D/g,'');
if(n.startsWith('00221')) n=n.slice(5);
else if(n.startsWith('221')&&(n.length>9||n[3]==='7')) n=n.slice(3);
return n;
}
function chiffresTelephone(t){return normaliserTelephone(t).slice(0,9);}
function formaterTelephone(t){
const n=chiffresTelephone(t);
return [n.slice(0,2),n.slice(2,5),n.slice(5,7),n.slice(7,9)].filter(Boolean).join(' ');
}
function telephoneValide(t){return /^7\d{8}$/.test(normaliserTelephone(t));}
function lienAppel(t){const n=chiffresTelephone(t);return n?'tel:+221'+n:'#';}
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
const r=await Donnees.auth.rafraichir(s.refresh_token);
if(!r.ok){
if(r.status===400||r.status===401||r.status===403){oublierSession();return null;}
return s;
}
return sauverTokens(await r.json());
}catch(e){
return s;
}
}
async function chargerProfil(s){
try{
const r=await Donnees.profils.mien(s);
if(!r.ok) return {erreur:true};
const lignes=await r.json();
return {profil:lignes[0]||null};
}catch(e){return {erreur:true};}
}
async function assurerProfil(s){
if(s.nom) return 'ok';
const res=await chargerProfil(s);
if(res.erreur) return 'erreur';
if(!res.profil) return 'creer';
s.nom=res.profil.nom;
s.telephone=res.profil.telephone;
s.adresse=res.profil.adresse||null;
s.photo=res.profil.photo||null;
enregistrerSession(s);
return 'ok';
}

function fermerAuth(){voirAccueil();}
function construireAuth(){
const a=document.createElement('div');
a.id='auth';
a.innerHTML=vueAuth();
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
if(window.google&&window.google.accounts&&window.google.accounts.id) return ok();
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
document.getElementById('auth-corps').innerHTML=vueConnexion();
montrer('auth');
rendrerBoutonGoogle();
}
function afficherErreurReseau(){
document.getElementById('auth-corps').innerHTML=vueErreurReseau();
montrer('auth');
}
function afficherCompletion(){
document.getElementById('auth-corps').innerHTML=vueCompletion();
montrer('auth');
}
async function connexionGoogle(reponse){
const msg=document.getElementById('c-msg');
if(msg) msg.textContent='';
try{
const r=await Donnees.auth.connexionGoogle(reponse.credential);
const j=await r.json();
if(!r.ok){if(msg) msg.textContent=traduire(j);return;}
sauverTokens(j);
await verifierAcces();
}catch(e){
if(msg) msg.textContent='Connexion impossible. Réessayez.';
}
}
async function verifierAcces(){
try{
if(!navigator.onLine){afficherErreurReseau();return;}
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const etat=await assurerProfil(s);
if(etat==='erreur'){afficherErreurReseau();return;}
if(etat==='creer'){afficherCompletion();return;}
montrer('accueil');
}catch(e){
afficherErreurReseau();
}
}
// Au démarrage : on reste sur l'accueil. La connexion n'est demandée que pour une action qui en a besoin.
async function verifierAccesSilencieux(){
try{
if(!navigator.onLine) return;
const s=await sessionValide();
if(!s||!s.user_id) return;
const etat=await assurerProfil(s);
if(etat==='erreur'||etat==='creer') return;
}catch(e){}
}
let profilEnCours=false;
async function creerProfil(){
if(profilEnCours) return;
const msg=document.getElementById('c-msg');
if(msg) msg.textContent='';
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
let r=await Donnees.profils.creer(s,{user_id:s.user_id,nom:complet,telephone:tel,adresse:adresse||null},'return=representation');
if(r.status===409){
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
if(etat==='erreur'){zone.innerHTML=vueProfilErreur();return;}
const photo=urlSure(s.photo);
if(s.photo===undefined) chargerProfil(s).then(res=>{if(res.profil){mettreAJourSession({photo:res.profil.photo||null});if(res.profil.photo&&vueCourante==='profil') afficherProfilCarte();}});
zone.innerHTML=vueProfilCarte({initiale:(s.nom.trim().charAt(0)||'N').toUpperCase(),photo:photo,nom:s.nom,adresse:s.adresse||'Adresse non indiquée',telephone:s.telephone?formaterTelephone(s.telephone):''});
}
function seDeconnecter(){
oublierSession();
if(window.google&&window.google.accounts&&window.google.accounts.id) window.google.accounts.id.disableAutoSelect();
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
construireAuth();
construireZoneProfil();
verifierAccesSilencieux();
