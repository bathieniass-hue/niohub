// Recherche : logique seulement (ouvrir/fermer l'écran, recherches rapides, catégorie choisie).
// L'affichage : ecran-recherche.js (vue…). Le style : style.css (.rch-…). Les clics : ecran-liaisons.js.
// Les résultats sont calculés par app.js (afficherGrille) : il écrit dans la grille de l'écran Recherche tant que rechercheActive est vrai.
// Dépend de app.js, boutique.js (creerPage) et raccourcis.js (dessinerFiltres).
VUES.push('recherche');

let rechercheAvant=null; // état de l'accueil à retrouver au retour

// Filtres de l'écran Recherche (trier, état, prix). Appliqués par app.js (afficherGrille) via les fonctions ci-dessous.
const FILTRES_DEFAUT={tri:'recent',etat:'',prixMin:null,prixMax:null};
let filtresRecherche=Object.assign({},FILTRES_DEFAUT);
const TRIS_RECHERCHE=[{valeur:'recent',nom:'Plus récents'},{valeur:'prix-asc',nom:'Prix croissant'},{valeur:'prix-desc',nom:'Prix décroissant'}];

function filtresRechercheActifs(){
const f=filtresRecherche;
return !!(f.tri!=='recent'||f.etat||f.prixMin!==null||f.prixMax!==null);
}
function cleFiltresRecherche(){
const f=filtresRecherche;
return [f.tri,f.etat,f.prixMin,f.prixMax].join('/');
}
function espacerNombre(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}

// [{ cle, libelle }] : une puce par filtre actif
function listeFiltresActifs(){
const f=filtresRecherche;
const l=[];
if(f.etat) l.push({cle:'etat',libelle:f.etat});
if(f.prixMin!==null||f.prixMax!==null){
const t=(f.prixMin!==null&&f.prixMax!==null)?espacerNombre(f.prixMin)+' – '+espacerNombre(f.prixMax):(f.prixMin!==null?'À partir de '+espacerNombre(f.prixMin):'Jusqu\'à '+espacerNombre(f.prixMax));
l.push({cle:'prix',libelle:t+' FCFA'});
}
if(f.tri!=='recent'){const t=TRIS_RECHERCHE.find(x=>x.valeur===f.tri);l.push({cle:'tri',libelle:t?t.nom:f.tri});}
return l;
}

function produitPasseFiltres(p){
const f=filtresRecherche;
if(f.etat&&(p.etat||'')!==f.etat) return false;
if(f.prixMin!==null||f.prixMax!==null){
const n=prixNombre(p.prix);
if(f.prixMin!==null&&n<f.prixMin) return false;
if(f.prixMax!==null&&n>f.prixMax) return false;
}
return true;
}

// Trie la liste [{p,i}] en place (« Plus récents » = ordre d'origine)
function trierResultats(liste){
const t=filtresRecherche.tri;
if(t==='prix-asc') liste.sort((a,b)=>prixNombre(a.p.prix)-prixNombre(b.p.prix));
else if(t==='prix-desc') liste.sort((a,b)=>prixNombre(b.p.prix)-prixNombre(a.p.prix));
}

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
if(e.key==='Enter') lancerRecherche();
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
const etat=(!q&&!categorieActive&&!filtresRechercheActifs())?'panneau':(q&&!rechercheValidee)?'suggestions':'resultats';
p.classList.toggle('rch-s',etat==='suggestions');
p.classList.toggle('rch-r',etat==='resultats');
const actif=document.getElementById('rch-actif');
if(actif) actif.innerHTML=vueRechercheActive({categorie:categorieActive,filtres:listeFiltresActifs()});
const bf=document.querySelector('#rch-filtre .rch-btn');
if(bf) bf.classList.toggle('actif',filtresRechercheActifs());
}

// Bouton Rechercher (ou touche Entrée) : lance la recherche tapée
function lancerRecherche(){
const champ=document.getElementById('q');
if(!champ) return;
if(!requeteRecherche()){champ.focus();return;}
document.getElementById('suggest').innerHTML='';
validerRecherche();
afficherGrille();
champ.blur();
window.scrollTo(0,0);
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
filtresRecherche=Object.assign({},FILTRES_DEFAUT);
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
filtresRecherche=Object.assign({},FILTRES_DEFAUT);
fermerFiltres();
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

// ---------- Fenêtre « Filtrer » ----------
function creerFenetreFiltres(){
let fond=document.getElementById('filtre-fond');
if(fond) return fond;
fond=document.createElement('div');
fond.id='filtre-fond';
fond.onclick=e=>{if(e.target.id==='filtre-fond') fermerFiltres();};
document.body.appendChild(fond);
return fond;
}

function ouvrirFiltres(){
const fond=creerFenetreFiltres();
const f=filtresRecherche;
fond.innerHTML=vueFiltreBoite({
tris:TRIS_RECHERCHE.map(t=>({valeur:t.valeur,nom:t.nom,actif:t.valeur===f.tri})),
etats:[{valeur:'',nom:'Tous',actif:!f.etat}].concat(ETATS_PRODUIT.map(e=>({valeur:e,nom:e,actif:e===f.etat}))),
prixMin:f.prixMin===null?'':String(f.prixMin),
prixMax:f.prixMax===null?'':String(f.prixMax)
});
fond.style.display='flex';
}

function fermerFiltres(){
const fond=document.getElementById('filtre-fond');
if(fond) fond.style.display='none';
}

// Une puce choisie dans la fenêtre (arg = « groupe|valeur ») : une seule active par groupe
function choisirFiltre(arg){
const k=String(arg).indexOf('|');
const groupe=String(arg).slice(0,k);
const valeur=String(arg).slice(k+1);
const zone=document.getElementById('filtre-'+groupe);
if(!zone) return;
zone.querySelectorAll('.filtre').forEach(b=>b.classList.toggle('on',b.getAttribute('data-valeur')===valeur));
}

function valeurFiltreChoisie(groupe,defaut){
const b=document.querySelector('#filtre-'+groupe+' .filtre.on');
return b?b.getAttribute('data-valeur'):defaut;
}

function nombreChamp(id){
const c=document.getElementById(id);
const n=c?parseInt(c.value,10):NaN;
return Number.isFinite(n)&&n>=0?n:null;
}

function appliquerFiltres(){
let min=nombreChamp('filtre-prix-min');
let max=nombreChamp('filtre-prix-max');
if(min!==null&&max!==null&&min>max){const t=min;min=max;max=t;}
filtresRecherche={tri:valeurFiltreChoisie('tri','recent'),etat:valeurFiltreChoisie('etat',''),prixMin:min,prixMax:max};
fermerFiltres();
montrerResultatsFiltres();
}

function reinitialiserFiltres(){
filtresRecherche=Object.assign({},FILTRES_DEFAUT);
fermerFiltres();
montrerResultatsFiltres();
}

// Enlève un filtre depuis sa puce au-dessus des résultats (cle = 'etat', 'prix' ou 'tri')
function retirerFiltre(cle){
if(cle==='etat') filtresRecherche.etat='';
else if(cle==='prix'){filtresRecherche.prixMin=null;filtresRecherche.prixMax=null;}
else if(cle==='tri') filtresRecherche.tri='recent';
montrerResultatsFiltres();
}

// Après un changement de filtres : les produits (déjà lancés) se mettent à jour
function montrerResultatsFiltres(){
rechercheValidee=true;
majEtatRecherche();
afficherGrille();
window.scrollTo(0,0);
}
