let boutiqueActuelle=null;
let logoBoutique="";
let logoBlob=null;
let logoApercuUrl=null;
let commandesCache=[];
let messagesCache=[];
let origineDetail='boutique';
let boutiqueEnCours=false;

const LOGO_MAX=290000;
const PAGES_BOUTIQUE=['commandes-page','messages-page','detail-vente'];

const montrerAvantBoutique=montrer;
montrer=function(vue){
PAGES_BOUTIQUE.forEach(id=>{const el=document.getElementById(id);if(el&&id!==vue) el.style.display='none';});
montrerAvantBoutique(vue);
};

function creerPage(id){
let p=document.getElementById(id);
if(!p){
p=document.createElement('div');
p.id=id;
p.className='page';
document.body.appendChild(p);
}
return p;
}

function afficherPage(id){
montrer(id);
const el=document.getElementById(id);
if(el) el.style.display='block';
window.scrollTo(0,0);
}

function telephonesBoutique(b){
return [b.telephone,b.telephone2].filter(Boolean).map(t=>esc(formaterTelephone(t))).join(' · ');
}

function lienWhatsapp(tel){
const num=String(tel||'').replace(/\D/g,'');
if(!num) return '#';
const intl=num.length===9?'221'+num:num;
return 'https://wa.me/'+intl;
}

function ajouterChampTel2(){
const tel=document.getElementById('bt-tel');
if(!tel||document.getElementById('bt-tel2')) return;
const bloc=document.createElement('div');
bloc.innerHTML=vueChampTel2();
(tel.closest('.champ-tel')||tel).insertAdjacentElement('afterend',bloc);
}
ajouterChampTel2();

function construireBoutique(){
document.getElementById('boutique').innerHTML=vueBoutique();
}

// Distingue "pas de boutique" d'une "erreur réseau" pour ne jamais proposer d'en recréer une qui existe déjà
async function chargerMaBoutique(s){
try{
const r=await Donnees.boutiques.mienne(s);
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return {boutique:lignes[0]||null};
}catch(e){return {erreur:true};}
}

function afficherBoutiqueEtat(connecte,erreur){
const zone=document.getElementById('infos-boutique');
const actions=document.getElementById('boutique-actions');
const bouton=document.getElementById('bt-action');
const b=boutiqueActuelle;
if(!connecte){
bouton.style.display='none';
zone.innerHTML=vueBoutiqueMessage('Connectez-vous dans Profil pour gérer votre boutique.');
actions.innerHTML='';
return;
}
if(erreur){
bouton.style.display='none';
zone.innerHTML=vueBoutiqueMessage('Impossible de charger votre boutique. Vérifiez votre connexion.');
actions.innerHTML=vueBoutiqueBouton('Réessayer','boutique');
return;
}
if(!b){
bouton.style.display='none';
zone.innerHTML=vueBoutiqueMessage('Vous n\'avez pas encore de boutique.');
actions.innerHTML=vueBoutiqueBouton('Ouvrir ma boutique','modifierBoutique');
return;
}
bouton.style.display='';
zone.innerHTML=vueBoutiqueFiche({fond:fondImage(b.logo,'#F2B233'),initiale:urlSure(b.logo)?'':'N',nom:b.nom,telephones:telephonesBoutique(b),adresse:b.adresse||'Adresse non indiquée',description:b.description||'Pas de description.'});
if(b.statut==='en_attente'){
zone.insertAdjacentHTML('beforeend',vueBoutiqueNonValidee());
chargerNumeroVerification();
}else if(b.statut==='validee'&&b.telephone_verifie){
zone.insertAdjacentHTML('beforeend',vueBoutiqueVerifiee());
}
if(b.statut&&b.statut!=='validee'&&b.statut!=='en_attente'){
zone.insertAdjacentHTML('beforeend',vueBoutiqueBloquee(b.statut==='suspendue'));
}
afficherNotifsBoutique(b);
actions.innerHTML=vueBoutiqueTuiles();
}

async function voirBoutique(){
construireBoutique();
montrer('boutique');
const s=await sessionValide();
const connecte=!!(s&&s.user_id);
let erreur=false;
boutiqueActuelle=null;
if(connecte){
const res=await chargerMaBoutique(s);
if(res.erreur) erreur=true; else boutiqueActuelle=res.boutique;
}
afficherBoutiqueEtat(connecte,erreur);
}

function ouvrirDetail(origine,titre,lignes,actions){
origineDetail=origine;
const p=creerPage('detail-vente');
p.innerHTML=vueDetailVente(origine,titre,lignes,actions);
afficherPage('detail-vente');
}

