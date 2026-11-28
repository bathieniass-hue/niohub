const VUES=['accueil','fiche','commande','ajout','mesproduits','boutique','boutique-form','profil','vitrine'];
const VUES_MENU={accueil:0,boutique:1,'boutique-form':1,profil:2};

const cats=[["Mode","#F2D9A3"],["Tech","#BFD8E3"],["Maison","#E3C4B3"],["Beauté","#C8DDBE"]];
document.getElementById('cats').innerHTML=vueCategories(cats.map(([n,c])=>({nom:n,fond:c})));

const defauts=[
{nom:"Boubou brodé",prix:"25 000 FCFA",couleur:"#D9B26F",desc:"Bazin riche, broderie faite main. Tailles M à XXL."},
{nom:"Sac en cuir",prix:"18 000 FCFA",couleur:"#C98B6B",desc:"Sac en cuir véritable, fait à la main."},
{nom:"Écouteurs",prix:"12 500 FCFA",couleur:"#8FB7C9",desc:"Écouteurs sans fil avec boîtier de charge."},
{nom:"Huile de baobab",prix:"4 500 FCFA",couleur:"#A8C59A",desc:"Huile de baobab naturelle, 100 ml."}
];
let distants=[];
let boutiquesCache=[];
let suggestionsEnCours=[];
let photoBlob=null;
let photoMiniBlob=null;
let photoExistante="";
let apercuUrl=null;
let editId=null;
let origineAjout='accueil';
let chargementEchoue=false;
let chargementEnCours=true;
let chargementLent=false;
const PRODUITS_HORS_LIGNE=12;

// ---------- Ordre de chargement : l'accueil d'abord, le reste ensuite ----------
let accueilPret=false;
const fileApresAccueil=[];
function apresAccueil(fn,delai){
const lancer=()=>setTimeout(()=>{try{fn();}catch(e){}},delai||0);
if(accueilPret) lancer(); else fileApresAccueil.push(lancer);
}
function accueilEstPret(){
if(accueilPret) return;
accueilPret=true;
fileApresAccueil.splice(0).forEach(f=>f());
}
setTimeout(accueilEstPret,6000); // sécurité : même si l'accueil tarde, le reste démarre

// ---------- Produits : première page, puis la suite en arrière-plan ----------
const TAILLE_PREMIERE_PAGE=20;
const TAILLE_LOT=100;
const PLAFOND_CHARGEMENT=500;
let finCatalogue=false;
let lotEnCours=false;
let promesseSuite=null;
let premierePageFraiche=[];
let derniereSynchro=0;
// ---------- Affichage progressif : 2 par 2, jusqu'à 20, puis 20 de plus quand on défile ----------
let nbAffiches=2;
let plafondAffichage=20;
let listeCourante=null;
let minuteurRevelation=null;
let derniereCleFiltre='';
let rechercheServeurFaite='';
let minuteurRechercheServeur=null;
let categorieActive='';
let rechercheActive=false; // vrai tant que l'écran Recherche est ouvert (voir recherche.js)
let rechercheValidee=false; // faux tant qu'on tape (suggestions seulement), vrai une fois la recherche lancée (produits affichés)
let notesVendeurs={};
let signatureCatalogue='';
let vueCourante='accueil';
let origineFiche=null;
try{history.scrollRestoration='manual';}catch(e){}
let restaurationScroll=false;
const CLE_CATALOGUE='niohub_catalogue_v1';

function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tous(){return (AFFICHER_DEMO?defauts:[]).concat(distants);}

// Accepte uniquement une image en base64 ou un fichier de notre Supabase Storage.
function urlSure(u){
const t=String(u||'');
if(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(t)) return t;
if(t.startsWith(SUPABASE_URL+'/storage/v1/object/public/')&&/^https:\/\/[A-Za-z0-9.\-]+\/storage\/v1\/object\/public\/[A-Za-z0-9_\-\/.]+$/.test(t)) return t;
return '';
}
function fondImage(u,defaut){
const s=urlSure(u);
return s?'url('+s+') center/cover no-repeat':defaut;
}
function fond(p){return fondImage(p.photo,p.couleur);}


