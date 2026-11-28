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
ajoutGauche:function(){return appeler('ajoutGauche');},
ajoutSuivant:function(){return appeler('ajoutSuivant');},
ajoutRetirer:function(i){return appeler('ajoutRetirer',i);},
fichePhoto:function(src,el){return appeler('choisirPhotoFiche',src,el);},
fermerAuth:function(){return appeler('fermerAuth');},
reessayerAcces:function(){return appeler('verifierAcces');},
changerCompte:function(){return appeler('seDeconnecter');},
creerProfil:function(){return appeler('creerProfil');},
reessayerProfil:function(){return appeler('afficherProfilCarte');},
messagesBoutique:function(){return appeler('voirMessages');},
commandes:function(){return appeler('voirCommandes');},
commandeDetail:function(i){return appeler('voirCommandeDetail',Number(i));},
validerNumero:function(){return appeler('validerMonNumero');},
afficherPage:function(id){return appeler('afficherPage',id);},
detailNio:function(id){return appeler('ouvrirDetailNio',id);},
retourNotif:function(){return appeler('retourNotifications');},
notifAller:function(i){return appeler('allerNotif',Number(i));},
toutVu:function(){return appeler('marquerToutVu');},
basculerNotif:function(){return appeler('basculerNotifSysteme');},
demandeOui:function(){return appeler('accepterDemandeNotif');},
demandeNon:function(){return appeler('reporterEtFermerDemande');},
fermerListe:function(){return appeler('fermerListe');},
fermerChat:function(){return appeler('fermerChat');},
envoyerChat:function(){return appeler('envoyerChat');},
ouvrirConversation:function(i){return appeler('ouvrirConversation',Number(i));},
reessayerListe:function(){return appeler('rafraichirListe');},
reessayerChat:function(){return appeler('chargerChat',true);},
voirProduitChat:function(){return appeler('voirProduitDuChat');},
ouvrirProduitId:function(id){return appeler('ouvrirParId',/^\d+$/.test(String(id))?Number(id):id);},
menuMessage:function(a,el){return appeler('menuMessage',el);},
supprimerMessage:function(arg){var k=String(arg).lastIndexOf('|');return appeler('supprimerMessage',String(arg).slice(0,k),String(arg).slice(k+1)==='1');},
ouvrirDemo:function(i){return appeler('ouvrir',Number(i));},
vitrine:function(id){return appeler('voirVitrine',id);},
ouvrirRecherche:function(){return appeler('ouvrirRecherche');},
fermerRecherche:function(){return appeler('fermerRecherche');},
rechercheRapide:function(t){return appeler('rechercherTexte',t);},
rechercheCategorie:function(c){return appeler('choisirCategorieRecherche',c);},
rechercheRetirerCategorie:function(){return appeler('retirerCategorieRecherche');},
rechercheLancer:function(){return appeler('lancerRecherche');},
filtreOuvrir:function(){return appeler('ouvrirFiltres');},
filtreFermer:function(){return appeler('fermerFiltres');},
filtreChoix:function(arg){return appeler('choisirFiltre',arg);},
filtreAppliquer:function(){return appeler('appliquerFiltres');},
filtreReinit:function(){return appeler('reinitialiserFiltres');},
filtreRetirer:function(cle){return appeler('retirerFiltre',cle);},
vitrineFiche:function(){return appeler('voirVitrineDepuisFiche');},
suggestion:function(k){return appeler('choisirSuggestion',Number(k));},
modifierProduit:function(id){return appeler('modifierProduit',Number(id));},
supprimerProduit:function(id){return appeler('supprimerProduit',Number(id));},
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
enregistrerProfil:function(){return appeler('enregistrerProfil');},
envoyerContact:function(){return appeler('envoyerContact');},
deconnecter:function(){return appeler('deconnecter');},
bandeau:function(message){return appeler('bandeau',message);},
conditions:function(){window.open('conditions.html','_blank');},
installer:function(){return appeler('installerApp');},
installMasquer:function(){return appeler('masquerInstallation');},
majRecharger:function(){return appeler('rechargerApp');},
majFermer:function(){return appeler('fermerBandeauMiseAJour');},
optionOuvrir:function(n,el,e){return appeler('ouvrirOption',n,e);},
optionChoisir:function(arg){var k=String(arg).indexOf('|');return appeler('choisirOption',String(arg).slice(0,k),String(arg).slice(k+1));},
optionFermer:function(a,el,e){if(e.target===el) return appeler('fermerOption');},
couleur:function(a,el){return appeler('basculerCouleur',el);},
// Ouvre le sélecteur de fichier d'un champ (arg = id du champ)
ouvrir:function(id){var c=document.getElementById(id);if(c) c.click();}
};

// Changement d'un champ (un fichier choisi, par exemple) : le moteur reçoit l'événement
const CHANGEMENT={
choisirPhoto:function(e){return appeler('choisirPhoto',e);},
choisirLogo:function(e){return appeler('choisirLogo',e);},
choisirPhotoProfil:function(e){return appeler('choisirPhotoProfil',e);}
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
})();
