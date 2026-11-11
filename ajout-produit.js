// Ajout d'un produit en 3 écrans : 1) photos (3 maximum)  2) nom  3) détails et prix.
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

// ---------- Construction des écrans ----------
const pageAjout=document.getElementById('ajout');
const champNom=document.getElementById('nom');
const champPrix=document.getElementById('prix');
const cartePrix=document.getElementById('dp-card');
const boutonPublier=document.getElementById('ajout-publier');
const champPhoto=document.getElementById('photo');
const grandApercu=document.getElementById('apercu');
champPhoto.multiple=true;

[...pageAjout.children].forEach(el=>{
if(el.tagName!=='HEADER'&&el!==champPhoto&&el!==grandApercu&&el!==champNom&&el!==champPrix&&el!==cartePrix&&el!==boutonPublier) el.remove();
});

function el(tag,classe,html){const e=document.createElement(tag);if(classe)e.className=classe;if(html!==undefined)e.innerHTML=html;return e;}

const indicateur=el('div','ep-etape');
const e1=el('div','etape');
e1.id='ep1';
const miniatures=el('div','ap-miniatures');
e1.appendChild(grandApercu);
e1.appendChild(miniatures);
e1.appendChild(el('div','ep-aide','Jusqu\'à '+PHOTOS_MAX+' photos. La première est la photo principale.'));

const e2=el('div','etape');
e2.id='ep2';
const photoNom=el('div','ep-grande');
const etiquetteNom=el('label','', 'Nom du produit');
e2.appendChild(photoNom);
e2.appendChild(etiquetteNom);
e2.appendChild(champNom);

const e3=el('div','etape');
e3.id='ep3';
const photoRecap=el('div','ep-grande');
const petitesRecap=el('div','ep-petites');
const nomRecap=el('div','ep-nom');
const titrePrix=el('label','','Prix (FCFA)');
e3.appendChild(photoRecap);
e3.appendChild(petitesRecap);
e3.appendChild(nomRecap);
e3.appendChild(cartePrix);
e3.appendChild(titrePrix);
e3.appendChild(champPrix);

const barre=el('div','ep-barre');
const bGauche=el('button','btn2');
bGauche.type='button';
const bSuivant=el('button','btn','Suivant');
bSuivant.type='button';
bSuivant.id='ajout-suivant';
barre.appendChild(bGauche);
barre.appendChild(bSuivant);
barre.appendChild(boutonPublier);

pageAjout.appendChild(indicateur);
pageAjout.appendChild(e1);
pageAjout.appendChild(e2);
pageAjout.appendChild(e3);
pageAjout.appendChild(barre);

// Prix : les points se mettent tout seuls (1.000.000)
champPrix.type='text';
champPrix.setAttribute('inputmode','numeric');
champPrix.setAttribute('autocomplete','off');
champPrix.placeholder='Ex. 25.000';
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
grandApercu.onclick=null;
}else{
grandApercu.textContent='+ Ajouter une photo';
grandApercu.style.background='';
grandApercu.style.borderStyle='';
grandApercu.onclick=()=>champPhoto.click();
}
miniatures.innerHTML='';
photosAjout.forEach((ph,i)=>{
const c=el('div','ap-case');
c.style.background=fondPhoto(ph);
const x=el('button','ap-x','×');
x.type='button';
x.setAttribute('aria-label','Retirer cette photo');
x.onclick=()=>{photosAjout.splice(i,1);dessinerPhotos();majBarre();};
c.appendChild(x);
miniatures.appendChild(c);
});
if(photosAjout.length&&photosAjout.length<PHOTOS_MAX){
const p=el('button','ap-case ap-plus','+');
p.type='button';
p.setAttribute('aria-label','Ajouter d\'autres photos');
p.onclick=()=>champPhoto.click();
miniatures.appendChild(p);
miniatures.appendChild(el('span','ap-legende','Ajouter d\'autres photos'));
}
// Écrans 2 et 3
photoNom.style.background=fondPhoto(premiere);
photoNom.style.display=premiere?'block':'none';
photoRecap.style.background=fondPhoto(premiere);
photoRecap.style.display=premiere?'block':'none';
petitesRecap.innerHTML='';
photosAjout.slice(1).forEach(ph=>{const c=el('div','ap-petite');c.style.background=fondPhoto(ph);petitesRecap.appendChild(c);});
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

bGauche.onclick=()=>{if(etapeAjout===1) retourVers(origineAjout);else allerEtape(etapeAjout-1);};
bSuivant.onclick=()=>{
if(etapeAjout===1){
if(!photosAjout.length&&editId===null){bandeau('Ajoutez au moins une photo.','erreur');return;}
allerEtape(2);
}else if(etapeAjout===2){
if(!champNom.value.trim()){bandeau('Écrivez le nom du produit.','erreur');return;}
allerEtape(3);
}
};
champNom.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();bSuivant.click();}});
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
const blob=await reduireImage(img,800,0.75);
const mini=await reduireImage(img,360,0.7);
if(!blob||!mini) throw new Error('image');
photosAjout.push({src:URL.createObjectURL(blob),blob:blob,mini:mini,existant:null,urlTeleversee:null});
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
photosAjout=urls.map(u=>({src:urlSure(u)||'',blob:null,mini:null,existant:u,urlTeleversee:null}));
champPrix.value=formaterPrixSaisie(String(p.prix).replace(/\D/g,''));
allerEtape(3);
};

// ---------- Plusieurs photos sur la fiche produit ----------
function dessinerPhotosFiche(p){
const grande=document.getElementById('fphoto');
if(!grande) return;
let zone=document.getElementById('fphotos');
if(!zone){zone=el('div','fphotos');zone.id='fphotos';grande.insertAdjacentElement('afterend',zone);}
const extras=extrasDe(p);
zone.innerHTML='';
if(!extras.length){zone.style.display='none';return;}
zone.style.display='flex';
[p.photo].concat(extras).filter(Boolean).forEach((u,i)=>{
const s=urlSure(u);
if(!s) return;
const b=el('button','fphoto-mini'+(i===0?' on':''));
b.type='button';
b.style.background="url('"+s+"') center/cover no-repeat";
b.onclick=()=>{
grande.style.background="url('"+s+"') center/cover no-repeat";
zone.querySelectorAll('.fphoto-mini').forEach(x=>x.classList.toggle('on',x===b));
};
zone.appendChild(b);
});
}

allerEtape(1);
