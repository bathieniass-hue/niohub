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
