const CATEGORIES_PRODUIT=["Mode & accessoires","Téléphone & high-tech","Maison & décoration","Beauté & hygiène","Alimentation","Sport et loisir","Électroménager","Bébé & enfants","École & bureau","Auto & moto","Autres"];
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
const LARGEUR_LIBELLE=72;
const PRIX_MAX=100000000;
const PHOTO_MAX=390000;
let choixDetails={categorie:'',etat:''};
let couleursChoisies=[];
let publicationEnCours=false;

const styleDetails=document.createElement('style');
styleDetails.textContent=`
#dp-card{background:#fff;border:1px solid #E6DECB;border-radius:12px;overflow:hidden;margin-top:8px}
.dp-row{display:grid;grid-template-columns:${LARGEUR_LIBELLE}px minmax(0,1fr) 14px;align-items:center;padding:6px 12px;border-top:1px solid #EDE5D3;font-family:sans-serif;color:#1E1A14;line-height:1.2;box-sizing:border-box}
#dp-card .dp-row > *{grid-column:auto !important;grid-row:auto !important;margin:0 !important;text-align:left !important}
#dp-card .dp-chev{text-align:right !important}
.dp-cliquable{cursor:pointer}
#dp-card > .dp-row:first-child{border-top:0}
.dp-label{color:#6B6254;font-size:13px;line-height:1.2}
.dp-valeur{font-weight:bold;font-size:13px;line-height:1.2;min-width:0;padding-left:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1E1A14}
.dp-valeur.dp-vide{font-weight:bold;color:#9A9080}
.dp-chev{font-size:16px;line-height:1;color:#1E1A14}
.dp-couleurs{display:flex;align-items:flex-start;min-width:0;overflow-x:auto;gap:6px;padding:2px 2px 2px 0;scrollbar-width:none;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent)}
.dp-couleurs::-webkit-scrollbar{display:none}
.dp-sw{flex-shrink:0;width:36px;min-height:0;height:auto;text-align:center;background:none;border:0;padding:0;margin:0;font-family:sans-serif;color:#1E1A14;font-size:10px;line-height:1}
.dp-pastille{width:26px;height:26px;border-radius:13px;border:1px solid #8A8170;margin:0 auto 2px;box-sizing:border-box}
.dp-sw.on .dp-pastille{box-shadow:0 0 0 2px #fff,0 0 0 3px #0E6B47}
.dp-choix{display:block;width:100%;padding:12px 14px;border:0;border-top:1px solid #F3EEE2;background:#fff;font-size:15px;color:#1E1A14;font-family:sans-serif;text-align:left;box-sizing:border-box}
.dp-choix:first-child{border-top:0}
.dp-choix.on{color:#0E6B47;font-weight:bold}
@keyframes dpPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
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
<div class="dp-row dp-cliquable" id="dp-row-categorie" onclick="ouvrirOption('categorie',event)">
<span class="dp-label">Catégorie</span>
<span class="dp-valeur dp-vide" id="dp-val-categorie">Choisir</span>
<span class="dp-chev">›</span>
</div>
<div class="dp-row dp-cliquable" id="dp-row-etat" onclick="ouvrirOption('etat',event)">
<span class="dp-label">État</span>
<span class="dp-valeur dp-vide" id="dp-val-etat">Choisir</span>
<span class="dp-chev">›</span>
</div>
<div class="dp-row">
<span class="dp-label">Couleur</span>
<div class="dp-couleurs">${COULEURS_PRODUIT.map(c=>`<button type="button" class="dp-sw" data-c="${c.nom}" onclick="basculerCouleur(this)"><div class="dp-pastille" style="background:${c.hex}"></div>${c.nom.toLowerCase()}</button>`).join('')}</div>
<span class="dp-chev">›</span>
</div>
`;
carte.appendChild(desc);
bouton.insertAdjacentElement('beforebegin',carte);
}
creerChampsDetails();

function creerPopover(){
if(document.getElementById('dp-fond')) return;
const fond=document.createElement('div');
fond.id='dp-fond';
fond.style.cssText='display:none;position:fixed;top:0;right:0;bottom:0;left:0;background:transparent;z-index:999';
fond.onclick=fermerOption;
const box=document.createElement('div');
box.id='dp-pop';
box.style.cssText='position:fixed;background:#fff;border:1px solid #E6DECB;border-radius:12px;box-shadow:0 8px 24px rgba(30,26,20,.18);padding:4px 0;max-height:280px;overflow-y:auto;z-index:1001;box-sizing:border-box;font-family:sans-serif';
box.onclick=e=>e.stopPropagation();
fond.appendChild(box);
document.body.appendChild(fond);
}
creerPopover();

function rafraichirDetails(){
['categorie','etat'].forEach(n=>{
const val=document.getElementById('dp-val-'+n);
val.textContent=choixDetails[n]||'Choisir';
val.className='dp-valeur'+(choixDetails[n]?'':' dp-vide');
});
document.querySelectorAll('#dp-card .dp-sw').forEach(b=>b.classList.toggle('on',couleursChoisies.includes(b.dataset.c)));
}

