// Écrans de l'installation et des mises à jour : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js) ; le style est dans style.css.
// La logique (quand afficher, installer, masquer) est dans pwa.js.

// Bandeau « Nouvelle version disponible » : renvoie l'élément à poser dans la page
function vueBandeauMiseAJour(){
const b=document.createElement('div');
b.id='bandeau-maj';
b.innerHTML='<span class="bm-texte"><b>Nouvelle version disponible</b></span>'
+'<button type="button" class="bm-bouton" data-action="majRecharger">Mettre à jour</button>'
+'<button type="button" class="bm-fermer" aria-label="Plus tard" data-action="majFermer">✕</button>';
return b;
}

// Bandeau « Installer NioHub » : mode = 'android', 'ios' ou 'webview' ; renvoie le HTML intérieur
function vueBandeauInstall(mode){
const textes={
android:'Accès direct depuis votre écran d’accueil, en plein écran.',
ios:'Touchez Partager (le carré avec une flèche), puis « Sur l’écran d’accueil ».',
webview:'Ouvrez cette page dans Chrome ou Safari (menu ⋮ puis « Ouvrir dans le navigateur ») pour pouvoir l’installer.'
};
const titre=mode==='ios'?'Installer NioHub sur iPhone':'Installer NioHub';
return '<div class="bi-texte"><b>'+titre+'</b><br>'+textes[mode]+'</div>'
+(mode==='android'?'<button type="button" class="petit" data-action="installer">Installer</button>':'')
+'<button type="button" class="bi-fermer" aria-label="Fermer" data-action="installMasquer">✕</button>';
}

// Ligne « Installer l'application » en haut de la liste du Profil : renvoie l'élément
function vueLigneInstaller(){
const l=document.createElement('div');
l.id='ligne-installer';
l.className='ligne';
l.setAttribute('data-action','installer');
l.innerHTML='<b class="li-titre">Installer l\'application</b><span>›</span>';
return l;
}
