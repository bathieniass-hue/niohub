// Écran « boutique » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['boutique']=`<div id="boutique" class="page">
<header><span style="font-weight:bold;font-size:20px">Ma boutique</span><button id="bt-action" class="btn-modif" data-action="modifierBoutique"><span class="crayon" aria-hidden="true"></span>Modifier</button></header>
<div id="infos-boutique"></div>
<button class="btn" style="margin-top:14px" data-action="mesProduits">Mes produits</button>
<button class="btn2" data-action="ajouterProduit" data-arg="boutique">Ajouter un produit</button>
<label>Commandes</label>
<div id="commandes-liste" class="liste">Chargement…</div>
<label>Messages des clients</label>
<div id="messages-liste" class="liste">Chargement…</div>
</div>
`;