function urlLocale(u){
const t=String(u||'');
return /^blob:[A-Za-z0-9:\/.\-]+$/.test(t)?t:'';
}

function urlMiniature(u){
const t=String(u||'');
return t.startsWith(PREFIXE_PHOTOS)&&t.endsWith('.jpg')&&!t.endsWith('_m.jpg')?t.replace(/\.jpg$/,'_m.jpg'):t;
}
function fondMini(p){return fondImage(urlMiniature(p.photo),p.couleur);}

function chargerImageDepuis(fichier){
return new Promise((ok,ko)=>{
const adresse=URL.createObjectURL(fichier);
const img=new Image();
img.onload=()=>{URL.revokeObjectURL(adresse);ok(img);};
img.onerror=()=>{URL.revokeObjectURL(adresse);ko(new Error('lecture'));};
img.src=adresse;
});
}

function reduireImage(img,largeurMax,qualite){
const echelle=Math.min(1,largeurMax/img.width);
const c=document.createElement('canvas');
c.width=Math.max(1,Math.round(img.width*echelle));
c.height=Math.max(1,Math.round(img.height*echelle));
c.getContext('2d').drawImage(img,0,0,c.width,c.height);
return new Promise(ok=>c.toBlob(ok,'image/jpeg',qualite));
}

// Les photos gardent leur format d'origine, mais jamais plus étroites que 2:3 ni plus larges que 3:2 :
// 1:1 et 5:4 ne sont pas coupées, 1:2 est recadrée en 2:3.
const RATIO_MIN=2/3;
const RATIO_MAX=3/2;
function limiterRatio(r){return Math.min(RATIO_MAX,Math.max(RATIO_MIN,r));}
function recadrerLimites(img){
const r=img.width/img.height;
if(r>=RATIO_MIN-0.001&&r<=RATIO_MAX+0.001) return img;
let sx=0,sy=0,sw=img.width,sh=img.height;
if(r<RATIO_MIN){sh=Math.round(img.width/RATIO_MIN);sy=Math.round((img.height-sh)/2);}   // trop haute : on coupe en haut et en bas
else{sw=Math.round(img.height*RATIO_MAX);sx=Math.round((img.width-sw)/2);}               // trop large : on coupe à gauche et à droite
const c=document.createElement('canvas');
c.width=sw;c.height=sh;
c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
return c;
}
// Format (largeur/hauteur) d'une photo déjà publiée, gardé en mémoire
const ratiosPhotos=new Map();
function mesurerRatioPhoto(url){
return new Promise(res=>{
if(!url) return res(null);
if(ratiosPhotos.has(url)) return res(ratiosPhotos.get(url));
const i=new Image();
i.onload=()=>{
const r=(i.naturalWidth&&i.naturalHeight)?limiterRatio(i.naturalWidth/i.naturalHeight):null;
if(r) ratiosPhotos.set(url,r);
res(r);
};
i.onerror=()=>res(null);
i.src=url;
});
}

async function televerserFichier(chemin,blob,s){
const r=await Donnees.photos.envoyer(s,chemin,blob);
if(!r.ok) throw new Error(r.status);
}

async function televerserPhoto(blob,mini,s){
const base=s.user_id+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
await televerserFichier(base+'.jpg',blob,s);
if(mini){
try{await televerserFichier(base+'_m.jpg',mini,s);}
catch(e){await supprimerPhotoStockee(PREFIXE_PHOTOS+base+'.jpg',s);throw e;}
}
return PREFIXE_PHOTOS+base+'.jpg';
}

async function supprimerPhotoStockee(url,s){
const t=String(url||'');
if(!t.startsWith(PREFIXE_PHOTOS)) return;
const chemin=t.slice(PREFIXE_PHOTOS.length);
const chemins=[chemin];
if(chemin.endsWith('.jpg')&&!chemin.endsWith('_m.jpg')) chemins.push(chemin.replace(/\.jpg$/,'_m.jpg'));
try{
await Donnees.photos.supprimer(s,chemins);
}catch(e){}
}

