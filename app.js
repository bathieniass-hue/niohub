const SUPABASE_URL="https://zpmjbggzqwcajjrzfejg.supabase.co";
const SUPABASE_KEY="sb_publishable_dz22DUOnanzHiA2jLk305g_Cf6KCVPr";

const cats=[["Mode","#F2D9A3"],["Tech","#BFD8E3"],["Maison","#E3C4B3"],["Beauté","#C8DDBE"]];
document.getElementById('cats').innerHTML=cats.map(([n,c])=>`<div class="cat" style="background:${c}">${n}</div>`).join('');

const defauts=[
{nom:"Boubou brodé",prix:"25 000 FCFA",couleur:"#D9B26F",desc:"Bazin riche, broderie faite main. Tailles M à XXL."},
{nom:"Sac en cuir",prix:"18 000 FCFA",couleur:"#C98B6B",desc:"Sac en cuir véritable, fait à la main."},
{nom:"Écouteurs",prix:"12 500 FCFA",couleur:"#8FB7C9",desc:"Écouteurs sans fil avec boîtier de charge."},
{nom:"Huile de baobab",prix:"4 500 FCFA",couleur:"#A8C59A",desc:"Huile de baobab naturelle, 100 ml."}
];
let distants=[];
let photoChoisie="";

function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tous(){return defauts.concat(distants);}
function fond(p){return p.photo?`url(${p.photo}) center/cover no-repeat`:p.couleur;}

async function chargerProduits(){
try{
const r=await fetch(SUPABASE_URL+"/rest/v1/produits?select=*&order=created_at.desc",{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
distants=lignes.map(l=>({nom:l.nom,prix:l.prix,desc:l.description||'Pas de description.',photo:l.photo||"",couleur:'#D9B26F'}));
}catch(e){
console.log(e);
}
afficherGrille();
}

function afficherGrille(){
document.getElementById('grid').innerHTML=tous().map((p,i)=>`<div class="card" onclick="ouvrir(${i})"><div class="img" style="background:${fond(p)}"></div><div class="info"><div class="name">${esc(p.nom)}</div><div class="price">${esc(p.prix)}</div></div></div>`).join('');
}
function ouvrir(i){
const p=tous()[i];
document.getElementById('fphoto').style.background=fond(p);
document.getElementById('fprix').textContent=p.prix;
document.getElementById('fnom').textContent=p.nom;
document.getElementById('fdesc').textContent=p.desc;
montrer('fiche');
}
function montrer(vue){
['accueil','fiche','ajout','boutique','profil'].forEach(v=>document.getElementById(v).style.display=v===vue?'block':'none');
window.scrollTo(0,0);
}
function voirAccueil(){montrer('accueil');}
function voirProfil(){montrer('profil');}

function voirBoutique(){
montrer('boutique');
document.getElementById('bmes').textContent='Chargement…';
chargerProduits().then(()=>{
const zone=document.getElementById('bmes');
zone.innerHTML=distants.length
?distants.map(l=>`<div class="ligne"><div class="vignette" style="background:${l.photo?'url('+l.photo+') center/cover':'#D9B26F'}"></div><div><div class="name">${esc(l.nom)}</div><div class="price">${esc(l.prix)}</div></div></div>`).join('')
:"Aucun produit publié pour l'instant.";
});
}

function voirAjout(){
photoChoisie="";
['nom','prix','desc'].forEach(id=>document.getElementById(id).value="");
const ap=document.getElementById('apercu');
ap.style.background="#fff";
ap.textContent="+ Choisir une photo";
montrer('ajout');
}

function choisirPhoto(e){
const f=e.target.files[0];
if(!f)return;
const lecteur=new FileReader();
lecteur.onload=()=>{
const img=new Image();
img.onload=()=>{
const echelle=Math.min(1,600/img.width);
const c=document.createElement('canvas');
c.width=img.width*echelle;
c.height=img.height*echelle;
c.getContext('2d').drawImage(img,0,0,c.width,c.height);
photoChoisie=c.toDataURL('image/jpeg',0.7);
const ap=document.getElementById('apercu');
ap.textContent="";
ap.style.background=`url(${photoChoisie}) center/cover no-repeat`;
};
img.src=lecteur.result;
};
lecteur.readAsDataURL(f);
}

async function publier(){
const nom=document.getElementById('nom').value.trim();
const prix=document.getElementById('prix').value.trim();
const desc=document.getElementById('desc').value.trim();
if(!nom||!prix){alert('Indiquez au moins le nom et le prix.');return;}
const corps={nom:nom,prix:Number(prix).toLocaleString('fr-FR')+' FCFA',description:desc||null,photo:photoChoisie||null};
try{
const r=await fetch(SUPABASE_URL+"/rest/v1/produits",{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
}catch(e){
alert('Erreur, produit non enregistré. Réessayez.');
return;
}
await chargerProduits();
voirAccueil();
}

chargerProduits();
