VUES.push('favoris');
VUES_MENU.favoris=0;

const styleRaccourcis=document.createElement('style');
styleRaccourcis.textContent=`
.raccourci{background:#fff;border:1px solid #E6DECB;border-radius:12px;padding:12px 4px;font-size:13px;font-weight:bold;color:#1E1A14;font-family:sans-serif;text-align:center}
#filtres{display:flex;gap:8px;overflow-x:auto;padding:0 20px 6px;margin:0 0 4px;scrollbar-width:none}
#filtres::-webkit-scrollbar{display:none}
.filtre{flex-shrink:0;padding:8px 14px;border:1px solid #E6DECB;border-radius:18px;background:#fff;color:#1E1A14;font-size:13px;font-family:sans-serif}
.filtre.on{background:#0E6B47;border-color:#0E6B47;color:#fff;font-weight:bold}
`;
document.head.appendChild(styleRaccourcis);

function afficherRaccourcis(){
const zone=document.getElementById('cats');
if(!zone) return;
zone.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 20px;margin:12px 0;';
zone.innerHTML=`
<button class="raccourci" onclick="voirFavoris()">Favoris</button>
<button class="raccourci" onclick="voirAchats()">Mes achats</button>
<button class="raccourci" onclick="voirBoutique()">Ma boutique</button>
<button class="raccourci" onclick="voirAjout('accueil')">Vendre</button>`;
}
afficherRaccourcis();

// Filtre par catégorie : "Tout" + les catégories de details-produit.js.
// Dessiné après le chargement de tous les scripts (CATEGORIES_PRODUIT est défini plus loin).
function dessinerFiltres(){
const zone=document.getElementById('filtres');
if(!zone) return;
zone.innerHTML=[''].concat(CATEGORIES_PRODUIT).map(c=>`<button type="button" class="filtre${c===categorieActive?' on':''}" data-c="${esc(c)}" onclick="choisirCategorie(this.dataset.c)">${c?esc(c):'Tout'}</button>`).join('');
}

function installerFiltres(){
if(document.getElementById('filtres')) return;
const cats=document.getElementById('cats');
if(!cats) return;
const zone=document.createElement('div');
zone.id='filtres';
cats.insertAdjacentElement('afterend',zone);
dessinerFiltres();
}

function choisirCategorie(c){
categorieActive=c;
dessinerFiltres();
afficherGrille();
}

document.addEventListener('DOMContentLoaded',installerFiltres);

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
const corps=liste.length
?`<div class="grid" style="padding:6px 0 30px">${liste.map(p=>`<div class="card" onclick="${p.id?'ouvrirParId('+Number(p.id)+')':'ouvrir('+tous().indexOf(p)+')'}"><div class="img" style="background:${fondMini(p)}"></div><div class="info"><div class="name">${esc(p.nom)}</div><div class="price">${esc(p.prix)}</div></div></div>`).join('')}</div>`
:'<div class="liste" style="margin-top:20px">Aucun favori pour l\'instant. Touchez le cœur sur un produit pour le garder ici.</div>';
page.innerHTML=`<header><button class="retour" onclick="voirAccueil()">←</button><span style="font-weight:bold;font-size:20px">Favoris</span><span></span></header>${corps}`;
}

function voirFavoris(){
rendreFavoris();
montrer('favoris');
}