function montrer(vue){
VUES.forEach(v=>{const el=document.getElementById(v);if(el)el.style.display=v===vue?'block':'none';});
const menu=document.getElementById('menu');
if(VUES_MENU[vue]===undefined){
menu.style.display='none';
}else{
menu.style.display='flex';
menu.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i===VUES_MENU[vue]));
}
vueCourante=vue;
window.scrollTo(0,0);
}

function voirAccueil(){montrer('accueil');}
function voirProfil(){montrer('profil');}

async function chargerBoutiquesCache(){
try{
const r=await Donnees.boutiques.toutes();
if(!r.ok) throw new Error(r.status);
boutiquesCache=(await r.json()).filter(b=>!b.statut||b.statut==='validee');
}catch(e){}
}

function mapperProduit(l){
return {
id:l.id,
user_id:l.user_id,
nom:l.nom,
prix:l.prix,
desc:l.description||'Pas de description.',
photo:l.photo||"",
photos:l.photos||null,
couleur:'#D9B26F',
categorie:l.categorie||null,
etat:l.etat||null,
couleurs:l.couleurs||null,
date:l.created_at||null
};
}

async function recupererLot(debut,taille){
const r=await Donnees.produits.lot(debut,taille);
if(!r.ok||r.headers.get('x-niohub-cache')==='1') throw new Error(String(r.status));
return (await r.json()).map(mapperProduit);
}

function sauverCatalogueLocal(){
try{
let produits=distants;
let texte=JSON.stringify({produits:produits,boutiques:boutiquesCache});
if(texte.length>1500000){produits=distants.slice(0,200);texte=JSON.stringify({produits:produits,boutiques:boutiquesCache});}
localStorage.setItem(CLE_CATALOGUE,texte);
}catch(e){}
}

// La première page remplace le haut de la liste ; les produits plus anciens déjà connus restent
function fusionnerPremierePage(page){
if(page.length<TAILLE_PREMIERE_PAGE){distants=page.slice();finCatalogue=true;return;}
const ids=new Set(page.map(p=>p.id));
const plusAncien=page[page.length-1].date;
const reste=distants.filter(p=>!ids.has(p.id)&&String(p.date||'')<String(plusAncien||''));
distants=page.concat(reste);
}
function fusionnerFrais(frais,complet){
if(complet||!frais.length){distants=frais.slice();return;}
const dernier=frais[frais.length-1].date;
const ids=new Set(frais.map(p=>p.id));
const reste=distants.filter(p=>!ids.has(p.id)&&String(p.date||'')<String(dernier||''));
distants=frais.concat(reste);
}

function signatureAccueil(){
return JSON.stringify([distants.map(p=>[p.id,p.nom,p.prix,p.photo,p.photos,p.categorie]),boutiquesCache.map(b=>[b.user_id,b.nom,b.logo,b.adresse]),notesVendeurs,chargementEchoue]);
}
function rendreSiChange(){
const signature=signatureAccueil();
if(signature===signatureCatalogue) return;
signatureCatalogue=signature;
afficherGrille();
}

async function chargerProduits(){
let echec=false;
const minuteurLent=setTimeout(()=>{if(chargementEnCours){chargementLent=true;afficherGrille();}},1200);
try{
const page=await recupererLot(0,TAILLE_PREMIERE_PAGE);
premierePageFraiche=page;
fusionnerPremierePage(page);
}catch(e){
echec=true;
}
if(echec){
chargementEchoue=true;
try{
const c=JSON.parse(localStorage.getItem(CLE_CATALOGUE)||'null');
if(c){
distants=c.produits||[];
boutiquesCache=c.boutiques||[];
}
}catch(e){}
}else{
chargementEchoue=false;
sauverCatalogueLocal();
}
// L'accueil s'affiche tout de suite : les boutiques, les notes et la suite des produits arrivent ensuite
clearTimeout(minuteurLent);
const etaitEnChargement=chargementEnCours||chargementLent;
chargementEnCours=false;
chargementLent=false;
const signature=signatureAccueil();
if(signature!==signatureCatalogue||etaitEnChargement){
signatureCatalogue=signature;
afficherGrille();
}
accueilEstPret();
if(!echec){
Promise.all([chargerBoutiquesCache(),chargerNotesVendeurs()]).then(([,notes])=>{
if(notes) notesVendeurs=notes;
sauverCatalogueLocal();
rendreSiChange();
});
if(Date.now()-derniereSynchro>600000){
derniereSynchro=Date.now();
apresAccueil(()=>chargerSuiteCatalogue(),800);
}
}
}

