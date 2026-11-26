// Écran « fiche » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['fiche']=`<div id="fiche" class="fiche">
<header><button class="retour" data-action="fermerFiche">←</button><span style="font-weight:bold">Produit</span><span></span></header>
<div class="photo" id="fphoto">
<button id="btn-favori" class="btn-favori" type="button" data-action="favori" aria-label="Ajouter aux favoris"><svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg></button>
</div>
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
