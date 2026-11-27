// Écran « détails du produit » (catégorie, état, couleurs, menu de choix) : uniquement du HTML, aucune logique.
// Les clics déclarent leur intention avec data-action (voir ecran-liaisons.js) ; le style est dans style.css (.dp-…).
// La logique (choix, positionnement du menu, publication) est dans details-produit.js.

// Carte des détails (hors description, ajoutée par le moteur). couleurs = [{nom,hex}]
function vueCarteDetails(couleurs){
return `
<div class="dp-row dp-cliquable" id="dp-row-categorie" data-action="optionOuvrir" data-arg="categorie">
<span class="dp-label">Catégorie</span>
<span class="dp-valeur dp-vide" id="dp-val-categorie">Choisir</span>
<span class="dp-chev">›</span>
</div>
<div class="dp-row dp-cliquable" id="dp-row-etat" data-action="optionOuvrir" data-arg="etat">
<span class="dp-label">État</span>
<span class="dp-valeur dp-vide" id="dp-val-etat">Choisir</span>
<span class="dp-chev">›</span>
</div>
<div class="dp-row">
<span class="dp-label">Couleur</span>
<div class="dp-couleurs">${couleurs.map(c=>`<button type="button" class="dp-sw" data-c="${esc(c.nom)}" data-action="couleur"><div class="dp-pastille" style="background:${c.hex}"></div>${esc(c.nom.toLowerCase())}</button>`).join('')}</div>
<span class="dp-chev">›</span>
</div>
`;
}

// Fond transparent + boîte du menu de choix : renvoie l'élément à poser dans la page
function vueFondOption(){
const fond=document.createElement('div');
fond.id='dp-fond';
fond.setAttribute('data-action','optionFermer');
const box=document.createElement('div');
box.id='dp-pop';
fond.appendChild(box);
return fond;
}

// Contenu du menu de choix : n = 'categorie' ou 'etat', liste = valeurs, courant = valeur choisie
function vueListeOption(n,titre,liste,courant){
return `<div class="dp-pop-titre">${esc(titre)}</div>`+liste.map(v=>`<button type="button" class="dp-choix${courant===v?' on':''}" data-action="optionChoisir" data-arg="${esc(n)}|${esc(v)}">${esc(v)}</button>`).join('');
}
