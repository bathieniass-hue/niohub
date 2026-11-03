const CATEGORIES_PRODUIT=["Mode","Tech","Maison","Beauté","Alimentation","Autres"];
const ETATS_PRODUIT=["Neuf","Comme neuf","Bon état","Occasion"];
const COULEURS_PRODUIT=[
{nom:"Vert",hex:"#1E9E4A"},
{nom:"Bleu",hex:"#1565C0"},
{nom:"Rouge",hex:"#D32F2F"},
{nom:"Jaune",hex:"#FBC02D"},
{nom:"Noir",hex:"#111111"},
{nom:"Blanc",hex:"#FFFFFF"},
{nom:"Orange",hex:"#F57C00"},
{nom:"Beige",hex:"#D7C4A3"},
{nom:"Marron",hex:"#6D4C41"},
{nom:"Gris",hex:"#9E9E9E"},
{nom:"Rose",hex:"#F48FB1"}
];
let choixDetails={categorie:'',etat:''};
let couleursChoisies=[];

const styleDetails=document.createElement('style');
styleDetails.textContent=`
#dp-card{background:#fff;border:1px solid #E6DECB;border-radius:12px;overflow:hidden;margin-top:8px}
.dp-row{display:flex;align-items:center;padding:6px 12px;border-top:1px solid #EDE5D3;font-family:sans-serif;color:#1E1A14;line-height:1.2;box-sizing:border-box;cursor:pointer}
#dp-card > .dp-row:first-child{border-top:0}
.dp-label{width:66px;flex-shrink:0;color:#6B6254;font-size:13px;line-height:1.2}
.dp-valeur{flex:1;font-weight:bold;font-size:13px;line-height:1.2;min-width:0;text-align:left;padding-left:0}
.dp-valeur.vide{font-weight:normal;color:#9A9080}
.dp-chev{font-size:16px;line-height:1;color:#1E1A14;margin-left:4px;flex-shrink:0}
.dp-couleurs{display:flex;align-items:flex-start;flex:1;min-width:0;overflow-x:auto;gap:6px;padding:2px 2px 2px 4px;scrollbar-width:none;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent)}
.dp-couleurs::-webkit-scrollbar{display:none}
.dp-sw{flex-shrink:0;width:36px;min-height:0;height:auto;text-align:center;background:none;border:0;padding:0;margin:0;font-family:sans-serif;color:#1E1A14;font-size:10px;line-height:1}
.dp-pastille{width:26px;height:26px;border-radius:13px;border:1px solid #8A8170;margin:0 auto 2px;box-sizing:border-box}
.dp-sw.on .dp-pastille{box-shadow:0 0 0 2px #fff,0 0 0 3px #0E6B47}
.dp-choix{display:flex;justify-content:space-between;align-items:center;width:100%;padding:12px 4px;border:0;border-bottom:1px solid #EDE5D3;background:#fff;font-size:15px;color:#1E1A14;font-family:sans-serif;text-align:left;box-sizing:border-box}
.dp-choix:last-child{border-bottom:0}
.dp-choix.on{color:#0E6B47;font-weight:bold}
#dp-card #desc{display:block;width:100%;box-sizing:border-box;border:0;border-top:1px solid #EDE5D3;border-radius:0;margin:0;padding:8px 12px;min-height:56px;font-size:13px;line-height:1.3;font-family:sans-serif;background:#fff;outline:none;resize:vertical;color:#1E1A14}
`;
document.head.appendChild(styleDetails);

