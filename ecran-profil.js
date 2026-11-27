// Écran « profil » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['profil']=`<div id="profil" class="page">
<header><span style="font-weight:bold;font-size:20px">Profil</span><button class="btn-modif" data-action="modifierProfil"><span class="crayon" aria-hidden="true"></span>Modifier</button></header>
<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center">
<div class="avatar">N</div>
<div><div class="nomboutique" id="profil-nom" style="font-size:18px">Utilisateur test</div><div style="font-size:13px;color:#6B6254">Mode test, sans compte</div></div>
</div>
<div class="liste" style="margin-top:12px">
<div class="ligne" data-action="boutique"><span class="icone-liste" style="--i:2" aria-hidden="true"></span><b style="flex:1">Ma boutique</b><span class="pastille-liste" data-compteur="boutique" style="display:none"></span><span>›</span></div>
<div class="ligne" data-action="achats"><span class="icone-liste" style="--i:5" aria-hidden="true"></span><b style="flex:1">Mes achats</b><span class="pastille-liste" data-compteur="achats" style="display:none"></span><span>›</span></div>
<div class="ligne" data-action="bandeau" data-arg="Bientôt disponible"><span class="icone-liste" style="--i:12" aria-hidden="true"></span><b style="flex:1">Adresses</b><span>›</span></div>
<div class="ligne" data-action="parametres"><span class="icone-liste" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#10301F,#050B07);box-shadow:inset 0 0 0 1.5px #3BBF4B" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6" fill="none" stroke="#2FB344" stroke-width="3" stroke-dasharray="2.3 2.25"></circle><circle cx="12" cy="12" r="6.2" fill="#2FB344" stroke="#EAF6EA" stroke-width="1.3"></circle><circle cx="12" cy="12" r="2.5" fill="#06210F"></circle></svg></span><b style="flex:1">Paramètres</b><span>›</span></div>
<div class="ligne" data-action="contact"><span class="icone-liste" style="--i:14" aria-hidden="true"></span><b style="flex:1">Nous contacter</b><span class="pastille-liste" data-compteur="support" style="display:none"></span><span>›</span></div>
<div class="ligne" data-action="conditions"><span class="icone-liste" style="--i:15" aria-hidden="true"></span><b style="flex:1">Conditions et confidentialité</b><span>›</span></div>
<div class="ligne" data-action="deconnecter"><span class="icone-liste" style="--i:13" aria-hidden="true"></span><b style="flex:1;color:#B4291A">Déconnecter</b><span>›</span></div>
</div>
</div>
`;

// Page « Modifier mon profil » : uniquement du HTML, aucune logique (voir profil.js). Le style : style.css (.pm-…).
function vueModifProfil(){
return `
<header><button class="retour" data-action="profil">←</button><span style="font-weight:bold;font-size:20px">Modifier mon profil</span><span></span></header>
<div class="pm-photo-zone">
<button type="button" class="pm-photo" id="pm-photo" data-action="ouvrir" data-arg="pm-photo-fichier" aria-label="Changer la photo de profil"></button>
<button type="button" class="pm-photo-lien" data-action="ouvrir" data-arg="pm-photo-fichier">Changer la photo</button>
<input id="pm-photo-fichier" type="file" accept="image/*" style="display:none" data-change="choisirPhotoProfil">
</div>
<label>Nom complet</label>
<input id="pm-nom" placeholder="Ex. Fatou Diop" maxlength="80">
<label>Téléphone</label>
<div class="champ-tel"><span class="indicatif">+221</span><input id="pm-tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>
<label>Adresse</label>
<input id="pm-adresse" placeholder="Quartier, repère" maxlength="200">
<div id="pm-msg" class="msg"></div>
<button id="pm-valider" class="btn" style="margin-top:14px" data-action="enregistrerProfil">Enregistrer</button>
`;
}
