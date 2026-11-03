const CATEGORIES_PRODUIT=["Mode","Tech","Maison","Beauté","Alimentation","Autres"];
const ETATS_PRODUIT=["Neuf","Comme neuf","Bon état","Occasion"];
const COULEURS_PRODUIT=["Noir","Blanc","Rouge","Bleu","Vert","Jaune","Beige","Marron","Gris","Rose"];
let couleursChoisies=[];

const styleDetails=document.createElement('style');
styleDetails.textContent=`
.puce{display:inline-block;margin:0 6px 8px 0;padding:8px 14px;border:1px solid #E6DECB;border-radius:20px;background:#fff;font-size:14px;color:#1E1A14;font-family:sans-serif}
.puce.on{background:#0E6B47;border-color:#0E6B47;color:#fff}
.sel-produit{width:100%;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif;box-sizing:border-box}
`;
document.head.appendChild(styleDetails);

function creerChampsDetails(){
const bouton=document.getElementById('ajout-publier');
if(!bouton||document.getElementById('dp-bloc')) return;
const bloc=document.createElement('div');
bloc.id='dp-bloc';
bloc.innerHTML=`
<label>Catégorie</label>
<select id="dp-categorie" class="sel-produit"><option value="">Choisir une catégorie</option>${CATEGORIES_PRODUIT.map(c=>`<option>${c}</option>`).join('')}</select>
<label>État du produit</label>
<select id="dp-etat" class="sel-produit"><option value="">Choisir l'état</option>${ETATS_PRODUIT.map(e=>`<option>${e}</option>`).join('')}</select>
<label>Couleurs disponibles</label>
<div id="dp-couleurs">${COULEURS_PRODUIT.map(c=>`<button type="button" class="puce" data-c="${c}" onclick="basculerCouleur(this)">${c}</button>`).join('')}</div>
`;
bouton.insertAdjacentElement('beforebegin',bloc);
}
creerChampsDetails();

function basculerCouleur(btn){
const c=btn.dataset.c;
if(couleursChoisies.includes(c)) couleursChoisies=couleursChoisies.filter(x=>x!==c);
else couleursChoisies=couleursChoisies.concat([c]);
btn.classList.toggle('on',couleursChoisies.includes(c));
}

function reinitialiserDetails(){
document.getElementById('dp-categorie').value='';
document.getElementById('dp-etat').value='';
couleursChoisies=[];
document.querySelectorAll('#dp-couleurs .puce').forEach(b=>b.classList.remove('on'));
}

async function chargerDetailsEdition(id){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?select=categorie,etat,couleurs&id=eq.'+id+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) return;
const p=(await r.json())[0];
if(!p) return;
document.getElementById('dp-categorie').value=p.categorie||'';
document.getElementById('dp-etat').value=p.etat||'';
couleursChoisies=p.couleurs?p.couleurs.split(',').map(x=>x.trim()).filter(Boolean):[];
document.querySelectorAll('#dp-couleurs .puce').forEach(b=>b.classList.toggle('on',couleursChoisies.includes(b.dataset.c)));
}catch(e){}
}

const voirAjoutAvantDetails=voirAjout;
voirAjout=async function(origine){
await voirAjoutAvantDetails(origine);
reinitialiserDetails();
};

const modifierProduitAvantDetails=modifierProduit;
modifierProduit=async function(id){
await modifierProduitAvantDetails(id);
if(editId===id) await chargerDetailsEdition(id);
};

publier=async function(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil pour publier.');montrer('profil');return;}
const nom=document.getElementById('nom').value.trim();
const prix=document.getElementById('prix').value.trim();
const desc=document.getElementById('desc').value.trim();
if(!nom||!prix){alert('Indiquez au moins le nom et le prix.');return;}
const corps={
nom:nom,
prix:Number(prix).toLocaleString('fr-FR')+' FCFA',
description:desc||null,
categorie:document.getElementById('dp-categorie').value||'Autres',
etat:document.getElementById('dp-etat').value||null,
couleurs:couleursChoisies.length?couleursChoisies.join(', '):null
};
const modification=editId!==null;
let url=SUPABASE_URL+'/rest/v1/produits';
let methode='POST';
if(modification){
url+='?id=eq.'+editId;
methode='PATCH';
if(photoChoisie) corps.photo=photoChoisie;
}else{
corps.photo=photoChoisie||null;
corps.user_id=s.user_id;
}
try{
const r=await fetch(url,{method:methode,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
}catch(e){
alert('Erreur, enregistrement impossible. Réessayez.');
return;
}
editId=null;
await chargerProduits();
retourVers(origineAjout);
};