// Suite du catalogue, par lots de 100, sans bloquer l'écran (recherche, hors ligne, favoris…)
function chargerSuiteCatalogue(){
if(promesseSuite) return promesseSuite;
promesseSuite=(async()=>{
lotEnCours=true;
try{
const frais=premierePageFraiche.slice();
let debut=TAILLE_PREMIERE_PAGE;
let termine=false;
while(true){
const lot=await recupererLot(debut,TAILLE_LOT);
const ids=new Set(frais.map(x=>x.id));
lot.forEach(p=>{if(!ids.has(p.id)) frais.push(p);});
debut+=lot.length;
if(lot.length<TAILLE_LOT){termine=true;break;}
if(frais.length>=PLAFOND_CHARGEMENT) break;
fusionnerFrais(frais,false);
rendreSiChange();
}
fusionnerFrais(frais,termine);
if(termine) finCatalogue=true;
}catch(e){}
lotEnCours=false;
promesseSuite=null;
sauverCatalogueLocal();
rendreSiChange();
})();
return promesseSuite;
}
function assurerCatalogueComplet(){
if(finCatalogue) return Promise.resolve();
return chargerSuiteCatalogue();
}

// Au-delà de la limite de chargement automatique : on va chercher 100 produits de plus quand on arrive en bas
async function chargerPlusDuServeur(){
if(finCatalogue) return;
if(promesseSuite){await promesseSuite;return;}
if(lotEnCours) return;
lotEnCours=true;
try{
const lot=await recupererLot(distants.length,TAILLE_LOT);
const ids=new Set(distants.map(x=>x.id));
lot.forEach(p=>{if(!ids.has(p.id)) distants.push(p);});
if(lot.length<TAILLE_LOT) finCatalogue=true;
sauverCatalogueLocal();
rendreSiChange();
}catch(e){}
lotEnCours=false;
}

// Recherche ou catégorie : si tout le catalogue n'est pas encore là, on interroge le serveur
function chargerRechercheServeur(q,categorie){
const cle=q+'|'+(categorie||'');
if(cle===rechercheServeurFaite) return;
rechercheServeurFaite=cle;
clearTimeout(minuteurRechercheServeur);
minuteurRechercheServeur=setTimeout(async()=>{
try{
let filtre='';
const mot=q.replace(/[^\p{L}\p{N} ]/gu,'').trim();
if(mot) filtre+='&nom=ilike.*'+encodeURIComponent(mot)+'*';
if(categorie) filtre+=categorie==='Autres'?'&or=(categorie.eq.Autres,categorie.is.null)':'&categorie=eq.'+encodeURIComponent(categorie);
const r=await Donnees.produits.recents(filtre);
if(!r.ok||r.headers.get('x-niohub-cache')==='1') return;
const lignes=(await r.json()).map(mapperProduit);
const ids=new Set(distants.map(x=>x.id));
const nouveaux=lignes.filter(p=>!ids.has(p.id));
if(!nouveaux.length) return;
distants=distants.concat(nouveaux).sort((x,y)=>String(y.date||'').localeCompare(String(x.date||'')));
rendreSiChange();
}catch(e){}
},350);
}

