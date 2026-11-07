const SUPABASE_URL="https://zpmjbggzqwcajjrzfejg.supabase.co";
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

function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tous(){return (AFFICHER_DEMO?defauts:[]).concat(distants);}

// Accepte uniquement une image en base64 ou un fichier de notre Supabase Storage.
// Tout le reste est refusé : impossible de sortir de l'attribut style.
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

// ---- Photos stockées dans Supabase Storage (bucket "photos") ----
const PREFIXE_PHOTOS=SUPABASE_URL+'/storage/v1/object/public/photos/';

// Aperçu local (blob:) créé par l'application elle-même, jamais venant de la base
function urlLocale(u){
const t=String(u||'');
return /^blob:[A-Za-z0-9:\/.\-]+$/.test(t)?t:'';
}

// Chaque photo de produit existe en deux tailles : abc.jpg (fiche) et abc_m.jpg (miniature des listes)
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
const r=await fetch(SUPABASE_URL+'/storage/v1/object/photos/'+chemin,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'image/jpeg','cache-control':'max-age=31536000'},body:blob});
if(!r.ok) throw new Error(r.status);
}

// Envoie la photo (et sa miniature si fournie) dans le dossier de l'utilisateur.
// Retourne l'adresse publique de la grande photo.
async function televerserPhoto(blob,mini,s){
const base=s.user_id+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
await televerserFichier(base+'.jpg',blob,s);
if(mini){
try{await televerserFichier(base+'_m.jpg',mini,s);}
catch(e){await supprimerPhotoStockee(PREFIXE_PHOTOS+base+'.jpg',s);throw e;}
}
return PREFIXE_PHOTOS+base+'.jpg';
}

// Supprime une photo de Storage (et sa miniature). Sans effet pour les anciennes photos stockées dans la base.
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
chargementEchoue=false;
}catch(e){
console.log(e);
chargementEchoue=true;
}
await chargerBoutiquesCache();
const notes=await chargerNotesVendeurs();
if(notes) notesVendeurs=notes;
// On ne redessine la grille que si quelque chose a changé : pas de clignotement pendant l'actualisation automatique
const signature=JSON.stringify([distants.map(p=>[p.id,p.nom,p.prix,p.photo,p.categorie]),boutiquesCache.map(b=>[b.user_id,b.nom,b.logo,b.adresse]),notesVendeurs,chargementEchoue]);
if(signature===signatureCatalogue) return;
signatureCatalogue=signature;
afficherGrille();
}

// Note moyenne de chaque vendeur (vue SQL notes_vendeurs). Si la vue n'existe pas encore : pas d'étoiles, rien ne casse.
async function chargerNotesVendeurs(){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/notes_vendeurs?select=vendeur_id,moyenne,nb',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const m={};
(await r.json()).forEach(l=>{m[l.vendeur_id]={moyenne:Number(l.moyenne),nb:Number(l.nb)};});
return m;
}catch(e){return null;}
}

// ---- Carte produit (accueil et favoris) : photo, prix, puis la boutique avec sa note et son adresse ----
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
if(liste.length){
grille.innerHTML=liste.map(x=>carteProduitHTML(x.p,x.i)).join('');
}else if(q){
grille.innerHTML=`<div class="vide">Aucun produit trouvé pour « ${esc(q)} »</div>`;
}else if(chargementEchoue&&!distants.length){
grille.innerHTML=`<div class="vide">Impossible de charger les produits. Vérifiez votre connexion et rouvrez l'application.</div>`;
}else if(categorieActive){
grille.innerHTML=`<div class="vide">Aucun produit dans la catégorie « ${esc(categorieActive)} »</div>`;
}else{
grille.innerHTML=`<div class="vide">Aucun produit pour l'instant.</div>`;
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
`;
document.head.appendChild(st);
}

function ouvrir(i){
const p=tous()[i];
if(vueCourante!=='fiche') origineFiche={vue:vueCourante,y:window.scrollY};
document.getElementById('fphoto').style.background=fond(p);
document.getElementById('fprix').textContent=p.prix;
document.getElementById('fnom').textContent=p.nom;
document.getElementById('fdesc').textContent=p.desc;
montrer('fiche');
}

// Ouvre un produit par son identifiant : reste correct même si la liste change entre-temps
function ouvrirParId(id){
const i=tous().findIndex(x=>x.id===id);
if(i>=0) ouvrir(i);
}

// Fermer une fiche produit : on revient là où on était (accueil, favoris, boutique, conversation...) à la même hauteur
function fermerFiche(){
const o=origineFiche;
origineFiche=null;
let cible=(o&&o.vue&&o.vue!=='fiche')?o.vue:'accueil';
if(cible==='chat'&&typeof chatCourant!=='undefined'&&!chatCourant) cible='accueil';
if(cible==='favoris'&&typeof rendreFavoris==='function') rendreFavoris();
restaurationScroll=!!(o&&cible===o.vue&&o.y>0);
montrer(cible);
if(restaurationScroll){window.scrollTo(0,o.y);restaurationScroll=false;}
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
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour publier un produit.');montrer('profil');return;}
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
if(!p||!s||p.user_id!==s.user_id){alert('Vous ne pouvez modifier que vos produits.');return;}
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
if(!p||!s||p.user_id!==s.user_id){alert('Vous ne pouvez supprimer que vos produits.');return;}
if(!confirm('Supprimer « '+p.nom+' » ?')) return;
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?id=eq.'+id+'&user_id=eq.'+s.user_id,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,Prefer:'return=representation'}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
// Supabase répond "OK" même si la règle de sécurité a bloqué : on vérifie qu'une ligne a bien été supprimée
if(!lignes.length) throw new Error('refusé');
}catch(e){
alert('Suppression impossible. Réessayez.');
return;
}
await supprimerPhotoStockee(p.photo,s);
voirMesProduits();
}

async function choisirPhoto(e){
const f=e.target.files[0];
e.target.value='';
if(!f) return;
if(!f.type.startsWith('image/')){alert('Choisissez une photo (image).');return;}
try{
const img=await chargerImageDepuis(f);
photoBlob=await reduireImage(img,800,0.75);
photoMiniBlob=await reduireImage(img,360,0.7);
if(!photoBlob||!photoMiniBlob) throw new Error('image');
}catch(err){
photoBlob=null;
photoMiniBlob=null;
alert('Cette photo ne peut pas être lue. Essayez-en une autre.');
return;
}
if(apercuUrl) URL.revokeObjectURL(apercuUrl);
apercuUrl=URL.createObjectURL(photoBlob);
remettreApercu(apercuUrl);
}

// publier() est définie dans details-produit.js (catégorie, état, couleurs).

styleAccueil();
installerRecherche();
chargerProduits();
montrer('accueil');
