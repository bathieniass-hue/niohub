// Écran « connexion / profil » : uniquement du HTML, aucune logique.
// Les données arrivent prêtes depuis compte.js. Les boutons déclarent leur intention avec
// data-action (voir ecran-liaisons.js). Le style : style.css (#auth, .auth-…, .btn-plein).

// Le cadre de l'écran de connexion (le contenu change dans #auth-corps)
function vueAuth(){
return '<div class="auth-haut"><button type="button" class="auth-retour" data-action="fermerAuth" aria-label="Retour à l\'accueil">←</button><img class="auth-logo" src="logo-n.png" alt="NioHub"><h1 class="auth-titre">NioHub</h1><div class="auth-sous">Achetez et vendez près de chez vous, en toute confiance.</div></div><div class="auth-carte" id="auth-corps"><p>Chargement…</p></div>';
}

function vueConnexion(){
return `<h2>Bienvenue</h2>
<p>Connectez-vous pour acheter, vendre et gérer votre boutique en toute sécurité.</p>
<div class="g-enveloppe"><div id="g-bouton"></div></div>
<div id="c-msg" class="msg"></div>
<button type="button" class="auth-lien" data-action="fermerAuth">Continuer sans compte</button>
<div class="auth-pied">En continuant, vous acceptez les <a href="conditions.html" target="_blank" rel="noopener" style="color:#0E6B47;font-weight:bold">conditions d'utilisation et la politique de confidentialité</a> de NioHub.</div>`;
}

function vueErreurReseau(){
return `<h2>Connexion impossible</h2>
<p>Nous n'arrivons pas à joindre le serveur. Vérifiez votre connexion internet puis réessayez.</p>
<button class="btn-plein" data-action="reessayerAcces">Réessayer</button>
<button class="auth-lien" data-action="changerCompte">Changer de compte</button>
<button type="button" class="auth-lien" data-action="fermerAuth">Retour à l'accueil</button>`;
}

function vueCompletion(){
return `<h2>Presque terminé</h2>
<p>Complétez votre profil pour commencer. Ces informations serviront à vos achats et à votre boutique.</p>
<div class="auth-champs">
<label>Prénom</label><input id="p-prenom" placeholder="Ex. Fatou" maxlength="40">
<label>Nom</label><input id="p-nom" placeholder="Ex. Diop" maxlength="40">
<label>Téléphone</label><div class="champ-tel"><span class="indicatif">+221</span><input id="p-tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>
<label>Adresse (facultatif)</label><input id="p-adresse" placeholder="Quartier, repère" maxlength="200">
</div>
<div id="c-msg" class="msg"></div>
<button id="p-valider" class="btn-plein" data-action="creerProfil">Enregistrer mon profil</button>
<button class="auth-lien" data-action="changerCompte">Changer de compte</button>`;
}

// Carte du profil. d = { initiale, photo (adresse sûre ou ''), nom, adresse, telephone }
function vueProfilCarte(d){
return `<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar" style="${d.photo?'background:url('+d.photo+') center/cover no-repeat':''}">${d.photo?'':esc(d.initiale)}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(d.nom)}</div><div style="font-size:13px;color:#6B6254">${esc(d.adresse)}</div><div style="font-size:13px;color:#6B6254">${esc(d.telephone)}</div></div></div>`;
}

function vueProfilErreur(){
return '<div class="liste" style="margin-top:0">Impossible de charger votre profil. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" data-action="reessayerProfil">Réessayer</button></div>';
}
