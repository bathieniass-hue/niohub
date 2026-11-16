const SUPABASE_URL="https://zpmjbggzqwcajjrzfejg.supabase.co";
const SUPABASE_KEY="sb_publishable_dz22DUOnanzHiA2jLk305g_Cf6KCVPr";

// Mettre true pour revoir les 4 produits de démonstration
const AFFICHER_DEMO=false;

const VUES=['accueil','fiche','commande','ajout','mesproduits','boutique','boutique-form','profil','vitrine'];
const VUES_MENU={accueil:0,boutique:1,'boutique-form':1,profil:2};

const cats=[["Mode","#F2D9A3"],["Tech","#BFD8E3"],["Maison","#E3C4B3"],["Beauté","#C8DDBE"]];
document.getElementById('cats').innerHTML=cats.map(([n,c])=>`<div class="cat" style="background:${c}">${n}</div>`).join('');

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

const PREFIXE_PHOTOS=SUPABASE_URL+'/storage/v1/object/public/photos/';

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
const r=await fetch(SUPABASE_URL+'/storage/v1/object/photos/'+chemin,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'image/jpeg','cache-control':'max-age=31536000'},body:blob});
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
await fetch(SUPABASE_URL+'/storage/v1/object/photos',{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({prefixes:chemins})});
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
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&order=created_at.asc',{headers:{apikey:SUPABASE_KEY}});
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
const r=await fetch(SUPABASE_URL+"/rest/v1/produits?select=*&order=created_at.desc&limit="+taille+"&offset="+debut,{headers:{apikey:SUPABASE_KEY}});
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
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?select=*&order=created_at.desc&limit=60'+filtre,{headers:{apikey:SUPABASE_KEY}});
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
const r=await fetch(SUPABASE_URL+'/rest/v1/notes_vendeurs?select=vendeur_id,moyenne,nb',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const m={};
(await r.json()).forEach(l=>{m[l.vendeur_id]={moyenne:Number(l.moyenne),nb:Number(l.nb)};});
return m;
}catch(e){return null;}
}

const ICONE_LIEU='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

function blocVendeurCarte(p){
const b=p.user_id?boutiquesCache.find(x=>x.user_id===p.user_id):null;
if(!b) return '';
const n=notesVendeurs[b.user_id];
const note=n&&n.nb
?`<span class="v-etoiles">★</span> <b>${n.moyenne.toFixed(1).replace('.',',')}</b>`
:'<span class="v-nouveau">Nouveau</span>';
const lieu=b.adresse?`<div class="v-lieu">${ICONE_LIEU}<span>${esc(b.adresse)}</span></div>`:'';
const ini=esc((b.nom||'N').charAt(0).toUpperCase());
return `<div class="vendeur"><div class="v-avatar" style="background:${fondImage(b.logo,'#F2B233')}">${urlSure(b.logo)?'':ini}</div><div class="v-txt"><div class="v-ligne"><span class="v-nom">${esc(b.nom)}</span><span class="v-note">${note}</span></div>${lieu}</div></div>`;
}

function carteProduitHTML(p,i){
const clic=p.id?'ouvrirParId('+Number(p.id)+')':'ouvrir('+i+')';
// Le prix rétrécit un peu quand il est long, pour toujours tenir sur une seule ligne (jusqu'à 100 000 000 FCFA)
const L=String(p.prix||'').length;
const taillePrix=L<=11?'':L<=13?' p18':L<=14?' p17':L<=16?' p15':' p13';
return `<div class="card" onclick="${clic}"><div class="img" style="background:${fondMini(p)}"></div><div class="info"><div class="name">${esc(p.nom)}</div><div class="price${taillePrix}">${esc(p.prix)}</div>${blocVendeurCarte(p)}</div></div>`;
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
bloc.style.padding='0 20px';
document.getElementById('grid').insertAdjacentElement('beforebegin',bloc);
}
return bloc;
}

