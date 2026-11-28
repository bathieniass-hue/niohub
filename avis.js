// Avis : logique seulement (chargement, calcul des notes, publication, modification, suppression).
// L'affichage : ecran-avis.js (vue…). Les clics : ecran-liaisons.js (actions avis, retourAvis, etoile, avisPublier…).
const PAGE_AVIS='avis-page';
let avisVendeurCourant=null;
let avisNoteChoisie=0;
let avisEnCours=false;

const montrerAvantAvis=montrer;
montrer=function(vue){
const p=document.getElementById(PAGE_AVIS);
if(p&&vue!==PAGE_AVIS) p.style.display='none';
montrerAvantAvis(vue);
};

function etoiles(n){
const k=Math.max(0,Math.min(5,Math.round(n)));
return '★'.repeat(k)+'☆'.repeat(5-k);
}

function moyenne(lignes){
return lignes.length?lignes.reduce((t,a)=>t+a.note,0)/lignes.length:0;
}

function texteMoyenne(lignes){
return lignes.length?moyenne(lignes).toFixed(1).replace('.',','):'–';
}

function resumeTexte(lignes){
return lignes.length?lignes.length+' avis':'Aucun avis pour l\'instant';
}

// En cas d'erreur réseau, retourne une liste vide marquée .erreur = true
// (les autres fichiers continuent de fonctionner, ceux qui le veulent peuvent tester .erreur)
async function chargerAvisVendeur(vendeurId,colonnes){
try{
const r=await Donnees.avis.deVendeur(vendeurId,colonnes);
if(!r.ok) throw new Error(r.status);
return await r.json();
}catch(e){
const vide=[];
vide.erreur=true;
return vide;
}
}

async function chargerMonAvis(s){
try{
const r=await Donnees.avis.monAvis(s,avisVendeurCourant);
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return {avis:lignes[0]||null};
}catch(e){return {erreur:true};}
}

// true = a une commande livrée chez ce vendeur, false = non, null = erreur réseau
async function commandeLivreeChez(s){
try{
const r=await Donnees.commandes.livreeChezVendeur(s,avisVendeurCourant);
if(!r.ok) throw new Error(r.status);
return (await r.json()).length>0;
}catch(e){return null;}
}

async function afficherBoutiqueFiche(userId){
avisVendeurCourant=userId||null;
const zone=document.querySelector('#fiche .boutique');
if(!zone) return;
if(!userId){zone.innerHTML=vueBoutiqueFicheMessage('Produit de démonstration');return;}
try{
const [r,lignes]=await Promise.all([
Donnees.boutiques.deVendeur(userId),
chargerAvisVendeur(userId,'note')
]);
// Si l'utilisateur a ouvert un autre produit entre-temps, on n'écrit rien
if(avisVendeurCourant!==userId) return;
if(!r.ok) throw new Error(r.status);
const b=(await r.json())[0];
if(!b){zone.innerHTML=vueBoutiqueFicheMessage('Boutique non ouverte');return;}
zone.innerHTML=vueBoutiqueFicheProduit({
nom:b.nom||'',
initiale:(b.nom||'N').charAt(0).toUpperCase(),
fond:fondImage(b.logo,'#F2B233'),
aLogo:!!urlSure(b.logo),
adresse:b.adresse||'Adresse non indiquée',
telephones:telephonesBoutique(b),
note:lignes.erreur?null:{etoiles:etoiles(moyenne(lignes)),texte:texteMoyenne(lignes)}
});
}catch(e){
if(avisVendeurCourant===userId) zone.innerHTML=vueBoutiqueFicheMessage('Boutique');
}
}

function creerPageAvis(){
let p=document.getElementById(PAGE_AVIS);
if(!p){
p=document.createElement('div');
p.id=PAGE_AVIS;
p.className='page';
document.body.appendChild(p);
}
return p;
}

async function voirAvis(){
if(!avisVendeurCourant){bandeau('Ce produit de démonstration ne peut pas recevoir d\'avis.');return;}
// Retour : vers "Mes achats" si on vient de là, sinon vers la fiche produit
const ach=document.getElementById('achats-detail');
const origine=(ach&&ach.style.display==='block')?'achats':'fiche';
const p=creerPageAvis();
p.innerHTML=vueAvis({origine:origine});
montrer(PAGE_AVIS);
p.style.display='block';
window.scrollTo(0,0);
await rafraichirAvis();
}

// Retour du bouton ← de la page Avis
function retourAvis(origine){
if(origine==='achats') afficherPageAchats(PAGE_ACHAT_DETAIL);
else montrer('fiche');
}

async function rafraichirAvis(){
const lignes=await chargerAvisVendeur(avisVendeurCourant);
const resume=document.getElementById('avis-resume');
const liste=document.getElementById('avis-liste');
if(!resume||!liste) return;
if(lignes.erreur){
resume.innerHTML='';
liste.innerHTML=vueAvisErreur();
document.getElementById('avis-moi').innerHTML='';
return;
}
resume.innerHTML=vueAvisResume({moyenne:texteMoyenne(lignes),etoiles:etoiles(moyenne(lignes)),resume:resumeTexte(lignes)});
liste.innerHTML=vueAvisListe({avis:lignes.map(a=>({auteur:a.auteur,etoiles:etoiles(a.note),commentaire:a.commentaire}))});
await afficherMonAvis();
}

