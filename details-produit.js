// Détails du produit et publication : logique seulement.
// L'affichage (carte, menu de choix) : ecran-details-produit.js. Le style : style.css (.dp-…). Les clics : ecran-liaisons.js.
const CATEGORIES_PRODUIT=["Mode & accessoires","Téléphone & high-tech","Maison & décoration","Beauté & hygiène","Alimentation","Sport et loisir","Électroménager","Bébé & enfants","École & bureau","Auto & moto","Autres"];
const ETATS_PRODUIT=["Neuf","Comme neuf","Bon état","Occasion"];
const COULEURS_PRODUIT=[
{nom:"Multicolore",hex:"conic-gradient(#E53935,#FBC02D,#43A047,#1E88E5,#8E24AA,#E53935)"},
{nom:"Noir",hex:"#111111"},
{nom:"Blanc",hex:"#FFFFFF"},
{nom:"Bleu",hex:"#1565C0"},
{nom:"Rouge",hex:"#D32F2F"},
{nom:"Vert",hex:"#1E9E4A"},
{nom:"Jaune",hex:"#FBC02D"},
{nom:"Rose",hex:"#F48FB1"},
{nom:"Gris",hex:"#9E9E9E"},
{nom:"Marron",hex:"#6D4C41"},
{nom:"Beige",hex:"#D7C4A3"},
{nom:"Orange",hex:"#F57C00"},
{nom:"Violet",hex:"#7B1FA2"},
{nom:"Bleu marine",hex:"#14224A"},
{nom:"Bordeaux",hex:"#7B1E2B"},
{nom:"Turquoise",hex:"#14B8A6"},
{nom:"Doré",hex:"#D4AF37"},
{nom:"Argenté",hex:"#C0C0C0"},
{nom:"Bleu ciel",hex:"#7EC8F0"},
{nom:"Kaki",hex:"#7A7A3A"},
{nom:"Fuchsia",hex:"#D81B77"},
{nom:"Corail",hex:"#FF7F6B"},
{nom:"Crème",hex:"#F6EBCF"},
{nom:"Camel",hex:"#B98A4E"},
{nom:"Lavande",hex:"#B39DDB"},
{nom:"Vert clair",hex:"#8FD694"},
{nom:"Saumon",hex:"#F7A58B"},
{nom:"Transparent",hex:"#EEF5F7"}
];
const LARGEUR_LIBELLE=72;
const PRIX_MAX=100000000;
const PHOTO_MAX=390000;
let choixDetails={categorie:'',etat:''};
let couleursChoisies=[];
let publicationEnCours=false;

function creerChampsDetails(){
const bouton=document.getElementById('ajout-publier');
const desc=document.getElementById('desc');
if(!bouton||!desc||document.getElementById('dp-card')) return;
const lab=desc.previousElementSibling;
if(lab&&lab.tagName==='LABEL') lab.remove();
desc.placeholder='description et détails';

const carte=document.createElement('div');
carte.id='dp-card';
carte.innerHTML=vueCarteDetails(COULEURS_PRODUIT);
carte.appendChild(desc);
bouton.insertAdjacentElement('beforebegin',carte);
}
creerChampsDetails();

function creerPopover(){
if(document.getElementById('dp-fond')) return;
const fond=vueFondOption();
document.body.appendChild(fond);
}
creerPopover();

function rafraichirDetails(){
['categorie','etat'].forEach(n=>{
const val=document.getElementById('dp-val-'+n);
val.textContent=choixDetails[n]||'Choisir';
val.className='dp-valeur'+(choixDetails[n]?'':' dp-vide');
});
document.querySelectorAll('#dp-card .dp-sw').forEach(b=>b.classList.toggle('on',couleursChoisies.includes(b.dataset.c)));
}

function ouvrirOption(n,ev){
creerPopover();
const liste=n==='categorie'?CATEGORIES_PRODUIT:ETATS_PRODUIT;
const titre=n==='categorie'?'Catégorie':'État';
const ligne=document.getElementById('dp-row-'+n);
const r=ligne.getBoundingClientRect();
const x=ev&&ev.clientX?ev.clientX:r.left+r.width/2;
const y=ev&&ev.clientY?ev.clientY:r.top+r.height/2;
const box=document.getElementById('dp-pop');
box.innerHTML=vueListeOption(n,titre,liste,choixDetails[n]);
const colonneValeur=r.left+12+LARGEUR_LIBELLE;
const largeur=Math.max(180,Math.min(240,window.innerWidth-colonneValeur-12));
const gauche=Math.max(12,Math.min(colonneValeur,window.innerWidth-largeur-12));
const hauteur=Math.min(280,(liste.length+1)*44+8);
let haut=r.bottom+4;
if(haut+hauteur>window.innerHeight-12) haut=Math.max(12,r.top-hauteur-4);
box.style.width=largeur+'px';
box.style.left=gauche+'px';
box.style.top=haut+'px';
box.style.transformOrigin=(x-gauche)+'px '+(y-haut)+'px';
box.style.animation='dpPop .18s ease-out';
document.getElementById('dp-fond').style.display='block';
}

