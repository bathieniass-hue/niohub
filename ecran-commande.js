// Écran « commande » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['commande']=`<div id="commande" class="page">
<header><button class="retour" data-action="retourFiche">←</button><span style="font-weight:bold">Commander</span><span></span></header>
<div class="liste" style="margin-top:0"><b id="cmd-produit"></b></div>
<label>Votre nom</label>
<input id="cmd-nom" placeholder="Ex. Fatou Diop">
<label>Téléphone</label>
<div class="champ-tel"><span class="indicatif">+221</span><input id="cmd-tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>
<label>Adresse de livraison</label>
<input id="cmd-adresse" placeholder="Quartier, repère">
<label>Quantité</label>
<input id="cmd-quantite" type="number" inputmode="numeric" value="1" min="1">
<label>Paiement</label>
<select id="cmd-paiement" style="width:100%;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px">
<option>À la livraison</option>
<option>Wave</option>
<option>Orange Money</option>
</select>
<div id="cmd-msg" class="msg"></div>
<button class="btn" style="margin-top:14px" data-action="confirmerCommande">Confirmer la commande</button>
</div>
`;
