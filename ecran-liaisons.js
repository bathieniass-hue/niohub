// ============================================================
// Liaisons : le SEUL fichier qui relie les écrans au moteur.
//  - Les écrans (ecran-*.js) ne contiennent que du HTML. Un bouton dit
//    ce qu'il veut avec  data-action="nom"  (et au besoin  data-arg="…").
//  - Ici, chaque nom d'action est relié à la fonction du moteur.
// Changer le design d'un écran : toucher seulement ecran-*.js.
// Renommer une fonction du moteur : toucher seulement ce fichier.
// Les fonctions sont cherchées au moment du clic (et non au chargement) :
// certaines sont redéfinies plus tard par d'autres fichiers.
// ============================================================
(function(){
function appeler(nom){
const f=window[nom];
if(typeof f!=='function') return;
return f.apply(null,Array.prototype.slice.call(arguments,1));
}

// Clic : nom d'action → ce que le moteur doit faire (arg = data-arg du bouton)
const CLIC={
accueil:function(){return appeler('voirAccueil');},
boutique:function(){return appeler('voirBoutique');},
profil:function(){return appeler('voirProfil');},
notifications:function(){return appeler('voirNotifications');},
parametres:function(){return appeler('voirParametres');},
contact:function(){return appeler('voirContact');},
achats:function(){return appeler('voirAchats');},
conversations:function(){return appeler('voirConversations');},
favoris:function(){return appeler('voirFavoris');},
categories:function(){return appeler('ouvrirCategories');},
categorie:function(c){return appeler('choisirCategorie',c);},
categorieModal:function(c){return appeler('choisirCategorieModal',c);},
retourAchats:function(){return appeler('retourAchats');},
achatsListe:function(){return appeler('retourListeAchats');},
achatDetail:function(id){return appeler('voirAchatDetail',id);},
avisAchat:function(id){return appeler('donnerAvisAchat',id);},
annulerAchat:function(id){return appeler('annulerAchat',id);},
avis:function(){return appeler('voirAvis');},
retourAvis:function(origine){return appeler('retourAvis',origine);},
avisRafraichir:function(){return appeler('rafraichirAvis');},
avisMoi:function(){return appeler('afficherMonAvis');},
avisModifier:function(){return appeler('modifierMonAvis');},
avisSupprimer:function(){return appeler('supprimerMonAvis');},
avisPublier:function(){return appeler('envoyerAvis');},
avisEnregistrer:function(){return appeler('enregistrerModifAvis');},
etoile:function(n){return appeler('choisirEtoile',Number(n));},
seConnecter:function(){return appeler('afficherConnexion');},
theme:function(t){return appeler('choisirTheme',t);},
avisRecus:function(){return appeler('voirAvisRecus');},
message:function(){return appeler('voirMessage');},
commander:function(){return appeler('voirCommande');},
confirmerCommande:function(){return appeler('envoyerCommande');},
ajouterProduit:function(origine){return appeler('voirAjout',origine);},
retourAjout:function(){return appeler('retourAjout');},
retourFiche:function(){return appeler('retourFiche');},
fermerFiche:function(){return appeler('fermerFiche');},
fermerVitrine:function(){return appeler('fermerVitrine');},
favori:function(){return appeler('basculerFavori');},
statut:function(arg){var k=String(arg).lastIndexOf('|');return appeler('changerStatut',String(arg).slice(0,k),String(arg).slice(k+1));},
publier:function(){return appeler('publier');},
mesProduits:function(){appeler('montrer','mesproduits');return appeler('voirMesProduits');},
modifierBoutique:function(){return appeler('ouvrirFormBoutique');},
enregistrerBoutique:function(){return appeler('enregistrerBoutique');},
modifierProfil:function(){return appeler('modifierProfil');},
deconnecter:function(){return appeler('deconnecter');},
bandeau:function(message){return appeler('bandeau',message);},
conditions:function(){window.open('conditions.html','_blank');},
// Ouvre le sélecteur de fichier d'un champ (arg = id du champ)
ouvrir:function(id){var c=document.getElementById(id);if(c) c.click();}
};

// Changement d'un champ (un fichier choisi, par exemple) : le moteur reçoit l'événement
const CHANGEMENT={
choisirPhoto:function(e){return appeler('choisirPhoto',e);},
choisirLogo:function(e){return appeler('choisirLogo',e);}
};

document.addEventListener('click',function(e){
const el=e.target.closest&&e.target.closest('[data-action]');
if(!el) return;
const f=CLIC[el.getAttribute('data-action')];
if(f) f(el.getAttribute('data-arg'),el,e);
});
document.addEventListener('change',function(e){
const el=e.target.closest&&e.target.closest('[data-change]');
if(!el) return;
const f=CHANGEMENT[el.getAttribute('data-change')];
if(f) f(e);
});

// Cas particulier : ajout-produit.js réassigne lui-même le onclick de cet aperçu
// (il l'active et le coupe selon qu'une photo est choisie). On garde donc ici une
// propriété onclick, pas une data-action, pour ne pas doubler le clic.
const apercu=document.getElementById('apercu');
if(apercu) apercu.onclick=function(){var c=document.getElementById('photo');if(c) c.click();};
})();