async function chargerNotesVendeurs(){
try{
const r=await Donnees.avis.notesVendeurs();
if(!r.ok) throw new Error(r.status);
const m={};
(await r.json()).forEach(l=>{m[l.vendeur_id]={moyenne:Number(l.moyenne),nb:Number(l.nb)};});
return m;
}catch(e){return null;}
}

function blocVendeurCarte(p){
const b=p.user_id?boutiquesCache.find(x=>x.user_id===p.user_id):null;
if(!b) return '';
const n=notesVendeurs[b.user_id];
return vueVendeurCarte({userId:b.user_id,fond:fondImage(b.logo,'#F2B233'),initiale:urlSure(b.logo)?'':(b.nom||'N').charAt(0).toUpperCase(),nom:b.nom,note:(n&&n.nb)?n.moyenne.toFixed(1).replace('.',','):'',lieu:b.adresse||''});
}

function carteProduitHTML(p,i){
// Le prix rétrécit un peu quand il est long, pour toujours tenir sur une seule ligne (jusqu'à 100 000 000 FCFA)
const L=String(p.prix||'').length;
const taillePrix=L<=11?'':L<=13?' p18':L<=14?' p17':L<=16?' p15':' p13';
return vueCarteProduit({action:p.id?'ouvrirProduitId':'ouvrirDemo',arg:p.id?Number(p.id):i,fond:fondMini(p),nom:p.nom,prix:p.prix,classePrix:taillePrix,vendeur:blocVendeurCarte(p)});
}

// La grille qui affiche les produits : celle de l'écran Recherche s'il est ouvert, sinon celle de l'accueil
function zoneGrille(){
return document.getElementById(rechercheActive?'rch-grid':'grid');
}

function requeteRecherche(){
const el=document.getElementById('q');
return el?el.value.trim().toLowerCase():'';
}

function garantirBlocBoutiques(){
let bloc=document.getElementById('boutiques-trouvees');
if(!bloc){
bloc=document.createElement('div');
bloc.id='boutiques-trouvees';
}
const g=zoneGrille();
bloc.style.padding=rechercheActive?'0':'0 20px';
if(g&&g.previousElementSibling!==bloc) g.insertAdjacentElement('beforebegin',bloc);
return bloc;
}

function afficherGrille(){
const q=requeteRecherche();
const grille=zoneGrille();
if(!grille) return;
const bloc=garantirBlocBoutiques();
if(rechercheActive&&((!q&&!categorieActive)||(q&&!rechercheValidee))){
// Écran Recherche sans recherche lancée (panneau de recherches rapides, ou suggestions pendant la frappe) : aucun produit à lister
clearInterval(minuteurRevelation);
listeCourante=null;
bloc.innerHTML='';
grille.innerHTML='';
return;
}
const trouvees=q?boutiquesCache.filter(b=>String(b.nom||'').toLowerCase().includes(q)):[];
bloc.innerHTML=vueBoutiquesTrouvees(trouvees.map(b=>({userId:b.user_id,fond:fondImage(b.logo,'#F2B233').replace('no-repeat','').trim(),nom:b.nom,adresse:b.adresse||''})));
const liste=tous().map((p,i)=>({p,i})).filter(x=>(!q||x.p.nom.toLowerCase().includes(q))&&(!categorieActive||(x.p.categorie||'Autres')===categorieActive));
const horsLigne=!navigator.onLine||chargementEchoue;
const cleFiltre=q+'|'+(categorieActive||'');
if(cleFiltre!==derniereCleFiltre){derniereCleFiltre=cleFiltre;nbAffiches=2;plafondAffichage=20;}
listeCourante=null;
if((q||categorieActive)&&!finCatalogue&&navigator.onLine) chargerRechercheServeur(q,categorieActive);
if(liste.length){
const quelques=(horsLigne&&!q&&!categorieActive)?liste.slice(0,PRODUITS_HORS_LIGNE):liste;
listeCourante=quelques;
const affiche=quelques.slice(0,nbAffiches);
let fin='';
if(horsLigne) fin=vueFinListe(navigator.onLine?'La connexion est lente. Les autres produits arriveront dès qu\'elle reviendra.':'Vous êtes hors ligne. Reconnectez-vous pour voir tous les produits.');
else if(chargementLent) fin=vueFinChargement();
grille.innerHTML=affiche.map(x=>carteProduitHTML(x.p,x.i)).join('')+fin;
if(affiche.length<Math.min(plafondAffichage,quelques.length)) demarrerRevelation();
}else if(chargementEnCours&&!q&&!categorieActive){
grille.innerHTML=vueSqueletteGrille();
}else if(q){
grille.innerHTML=vueMessageVide('Aucun produit trouvé pour « '+q+' »');
}else if(chargementEchoue&&!distants.length){
grille.innerHTML=vueMessageVide('Impossible de charger les produits. Vérifiez votre connexion et rouvrez l\'application.');
}else if(categorieActive){
grille.innerHTML=vueMessageVide('Aucun produit dans la catégorie « '+categorieActive+' »');
}else{
grille.innerHTML=vueAccueilVide();
}
}

