// ============================================================
// Écrans : assemblage. Insère le HTML de chaque écran dans la page,
// exactement à l'endroit où ce script est appelé (dans index.html).
// Pour ajouter un écran : créer ecrans/nom.js, le charger dans
// index.html avant ce fichier, et l'ajouter à la liste ci-dessous.
// ============================================================
(function(){
const ORDRE=['accueil','fiche','commande','ajout','boutique','boutique-form','mesproduits','profil','menu'];
const html=ORDRE.map(function(nom){return (window.Ecrans&&window.Ecrans[nom])||'';}).join('\n\n');
document.currentScript.insertAdjacentHTML('beforebegin',html);
})();
