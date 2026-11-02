let msgProduit="";

async function voirMessage(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
if(!produitOuvert||!produitOuvert.user_id){alert('Ce produit de démonstration ne peut pas recevoir de message.');return;}
msgProduit=produitOuvert.nom;
document.getElementById('msg-produit').textContent=msgProduit;
document.getElementById('msg-nom').value=nomComplet();
document.getElementById('msg-msg').textContent='';
document.getElementById('fiche').style.display='none';
document.getElementById('message').style.display='block';
window.scrollTo(0,0);
}

function retourFicheMessage(){
document.getElementById('message').style.display='none';
document.getElementById('fiche').style.display='block';
window.scrollTo(0,0);
}

async function envoyerMessage(){
const msg=document.getElementById('msg-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour envoyer un message.');montrer('profil');return;}
const nom=document.getElementById('msg-nom').value.trim();
const texte=document.getElementById('msg-texte').value.trim();
if(!nom||!texte){msg.textContent='Indiquez votre nom et votre message.';return;}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({produit:msgProduit,expediteur:nom,texte:texte,vendeur_id:produitOuvert.user_id,acheteur_id:s.user_id})});
if(!r.ok) throw new Error(r.status);
}catch(e){msg.textContent='Erreur, message non envoyé. Réessayez.';return;}
alert('Message envoyé au vendeur.');
document.getElementById('msg-texte').value='';
document.getElementById('message').style.display='none';
voirAccueil();
}
