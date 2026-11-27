// Ajout d'un produit en 3 écrans : 1) photos (3 maximum)  2) nom  3) détails et prix.
// LOGIQUE SEULE : le HTML (écrans, petites photos) est dans ecran-ajout.js, les clics dans ecran-liaisons.js.
// On réutilise les champs existants (#nom, #prix, #dp-card) et la publication de details-produit.js.

const PHOTOS_MAX=3;
let photosAjout=[];          // [{src, blob, mini, existant, urlTeleversee}]
let etapeAjout=1;
let anciennesPhotos=[];      // photos déjà publiées du produit qu'on modifie
let produitAvaitExtras=false;

// ---------- Fonctions utilisées par la publication ----------
async function televerserNouvellesPhotos(s){
for(const ph of photosAjout){
if(ph.blob&&!ph.urlTeleversee) ph.urlTeleversee=await televerserPhoto(ph.blob,ph.mini,s);
}
}
function urlsFinales(){return photosAjout.map(ph=>ph.urlTeleversee||ph.existant).filter(Boolean);}
function appliquerPhotosAuCorps(corps,modification){
const urls=urlsFinales();
if(urls.length) corps.photo=urls[0];
const extras=urls.slice(1);
// La colonne « photos » n'est envoyée que s'il y a des photos supplémentaires (ou s'il y en avait avant)
if(extras.length||(modification&&produitAvaitExtras)) corps.photos=JSON.stringify(extras);
}
async function nettoyerTeleversees(s){
for(const ph of photosAjout){
if(ph.urlTeleversee){await supprimerPhotoStockee(ph.urlTeleversee,s);ph.urlTeleversee=null;}
}
}
async function supprimerAnciennesPhotos(s){
const garde=new Set(urlsFinales());
for(const u of anciennesPhotos){if(!garde.has(u)) await supprimerPhotoStockee(u,s);}
}
function extrasDe(p){
try{const a=JSON.parse((p&&p.photos)||'[]');return Array.isArray(a)?a.filter(u=>typeof u==='string').slice(0,PHOTOS_MAX-1):[];}catch(e){return [];}
}

// ---------- Éléments de l'écran (le HTML est dans ecran-ajout.js) ----------
const pageAjout=document.getElementById('ajout');
const champNom=document.getElementById('nom');
const champPrix=document.getElementById('prix');
const boutonPublier=document.getElementById('ajout-publier');
const champPhoto=document.getElementById('photo');
const grandApercu=document.getElementById('apercu');
const indicateur=document.getElementById('ep-etape');
const e1=document.getElementById('ep1');
const e2=document.getElementById('ep2');
const e3=document.getElementById('ep3');
const miniatures=document.getElementById('ap-mini1');
const photoNom=document.getElementById('ap-photo-nom');
const miniNom=document.getElementById('ap-mini-nom');
const photoRecap=document.getElementById('ep-photo-recap');
const petitesRecap=document.getElementById('ep-petites');
const nomRecap=document.getElementById('ep-nom');
const titrePrix=document.getElementById('ep-titre-prix');
const bGauche=document.getElementById('ep-gauche');
const bSuivant=document.getElementById('ajout-suivant');
// La carte des détails est créée par details-produit.js : on la met devant « Prix »
const cartePrix=document.getElementById('dp-card');
if(cartePrix) titrePrix.insertAdjacentElement('beforebegin',cartePrix);
document.getElementById('ep-aide').textContent='Jusqu\'à '+PHOTOS_MAX+' photos. La première est la photo principale.';

// Prix : les points se mettent tout seuls (1.000.000)
function formaterPrixSaisie(v){
const chiffres=String(v||'').replace(/\D/g,'').replace(/^0+(?=\d)/,'').slice(0,9);
return chiffres.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}
champPrix.addEventListener('input',()=>{champPrix.value=formaterPrixSaisie(champPrix.value);});

// ---------- Affichage ----------
function fondPhoto(ph){
const u=ph&&(ph.src||'');
return u?"url('"+u+"') center/cover no-repeat":'';
}

