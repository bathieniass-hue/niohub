// Enregistre le service worker et propose "Installer l'application" dans le Profil.
if('serviceWorker' in navigator){
window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});
}

let invitationInstall=null;

function estIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent);}
function enModeApp(){return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}

function majLigneInstaller(){
const liste=document.querySelector('#profil > .liste');
if(!liste) return;
let ligne=document.getElementById('ligne-installer');
const afficher=!enModeApp()&&(invitationInstall||estIOS());
if(!afficher){if(ligne) ligne.remove();return;}
if(ligne) return;
ligne=document.createElement('div');
ligne.id='ligne-installer';
ligne.className='ligne';
ligne.onclick=installerApp;
ligne.innerHTML='<b style="flex:1;color:#0E6B47">Installer l\'application</b><span>›</span>';
liste.insertBefore(ligne,liste.firstChild);
}

async function installerApp(){
if(invitationInstall){
invitationInstall.prompt();
try{await invitationInstall.userChoice;}catch(e){}
invitationInstall=null;
majLigneInstaller();
return;
}
if(estIOS()) alert('Pour installer NioHub sur iPhone : touchez le bouton Partager de Safari, puis « Sur l\'écran d\'accueil ».');
}

window.addEventListener('beforeinstallprompt',e=>{
e.preventDefault();
invitationInstall=e;
majLigneInstaller();
});
window.addEventListener('appinstalled',()=>{
invitationInstall=null;
majLigneInstaller();
});

majLigneInstaller();
