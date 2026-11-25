// Écran « ajout » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['ajout']=`<div id="ajout" class="page">
<header><button class="retour" data-action="retourAjout">←</button><span id="ajout-titre" style="font-weight:bold">Ajouter un produit</span><span></span></header>
<div class="apercu" id="apercu">+ Choisir une photo</div>
<input type="file" id="photo" accept="image/*" style="display:none" data-change="choisirPhoto">
<label>Nom du produit</label>
<input id="nom" placeholder="Ex. Boubou brodé">
<label>Prix (FCFA)</label>
<input id="prix" type="number" inputmode="numeric" placeholder="Ex. 25000">
<label>Description</label>
<textarea id="desc" placeholder="Décrivez le produit"></textarea>
<button id="ajout-publier" class="btn" style="margin-top:20px" data-action="publier">Publier</button>
</div>
`;
