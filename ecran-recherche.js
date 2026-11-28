// Écran « Recherche » : uniquement du HTML, aucune logique. Reçoit des données déjà prêtes (voir recherche.js).
// Le style est dans style.css (.rch-…, #rch-…). Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js).
// Les suggestions (liste sous la barre) sont dessinées par vueSuggestions() (ecran-catalogue.js). Les icônes de catégories : vueIconeCategorie() (ecran-raccourcis.js).

// Page complète : barre du haut (← à gauche, champ, emplacement du futur bouton Filtre à droite),
// panneau d'accueil de la recherche, puis les résultats.
function vueRechercheEcran(){
return `<header class="rch-entete"><button class="retour" data-action="fermerRecherche" aria-label="Retour">←</button><div class="recherche"><input id="q" type="search" placeholder="Rechercher un produit ou une boutique" autocomplete="off"></div><button type="button" class="rch-btn rch-btn-go" data-action="rechercheLancer" aria-label="Rechercher"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button><div id="rch-filtre"><button type="button" class="rch-btn rch-btn-filtre" data-action="filtreOuvrir" aria-label="Filtrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg></button></div></header>
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

// Catégorie et filtres en cours, au-dessus des résultats (touchez une puce pour l'enlever).
// d = { categorie ('' si aucune), filtres:[{ cle, libelle }] }
function vueRechercheActive(d){
const puces=[];
if(d.categorie) puces.push(`<button type="button" class="filtre tout on" data-action="rechercheRetirerCategorie">${esc(d.categorie)} <span aria-hidden="true">✕</span></button>`);
d.filtres.forEach(f=>puces.push(`<button type="button" class="filtre tout on" data-action="filtreRetirer" data-arg="${esc(f.cle)}">${esc(f.libelle)} <span aria-hidden="true">✕</span></button>`));
return puces.length?`<div class="rch-chips">${puces.join('')}</div>`:'';
}

// Fenêtre « Filtrer » (le fond sombre est créé par recherche.js).
// d = { tris:[{valeur,nom,actif}], etats:[{valeur,nom,actif}] (valeur '' = Tous), prixMin, prixMax (texte, '' si vide) }
function vueFiltreBoite(d){
const puces=(groupe,l)=>l.map(x=>`<button type="button" class="filtre tout${x.actif?' on':''}" data-groupe="${groupe}" data-valeur="${esc(x.valeur)}" data-action="filtreChoix" data-arg="${groupe}|${esc(x.valeur)}">${esc(x.nom)}</button>`).join('');
return `<div id="filtre-boite"><div id="filtre-entete"><span id="filtre-titre">Filtrer</span><button type="button" class="retour" data-action="filtreFermer" aria-label="Fermer">✕</button></div>
<div class="titre-section">Trier par</div><div class="rch-chips" id="filtre-tri">${puces('tri',d.tris)}</div>
<div class="titre-section">État</div><div class="rch-chips" id="filtre-etat">${puces('etat',d.etats)}</div>
<div class="titre-section">Prix (FCFA)</div><div class="filtre-prix"><input id="filtre-prix-min" type="number" inputmode="numeric" min="0" placeholder="Minimum" value="${esc(d.prixMin)}"><span>–</span><input id="filtre-prix-max" type="number" inputmode="numeric" min="0" placeholder="Maximum" value="${esc(d.prixMax)}"></div>
<div class="filtre-actions"><button type="button" class="btn2" data-action="filtreReinit">Réinitialiser</button><button type="button" class="btn" data-action="filtreAppliquer">Voir les résultats</button></div></div>`;
}

// Rien ne correspond à ce qui est tapé. texte = ce que la personne a tapé
function vueSuggestionsVide(texte){
return `<div class="sug-vide">Aucune suggestion pour « ${esc(texte)} ».<br>Appuyez sur Rechercher pour lancer la recherche.</div>`;
}