function dessinerPhotos(){
// Écran 1 : grand bouton tant qu'il n'y a pas de photo, puis la photo principale et les petites cases
const premiere=photosAjout[0];
if(premiere){
grandApercu.textContent='';
grandApercu.style.background=fondPhoto(premiere);
grandApercu.style.borderStyle='solid';
grandApercu.removeAttribute('data-action');   // la grande photo ne rouvre plus le sélecteur
}else{
grandApercu.textContent='+ Ajouter une photo';
grandApercu.style.background='';
grandApercu.style.borderStyle='';
grandApercu.setAttribute('data-action','ouvrir');
}
const fonds=photosAjout.map(ph=>ph.src||'');
miniatures.innerHTML=vueMiniaturesAjout(fonds,photosAjout.length>0&&photosAjout.length<PHOTOS_MAX);
// Les grandes photos gardent le format de la première photo
[grandApercu,photoNom,photoRecap].forEach(e=>{
if(premiere&&premiere.ratio) e.style.setProperty('--ratio',String(premiere.ratio));
else e.style.removeProperty('--ratio');
});
// Écrans 2 et 3
photoNom.style.background=fondPhoto(premiere);
photoNom.style.borderStyle='solid';
photoNom.style.display=premiere?'flex':'none';
miniNom.innerHTML=vueMiniaturesNom(fonds);
miniNom.style.display=photosAjout.length>1?'flex':'none';
photoRecap.style.background=fondPhoto(premiere);
photoRecap.style.display=premiere?'block':'none';
petitesRecap.innerHTML=vuePetitesRecap(fonds.slice(1));
petitesRecap.style.display=photosAjout.length>1?'flex':'none';
}

function majBarre(){
const e=etapeAjout;
indicateur.textContent='Étape '+e+' sur 3';
[e1,e2,e3].forEach((x,i)=>x.classList.toggle('on',i+1===e));
bGauche.textContent=e===1?'Annuler':'Retour';
bSuivant.style.display=e<3?'block':'none';
boutonPublier.style.display=e===3?'block':'none';
nomRecap.textContent=champNom.value.trim();
}

function allerEtape(n){
etapeAjout=n;
dessinerPhotos();
majBarre();
window.scrollTo(0,0);
if(n===2) setTimeout(()=>{try{champNom.focus();}catch(e){}},150);
}

function ajoutGauche(){if(etapeAjout===1) retourVers(origineAjout);else allerEtape(etapeAjout-1);}
function ajoutSuivant(){
if(etapeAjout===1){
if(!photosAjout.length&&editId===null){bandeau('Ajoutez au moins une photo.','erreur');return;}
allerEtape(2);
}else if(etapeAjout===2){
if(!champNom.value.trim()){bandeau('Écrivez le nom du produit.','erreur');return;}
allerEtape(3);
}
}
function ajoutRetirer(i){
photosAjout.splice(Number(i),1);
dessinerPhotos();
majBarre();
}
champNom.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();ajoutSuivant();}});
retourAjout=function(){if(etapeAjout>1) allerEtape(etapeAjout-1);else retourVers(origineAjout);};

// ---------- Choix des photos (plusieurs à la fois possible) ----------
choisirPhoto=async function(ev){
const fichiers=[...ev.target.files];
ev.target.value='';
for(const f of fichiers){
if(photosAjout.length>=PHOTOS_MAX){bandeau('Vous pouvez ajouter '+PHOTOS_MAX+' photos au maximum.');break;}
if(!f.type.startsWith('image/')){bandeau('Choisissez une photo (image).','erreur');continue;}
try{
const img=await chargerImageDepuis(f);
const source=recadrerLimites(img);   // format d'origine, limité à 2:3 / 3:2
const blob=await reduireImage(source,800,0.75);
const mini=await reduireImage(source,360,0.7);
if(!blob||!mini) throw new Error('image');
photosAjout.push({src:URL.createObjectURL(blob),blob:blob,mini:mini,existant:null,urlTeleversee:null,ratio:limiterRatio(source.width/source.height)});
}catch(err){
bandeau('Cette photo ne peut pas être lue. Essayez-en une autre.','erreur');
}
}
dessinerPhotos();
majBarre();
};

// ---------- Ouverture : nouveau produit / modification ----------
function libererPhotos(){
photosAjout.forEach(ph=>{if(ph.blob&&ph.src) try{URL.revokeObjectURL(ph.src);}catch(e){}});
photosAjout=[];
}

const voirAjoutAvantEtapes=voirAjout;
voirAjout=async function(origine){
await voirAjoutAvantEtapes(origine);
libererPhotos();
anciennesPhotos=[];
produitAvaitExtras=false;
champPrix.value='';
allerEtape(1);
};