// Les produits apparaissent 2 par 2 (jusqu'à 20) ; en défilant, 20 de plus, et ainsi de suite
function revelerSuite(){
const grille=zoneGrille();
if(!grille||!listeCourante) return false;
const maxi=Math.min(plafondAffichage,listeCourante.length);
if(nbAffiches>=maxi) return false;
const debut=nbAffiches;
nbAffiches=Math.min(nbAffiches+2,maxi);
const html=listeCourante.slice(debut,nbAffiches).map(x=>carteProduitHTML(x.p,x.i)).join('');
const fin=grille.querySelector('.fin-liste');
if(fin) fin.insertAdjacentHTML('beforebegin',html); else grille.insertAdjacentHTML('beforeend',html);
return true;
}
function demarrerRevelation(){
clearInterval(minuteurRevelation);
minuteurRevelation=setInterval(()=>{
if(!revelerSuite()){clearInterval(minuteurRevelation);verifierSentinelle();}
},110);
}
async function produitsSuivants(){
if(vueCourante!==(rechercheActive?'recherche':'accueil')||!listeCourante) return;
const maxi=Math.min(plafondAffichage,listeCourante.length);
if(nbAffiches<maxi){demarrerRevelation();return;}
// tout ce qui était prévu est affiché : on en prévoit 20 de plus
if(listeCourante.length>plafondAffichage){plafondAffichage+=20;demarrerRevelation();return;}
if(finCatalogue||!navigator.onLine) return;
await chargerPlusDuServeur();
if(listeCourante&&listeCourante.length>plafondAffichage){plafondAffichage+=20;demarrerRevelation();}
}
function verifierSentinelle(){
const s=document.getElementById(rechercheActive?'sentinelle-rch':'sentinelle');
if(!s) return;
const r=s.getBoundingClientRect();
if(r.top<window.innerHeight+400) produitsSuivants();
}
function installerDefilement(idGrille,idSentinelle){
idGrille=idGrille||'grid';
idSentinelle=idSentinelle||'sentinelle';
const grille=document.getElementById(idGrille);
if(!grille||document.getElementById(idSentinelle)) return;
const s=document.createElement('div');
s.id=idSentinelle;
s.style.cssText='height:2px;margin-top:30px';
grille.insertAdjacentElement('afterend',s);
if('IntersectionObserver' in window){
new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)) produitsSuivants();},{rootMargin:'400px'}).observe(s);
}
}

function suggestions(q){
const res=[];
const vus=new Set();
boutiquesCache.forEach(b=>{
const nom=String(b.nom||'').trim();
const cle='b:'+nom.toLowerCase();
if(!nom||vus.has(cle)||!nom.toLowerCase().includes(q)) return;
vus.add(cle);
res.push({type:'boutique',nom:nom,userId:b.user_id,fond:fondImage(b.logo,'#F2B233'),initiale:urlSure(b.logo)?'':nom.charAt(0).toUpperCase()});
});
tous().forEach(p=>{
const nom=String(p.nom||'').trim();
const cle='p:'+nom.toLowerCase();
if(!nom||vus.has(cle)||!nom.toLowerCase().includes(q)) return;
vus.add(cle);
res.push({type:'produit',nom:nom,fond:fondMini(p),initiale:''});
});
res.sort((a,b)=>{
const sa=a.nom.toLowerCase().startsWith(q)?0:1;
const sb=b.nom.toLowerCase().startsWith(q)?0:1;
return sa-sb||a.nom.localeCompare(b.nom,'fr');
});
return res.slice(0,8);
}

