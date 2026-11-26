// Favoris : logique seulement (liste dans le stockage du téléphone, état du bouton cœur).
// Le dessin du cœur : ecran-fiche.js + style.css. Le clic : ecran-liaisons.js (action « favori »).
let ficheCle=null;

function cleProduit(p){
return p.id?'id:'+p.id:'nom:'+p.nom;
}

function lireFavoris(){
try{
const l=JSON.parse(localStorage.getItem('niohub_favoris')||'[]');
return Array.isArray(l)?l:[];
}catch(e){return [];}
}

function ecrireFavoris(liste){
// Peut échouer en navigation privée ou si le stockage est plein : on ne bloque pas l'application
try{localStorage.setItem('niohub_favoris',JSON.stringify(liste));}catch(e){}
}

// Retire des favoris les produits qui n'existent plus (supprimés par leur vendeur)
function nettoyerFavoris(){
if(chargementEchoue||!distants.length||!finCatalogue) return;
const ids=new Set(distants.map(p=>'id:'+p.id));
const favs=lireFavoris();
const gardes=favs.filter(k=>!String(k).startsWith('id:')||ids.has(k));
if(gardes.length!==favs.length) ecrireFavoris(gardes);
}

// Met à jour l'état du bouton cœur (le dessin est dans ecran-fiche.js et style.css)
function majBoutonFavori(){
const b=document.getElementById('btn-favori');
if(!b) return;
const est=lireFavoris().includes(ficheCle);
b.classList.toggle('actif',est);
b.setAttribute('aria-label',est?'Retirer des favoris':'Ajouter aux favoris');
}

function basculerFavori(){
if(!ficheCle) return;
const liste=lireFavoris();
ecrireFavoris(liste.includes(ficheCle)?liste.filter(x=>x!==ficheCle):liste.concat([ficheCle]));
majBoutonFavori();
}

const ouvrirAvantFavoris=ouvrir;
ouvrir=function(i){
ouvrirAvantFavoris(i);
ficheCle=cleProduit(tous()[i]);
majBoutonFavori();
};