async function voirCommandes(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil.');montrer('profil');return;}
const p=creerPage('commandes-page');
p.innerHTML=vueCommandesPage();
afficherPage('commandes-page');
try{
const r=await Donnees.commandes.deVendeur(s);
if(!r.ok) throw new Error(r.status);
commandesCache=await r.json();
document.getElementById('liste-commandes').innerHTML=vueCommandesListe(commandesCache.map(c=>{
const st=c.statut||'À préparer';
return {produit:c.produit,quantite:c.quantite,client:c.nom_client,total:c.total?' · '+Number(c.total).toLocaleString('fr-FR')+' FCFA':'',statut:st,couleur:couleurStatut(st)};
}));
}catch(e){document.getElementById('liste-commandes').textContent='Erreur de chargement. Vérifiez votre connexion.';}
}

// voirCommandeDetail() est définie dans statut.js (détail + changement de statut).

// voirMessages() est définie dans messages.js (conversations).

async function ouvrirFormBoutique(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous d\'abord dans Profil.');montrer('profil');return;}
const b=boutiqueActuelle||{};
logoBoutique=b.logo||"";
logoBlob=null;
const champNom=document.getElementById('bt-nom');
const suggestion=nomComplet();
champNom.placeholder=suggestion?'Chez '+suggestion:'Nom de la boutique';
champNom.value=b.nom||"";
document.getElementById('bt-tel').value=formaterTelephone(b.telephone);
document.getElementById('bt-tel2').value=formaterTelephone(b.telephone2);
document.getElementById('bt-adresse').value=b.adresse||"";
document.getElementById('bt-desc').value=b.description||"";
document.getElementById('bt-msg').textContent="";
apercuLogo(logoBoutique);
montrer('boutique-form');
}

function apercuLogo(src){
const el=document.getElementById('bt-logo');
const sur=urlSure(src)||urlLocale(src);
if(sur){el.textContent='';el.style.background='url('+sur+') center/cover no-repeat';}
else{el.textContent='+ Logo';el.style.background='#fff';}
}

async function choisirLogo(e){
const f=e.target.files[0];
e.target.value='';
if(!f) return;
if(!f.type.startsWith('image/')){bandeau('Choisissez une image pour le logo.','erreur');return;}
try{
const img=await chargerImageDepuis(f);
logoBlob=await reduireImage(img,300,0.75);
if(!logoBlob) throw new Error('image');
}catch(err){
logoBlob=null;
bandeau('Ce logo ne peut pas être lu. Essayez une autre image.','erreur');
return;
}
if(logoApercuUrl) URL.revokeObjectURL(logoApercuUrl);
logoApercuUrl=URL.createObjectURL(logoBlob);
apercuLogo(logoApercuUrl);
}

async function enregistrerBoutique(){
if(boutiqueEnCours) return;
const msg=document.getElementById('bt-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){msg.textContent='Connectez-vous dans Profil avant d\'enregistrer.';return;}
const saisi=document.getElementById('bt-nom').value.trim();
const suggestion=nomComplet();
const nom=saisi||(!boutiqueActuelle&&suggestion?'Chez '+suggestion:'');
const tel=formaterTelephone(document.getElementById('bt-tel').value);
const tel2=formaterTelephone(document.getElementById('bt-tel2').value);
const adresse=document.getElementById('bt-adresse').value.trim();
const description=document.getElementById('bt-desc').value.trim();
if(!nom||!tel){msg.textContent='Indiquez le nom et le téléphone.';return;}
if(nom.length>100){msg.textContent='Le nom de la boutique est trop long (100 caractères maximum).';return;}
if(!telephoneValide(tel)){msg.textContent=MESSAGE_TEL;return;}
if(tel2&&!telephoneValide(tel2)){msg.textContent='Autre numéro : '+MESSAGE_TEL;return;}
if(adresse.length>200){msg.textContent='L\'adresse est trop longue (200 caractères maximum).';return;}
if(description.length>1000){msg.textContent='La description est trop longue (1000 caractères maximum).';return;}
if(logoBlob&&logoBlob.size>LOGO_MAX){msg.textContent='Ce logo est trop lourd. Choisissez-en un plus léger.';return;}
const corps={
nom:nom,
telephone:tel,
telephone2:tel2||null,
adresse:adresse||null,
description:description||null,
logo:logoBoutique||null
};
const modification=!!boutiqueActuelle;
if(!modification) corps.user_id=s.user_id;
const bouton=document.querySelector('#boutique-form .btn');
const texteBouton=bouton?bouton.textContent:'';
boutiqueEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Enregistrement…';}
const fin=()=>{boutiqueEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}};
let nouveauLogo=null;
try{
// Le logo part d'abord dans Supabase Storage ; la base ne garde que son adresse
if(logoBlob){
nouveauLogo=await televerserPhoto(logoBlob,null,s);
corps.logo=nouveauLogo;
}
let r;
if(modification){
r=await Donnees.boutiques.modifier(s,boutiqueActuelle.id,corps);
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
// Supabase répond "OK" même si la règle de sécurité bloque : on vérifie qu'une ligne a bien été modifiée
if(!lignes.length) throw new Error('refusé');
}else{
r=await Donnees.boutiques.creer(s,corps);
if(r.status===409){
// Une boutique existe déjà pour ce compte : on la recharge au lieu d'en créer une 2e
if(nouveauLogo) await supprimerPhotoStockee(nouveauLogo,s);
fin();
await voirBoutique();
return;
}
if(!r.ok) throw new Error(r.status);
}
}catch(e){
if(nouveauLogo) await supprimerPhotoStockee(nouveauLogo,s);
fin();
msg.textContent='Erreur, enregistrement impossible. Vérifiez votre connexion et réessayez.';
return;
}
// Logo remplacé : l'ancien est supprimé de Storage
if(modification&&nouveauLogo&&boutiqueActuelle&&boutiqueActuelle.logo) await supprimerPhotoStockee(boutiqueActuelle.logo,s);
fin();
await voirBoutique();
}

