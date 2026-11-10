const SUPABASE_URL="https://supabase.co";
const SUPABASE_KEY="sb_publishable_dz22DUOnanzHiA2jLk305g_Cf6KCVPr";

// Mettre true pour revoir les 4 produits de démonstration
const AFFICHER_DEMO=false;

const VUES=['accueil','fiche','commande','ajout','mesproduits','boutique','boutique-form','profil','vitrine'];
const VUES_MENU={accueil:0,boutique:1,mesproduits:1,'boutique-form':1,profil:2};

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
let categorieActive='';
let notesVendeurs={};
let signatureCatalogue='';
let vueCourante='accueil';
let origineFiche=null;
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

async function televerserFichier(chemin,blob,s){
const r=await fetch(SUPABASE_URL+'/storage/v1/object/photos/'+chemin,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'image/jpeg','x-upsert':'true'},body:blob});
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
boutiquesCache=await r.json();
}catch(e){}
}

async function chargerProduits(){
let echec=false;
try{
const r=await fetch(SUPABASE_URL+"/rest/v1/produits?select=*&order=created_at.desc",{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
distants=lignes.map(l=>({
id:l.id,
user_id:l.user_id,
nom:l.nom,
prix:l.prix,
desc:l.description||'Pas de description.',
photo:l.photo||"",
couleur:'#D9B26F',
categorie:l.categorie||null,
etat:l.etat||null,
couleurs:l.couleurs||null
}));
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
try{localStorage.setItem(CLE_CATALOGUE,JSON.stringify({produits:distants,boutiques:boutiquesCache}));}catch(e){}
}
await chargerBoutiquesCache();
const notes=await chargerNotesVendeurs();
if(notes) notesVendeurs=notes;
const signature=JSON.stringify([distants.map(p=>[p.id,p.nom,p.prix,p.photo,p.categorie]),boutiquesCache.map(b=>[b.user_id,b.nom,b.logo,b.adresse]),notesVendeurs,chargementEchoue]);
if(signature===signatureCatalogue) return;
signatureCatalogue=signature;
afficherGrille();
majBandeauReseau();
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
?`<span class="v-etoiles">${etoiles(n.moyenne)}</span> <b>${n.moyenne.toFixed(1).replace('.',',')}</b> <span class="v-nb">(${n.nb})</span>`
:'<span class="v-nb">Aucun avis</span>';
const lieu=b.adresse?`<div class="v-lieu">${ICONE_LIEU}<span>${esc(b.adresse)}</span></div>`:'';
const ini=esc((b.nom||'N').charAt(0).toUpperCase());
return `<div class="vendeur"><div class="v-avatar" style="background:${fondImage(b.logo,'#F2B233')}">${urlSure(b.logo)?'':ini}</div><div class="v-txt"><div class="v-nom">${esc(b.nom)}</div><div class="v-note">${note}</div></div></div>${lieu}`;
}

function carteProduitHTML(p,i){
const clic=p.id?'ouvrirParId('+Number(p.id)+')':'ouvrir('+i+')';
return `<div class="card" onclick="${clic}"><div class="img" style="background:${fondMini(p)}"></div><div class="info"><div class="name">${esc(p.nom)}</div><div class="price">${esc(p.prix)}</div>${blocVendeurCarte(p)}</div></div>`;
}

function requeteRecherche(){
const el=document.getElementById('q');
return el?el.value.trim().toLowerCase():'';
}

function garantizarBlocBoutiques(){
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
if(liste.length){
grille.innerHTML=liste.map(x=>carteProduitHTML(x.p,x.i)).join('');
}else if(q){
grille.innerHTML=`<div class="vide">Aucun produit trouvé pour « ${esc(q)} »</div>`;
}else if(chargementEchoue&&!distants.length){
grille.innerHTML=`<div class="vide">Impossible de charger les produits. Vérifiez votre connexion et rouvrez l'application.</div>`;
}else if(categorieActive){
grille.innerHTML=`<div class="vide">Aucun produit dans la catégorie « ${esc(categorieActive)} »</div>`;
}else{
