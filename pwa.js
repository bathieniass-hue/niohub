// NioHub : installation, mises à jour et actualisation de l'application. Logique seulement.
// L'affichage (bandeaux, ligne « Installer ») : ecran-pwa.js. Le style : style.css. Les clics : ecran-liaisons.js.
const VERSION_APP=(typeof NIOHUB_VERSION!=='undefined')?NIOHUB_VERSION:''; // vient de version.js
let DELAI_RETOUR=60000;  // actualiser les produits si l'application revient après plus d'1 minute
let invitationInstall=null;

// ---------- Service worker ----------
if('serviceWorker' in navigator){
window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{});});
}

// ---------- Zoom : le pincement à deux doigts est bloqué aussi sur iPhone ----------
document.addEventListener('gesturestart',e=>e.preventDefault());

// ---------- Écrans avec saisie : on n'y actualise jamais (pour ne rien effacer) ----------
const ECRANS_SAISIE=['ajout','commande','chat','boutique-form','profil-modif','avis-page','auth'];
function ecranAvecSaisie(){
const ouvert=ECRANS_SAISIE.some(id=>{const e=document.getElementById(id);return e&&e.style.display==='block';});
const champ=/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement&&document.activeElement.tagName)||'');
return ouvert||champ;
}

// ---------- Nouvelle version disponible ----------
async function verifierMiseAJour(){
try{
const r=await fetch('version.js?'+Date.now(),{cache:'no-store'});
if(!r.ok) return;
const m=(await r.text()).match(/NIOHUB_VERSION\s*=\s*'([^']+)'/);
if(m&&VERSION_APP&&m[1]!==VERSION_APP) afficherBandeauMiseAJour();
}catch(e){}
}

function afficherBandeauMiseAJour(){
if(document.getElementById('bandeau-maj')) return;
document.body.appendChild(vueBandeauMiseAJour());
}
function rechargerApp(){location.reload();}
function fermerBandeauMiseAJour(){
const b=document.getElementById('bandeau-maj');
if(b) b.remove();
}
setTimeout(verifierMiseAJour,4000);

// ---------- Retour dans l'application ----------
let masqueLe=0;
document.addEventListener('visibilitychange',()=>{
if(document.visibilityState==='hidden'){masqueLe=Date.now();return;}
verifierMiseAJour();
if(masqueLe&&Date.now()-masqueLe>DELAI_RETOUR&&typeof chargerProduits==='function'&&!ecranAvecSaisie()) chargerProduits();
});
// Connexion revenue après un échec de chargement : on réessaie tout seul
window.addEventListener('online',()=>{
if(typeof chargementEchoue!=='undefined'&&chargementEchoue&&typeof chargerProduits==='function') chargerProduits();
});

// ---------- Actualisation automatique : plus besoin de glisser vers le bas ----------
// Les produits, boutiques et notes se mettent à jour tout seuls. L'écran n'est redessiné que si quelque chose a changé.
let INTERVALLE_AUTO=60000;
function planifierActualisation(){
setTimeout(()=>{
if(document.visibilityState==='visible'&&!ecranAvecSaisie()&&typeof chargerProduits==='function') chargerProduits();
planifierActualisation();
},INTERVALLE_AUTO);
}
planifierActualisation();

// ---------- Installation ----------
function estIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent);}
function estWebview(){return /FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|MicroMessenger/i.test(navigator.userAgent);}
function enModeApp(){return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}

function modeInstall(){
if(enModeApp()) return null;
if(invitationInstall) return 'android';
if(estWebview()) return 'webview';
if(estIOS()) return 'ios';
return null;
}

function installationMasquee(){
try{
const t=Number(localStorage.getItem('niohub_install_masque')||0);
return t&&Date.now()-t<7*24*3600*1000;
}catch(e){return false;}
}
function masquerInstallation(){
try{localStorage.setItem('niohub_install_masque',String(Date.now()));}catch(e){}
document.querySelectorAll('.bandeau-install').forEach(b=>b.remove());
}

function placerBandeau(id,ancre,position,mode){
let b=document.getElementById(id);
if(!b){
b=document.createElement('div');
b.id=id;
b.className='bandeau-install';
ancre.insertAdjacentElement(position,b);
}
b.innerHTML=vueBandeauInstall(mode);
}

function majLigneInstaller(mode){
const liste=document.querySelector('#profil > .liste');
if(!liste) return;
let ligne=document.getElementById('ligne-installer');
if(!mode){if(ligne) ligne.remove();return;}
if(ligne) return;
ligne=vueLigneInstaller();
liste.insertBefore(ligne,liste.firstChild);
}

function majInstallation(){
const mode=modeInstall();
majLigneInstaller(mode);
if(!mode||installationMasquee()){
document.querySelectorAll('.bandeau-install').forEach(b=>b.remove());
return;
}
const cats=document.getElementById('cats');
if(cats) placerBandeau('bandeau-install',cats,'beforebegin',mode);
const corps=document.getElementById('auth-corps');
if(corps&&document.getElementById('g-bouton')){
placerBandeau('bandeau-install-auth',corps,'beforeend',mode);
}else{
const a=document.getElementById('bandeau-install-auth');
if(a) a.remove();
}
}

async function installerApp(){
if(invitationInstall){
invitationInstall.prompt();
try{await invitationInstall.userChoice;}catch(e){}
invitationInstall=null;
majInstallation();
return;
}
if(estWebview()){bandeau('Ouvrez cette page dans Chrome ou Safari (menu ⋮ puis « Ouvrir dans le navigateur ») pour pouvoir installer NioHub.','info',{duree:9000});return;}
if(estIOS()) bandeau('Pour installer NioHub sur iPhone : touchez le bouton Partager de Safari, puis « Sur l’écran d’accueil ».','info',{duree:9000});
}

window.addEventListener('beforeinstallprompt',e=>{
e.preventDefault();
invitationInstall=e;
majInstallation();
});
window.addEventListener('appinstalled',()=>{
invitationInstall=null;
majInstallation();
});

// L'écran de connexion est redessiné à chaque fois : on y remet le bandeau
if(typeof afficherConnexion==='function'){
const afficherConnexionAvantPwa=afficherConnexion;
afficherConnexion=function(){
afficherConnexionAvantPwa();
majInstallation();
};
}

majInstallation();
