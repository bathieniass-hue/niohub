const SUPABASE_URL="https://zpmjbggzqwcajjrzfejg.supabase.co";
const SUPABASE_KEY="sb_publishable_dz22DUOnanzHiA2jLk305g_Cf6KCVPr";

const VUES=['accueil','fiche','commande','ajout','mesproduits','boutique','boutique-form','profil'];
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
let photoChoisie="";
let photoExistante="";
let editId=null;
let origineAjout='accueil';

function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tous(){return defauts.concat(distants);}
function fond(p){return p.photo?`url(${p.photo}) center/cover no-repeat`:p.couleur;}

function montrer(vue){
VUES.forEach(v=>{const el=document.getElementById(v);if(el)el.style.display=v===vue?'block':'none';});
const menu=document.getElementById('menu');
if(VUES_MENU[vue]===undefined){
menu.style.display='none';
}else{
menu.style.display='flex';
menu.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i===VUES_MENU[vue]));
}
window.scrollTo(0,0);
}

function voirAccueil(){montrer('accueil');}
function voirProfil(){montrer('profil');}

async function chargerProduits(){
try{
const r=await fetch(SUPABASE_URL+"/rest/v1/produits?select=*&order=created_at.desc",{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
distants=lignes.map(l=>({id:l.id,user_id:l.user_id,nom:l.nom,prix:l.prix,desc:l.description||'Pas de description.',photo:l.photo||"",couleur:'#D9B26F'}));
}catch(e){console.log(e);}
afficherGrille();
}

function requeteRecherche(){
const el=document.getElementById('q');
return el?el.value.trim().toLowerCase():'';
}

function afficherGrille(){
const q=requeteRecherche();
const liste=tous().map((p,i)=>({p,i})).filter(x=>!q||x.p.nom.toLowerCase().includes(q));
const grille=document.getElementById('grid');
if(!grille) return;
if(liste.length){
grille.innerHTML=liste.map(x=>`<div class="card" onclick="ouvrir(${x.i})"><div class="img" style="background:${fond(x.p)}"></div><div class="info"><div class="name">${esc(x.p.nom)}</div><div class="price">${esc(x.p.prix)}</div></div></div>`).join('');
}else{
grille.innerHTML=q?`<div class="vide">Aucun produit trouvé pour « ${esc(q)} »</div>`:`<div class="vide">Aucun produit pour l'instant.</div>`;
}
}

function suggestions(q){
const vus=new Set();
const res=[];
tous().forEach(p=>{
const nom=String(p.nom||'').trim();
const cle=nom.toLowerCase();
if(!nom||vus.has(cle)||!cle.includes(q)) return;
vus.add(cle);
res.push(nom);
});
res.sort((a,b)=>{
const sa=a.toLowerCase().startsWith(q)?0:1;
const sb=b.toLowerCase().startsWith(q)?0:1;
return sa-sb||a.localeCompare(b,'fr');
});
return res.slice(0,6);
}

function afficherSuggestions(){
const q=requeteRecherche();
const zone=document.getElementById('suggest');
if(!zone) return;
if(!q){zone.innerHTML='';return;}
zone.innerHTML=suggestions(q).map(n=>{
const i=n.toLowerCase().indexOf(q);
const avant=esc(n.slice(0,i));
const milieu=esc(n.slice(i,i+q.length));
const apres=esc(n.slice(i+q.length));
return `<button onclick="choisirSuggestion(this.dataset.nom)" data-nom="${esc(n)}">${avant}<b>${milieu}</b>${apres}</button>`;
}).join('');
}

function choisirSuggestion(nom){
document.getElementById('q').value=nom;
document.getElementById('suggest').innerHTML='';
afficherGrille();
}

function installerRecherche(){
const ancien=document.querySelector('#accueil .search');
if(!ancien||document.getElementById('q')) return;
const zone=document.createElement('div');
zone.className='recherche';
zone.innerHTML='<input id="q" type="search" placeholder="Rechercher un produit" autocomplete="off"><div id="suggest"></div>';
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

function styleRecherche(){
const st=document.createElement('style');
st.textContent=`
.recherche{position:relative;margin:0 20px}
#q{width:100%;padding:12px 14px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif;outline:none}
#q:focus{border-color:#0E6B47}
#suggest{position:absolute;left:0;right:0;top:100%;margin-top:6px;background:#fff;border:1px solid #EDE5D3;border-radius:14px;box-shadow:0 10px 24px rgba(30,26,20,.12);z-index:20;overflow:hidden}
#suggest button{display:block;width:100%;text-align:left;padding:12px 14px;border:0;border-bottom:1px solid #F3EEE2;background:#fff;font-size:14px;color:#1E1A14}
#suggest button:last-child{border-bottom:0}
#suggest b{color:#0E6B47}
.vide{grid-column:1/-1;text-align:center;color:#6B6254;padding:30px 0;font-size:14px}
`;
document.head.appendChild(st);
}

function ouvrir(i){
const p=tous()[i];
document.getElementById('fphoto').style.background=fond(p);
document.getElementById('fprix').textContent=p.prix;
document.getElementById('fnom').textContent=p.nom;
document.getElementById('fdesc').textContent=p.desc;
montrer('fiche');
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
?mes.map(l=>`<div class="ligne"><div class="vignette" style="background:${l.photo?'url('+l.photo+') center/cover':'#D9B26F'}"></div><div style="flex:1"><div class="name">${esc(l.nom)}</div><div class="price">${esc(l.prix)}</div></div><button onclick="modifierProduit(${l.id})" style="border:0;background:none;color:#0E6B47;font-weight:bold;font-size:13px">Modifier</button><button onclick="supprimerProduit(${l.id})" style="border:0;background:none;color:#B4291A;font-weight:bold;font-size:13px">Supprimer</button></div>`).join('')
:"Vous n'avez pas encore de produit publié.";
}

function remettreApercu(photo){
const ap=document.getElementById('apercu');
if(photo){ap.textContent="";ap.style.background=`url(${photo}) center/cover no-repeat`;}
else{ap.textContent="+ Choisir une photo";ap.style.background="#fff";}
}

async function voirAjout(origine){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour publier un produit.');montrer('profil');return;}
origineAjout=origine||'accueil';
editId=null;
photoChoisie="";
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
photoChoisie="";
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
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?id=eq.'+id,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,Prefer:'return=minimal'}});
if(!r.ok) throw new Error(r.status);
}catch(e){
alert('Suppression impossible. Réessayez.');
return;
}
voirMesProduits();
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
remettreApercu(photoChoisie);
};
img.src=lecteur.result;
};
lecteur.readAsDataURL(f);
}

async function publier(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour publier.');montrer('profil');return;}
const nom=document.getElementById('nom').value.trim();
const prix=document.getElementById('prix').value.trim();
const desc=document.getElementById('desc').value.trim();
if(!nom||!prix){alert('Indiquez au moins le nom et le prix.');return;}
const corps={nom:nom,prix:Number(prix).toLocaleString('fr-FR')+' FCFA',description:desc||null};
const modification=editId!==null;
let url=SUPABASE_URL+"/rest/v1/produits";
let methode="POST";
if(modification){
url+='?id=eq.'+editId;
methode="PATCH";
if(photoChoisie) corps.photo=photoChoisie;
}else{
corps.photo=photoChoisie||null;
corps.user_id=s.user_id;
}
try{
const r=await fetch(url,{method:methode,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
}catch(e){
alert('Erreur, enregistrement impossible. Réessayez.');
return;
}
editId=null;
await chargerProduits();
retourVers(origineAjout);
}

styleRecherche();
installerRecherche();
chargerProduits();
montrer('accueil');
