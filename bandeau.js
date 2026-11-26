// Bandeaux de NioHub : remplacent les alert() du navigateur par un message intégré au design.
// Logique seulement (durée, fermeture, clavier, réponse). Les éléments : ecran-bandeau.js. Le style : style.css.
// Utilisation : bandeau('Texte') · bandeau('Texte','erreur') · bandeau('Texte','succes',{duree:8000})
// Types : 'info' (par défaut), 'succes', 'erreur'. Un nouveau bandeau remplace le précédent.
(function(){
let zone=null,minuteur=null;

function preparer(){
if(zone) return zone;
zone=vueZoneBandeaux();
document.body.appendChild(zone);
return zone;
}

function fermer(el){
if(!el||el.classList.contains('sortie')) return;
el.classList.add('sortie');
setTimeout(()=>el.remove(),250);
}

window.bandeau=function(message,type,options){
options=options||{};
const texte=String(message==null?'':message);
// Durée selon la longueur du texte : entre 3,5 et 9 secondes
const duree=options.duree||Math.min(9000,Math.max(3500,texte.length*60));
const z=preparer();
clearTimeout(minuteur);
z.querySelectorAll('.bandeau').forEach(fermer);

const el=vueBandeau(type,texte);
el.addEventListener('click',()=>{clearTimeout(minuteur);fermer(el);});
z.appendChild(el);
minuteur=setTimeout(()=>fermer(el),duree);
return el;
};
})();

// Fenêtre de confirmation NioHub : remplace confirm() du navigateur.
// Utilisation : if(!(await confirmer('Texte',{titre:'…',ok:'Supprimer',danger:true}))) return;
// Renvoie une promesse : true si l'utilisateur confirme, false sinon.
(function(){
let ouverte=null;
window.confirmer=function(message,options){
options=options||{};
if(ouverte) ouverte(false);
return new Promise(resolve=>{
const v=vueConfirmation(message,options);
const fond=v.fond,non=v.non,oui=v.oui;
const avant=document.activeElement;

function finir(reponse){
if(ouverte!==finir) return;
ouverte=null;
document.removeEventListener('keydown',touche);
fond.classList.add('sortie');
setTimeout(()=>fond.remove(),200);
if(avant&&avant.focus) try{avant.focus();}catch(e){}
resolve(reponse);
}
function touche(e){
if(e.key==='Escape'){e.preventDefault();finir(false);}
}
ouverte=finir;
non.onclick=()=>finir(false);
oui.onclick=()=>finir(true);
fond.addEventListener('click',e=>{if(e.target===fond) finir(false);});
document.addEventListener('keydown',touche);
document.body.appendChild(fond);
// Action dangereuse : le focus va sur « Annuler » pour éviter une validation par erreur
// Sur téléphone (écran tactile), pas de focus automatique : il afficherait un contour inutile
if(window.matchMedia&&matchMedia('(pointer:fine)').matches) (options.danger?non:oui).focus();
});
};
})();