// afficherBoutiqueFiche() est définie dans avis.js (boutique + note sur la fiche produit).

// ---------- validation du numéro par WhatsApp ----------
let numeroVerification=null;   // numéro WhatsApp de NioHub (réglé dans l'application d'administration)
async function chargerNumeroVerification(){
try{
const r=await Donnees.reglages.whatsappVerification();
if(!r.ok) return;
const l=await r.json();
numeroVerification=(l[0]&&String(l[0].valeur||'').replace(/\D/g,''))||'';
}catch(e){}
}
function messageVerification(b){
const s=(typeof lireSession==='function'?lireSession():null)||{};
const tels=[b.telephone,b.telephone2].filter(Boolean).map(t=>formaterTelephone(t)).join(' / ');
const lignes=[
'Bonjour NioHub, je souhaite valider mon numéro de téléphone et ma boutique.',
'',
'BOUTIQUE',
'Nom : '+(b.nom||'—'),
'Adresse : '+(b.adresse||'—'),
'Téléphone : '+(tels||'—'),
'',
'PROFIL',
'Nom : '+(s.nom||'—'),
'Téléphone : '+(s.telephone?formaterTelephone(s.telephone):'—'),
'E-mail : '+(s.email||'—'),
'Identifiant : '+String(s.user_id||b.user_id||'').slice(0,8)
];
return lignes.join('\n');
}
async function validerMonNumero(){
const b=boutiqueActuelle;
if(!b){bandeau('Boutique introuvable. Réessayez.','erreur');return;}
if(numeroVerification===null) await chargerNumeroVerification();
if(!numeroVerification){bandeau('Le numéro de vérification n\'est pas encore configuré. Réessayez plus tard.','erreur');return;}
const num=numeroVerification.length===9?'221'+numeroVerification:numeroVerification;
const url='https://wa.me/'+num+'?text='+encodeURIComponent(messageVerification(b));
const w=window.open(url,'_blank','noopener');
if(!w) window.location.href=url;
}

// ---------- résumé des messages de NioHub concernant la boutique ----------
// Suspension / remise en attente : le résumé reste tant que le statut est le même.
// Autres messages (produit supprimé, boutique validée…) : ils disparaissent 24 h après avoir été lus.
const TYPES_BOUTIQUE_TEMPORAIRES=['produit_supprime','boutique_validee','numero_valide','boutique_supprimee'];
function notifsPourBoutique(liste,b){
const maintenant=Date.now();
const sortie=[];
let aSuspension=false,aAttente=false;
liste.forEach(m=>{
if(m.type==='boutique_suspendue'){
if(b.statut==='suspendue'&&!aSuspension){aSuspension=true;sortie.push(m);}
}else if(m.type==='boutique_en_attente'){
if(b.statut==='en_attente'&&!aAttente){aAttente=true;sortie.push(m);}
}else if(TYPES_BOUTIQUE_TEMPORAIRES.includes(m.type)){
const luDepuis=m.lu&&m.lu_le?maintenant-Date.parse(m.lu_le):0;
if(!m.lu||luDepuis<86400000) sortie.push(m);
}
});
return sortie.slice(0,3);
}
async function afficherNotifsBoutique(b){
const zone=document.getElementById('boutique-zone')||document.getElementById('boutique-actions');
if(!zone) return;
let cadre=document.getElementById('boutique-notifs');
if(!cadre){
cadre=document.createElement('div');
cadre.id='boutique-notifs';
(document.getElementById('boutique-actions')||zone).insertAdjacentElement('beforebegin',cadre);
}
cadre.replaceChildren();
try{
const s=await sessionValide();
if(!s||!s.user_id) return;
const r=await Donnees.notifications.liste(s,30);
if(!r.ok) return;
const liste=notifsPourBoutique(await r.json(),b);
cadre.innerHTML=vueNotifsBoutique(liste.map(m=>{
const texte=String(m.texte||'').replace(/\s+/g,' ').trim();
return {id:m.id,lu:!!m.lu,titre:m.titre||'Message de NioHub',resume:texte.length>110?texte.slice(0,109)+'…':texte};
}));
}catch(e){}
}