const modifierProduitAvantEtapes=modifierProduit;
modifierProduit=async function(id){
await modifierProduitAvantEtapes(id);
if(editId!==id) return;
const p=distants.find(x=>x.id===id);
if(!p) return;
libererPhotos();
const extras=extrasDe(p);
const urls=[p.photo].concat(extras).filter(Boolean);
anciennesPhotos=urls.slice();
produitAvaitExtras=extras.length>0;
photosAjout=urls.map(u=>({src:urlSure(u)||'',blob:null,mini:null,existant:u,urlTeleversee:null,ratio:ratiosPhotos.get(u)||null}));
photosAjout.forEach(it=>{if(!it.ratio&&it.src) mesurerRatioPhoto(it.existant).then(r=>{if(r){it.ratio=r;dessinerPhotos();}});});
champPrix.value=formaterPrixSaisie(String(p.prix).replace(/\D/g,''));
allerEtape(3);
};

// ---------- Plusieurs photos sur la fiche produit ----------
function appliquerRatioFiche(url){
const g=document.getElementById('fphoto');
if(!g) return;
g.setAttribute('data-url',url||'');
const connu=url&&ratiosPhotos.get(url);
if(connu){g.style.setProperty('--ratio',String(connu));return;}
g.style.removeProperty('--ratio');
if(url) mesurerRatioPhoto(url).then(r=>{if(r&&g.getAttribute('data-url')===url) g.style.setProperty('--ratio',String(r));});
}
function dessinerPhotosFiche(p){
const grande=document.getElementById('fphoto');
if(!grande) return;
appliquerRatioFiche(urlSure(p.photo)||'');
let zone=document.getElementById('fphotos');
if(!zone){grande.insertAdjacentHTML('afterend',vueZonePhotosFiche());zone=document.getElementById('fphotos');}
const extras=extrasDe(p);
zone.innerHTML='';
if(!extras.length){zone.style.display='none';return;}
zone.style.display='flex';
zone.innerHTML=[p.photo].concat(extras).filter(Boolean).map(urlSure).filter(Boolean).map((u,i)=>vueMiniFiche(u,i===0)).join('');
}
// Clic sur une petite photo de la fiche : elle devient la grande
function choisirPhotoFiche(src,bouton){
const grande=document.getElementById('fphoto');
if(!grande||!src) return;
grande.style.background=fondPhotoAjout(src);
appliquerRatioFiche(src);
document.querySelectorAll('#fphotos .fphoto-mini').forEach(x=>x.classList.toggle('on',x===bouton));
}

allerEtape(1);

// Pendant la saisie (clavier ouvert), la barre du bas disparaît pour ne rien cacher ; elle revient ensuite.
// Si le clavier se ferme tout seul (par exemple avec le bouton retour du téléphone) alors que le curseur reste dans la case,
// on le détecte avec la hauteur visible de l'écran : la barre revient et le curseur disparaît.
const vv=window.visualViewport||null;
let hautMax=vv?Math.max(vv.height,window.innerHeight):window.innerHeight;
let clavierOuvert=false;
function champEnSaisie(){
const a=document.activeElement;
return !!(a&&pageAjout.contains(a)&&a.matches&&a.matches('input,textarea'));
}
function surveillerClavier(){
if(!vv) return;
if(vv.height>hautMax) hautMax=vv.height;
const ouvert=vv.height<hautMax-120;
if(ouvert&&!clavierOuvert){
clavierOuvert=true;
if(champEnSaisie()) pageAjout.classList.add('clavier');
}else if(!ouvert&&clavierOuvert){
clavierOuvert=false;
pageAjout.classList.remove('clavier');
if(champEnSaisie()){try{document.activeElement.blur();}catch(e){}}
}
}
if(vv){
vv.addEventListener('resize',surveillerClavier);
window.addEventListener('orientationchange',()=>{hautMax=0;clavierOuvert=false;setTimeout(()=>{hautMax=vv.height;},400);});
}
pageAjout.addEventListener('focusin',ev=>{
const t=ev.target;
if(!t.matches||!t.matches('input,textarea')) return;
pageAjout.classList.add('clavier');
setTimeout(()=>{try{t.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){}},320);
});
pageAjout.addEventListener('focusout',()=>{
setTimeout(()=>{
if(!champEnSaisie()) pageAjout.classList.remove('clavier');
},150);
});
// Si l'écran change d'étape, la barre revient toujours
const allerEtapeAvantClavier=allerEtape;
allerEtape=function(n){pageAjout.classList.remove('clavier');allerEtapeAvantClavier(n);};
