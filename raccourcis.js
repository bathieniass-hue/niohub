// Accueil : raccourcis, filtres de catégories, repli de la barre, page Favoris, retour Android. Logique seulement.
// L'affichage : ecran-raccourcis.js (vue…). Le style : style.css. Les clics : ecran-liaisons.js.
VUES.push('favoris');


// Liste des catégories pour l'affichage : [{nom, i, actif}] (nom '' = « Tout »)
function listeCategories(){
return [''].concat(CATEGORIES_PRODUIT).map(c=>({nom:c,i:CATEGORIES_PRODUIT.indexOf(c),actif:c===categorieActive}));
}

function afficherRaccourcis(){
const zone=document.getElementById('cats');
if(!zone) return;
zone.innerHTML=vueRaccourcis();
}
afficherRaccourcis();

function creerFenetreCategories(){
if(document.getElementById('categories-fond')) return;
const fond=document.createElement('div');
fond.id='categories-fond';
fond.innerHTML=vueCategoriesBoite();
fond.onclick=e=>{if(e.target.id==='categories-fond') fermerCategories();};
document.body.appendChild(fond);
}

function ouvrirCategories(){
creerFenetreCategories();
const liste=document.getElementById('categories-liste');
liste.innerHTML=vueCategoriesListe(listeCategories());
document.getElementById('categories-fond').style.display='flex';
}

function fermerCategories(){
const fond=document.getElementById('categories-fond');
if(fond) fond.style.display='none';
}

function choisirCategorieModal(c){
choisirCategorie(c);
fermerCategories();
montrer('accueil');
}

function dessinerFiltres(){
const zone=document.getElementById('filtres');
if(!zone) return;
zone.innerHTML=vueFiltres(listeCategories());
}

function installerFiltres(){
if(document.getElementById('filtres')) return;
const haut=document.getElementById('haut');
const cats=document.getElementById('cats');
const zone=document.createElement('div');
zone.id='filtres';
if(haut) haut.appendChild(zone);
else if(cats) cats.insertAdjacentElement('afterend',zone);
else return;
dessinerFiltres();
}

function centrerCategorieActive(){
const actif=document.querySelector('#filtres .filtre.on');
if(!actif||!actif.scrollIntoView) return;
actif.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

function choisirCategorie(c){
categorieActive=c;
dessinerFiltres();
afficherGrille();
centrerCategorieActive();
}

document.addEventListener('DOMContentLoaded',installerFiltres);

// ---------- Barre du haut : repli au défilement ----------
const SEUIL_DEFILEMENT=8;
const HAUTEUR_MIN_REPLI=120;
let dernierY=0,verrouBarre=0;

function basculerBarre(compact){
const haut=document.getElementById('haut');
if(!haut) return;
haut.classList.toggle('compact',compact);
verrouBarre=Date.now()+350;
}

window.addEventListener('scroll',()=>{
const haut=document.getElementById('haut');
const acc=document.getElementById('accueil');
if(!haut||!acc||acc.style.display==='none') return;
const y=window.scrollY;
if(Date.now()<verrouBarre){dernierY=y;return;}
if(y<=10){
if(haut.classList.contains('compact')) basculerBarre(false);
dernierY=y;
return;
}
const dy=y-dernierY;
if(Math.abs(dy)<SEUIL_DEFILEMENT) return;
const compact=haut.classList.contains('compact');
if(dy>0&&y>HAUTEUR_MIN_REPLI&&!compact) basculerBarre(true);
else if(dy<0&&compact) basculerBarre(false);
dernierY=y;
},{passive:true});

const montrerAvantBarre=montrer;
montrer=function(vue){
montrerAvantBarre(vue);
if(vue==='accueil'&&!restaurationScroll&&window.scrollY<=10){
const h=document.getElementById('haut');
if(h) h.classList.remove('compact');
dernierY=0;
}
};

// ---------- Favoris ----------
function creerPageFavoris(){
if(document.getElementById('favoris')) return;
const p=document.createElement('div');
p.id='favoris';
p.className='page';
p.style.display='none';
document.body.appendChild(p);
}
creerPageFavoris();

function rendreFavoris(){
const page=document.getElementById('favoris');
nettoyerFavoris();
const favs=lireFavoris();
const liste=tous().filter(p=>favs.includes(cleProduit(p)));
page.innerHTML=vueFavoris({cartes:liste.map(p=>carteProduitHTML(p,tous().indexOf(p)))});
}

function voirFavoris(){
rendreFavoris();
montrer('favoris');
}

// ---------- Retour Android : identique au bouton ← de l’écran ----------
let profondeurHistoire=0;
let retourTelephoneEnCours=false;

function pousserSentinelle(){
try{
history.pushState({niohub:true},'','#niohub');
profondeurHistoire++;
}catch(e){}
}

const montrerAvantRetourAndroid=montrer;
montrer=function(vue){
const precedent=vueCourante;
if(retourTelephoneEnCours){
retourTelephoneEnCours=false;
montrerAvantRetourAndroid(vue);
if(vue==='accueil'){
try{history.replaceState({niohub:false},'','#accueil');}catch(e){}
}
return;
}
if(vue==='accueil'&&profondeurHistoire>0){
const n=profondeurHistoire;
profondeurHistoire=0;
try{history.go(-n);}catch(e){}
montrerAvantRetourAndroid(vue);
return;
}
montrerAvantRetourAndroid(vue);
if(vue!==precedent&&vue!=='accueil') pousserSentinelle();
};

window.addEventListener('popstate',()=>{
if(vueCourante==='accueil') return;
profondeurHistoire=Math.max(0,profondeurHistoire-1);
retourTelephoneEnCours=true;
const page=document.getElementById(vueCourante);
const bouton=page&&(page.querySelector('.retour')||page.querySelector('.retour-carre'));
if(bouton){bouton.click();return;}
montrer('accueil');
});
