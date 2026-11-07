// NioHub : installation, mises à jour et actualisation de l'application.
const VERSION_APP='f6d3dcde61'; // remplacé automatiquement à chaque livraison
let DELAI_RETOUR=60000;  // actualiser les produits si l'application revient après plus d'1 minute
let invitationInstall=null;

// ---------- Service worker ----------
if('serviceWorker' in navigator){
window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});
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
const r=await fetch('version.json?'+Date.now(),{cache:'no-store'});
if(!r.ok) return;
const j=await r.json();
if(j&&j.v&&j.v!==VERSION_APP) afficherBandeauMiseAJour();
}catch(e){}
}

function afficherBandeauMiseAJour(){
if(document.getElementById('bandeau-maj')) return;
const b=document.createElement('div');
b.id='bandeau-maj';
b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:0;width:100%;max-width:430px;z-index:200;background:#0E6B47;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center;font:14px sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)';
b.innerHTML='<span style="flex:1"><b>Nouvelle version disponible</b></span><button type="button" style="border:0;border-radius:10px;background:#F2B233;color:#1E1A14;font-weight:bold;padding:8px 14px;font-size:14px" onclick="location.reload()">Mettre à jour</button><button type="button" aria-label="Plus tard" style="border:0;background:none;color:#fff;font-size:20px;line-height:1" onclick="document.getElementById(\'bandeau-maj\').remove()">✕</button>';
document.body.appendChild(b);
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

const styleInstall=document.createElement('style');
styleInstall.textContent='.bandeau-install{display:flex;gap:10px;align-items:center;margin:10px 20px;padding:12px 14px;background:#E1F1E8;border:1px solid #BFDCCB;border-radius:14px}#bandeau-install-auth{margin:16px 0 0}';
document.head.appendChild(styleInstall);

function htmlBandeau(mode){
const textes={
android:'Accès direct depuis votre écran d’accueil, en plein écran.',
ios:'Touchez Partager (le carré avec une flèche), puis « Sur l’écran d’accueil ».',
webview:'Ouvrez cette page dans Chrome ou Safari (menu ⋮ puis « Ouvrir dans le navigateur ») pour pouvoir l’installer.'
};
const titre=mode==='ios'?'Installer NioHub sur iPhone':'Installer NioHub';
return '<div style="flex:1;min-width:0;font-size:13px;color:#0A4D33;line-height:1.4"><b style="font-size:14px">'+titre+'</b><br>'+textes[mode]+'</div>'
+(mode==='android'?'<button type="button" class="petit" onclick="installerApp()">Installer</button>':'')
+'<button type="button" aria-label="Fermer" onclick="masquerInstallation()" style="border:0;background:none;font-size:20px;line-height:1;color:#6B6254;padding:4px">✕</button>';
}

function placerBandeau(id,ancre,position,mode){
let b=document.getElementById(id);
if(!b){
b=document.createElement('div');
b.id=id;
b.className='bandeau-install';
ancre.insertAdjacentElement(position,b);
}
b.innerHTML=htmlBandeau(mode);
}

function majLigneInstaller(mode){
const liste=document.querySelector('#profil > .liste');
if(!liste) return;
let ligne=document.getElementById('ligne-installer');
if(!mode){if(ligne) ligne.remove();return;}
if(ligne) return;
ligne=document.createElement('div');
ligne.id='ligne-installer';
ligne.className='ligne';
ligne.onclick=installerApp;
ligne.innerHTML='<b style="flex:1;color:#0E6B47">Installer l\'application</b><span>›</span>';
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