function afficherSuggestions(){
const q=requeteRecherche();
const zone=document.getElementById('suggest');
if(!zone) return;
if(!q){zone.innerHTML='';suggestionsEnCours=[];return;}
suggestionsEnCours=suggestions(q);
zone.innerHTML=suggestionsEnCours.length?vueSuggestions(suggestionsEnCours.map((s,k)=>{
const i=s.nom.toLowerCase().indexOf(q);
return {k:k,avant:s.nom.slice(0,i),milieu:s.nom.slice(i,i+q.length),apres:s.nom.slice(i+q.length),boutique:s.type==='boutique',fond:s.fond,initiale:s.initiale||''};
})):vueSuggestionsVide(q);
}

function choisirSuggestion(k){
const s=suggestionsEnCours[k];
if(!s) return;
document.getElementById('suggest').innerHTML='';
if(s.type==='boutique'){
document.getElementById('q').value='';
afficherGrille();
if(typeof majEtatRecherche==='function') majEtatRecherche();
voirVitrine(s.userId);
return;
}
document.getElementById('q').value=s.nom;
if(typeof validerRecherche==='function') validerRecherche();
afficherGrille();
}

// Le bandeau « hors ligne / connexion lente » n'existe plus : l'état est montré à la fin de la liste des produits.
window.addEventListener('online',afficherGrille);
window.addEventListener('offline',afficherGrille);

function ouvrir(i){
const p=tous()[i];
if(vueCourante!=='fiche') origineFiche={vue:vueCourante,y:window.scrollY};
document.getElementById('fphoto').style.background=fond(p);
if(typeof dessinerPhotosFiche==='function') dessinerPhotosFiche(p);
document.getElementById('fprix').textContent=p.prix;
document.getElementById('fnom').textContent=p.nom;
document.getElementById('fdesc').textContent=p.desc;
montrer('fiche');
}

async function ouvrirParId(id){
let i=tous().findIndex(x=>x.id===id);
if(i<0){await assurerCatalogueComplet();i=tous().findIndex(x=>x.id===id);}
if(i>=0) ouvrir(i);
}

function fermerFiche(){
const o=origineFiche;
origineFiche=null;
let cible=(o&&o.vue&&o.vue!=='fiche')?o.vue:'accueil';
if(cible==='chat'&&typeof chatCourant!=='undefined'&&!chatCourant) cible='accueil';
if(cible==='favoris'&&typeof rendreFavoris==='function') rendreFavoris();
restaurationScroll=!!(o&&cible===o.vue&&o.y>0);
montrer(cible);
const pageCible=document.getElementById(cible);
if(pageCible&&pageCible.style.display==='none') pageCible.style.display='block';
if(restaurationScroll){
const y=o.y;
restaurationScroll=false;
window.scrollTo(0,y);
requestAnimationFrame(()=>window.scrollTo(0,y));
setTimeout(()=>window.scrollTo(0,y),80);
setTimeout(()=>window.scrollTo(0,y),250);
}
}

function retourVers(v){
if(v==='mesproduits') return voirMesProduits();
if(v==='boutique') return voirBoutique();
return voirAccueil();
}

async function voirMesProduits(){
montrer('mesproduits');
const zone=document.getElementById('bmes');
zone.textContent='Chargement…';
const s=await sessionValide();
await chargerProduits();
await assurerCatalogueComplet();
if(!s||!s.user_id){zone.textContent='Connectez-vous dans Profil pour voir vos produits.';return;}
const mes=distants.filter(l=>l.user_id===s.user_id);
if(mes.length) zone.innerHTML=vueMesProduits(mes.map(l=>({id:Number(l.id),fond:fondImage(urlMiniature(l.photo),'#D9B26F').replace('no-repeat','').trim(),nom:l.nom,prix:l.prix})));
else zone.textContent="Vous n'avez pas encore de produit publié.";
}

