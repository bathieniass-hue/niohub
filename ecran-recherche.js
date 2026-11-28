// Écran « Recherche » : uniquement du HTML, aucune logique. Reçoit des données déjà prêtes (voir recherche.js).
// Le style est dans style.css (.rch-…, #rch-…). Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js).
// Les suggestions (liste sous la barre) sont dessinées par vueSuggestions() (ecran-catalogue.js). Les icônes de catégories : vueIconeCategorie() (ecran-raccourcis.js).

// Page complète : barre du haut (← à gauche, champ, emplacement du futur bouton Filtre à droite),
// panneau d'accueil de la recherche, puis les résultats.
function vueRechercheEcran(){
return `<header class="rch-entete"><button class="retour" data-action="fermerRecherche" aria-label="Retour">←</button><div class="recherche"><input id="q" type="search" placeholder="Rechercher un produit ou une boutique" autocomplete="off"></div><div id="rch-filtre"></div></header>
<div id="suggest"></div>
<div id="rch-panneau"></div>
<div id="rch-resultats"><div id="rch-actif"></div><div class="grid" id="rch-grid"></div></div>`;
}

// Recherches rapides. l = [texte]
function vueRechercheRapides(l){
if(!l.length) return '';
return `<div class="titre-section">Recherches rapides</div><div class="rch-chips">${l.map(t=>`<button type="button" class="filtre tout" data-action="rechercheRapide" data-arg="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
}

// Catégories. l = [{ nom, i }] (i = numéro de l'icône)
function vueRechercheCategories(l){
if(!l.length) return '';
return `<div class="titre-section">Catégories</div><div class="rch-chips">${l.map(c=>`<button type="button" class="filtre" data-action="rechercheCategorie" data-arg="${esc(c.nom)}">${vueIconeCategorie(c.i)}${esc(c.nom)}</button>`).join('')}</div>`;
}

// Catégorie choisie, au-dessus des résultats (touchez pour l'enlever). nom = '' → rien
function vueRechercheActive(nom){
if(!nom) return '';
return `<div class="rch-chips"><button type="button" class="filtre tout on" data-action="rechercheRetirerCategorie">${esc(nom)} <span aria-hidden="true">✕</span></button></div>`;
}

// Rien ne correspond à ce qui est tapé. texte = ce que la personne a tapé
function vueSuggestionsVide(texte){
return `<div class="sug-vide">Aucune suggestion pour « ${esc(texte)} ».<br>Appuyez sur Rechercher pour lancer la recherche.</div>`;
}
