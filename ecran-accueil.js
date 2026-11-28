// Écran « accueil » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['accueil']=`<div id="accueil">
<div id="haut">
<div class="repliable" id="rep-entete"><div class="interieur"><header><h1>NioHub</h1><div class="actions-haut"><button class="cloche" data-action="notifications" aria-label="Notifications"><span class="cloche-ic" aria-hidden="true"></span><span class="pastille-cloche" data-compteur="total" style="display:none"></span></button><button class="plus" data-action="ajouterProduit" data-arg="accueil">+</button></div></header></div></div>
<div class="search" role="button" tabindex="0" data-action="ouvrirRecherche">Rechercher un produit ou une boutique</div>
<div class="repliable" id="rep-cats"><div class="interieur"><div class="cats" id="cats"></div></div></div>
</div>
<div class="grid" id="grid"></div>
</div>
`;