function remettreApercu(photo){
const ap=document.getElementById('apercu');
const s=urlSure(photo)||urlLocale(photo);
if(s){ap.textContent="";ap.style.background='url('+s+') center/cover no-repeat';}
else{ap.textContent="+ Choisir une photo";ap.style.background="#fff";}
}

async function voirAjout(origine){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour publier un produit.');montrer('profil');return;}
origineAjout=origine||'accueil';
editId=null;
photoBlob=null;
photoMiniBlob=null;
photoExistante="";
document.getElementById('ajout-titre').textContent='Ajouter un produit';
document.getElementById('ajout-publier').textContent='Publier';
['nom','prix','desc'].forEach(id=>document.getElementById(id).value="");
remettreApercu("");
montrer('ajout');
}

function retourAjout(){retourVers(origineAjout);}

async function modifierProduit(id){
const s=await sessionValide();
const p=distants.find(x=>x.id===id);
if(!p||!s||p.user_id!==s.user_id){bandeau('Vous ne pouvez modifier que vos produits.','erreur');return;}
editId=p.id;
origineAjout='mesproduits';
photoBlob=null;
photoMiniBlob=null;
photoExistante=p.photo||"";
document.getElementById('ajout-titre').textContent='Modifier le produit';
document.getElementById('ajout-publier').textContent='Enregistrer les modifications';
document.getElementById('nom').value=p.nom;
document.getElementById('prix').value=p.prix.replace(/\D/g,'');
document.getElementById('desc').value=p.desc==='Pas de description.'?'':p.desc;
remettreApercu(photoExistante);
montrer('ajout');
}

async function supprimerProduit(id){
const s=await sessionValide();
const p=distants.find(x=>x.id===id);
if(!p||!s||p.user_id!==s.user_id){bandeau('Vous ne pouvez supprimer que vos produits.','erreur');return;}
if(!(await confirmer('« '+p.nom+' » sera retiré de NioHub. Cette action est définitive.',{titre:'Supprimer ce produit ?',ok:'Supprimer',danger:true}))) return;
try{
const r=await Donnees.produits.supprimer(s,id);
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
if(!lignes.length) throw new Error('refusé');
}catch(e){
bandeau('Suppression impossible. Réessayez.','erreur');
return;
}
await supprimerPhotoStockee(p.photo,s);
voirMesProduits();
}

async function choisirPhoto(e){
const f=e.target.files[0];
e.target.value='';
if(!f) return;
if(!f.type.startsWith('image/')){bandeau('Choisissez une photo (image).','erreur');return;}
try{
const img=await chargerImageDepuis(f);
photoBlob=await reduireImage(img,800,0.75);
photoMiniBlob=await reduireImage(img,360,0.7);
if(!photoBlob||!photoMiniBlob) throw new Error('image');
}catch(err){
photoBlob=null;
photoMiniBlob=null;
bandeau('Cette photo ne peut pas être lue. Essayez-en une autre.','erreur');
return;
}
if(apercuUrl) URL.revokeObjectURL(apercuUrl);
apercuUrl=URL.createObjectURL(photoBlob);
remettreApercu(apercuUrl);
}

installerDefilement();
(function(){
try{
const c=JSON.parse(localStorage.getItem(CLE_CATALOGUE)||'null');
if(c&&c.produits&&c.produits.length){distants=c.produits;boutiquesCache=c.boutiques||[];afficherGrille();}
}catch(e){}
})();
chargerProduits();
// Copie de ses données (discussions, commandes, avis…) pour le mode hors ligne, une fois l'accueil affiché
apresAccueil(()=>{if(typeof prechargerHorsLigne==='function') prechargerHorsLigne();},5000);
montrer('accueil');