function creerChampsDetails(){
const bouton=document.getElementById('ajout-publier');
const desc=document.getElementById('desc');
if(!bouton||!desc||document.getElementById('dp-card')) return;
const lab=desc.previousElementSibling;
if(lab&&lab.tagName==='LABEL') lab.remove();
desc.placeholder='description et détails';

const carte=document.createElement('div');
carte.id='dp-card';
carte.innerHTML=`
<div class="dp-row" onclick="ouvrirOption('categorie')">
<span class="dp-label">Catégorie</span>
<span class="dp-valeur vide" id="dp-val-categorie">Choisir</span>
<span class="dp-chev">›</span>
</div>
<div class="dp-row">
<span class="dp-label">Couleur</span>
<div class="dp-couleurs">${COULEURS_PRODUIT.map(c=>`<button type="button" class="dp-sw" data-c="${c.nom}" onclick="basculerCouleur(this)"><div class="dp-pastille" style="background:${c.hex}"></div>${c.nom.toLowerCase()}</button>`).join('')}</div>
<span class="dp-chev">›</span>
</div>
<div class="dp-row" onclick="ouvrirOption('etat')">
<span class="dp-label">État</span>
<span class="dp-valeur vide" id="dp-val-etat">Choisir</span>
<span class="dp-chev">›</span>
</div>
`;
carte.appendChild(desc);
bouton.insertAdjacentElement('beforebegin',carte);
}
creerChampsDetails();

function creerModalDetails(){
if(document.getElementById('dp-modal')) return;
const m=document.createElement('div');
m.id='dp-modal';
m.style.cssText='display:none;position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(30,26,20,.45);z-index:1000;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
m.onclick=fermerOption;
m.innerHTML=`<div id="dp-modal-box" style="background:#fff;border-radius:14px;width:100%;max-width:300px;padding:12px 16px 8px;box-sizing:border-box;font-family:sans-serif;max-height:80vh;overflow-y:auto"><div id="dp-modal-titre" style="font-weight:bold;font-size:15px;color:#1E1A14;padding:4px 4px 8px"></div><div id="dp-modal-liste"></div></div>`;
m.querySelector('#dp-modal-box').onclick=e=>e.stopPropagation();
document.body.appendChild(m);
}
creerModalDetails();

function rafraichirDetails(){
['categorie','etat'].forEach(n=>{
const val=document.getElementById('dp-val-'+n);
val.textContent=choixDetails[n]||'Choisir';
val.className='dp-valeur'+(choixDetails[n]?'':' vide');
});
document.querySelectorAll('#dp-card .dp-sw').forEach(b=>b.classList.toggle('on',couleursChoisies.includes(b.dataset.c)));
}

function ouvrirOption(n){
const titre=n==='categorie'?'Catégorie':'État';
const liste=n==='categorie'?CATEGORIES_PRODUIT:ETATS_PRODUIT;
document.getElementById('dp-modal-titre').textContent=titre;
document.getElementById('dp-modal-liste').innerHTML=liste.map(v=>`<button type="button" class="dp-choix${choixDetails[n]===v?' on':''}" onclick="choisirOption('${n}','${v}')"><span>${v}</span><span>${choixDetails[n]===v?'✓':''}</span></button>`).join('');
document.getElementById('dp-modal').style.display='flex';
}

function fermerOption(){
const m=document.getElementById('dp-modal');
if(m) m.style.display='none';
}

function choisirOption(n,v){
choixDetails[n]=v;
fermerOption();
rafraichirDetails();
}

function basculerCouleur(btn){
const c=btn.dataset.c;
couleursChoisies=couleursChoisies.includes(c)?couleursChoisies.filter(x=>x!==c):couleursChoisies.concat([c]);
rafraichirDetails();
}

function reinitialiserDetails(){
choixDetails={categorie:'',etat:''};
couleursChoisies=[];
rafraichirDetails();
}

async function chargerDetailsEdition(id){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?select=categorie,etat,couleurs&id=eq.'+id+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) return;
const p=(await r.json())[0];
if(!p) return;
choixDetails={categorie:p.categorie||'',etat:p.etat||''};
couleursChoisies=p.couleurs?p.couleurs.split(',').map(x=>x.trim()).filter(Boolean):[];
rafraichirDetails();
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
categorie:choixDetails.categorie||'Autres',
etat:choixDetails.etat||null,
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
