// Écran « boutique-form » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['boutique-form']=`<div id="boutique-form" class="page">
<header><button class="retour" data-action="boutique">←</button><span style="font-weight:bold;font-size:20px">Ma boutique</span><span></span></header>
<label>Logo (photo)</label>
<div class="apercu" id="bt-logo" style="width:120px;height:120px;border-radius:60px;margin:0 auto" data-action="ouvrir" data-arg="bt-photo">+ Logo</div>
<input type="file" id="bt-photo" accept="image/*" style="display:none" data-change="choisirLogo">
<label>Nom de la boutique</label>
<input id="bt-nom">
<label>Téléphone</label>
<div class="champ-tel"><span class="indicatif">+221</span><input id="bt-tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>
<label>Adresse</label>
<input id="bt-adresse" placeholder="Quartier, repère">
<label>Description</label>
<textarea id="bt-desc"></textarea>
<div id="bt-msg" class="msg"></div>
<button class="btn" style="margin-top:14px" data-action="enregistrerBoutique">Enregistrer ma boutique</button>
</div>
`;
