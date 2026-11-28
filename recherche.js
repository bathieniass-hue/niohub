// Recherche : logique seulement (ouvrir/fermer l'écran, recherches rapides, catégorie choisie).
// L'affichage : ecran-recherche.js (vue…). Le style : style.css (.rch-…). Les clics : ecran-liaisons.js.
// Les résultats sont calculés par app.js (afficherGrille) : il écrit dans la grille de l'écran Recherche tant que rechercheActive est vrai.
// Dépend de app.js, boutique.js (creerPage) et raccourcis.js (dessinerFiltres).
VUES.push('recherche');

let rechercheAvant=null; // état de l'accueil à retrouver au retour

function creerPageRecherche(){
const p=creerPage('recherche');
if(p.getAttribute('data-prete')) return p;
p.setAttribute('data-prete','1');
p.innerHTML=vueRechercheEcran();
const champ=document.getElementById('q');
// Pendant la frappe : seulement des suggestions (les produits n'apparaissent qu'une fois la recherche lancée)
champ.addEventListener('input',()=>{
rechercheValidee=false;
afficherSuggestions();
majEtatRecherche();
afficherGrille();
});
champ.addEventListener('keydown',e=>{
if(e.key==='Enter'&&requeteRecherche()){
document.getElementById('suggest').innerHTML='';
validerRecherche();
afficherGrille();
champ.blur();
}
});
installerDefilement('rch-grid','sentinelle-rch');
return p;
}
creerPageRecherche();

// Trois états : panneau d'accueil (rien tapé, aucune catégorie), suggestions (on tape), résultats (recherche lancée ou catégorie choisie)
function majEtatRecherche(){
const p=document.getElementById('recherche');
if(!p) return;
const q=requeteRecherche();
const etat=(!q&&!categorieActive)?'panneau':(q&&!rechercheValidee)?'suggestions':'resultats';
p.classList.toggle('rch-s',etat==='suggestions');
p.classList.toggle('rch-r',etat==='resultats');
const actif=document.getElementById('rch-actif');
if(actif) actif.innerHTML=vueRechercheActive(categorieActive);
}

// La recherche est lancée : les produits s'affichent
function validerRecherche(){
rechercheValidee=true;
majEtatRecherche();
}

function dessinerPanneauRecherche(){
const zone=document.getElementById('rch-panneau');
if(!zone) return;
const rapides=(typeof RECHERCHES_RAPIDES!=='undefined'&&Array.isArray(RECHERCHES_RAPIDES))?RECHERCHES_RAPIDES:[];
zone.innerHTML=vueRechercheRapides(rapides)+vueRechercheCategories(CATEGORIES_PRODUIT.map((nom,i)=>({nom:nom,i:i})));
}

function ouvrirRecherche(){
creerPageRecherche();
// On garde l'état de l'accueil (catégorie, affichage, défilement) pour le retrouver au retour
rechercheAvant={categorie:categorieActive,nb:nbAffiches,plafond:plafondAffichage,cle:derniereCleFiltre,y:window.scrollY};
categorieActive='';
rechercheActive=true;
rechercheValidee=false;
const champ=document.getElementById('q');
champ.value='';
document.getElementById('suggest').innerHTML='';
dessinerPanneauRecherche();
majEtatRecherche();
afficherGrille();
montrer('recherche');
champ.focus();
}

// Sortie de la recherche : l'accueil retrouve sa catégorie et son affichage
function terminerRecherche(){
if(!rechercheActive) return null;
const av=rechercheAvant;
rechercheAvant=null;
rechercheActive=false;
rechercheValidee=false;
const champ=document.getElementById('q');
if(champ){champ.value='';champ.blur();}
const s=document.getElementById('suggest');
if(s) s.innerHTML='';
if(av){
categorieActive=av.categorie;
nbAffiches=av.nb;
plafondAffichage=av.plafond;
derniereCleFiltre=av.cle;
}else{
categorieActive='';
}
dessinerFiltres();
afficherGrille();
return av;
}

function fermerRecherche(){
const av=terminerRecherche();
montrer('accueil');
const y=av?av.y:0;
if(y>0){
window.scrollTo(0,y);
requestAnimationFrame(()=>window.scrollTo(0,y));
setTimeout(()=>window.scrollTo(0,y),80);
setTimeout(()=>window.scrollTo(0,y),250);
}
}

// Quelle que soit la façon de revenir à l'accueil (menu, retour du téléphone…), la recherche est terminée proprement
const montrerAvantRecherche=montrer;
montrer=function(vue){
if(vue==='accueil'&&rechercheActive) terminerRecherche();
montrerAvantRecherche(vue);
};

function rechercherTexte(texte){
const champ=document.getElementById('q');
if(!champ) return;
champ.value=String(texte||'');
document.getElementById('suggest').innerHTML='';
validerRecherche();
afficherGrille();
champ.blur();
window.scrollTo(0,0);
}

function choisirCategorieRecherche(c){
categorieActive=c||'';
validerRecherche();
afficherGrille();
window.scrollTo(0,0);
}

function retirerCategorieRecherche(){
choisirCategorieRecherche('');
}
