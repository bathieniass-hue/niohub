// La page "Message au vendeur" est enregistrée comme une vraie vue : elle se ferme avec les autres écrans
VUES.push('message');

let msgProduit="";
let messageEnCours=false;

async function voirMessage(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id){alert('Ce produit de démonstration ne peut pas recevoir de message.');return;}
if(produitOuvert.user_id===s.user_id){alert('Vous ne pouvez pas vous écrire à vous-même : c\'est votre produit.');return;}
msgProduit=produitOuvert.nom;
document.getElementById('msg-produit').textContent=msgProduit;
document.getElementById('msg-nom').value=nomComplet();
document.getElementById('msg-nom').maxLength=80;
document.getElementById('msg-texte').maxLength=1000;
document.getElementById('msg-msg').textContent='';
montrer('message');
}

function retourFicheMessage(){
montrer('fiche');
}

async function envoyerMessage(){
if(messageEnCours) return;
const msg=document.getElementById('msg-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id){msg.textContent='Produit introuvable. Retournez à la fiche et réessayez.';return;}
if(produitOuvert.user_id===s.user_id){msg.textContent='Vous ne pouvez pas vous écrire à vous-même.';return;}
const nom=document.getElementById('msg-nom').value.trim();
const texte=document.getElementById('msg-texte').value.trim();
if(!nom||!texte){msg.textContent='Indiquez votre nom et votre message.';return;}
if(nom.length>80){msg.textContent='Le nom est trop long (80 caractères maximum).';return;}
if(texte.length>1000){msg.textContent='Le message est trop long (1000 caractères maximum).';return;}
const bouton=document.querySelector('#message .btn');
const texteBouton=bouton?bouton.textContent:'';
messageEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Envoi en cours…';}
const fin=()=>{messageEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}};
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({produit:msgProduit,expediteur:nom,texte:texte,vendeur_id:produitOuvert.user_id,acheteur_id:s.user_id})});
if(!r.ok) throw new Error(r.status);
}catch(e){
fin();
msg.textContent='Erreur, message non envoyé. Vérifiez votre connexion et réessayez.';
return;
}
fin();
document.getElementById('msg-texte').value='';
alert('Message envoyé au vendeur. Il vous répondra par téléphone ou WhatsApp.');
voirAccueil();
}
