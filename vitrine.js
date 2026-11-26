// Vitrine : page publique d'une boutique (ses infos, sa note et ses produits en vente). Logique seulement.
// L'affichage : ecran-vitrine.js (vueVitrine…) + style.css. Le clic sur ← : ecran-liaisons.js (action « fermerVitrine »).
// Ouverte depuis la recherche (voirVitrine(user_id)). Dépend d'app.js, boutique.js, compte.js.

let vitrineOrigine='accueil';
let vitrineId=null;

creerPage('vitrine');

async function vitrineTrouverBoutique(userId){
const b=boutiquesCache.find(x=>x.user_id===userId);
if(b) return b;
try{
const r=await Donnees.boutiques.deVendeur(userId);
if(!r.ok) throw new Error(r.status);
return (await r.json())[0]||null;
}catch(e){return null;}
}

// Liens d'appel et WhatsApp (ou null si aucun numéro valide)
function vitrineContact(b){
const tel=[b.telephone,b.telephone2].find(t=>t&&telephoneValide(t));
if(!tel) return null;
return {appel:'tel:+221'+chiffresTelephone(tel),whatsapp:lienWhatsapp(tel)};
}

async function voirVitrine(userId){
if(!userId) return;
if(vueCourante!=='vitrine'&&vueCourante!=='fiche') vitrineOrigine=vueCourante;
vitrineId=userId;
const page=document.getElementById('vitrine');
page.innerHTML=vueVitrineMessage('Chargement…');
montrer('vitrine');
const b=await vitrineTrouverBoutique(userId);
// Si l'utilisateur est parti ailleurs ou a ouvert une autre boutique entre-temps, on n'écrit rien
if(vitrineId!==userId||vueCourante!=='vitrine') return;
if(!b){
page.innerHTML=vueVitrineMessage('Cette boutique est introuvable pour le moment. Vérifiez votre connexion.');
return;
}
if(b.statut&&b.statut!=='validee'){
page.innerHTML=vueVitrineMessage('Cette boutique n\'est pas disponible pour le moment.');
return;
}
const n=notesVendeurs[userId];
await assurerCatalogueComplet();
const produits=distants.filter(p=>p.user_id===userId);
page.innerHTML=vueVitrine({
nom:b.nom||'',
initiale:(b.nom||'N').charAt(0).toUpperCase(),
fond:fondImage(b.logo,'#F2B233'),
aLogo:!!urlSure(b.logo),
verifie:!!b.telephone_verifie,
note:n&&n.nb?{texte:n.moyenne.toFixed(1).replace('.',','),nb:n.nb}:null,
adresse:b.adresse||'Adresse non indiquée',
telephones:telephonesBoutique(b),
contact:vitrineContact(b),
cartes:produits.map(p=>carteProduitHTML(p,0))
});
}

function fermerVitrine(){
const cible=(vitrineOrigine&&vitrineOrigine!=='vitrine'&&vitrineOrigine!=='fiche')?vitrineOrigine:'accueil';
vitrineId=null;
montrer(cible);
}
