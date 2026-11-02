let produitOuvert=null;

const ouvrirAvantCommande=ouvrir;
ouvrir=function(i){
produitOuvert=tous()[i];
ouvrirAvantCommande(i);
afficherBoutiqueFiche(produitOuvert.user_id||null);
};

async function voirCommande(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour commander.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id){alert('Ce produit de démonstration ne peut pas être commandé.');return;}
document.getElementById('cmd-produit').textContent=produitOuvert.nom+' · '+produitOuvert.prix;
document.getElementById('cmd-nom').value=nomComplet();
document.getElementById('cmd-tel').value=s.telephone||'';
document.getElementById('cmd-adresse').value=s.quartier||'';
document.getElementById('cmd-msg').textContent='';
montrer('commande');
}

function retourFiche(){montrer('fiche');}

async function envoyerCommande(){
const msg=document.getElementById('cmd-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour commander.');montrer('profil');return;}
const nom=document.getElementById('cmd-nom').value.trim();
const tel=document.getElementById('cmd-tel').value.trim();
const adresse=document.getElementById('cmd-adresse').value.trim();
const quantite=parseInt(document.getElementById('cmd-quantite').value,10)||1;
const paiement=document.getElementById('cmd-paiement').value;
if(!nom||!tel){msg.textContent='Indiquez votre nom et votre téléphone.';return;}
const corps={produit:produitOuvert.nom,quantite:quantite,nom_client:nom,telephone:tel,adresse:adresse||null,paiement:paiement,vendeur_id:produitOuvert.user_id,acheteur_id:s.user_id};
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
}catch(e){msg.textContent='Erreur, commande non envoyée. Réessayez.';return;}
alert('Commande envoyée ! Le vendeur vous contactera.');
voirAccueil();
}
