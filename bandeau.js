// Bandeaux de NioHub : remplacent les alert() du navigateur par un message intégré au design.
// Utilisation : bandeau('Texte') · bandeau('Texte','erreur') · bandeau('Texte','succes',{duree:8000})
// Types : 'info' (par défaut), 'succes', 'erreur'. Un nouveau bandeau remplace le précédent.
(function(){
const ICONES={info:'i',succes:'✓',erreur:'!'};
let zone=null,minuteur=null;

function preparer(){
if(zone) return zone;
zone=document.createElement('div');
zone.id='bandeaux';
zone.setAttribute('aria-live','polite');
document.body.appendChild(zone);
return zone;
}

function fermer(el){
if(!el||el.classList.contains('sortie')) return;
el.classList.add('sortie');
setTimeout(()=>el.remove(),250);
}

window.bandeau=function(message,type,options){
type=ICONES[type]?type:'info';
options=options||{};
const texte=String(message==null?'':message);
// Durée selon la longueur du texte : entre 3,5 et 9 secondes
const duree=options.duree||Math.min(9000,Math.max(3500,texte.length*60));
const z=preparer();
clearTimeout(minuteur);
z.querySelectorAll('.bandeau').forEach(fermer);

const el=document.createElement('div');
el.className='bandeau '+type;
el.setAttribute('role',type==='erreur'?'alert':'status');
const icone=document.createElement('span');
icone.className='bandeau-icone';
icone.textContent=ICONES[type];
const corps=document.createElement('div');
corps.className='bandeau-texte';
corps.textContent=texte;
const croix=document.createElement('button');
croix.className='bandeau-fermer';
croix.type='button';
croix.setAttribute('aria-label','Fermer');
croix.textContent='×';
el.append(icone,corps,croix);
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
const fond=document.createElement('div');
fond.className='confirm-fond';
const boite=document.createElement('div');
boite.className='confirm-boite';
boite.setAttribute('role','alertdialog');
boite.setAttribute('aria-modal','true');
const titre=document.createElement('div');
titre.className='confirm-titre';
titre.id='confirm-titre';
titre.textContent=options.titre||'Confirmer';
boite.setAttribute('aria-labelledby','confirm-titre');
const texte=document.createElement('div');
texte.className='confirm-texte';
texte.textContent=String(message==null?'':message);
const actions=document.createElement('div');
actions.className='confirm-actions';
const non=document.createElement('button');
non.type='button';non.className='confirm-non';
non.textContent=options.annuler||'Annuler';
const oui=document.createElement('button');
oui.type='button';oui.className='confirm-oui'+(options.danger?' danger':'');
oui.textContent=options.ok||'Confirmer';
actions.append(non,oui);
boite.append(titre,texte,actions);
fond.appendChild(boite);
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