let avisActuel=null;

async function afficherMonAvis(){
const zone=document.getElementById('avis-moi');
if(!zone) return;
const s=await sessionValide();
if(!s||!s.user_id){
zone.innerHTML=vueMonAvisConnexion();
return;
}
if(s.user_id===avisVendeurCourant){
zone.innerHTML=vueMonAvisTexte('Vous ne pouvez pas noter votre propre boutique.');
return;
}
const [moi,livre]=await Promise.all([chargerMonAvis(s),commandeLivreeChez(s)]);
if(moi.erreur||livre===null){
zone.innerHTML=vueMonAvisErreur();
return;
}
const mien=moi.avis;
if(mien){
zone.innerHTML=vueMonAvisExistant({etoiles:etoiles(mien.note),commentaire:mien.commentaire});
avisActuel=mien;
return;
}
if(!livre){
zone.innerHTML=vueMonAvisTexte('Vous pourrez donner votre avis après la livraison d\'une commande auprès de cette boutique.');
return;
}
zone.innerHTML=formulaireAvis(false);
}

function formulaireAvis(modif){
avisNoteChoisie=0;
return vueFormulaireAvis({modif:!!modif});
}

function choisirEtoile(n){
avisNoteChoisie=n;
document.querySelectorAll('#av-etoiles button').forEach(b=>{b.classList.toggle('on',Number(b.dataset.n)<=n);});
}

async function envoyerAvis(){
if(avisEnCours) return;
const msg=document.getElementById('av-msg');
msg.textContent='';
if(!avisNoteChoisie){msg.textContent='Touchez une étoile pour noter.';return;}
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const commentaire=document.getElementById('av-texte').value.trim();
if(commentaire.length>500){msg.textContent='Le commentaire est trop long (500 caractères maximum).';return;}
const bouton=document.querySelector('#avis-moi .btn');
const texteBouton=bouton?bouton.textContent:'';
avisEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Envoi en cours…';}
const fin=()=>{avisEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}};
try{
const r=await Donnees.avis.publier(s,{vendeur_id:avisVendeurCourant,acheteur_id:s.user_id,auteur:s.nom||'Client',note:avisNoteChoisie,commentaire:commentaire||null});
if(r.status===409){fin();msg.textContent='Vous avez déjà donné un avis.';return;}
if(r.status===401||r.status===403){fin();msg.textContent='Vous pourrez donner votre avis après la livraison d\'une commande auprès de cette boutique.';return;}
if(!r.ok) throw new Error(r.status);
}catch(e){
fin();
msg.textContent='Avis non enregistré. Vérifiez votre connexion et réessayez.';
return;
}
fin();
await rafraichirAvis();
afficherBoutiqueFiche(avisVendeurCourant);
}

// ---------- modifier ou supprimer son avis ----------
function modifierMonAvis(){
const zone=document.getElementById('avis-moi');
if(!zone||!avisActuel) return;
zone.innerHTML=formulaireAvis(true);
choisirEtoile(avisActuel.note);
document.getElementById('av-texte').value=avisActuel.commentaire||'';
}
async function enregistrerModifAvis(){
if(avisEnCours) return;
const msg=document.getElementById('av-msg');
msg.textContent='';
if(!avisNoteChoisie){msg.textContent='Touchez une étoile pour noter.';return;}
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const commentaire=document.getElementById('av-texte').value.trim();
if(commentaire.length>500){msg.textContent='Le commentaire est trop long (500 caractères maximum).';return;}
avisEnCours=true;
try{
const r=await Donnees.avis.modifier(s,avisVendeurCourant,avisNoteChoisie,commentaire);
if(!r.ok) throw new Error(r.status);
}catch(e){
avisEnCours=false;
msg.textContent='Avis non modifié. Vérifiez votre connexion et réessayez.';
return;
}
avisEnCours=false;
bandeau('Avis modifié');
await rafraichirAvis();
if(typeof afficherBoutiqueFiche==='function') afficherBoutiqueFiche(avisVendeurCourant);
}
async function supprimerMonAvis(){
if(!(await confirmer('Votre avis sera supprimé définitivement. Vous pourrez en publier un nouveau.',{titre:'Supprimer votre avis ?',ok:'Supprimer',danger:true}))) return;
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
try{
const r=await Donnees.avis.supprimer(s,avisVendeurCourant);
if(!r.ok) throw new Error(r.status);
}catch(e){
bandeau('Suppression impossible. Vérifiez votre connexion.','erreur');
return;
}
bandeau('Avis supprimé');
await rafraichirAvis();
if(typeof afficherBoutiqueFiche==='function') afficherBoutiqueFiche(avisVendeurCourant);
}
