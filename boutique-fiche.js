// Fiche boutique (vendeur) : note de la boutique et page « Avis reçus ». Logique seulement.
// L'affichage : ecran-avis-recus.js (vue…). Les clics : ecran-liaisons.js (actions « avisRecus », « boutique »).
VUES.push('avis-recus');

function creerPageAvisRecus(){
if(document.getElementById('avis-recus')) return;
const p=document.createElement('div');
p.id='avis-recus';
p.className='page';
p.style.display='none';
document.body.appendChild(p);
}
creerPageAvisRecus();

// boutique.js affiche déjà la carte de la boutique (avec gestion des erreurs réseau).
// Ici on ajoute seulement la note et le bouton "Avis reçus", avec un seul appel réseau (les avis).
async function completerFicheBoutique(){
const b=boutiqueActuelle;
if(!b) return;
const s=await sessionValide();
if(!s||!s.user_id) return;
const avis=await chargerAvisVendeur(s.user_id);
if(avis.erreur) return;
// Si l'utilisateur a changé d'écran ou de boutique entre-temps, on n'écrit rien
if(boutiqueActuelle!==b) return;
const nom=document.querySelector('#infos-boutique .nomboutique');
const actions=document.getElementById('boutique-actions');
if(!nom||!actions) return;
nom.insertAdjacentHTML('afterend',vueNoteBoutique({etoiles:etoiles(moyenne(avis)),texte:texteMoyenne(avis),nb:avis.length}));

}

const voirBoutiqueAvantAvis=voirBoutique;
voirBoutique=async function(){
await voirBoutiqueAvantAvis();
await completerFicheBoutique();
};

async function voirAvisRecus(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous pour voir vos avis.');return;}
const page=document.getElementById('avis-recus');
page.innerHTML=vueAvisRecus();
montrer('avis-recus');
const avis=await chargerAvisVendeur(s.user_id);
const zone=document.getElementById('ar-corps');
if(!zone) return;
if(avis.erreur){
zone.innerHTML=vueAvisRecusErreur();
return;
}
if(!avis.length){
zone.innerHTML=vueAvisRecusVide();
return;
}
zone.innerHTML=vueAvisRecusListe({moyenne:texteMoyenne(avis),etoiles:etoiles(moyenne(avis)),nb:avis.length,avis:avis.map(a=>({auteur:a.auteur||'Client',etoiles:etoiles(a.note),commentaire:a.commentaire}))});
}
