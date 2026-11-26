// Écrans « bandeau » (message en haut) et « fenêtre de confirmation » : construction des éléments seulement.
// Aucune logique (durée, fermeture, clavier, réponse) : tout cela est dans bandeau.js. Le style est dans style.css.
(function(){
const ICONES={info:'i',succes:'✓',erreur:'!'};

// Zone qui contient les bandeaux
window.vueZoneBandeaux=function(){
const z=document.createElement('div');
z.id='bandeaux';
z.setAttribute('aria-live','polite');
return z;
};

// Un bandeau : type 'info' (par défaut), 'succes' ou 'erreur'
window.vueBandeau=function(type,texte){
type=ICONES[type]?type:'info';
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
return el;
};

// Fenêtre de confirmation : renvoie {fond, non, oui} (le fond contient toute la fenêtre)
window.vueConfirmation=function(message,options){
options=options||{};
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
return {fond:fond,non:non,oui:oui};
};
})();