function ouvrirOption(n,ev){
creerPopover();
const liste=n==='categorie'?CATEGORIES_PRODUIT:ETATS_PRODUIT;
const titre=n==='categorie'?'Catégorie':'État';
const ligne=document.getElementById('dp-row-'+n);
const r=ligne.getBoundingClientRect();
const x=ev&&ev.clientX?ev.clientX:r.left+r.width/2;
const y=ev&&ev.clientY?ev.clientY:r.top+r.height/2;
const box=document.getElementById('dp-pop');
box.innerHTML=`<div style="font-weight:bold;font-size:12px;color:#6B6254;padding:8px 14px 4px">${titre}</div>`+liste.map(v=>`<button type="button" class="dp-choix${choixDetails[n]===v?' on':''}" onclick="choisirOption('${n}','${v}')">${v}</button>`).join('');
const colonneValeur=r.left+12+LARGEUR_LIBELLE;
const largeur=Math.max(180,Math.min(240,window.innerWidth-colonneValeur-12));
const gauche=Math.max(12,Math.min(colonneValeur,window.innerWidth-largeur-12));
const hauteur=Math.min(280,(liste.length+1)*44+8);
let haut=r.bottom+4;
if(haut+hauteur>window.innerHeight-12) haut=Math.max(12,r.top-hauteur-4);
box.style.width=largeur+'px';
box.style.left=gauche+'px';
box.style.top=haut+'px';
box.style.transformOrigin=(x-gauche)+'px '+(y-haut)+'px';
box.style.animation='dpPop .18s ease-out';
document.getElementById('dp-fond').style.display='block';
}

function fermerOption(){
const f=document.getElementById('dp-fond');
if(f) f.style.display='none';
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

function remplirDetailsDepuis(p){
choixDetails={categorie:p.categorie||'',etat:p.etat||''};
couleursChoisies=p.couleurs?String(p.couleurs).split(',').map(x=>x.trim()).filter(Boolean):[];
rafraichirDetails();
}

const voirAjoutAvantDetails=voirAjout;
voirAjout=async function(origine){
await voirAjoutAvantDetails(origine);
reinitialiserDetails();
};

const modifierProduitAvantDetails=modifierProduit;
modifierProduit=async function(id){
await modifierProduitAvantDetails(id);
if(editId===id){
const p=distants.find(x=>x.id===id);
if(p) remplirDetailsDepuis(p);
}
};

async function lireErreurSupabase(r){
let texte='';
try{
texte=await r.text();
}catch(e){}
let detail='';
try{
const j=JSON.parse(texte);
detail=j.message||j.error_description||j.error||j.msg||'';
}catch(e){}
detail=String(detail||texte||'').slice(0,180);
return 'Erreur ' + r.status + (detail?' : ' + detail:'');
}

publier=async function(){
if(publicationEnCours) return;
publicationEnCours=true;
const bouton=document.getElementById('ajout-publier');
if(bouton){bouton.disabled=true;bouton.textContent='Envoi en cours…';}
try{
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil pour publier.');montrer('profil');return;}
const nom=document.getElementById('nom').value.trim();
const prixSaisi=document.getElementById('prix').value.trim();
const desc=document.getElementById('desc').value.trim();
if(!nom||!prixSaisi){bandeau('Indiquez au moins le nom et le prix.','erreur');return;}
const prix=Math.round(Number(prixSaisi));
if(!(prix>0)||prix>PRIX_MAX){bandeau('Le prix doit être un nombre entre 1 et '+PRIX_MAX.toLocaleString('fr-FR')+' FCFA.','erreur');return;}
if(nom.length>100){bandeau('Le nom est trop long (100 caractères maximum).','erreur');return;}
if(desc.length>2000){bandeau('La description est trop longue (2000 caractères maximum).','erreur');return;}
if(photoBlob&&photoBlob.size>PHOTO_MAX){bandeau('Cette photo est trop lourde. Choisissez-en une plus légère.','erreur');return;}
const corps={
nom:nom,
prix:prix.toLocaleString('fr-FR')+' FCFA',
description:desc||null,
categorie:choixDetails.categorie||'Autres',
etat:choixDetails.etat||null,
couleurs:couleursChoisies.length?couleursChoisies.join(', '):null
};
const modification=editId!==null;
let url=SUPABASE_URL+'/rest/v1/produits';
let methode='POST';
if(modification){
url+='?id=eq.'+editId+'&user_id=eq.'+s.user_id;
methode='PATCH';
}else{
corps.photo=null;
corps.user_id=s.user_id;
}
let nouvelleUrl=null;
try{
if(photoBlob){
try{
nouvelleUrl=await televerserPhoto(photoBlob,photoMiniBlob,s);
}catch(e){
bandeau('Envoi de la photo impossible. Vérifiez votre connexion ou réessayez avec une autre photo.','erreur');
return;
}
corps.photo=nouvelleUrl;
}
const r=await fetch(url,{method:methode,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:modification?'return=representation':'return=minimal'},body:JSON.stringify(corps)});
if(!r.ok){
const detail=await lireErreurSupabase(r);
bandeau('Enregistrement impossible. ' + detail,'erreur');
return;
}
if(modification){
const lignes=await r.json();
if(!lignes.length){
bandeau('Enregistrement impossible : produit non trouvé ou non autorisé.','erreur');
return;
}
}
}catch(e){
bandeau('Enregistrement impossible. Vérifiez votre connexion et réessayez.','erreur');
return;
}
if(modification&&nouvelleUrl&&photoExistante) await supprimerPhotoStockee(photoExistante,s);
editId=null;
await chargerProduits();
retourVers(origineAjout);
}finally{
publicationEnCours=false;
if(bouton){bouton.disabled=false;bouton.textContent=editId===null?'Publier':'Enregistrer les modifications';}
}
};
