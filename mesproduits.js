// Écran « mesproduits » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['mesproduits']=`<div id="mesproduits" class="page">
<header><button class="retour" data-action="boutique">←</button><span style="font-weight:bold;font-size:20px">Mes produits</span><span></span></header>
<button class="btn" data-action="ajouterProduit" data-arg="mesproduits">+ Ajouter un produit</button>
<label>Produits publiés</label>
<div id="bmes" class="liste">Chargement…</div>
</div>
`;
