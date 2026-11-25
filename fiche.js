// Écran « fiche » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['fiche']=`<div id="fiche" class="fiche">
<header><button class="retour" data-action="fermerFiche">←</button><span style="font-weight:bold">Produit</span><span></span></header>
<div class="photo" id="fphoto"></div>
<div class="corps">
<div class="prix" id="fprix"></div>
<div class="titre" id="fnom"></div>
<div class="desc" id="fdesc"></div>
<div class="boutique"><b>Boutique</b></div>
</div>
<div class="bar" style="display:flex;gap:10px">
<button class="btn2" style="margin-top:0;flex:1" data-action="message">Message</button>
<button class="btn" style="flex:1.4" data-action="commander">Commander</button>
</div>
</div>
`;