function fermerOption(){
const f=document.getElementById('dp-fond');
if(f) f.style.display='none';
}

function choisirOption(n,v){
choixDetails[n]=v;
fermerOption();
rafraichirDetails();
}

function basculerCouleur(btn){
const c=btn.dataset.c;
couleursChoisies=couleursChoisies.includes(c)?couleursChoisies.filter(x=>x!==c):couleursChoisies.concat([c]);
rafraichirDetails();
}

function reinitialiserDetails(){
choixDetails={categorie:'',etat:''};
couleursChoisies=[];
rafraichirDetails();
}

function remplirDetailsDepuis(p){
choixDetails={categorie:p.categorie||'',etat:p.etat||''};
couleursChoisies=p.couleurs?String(p.couleurs).split(',').map(x=>x.trim()).filter(Boolean):[];
rafraichirDetails();
}

const voirAjoutAvantDetails=voirAjout;
voirAjout=async function(origine){
await voirAjoutAvantDetails(origine);
reinitialiserDetails();
};

const modifierProduitAvantDetails=modifierProduit;
modifierProduit=async function(id){
await modifierProduitAvantDetails(id);
if(editId===id){
const p=distants.find(x=>x.id===id);
if(p) remplirDetailsDepuis(p);
}
};

async function lireErreurSupabase(r){
let texte='';
try{
texte=await r.text();
}catch(e){}
let detail='';
try{
const j=JSON.parse(texte);
detail=j.message||j.error_description||j.error||j.msg||'';
}catch(e){}
detail=String(detail||texte||'').slice(0,180);
return 'Erreur ' + r.status + (detail?' : ' + detail:'');
}

publier=async function(){
if(publicationEnCours) return;
publicationEnCours=true;
const bouton=document.getElementById('ajout-publier');
if(bouton){bouton.disabled=true;bouton.textContent='Envoi en cours…';}
try{
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour publier.');montrer('profil');return;}
if(boutiqueActuelle&&boutiqueActuelle.statut&&boutiqueActuelle.statut!=='validee'){bandeau(boutiqueActuelle.statut==='suspendue'?'Votre boutique est suspendue : vous ne pouvez pas publier.':'Votre boutique est en attente de validation.','erreur');return;}
const nom=document.getElementById('nom').value.trim();
const prixSaisi=String(document.getElementById('prix').value).replace(/\D/g,'');
const desc=document.getElementById('desc').value.trim();
if(!nom||!prixSaisi){bandeau('Indiquez au moins le nom et le prix.','erreur');return;}
const prix=Math.round(Number(prixSaisi));
if(!(prix>0)||prix>PRIX_MAX){bandeau('Le prix doit être un nombre entre 1 et '+PRIX_MAX.toLocaleString('fr-FR')+' FCFA.','erreur');return;}
if(nom.length>100){bandeau('Le nom est trop long (100 caractères maximum).','erreur');return;}
if(desc.length>2000){bandeau('La description est trop longue (2000 caractères maximum).','erreur');return;}
if(photosAjout.some(ph=>ph.blob&&ph.blob.size>PHOTO_MAX)){bandeau('Une photo est trop lourde. Choisissez-en une plus légère.','erreur');return;}
if(editId===null&&!photosAjout.length){bandeau('Ajoutez au moins une photo.','erreur');return;}
const corps={
nom:nom,
prix:prix.toLocaleString('fr-FR')+' FCFA',
description:desc||null,
categorie:choixDetails.categorie||'Autres',
etat:choixDetails.etat||null,
couleurs:couleursChoisies.length?couleursChoisies.join(', '):null
};
const modification=editId!==null;
if(!modification){
corps.photo=null;
corps.user_id=s.user_id;
}
try{
try{
await televerserNouvellesPhotos(s);
}catch(e){
await nettoyerTeleversees(s);
bandeau('Envoi des photos impossible. Vérifiez votre connexion ou réessayez avec d\'autres photos.','erreur');
return;
}
appliquerPhotosAuCorps(corps,modification);
const r=await Donnees.produits.enregistrer(s,editId,corps);
if(!r.ok){
const detail=await lireErreurSupabase(r);
await nettoyerTeleversees(s);
bandeau('Enregistrement impossible. ' + detail,'erreur');
return;
}
if(modification){
const lignes=await r.json();
if(!lignes.length){
await nettoyerTeleversees(s);
bandeau('Enregistrement impossible : produit non trouvé ou non autorisé.','erreur');
return;
}
}
}catch(e){
await nettoyerTeleversees(s);
bandeau('Enregistrement impossible. Vérifiez votre connexion et réessayez.','erreur');
return;
}
if(modification) await supprimerAnciennesPhotos(s);
editId=null;
await chargerProduits();
retourVers(origineAjout);
}finally{
publicationEnCours=false;
if(bouton){bouton.disabled=false;bouton.textContent=editId===null?'Publier':'Enregistrer les modifications';}
}
};
