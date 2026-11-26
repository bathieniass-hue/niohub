// Écrans de l'accueil : les 4 raccourcis, les filtres de catégories, la fenêtre « Catégories » et la page « Favoris ».
// Uniquement du HTML, aucune logique. Reçoivent des données déjà prêtes (voir raccourcis.js).
// Le style est dans style.css. Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js).

// Icône d'une catégorie : i = numéro dans l'image d'icônes, -1 = « Tout »
function vueIconeCategorie(i){
if(i<0) return '<svg class="cat-tout" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>';
return '<span class="cat-ic" style="--i:'+i+'" aria-hidden="true"></span>';
}

// Les 4 raccourcis du haut de l'accueil
function vueRaccourcis(){
const icMessages='<span class="gl" style="--i:1" aria-hidden="true"></span>';
const icFavoris='<span class="gn" style="--i:0" aria-hidden="true"></span>';
const icAchats='<span class="gl" style="--i:2" aria-hidden="true"></span>';
const icCategories='<svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true"><g fill="#2FB344" stroke="#EAF6EA" stroke-width="1.2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></g></svg>';
return `
<button class="raccourci" data-action="conversations">${icMessages}<span>Messages</span><span class="badge" id="badge-messages" data-compteur="messages"></span></button>
<button class="raccourci" data-action="favoris">${icFavoris}<span>Favoris</span><span class="badge" data-compteur="favoris"></span></button>
<button class="raccourci" data-action="achats">${icAchats}<span>Mes achats</span><span class="badge" data-compteur="achats"></span></button>
<button class="raccourci" data-action="categories">${icCategories}<span>Catégories</span></button>`;
}

// Fenêtre « Catégories » (la liste est ajoutée ensuite par vueCategoriesListe)
function vueCategoriesBoite(){
return '<div id="categories-boite"><div id="categories-titre">Choisir une catégorie</div><div id="categories-liste"></div></div>';
}

// items = [{nom, i, actif}] (nom '' = « Tout »)
function vueCategoriesListe(items){
return items.map(c=>`<button type="button" class="categorie-item${c.actif?' on':''}" data-action="categorieModal" data-arg="${esc(c.nom)}">${vueIconeCategorie(c.i)}<span>${c.nom?esc(c.nom):'Tout'}</span></button>`).join('');
}

// Barre de filtres de l'accueil (mêmes items)
function vueFiltres(items){
return items.map(c=>`<button type="button" class="filtre${c.nom?'':' tout'}${c.actif?' on':''}" data-action="categorie" data-arg="${esc(c.nom)}">${vueIconeCategorie(c.i)}${c.nom?esc(c.nom):'Tout'}</button>`).join('');
}

// Page « Favoris » : d = { cartes:[HTML prêt de chaque produit] }
function vueFavoris(d){
const corps=d.cartes.length
?`<div class="grid" style="padding:6px 0 30px">${d.cartes.join('')}</div>`
:'<div class="liste" style="margin-top:20px">Aucun favori pour l\'instant. Touchez le cœur sur un produit pour le garder ici.</div>';
return `<header><button class="retour" data-action="accueil">←</button><span style="font-weight:bold;font-size:20px">Favoris</span><span></span></header>${corps}`;
}