function afficherGrille(){
const q=requeteRecherche();
const grille=document.getElementById('grid');
if(!grille) return;
const bloc=garantirBlocBoutiques();
const trouvees=q?boutiquesCache.filter(b=>String(b.nom||'').toLowerCase().includes(q)):[];
bloc.innerHTML=trouvees.length
?`<div class="titre-section">Boutiques</div><div class="liste" style="margin-top:0">${trouvees.map(b=>`<div class="ligne" style="cursor:pointer" onclick="voirVitrine('${esc(b.user_id)}')"><div class="vignette" style="border-radius:28px;background:${fondImage(b.logo,'#F2B233').replace('no-repeat','').trim()}"></div><div style="flex:1"><div class="name">${esc(b.nom)}</div><div style="font-size:12px;color:#6B6254">${esc(b.adresse||'')}</div></div><span>›</span></div>`).join('')}</div>`
:'';
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
if(horsLigne) fin='<div class="fin-liste">'+(navigator.onLine?'La connexion est lente. Les autres produits arriveront dès qu\'elle reviendra.':'Vous êtes hors ligne. Reconnectez-vous pour voir tous les produits.')+'</div>';
else if(chargementLent) fin='<div class="fin-liste"><span class="roue"></span>Chargement des produits…</div>';
grille.innerHTML=affiche.map(x=>carteProduitHTML(x.p,x.i)).join('')+fin;
if(affiche.length<Math.min(plafondAffichage,quelques.length)) demarrerRevelation();
}else if(chargementEnCours&&!q&&!categorieActive){
grille.innerHTML=Array(6).fill('<div class="sk-carte"></div>').join('');
}else if(q){
grille.innerHTML=`<div class="vide">Aucun produit trouvé pour « ${esc(q)} »</div>`;
}else if(chargementEchoue&&!distants.length){
grille.innerHTML=`<div class="vide">Impossible de charger les produits. Vérifiez votre connexion et rouvrez l'application.</div>`;
}else if(categorieActive){
grille.innerHTML=`<div class="vide">Aucun produit dans la catégorie « ${esc(categorieActive)} »</div>`;
}else{
grille.innerHTML=`<div class="accueil-vide">
<img src="logo-n.png" alt="" class="accueil-vide-logo">
<div class="accueil-vide-titre">Bienvenue sur NioHub</div>
<div class="accueil-vide-texte">Aucun produit n'est encore en vente près de chez vous. Lancez le marché : publiez le premier article, il sera vu par tous les visiteurs.</div>
<button class="btn" type="button" onclick="voirAjout('accueil')">Publier un produit</button>
<button class="accueil-vide-lien" type="button" onclick="voirBoutique()">Créer ma boutique</button>
</div>`;
}
}

