// Fiche produit : réorganise la fiche (prix, catégorie, nom, détails, description, boutique). Logique seulement.
// L'affichage des détails : ecran-fiche-details.js (vueDetailsFiche). Le style : style.css (#fd-details…).

// La catégorie, l'état et les couleurs sont déjà chargés avec les produits par app.js :
// plus d'appel réseau supplémentaire, et plus de rechargement du catalogue au démarrage.

function arrangerFiche(p){
const corps=document.querySelector('#fiche .corps');
if(!corps||!p) return;
const prix=document.getElementById('fprix');
const nom=document.getElementById('fnom');
const desc=document.getElementById('fdesc');
const boutique=corps.querySelector('.boutique');

let cat=document.getElementById('fcat');
if(!cat){cat=document.createElement('div');cat.id='fcat';}
cat.textContent=p.categorie||'';
cat.style.display=p.categorie?'block':'none';

let zone=document.getElementById('fd-details');
if(!zone){zone=document.createElement('div');zone.id='fd-details';}
const couleurs=p.couleurs?String(p.couleurs).split(',').map(x=>x.trim()).filter(Boolean):[];
const html=vueDetailsFiche({
etat:p.etat||'',
couleurs:couleurs.map(n=>{const c=COULEURS_PRODUIT.find(x=>x.nom===n);return {nom:n,hex:c?c.hex:'#FFFFFF'};})
});
zone.innerHTML=html;
zone.style.display=html?'block':'none';

let titreDesc=document.getElementById('fd-desc-titre');
if(!titreDesc){titreDesc=document.createElement('div');titreDesc.id='fd-desc-titre';titreDesc.textContent='Description et détails';}

if(prix) corps.appendChild(prix);
corps.appendChild(cat);
if(nom) corps.appendChild(nom);
corps.appendChild(zone);
corps.appendChild(titreDesc);
if(desc) corps.appendChild(desc);
if(boutique) corps.appendChild(boutique);
}

const ouvrirAvantFiche=ouvrir;
ouvrir=function(i){
ouvrirAvantFiche(i);
arrangerFiche(tous()[i]);
};
