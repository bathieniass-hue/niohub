let produitOuvert=null;
let commandeEnCours=false;

const ouvrirAvantCommande=ouvrir;
ouvrir=function(i){
produitOuvert=tous()[i];
ouvrirAvantCommande(i);
afficherBoutiqueFiche(produitOuvert.user_id||null);
};

function prixNombre(texte){
return parseInt(String(texte||'').replace(/\D/g,''),10)||0;
}

async function voirCommande(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour commander.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id||!produitOuvert.id){bandeau('Ce produit de démonstration ne peut pas être commandé.');return;}
if(produitOuvert.user_id===s.user_id){bandeau('Vous ne pouvez pas commander votre propre produit.','erreur');return;}
document.getElementById('cmd-produit').textContent=produitOuvert.nom+' · '+produitOuvert.prix;
document.getElementById('cmd-nom').value=nomComplet();
document.getElementById('cmd-tel').value=formaterTelephone(s.telephone);
document.getElementById('cmd-adresse').value=s.adresse||'';
document.getElementById('cmd-quantite').value='1';
document.getElementById('cmd-msg').textContent='';
montrer('commande');
}

function retourFiche(){montrer('fiche');}

async function envoyerCommande(){
if(commandeEnCours) return;
const msg=document.getElementById('cmd-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour commander.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id||!produitOuvert.id){msg.textContent='Produit introuvable. Retournez à la fiche et réessayez.';return;}
if(produitOuvert.user_id===s.user_id){msg.textContent='Vous ne pouvez pas commander votre propre produit.';return;}
const nom=document.getElementById('cmd-nom').value.trim();
const tel=formaterTelephone(document.getElementById('cmd-tel').value);
const adresse=document.getElementById('cmd-adresse').value.trim();
const quantite=Number(document.getElementById('cmd-quantite').value);
const paiement=document.getElementById('cmd-paiement').value;
if(!nom||!tel){msg.textContent='Indiquez votre nom et votre téléphone.';return;}
if(!telephoneValide(tel)){msg.textContent=MESSAGE_TEL;return;}
if(!Number.isInteger(quantite)||quantite<1||quantite>100){msg.textContent='La quantité doit être un nombre entre 1 et 100.';return;}
if(nom.length>80||adresse.length>200){msg.textContent='Le nom ou l\'adresse est trop long.';return;}
const prixUnitaire=prixNombre(produitOuvert.prix);
const corps={
produit_id:produitOuvert.id,
produit:produitOuvert.nom,
quantite:quantite,
nom_client:nom,
telephone:tel,
adresse:adresse||null,
paiement:paiement,
vendeur_id:produitOuvert.user_id,
acheteur_id:s.user_id
};
const bouton=document.querySelector('#commande .btn');
const texteBouton=bouton?bouton.textContent:'';
commandeEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Envoi en cours…';}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
}catch(e){
msg.textContent='Erreur, commande non envoyée. Réessayez.';
commandeEnCours=false;
if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}
return;
}
commandeEnCours=false;
if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}
const total=prixUnitaire*quantite;
bandeau('Commande envoyée au vendeur'+(total?' · Total : '+total.toLocaleString('fr-FR')+' FCFA':'')+'.\n\nAucun paiement n\'a été fait dans l\'application. Le vendeur vous contactera : convenez avec lui du paiement ('+paiement+') et de la livraison.','succes',{duree:9000});
voirAccueil();
}