// Les produits apparaissent 2 par 2 (jusqu'à 20) ; en défilant, 20 de plus, et ainsi de suite
function revelerSuite(){
const grille=document.getElementById('grid');
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
if(vueCourante!=='accueil'||!listeCourante) return;
const maxi=Math.min(plafondAffichage,listeCourante.length);
if(nbAffiches<maxi){demarrerRevelation();return;}
// tout ce qui était prévu est affiché : on en prévoit 20 de plus
if(listeCourante.length>plafondAffichage){plafondAffichage+=20;demarrerRevelation();return;}
if(finCatalogue||!navigator.onLine) return;
await chargerPlusDuServeur();
if(listeCourante&&listeCourante.length>plafondAffichage){plafondAffichage+=20;demarrerRevelation();}
}
function verifierSentinelle(){
const s=document.getElementById('sentinelle');
if(!s) return;
const r=s.getBoundingClientRect();
if(r.top<window.innerHeight+400) produitsSuivants();
}
function installerDefilement(){
const grille=document.getElementById('grid');
if(!grille||document.getElementById('sentinelle')) return;
const s=document.createElement('div');
s.id='sentinelle';
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
res.push({type:'boutique',nom:nom,userId:b.user_id});
});
tous().forEach(p=>{
const nom=String(p.nom||'').trim();
const cle='p:'+nom.toLowerCase();
if(!nom||vus.has(cle)||!nom.toLowerCase().includes(q)) return;
vus.add(cle);
res.push({type:'produit',nom:nom});
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
zone.innerHTML=suggestionsEnCours.map((s,k)=>{
const i=s.nom.toLowerCase().indexOf(q);
const tag=s.type==='boutique'?'<span class="tag-b">Boutique</span>':'<span class="tag-p">Produit</span>';
return `<button onclick="choisirSuggestion(${k})">${esc(s.nom.slice(0,i))}<b>${esc(s.nom.slice(i,i+q.length))}</b>${esc(s.nom.slice(i+q.length))}${tag}</button>`;
}).join('');
}

function choisirSuggestion(k){
const s=suggestionsEnCours[k];
if(!s) return;
document.getElementById('suggest').innerHTML='';
if(s.type==='boutique'){
document.getElementById('q').value='';
afficherGrille();
voirVitrine(s.userId);
return;
}
document.getElementById('q').value=s.nom;
afficherGrille();
}

function installerRecherche(){
const ancien=document.querySelector('#accueil .search');
if(!ancien||document.getElementById('q')) return;
const zone=document.createElement('div');
zone.className='recherche';
zone.innerHTML='<input id="q" type="search" placeholder="Rechercher un produit ou une boutique" autocomplete="off"><div id="suggest"></div>';
ancien.replaceWith(zone);
const champ=document.getElementById('q');
champ.addEventListener('input',()=>{afficherSuggestions();afficherGrille();});
champ.addEventListener('keydown',e=>{
if(e.key==='Enter'){
document.getElementById('suggest').innerHTML='';
afficherGrille();
champ.blur();
}
});
}

function styleAccueil(){
const st=document.createElement('style');
st.textContent=`
.recherche{position:relative;margin:0 20px}
#q{width:100%;padding:12px 14px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif;outline:none}
#q:focus{border-color:#0E6B47}
#suggest{position:absolute;left:0;right:0;top:100%;margin-top:6px;background:#fff;border:1px solid #EDE5D3;border-radius:14px;box-shadow:0 10px 24px rgba(30,26,20,.12);z-index:20;overflow:hidden}
#suggest button{display:block;width:100%;text-align:left;padding:12px 14px;border:0;border-bottom:1px solid #F3EEE2;background:#fff;font-size:14px;color:#1E1A14}
#suggest button:last-child{border-bottom:0}
#suggest b{color:#0E6B47}
.tag-b,.tag-p{font-size:11px;font-weight:bold;padding:2px 6px;border-radius:8px;margin-left:6px}
.tag-b{background:#E1F1E8;color:#0E6B47}
.tag-p{background:#FFF1CC;color:#8A5A00}
.titre-section{font-size:14px;font-weight:bold;margin:8px 0 6px;color:#6B6254}
.vide{grid-column:1/-1;text-align:center;color:#6B6254;padding:30px 0;font-size:14px}
#bandeau-reseau-supprime{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:900;display:none;padding:10px 14px;border-radius:14px;background:#8A5A00;color:#fff;font-size:13px;font-weight:bold;box-shadow:0 8px 20px rgba(30,26,20,.2)}
`;
document.head.appendChild(st);
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
zone.innerHTML=mes.length
?mes.map(l=>`<div class="ligne"><div class="vignette" style="background:${fondImage(urlMiniature(l.photo),'#D9B26F').replace('no-repeat','').trim()}"></div><div style="flex:1"><div class="name">${esc(l.nom)}</div><div class="price">${esc(l.prix)}</div></div><button onclick="modifierProduit(${Number(l.id)})" style="border:0;background:none;color:#0E6B47;font-weight:bold;font-size:13px">Modifier</button><button onclick="supprimerProduit(${Number(l.id)})" style="border:0;background:none;color:#B4291A;font-weight:bold;font-size:13px">Supprimer</button></div>`).join('')
:"Vous n'avez pas encore de produit publié.";
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
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?id=eq.'+id+'&user_id=eq.'+s.user_id,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,Prefer:'return=representation'}});
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

styleAccueil();
installerRecherche();
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
