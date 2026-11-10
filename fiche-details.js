const styleFicheDetails=document.createElement('style');
styleFicheDetails.textContent=`
#fprix{font-size:22px;font-weight:bold;line-height:1.2;margin:0 0 2px}
#fcat{font-size:12px;color:#8A8170;line-height:1.2;margin:0}
#fnom{font-size:19px;font-weight:bold;line-height:1.25;margin:0 0 10px}
#fd-details{margin:0 0 14px}
#fd-details .fd-ligne{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:8px 0;border-top:1px solid #EDE5D3;font-size:14px;color:#1E1A14}
#fd-details .fd-ligne:first-child{border-top:0}
#fd-details .fd-label{color:#6B6254}
#fd-details .fd-val{font-weight:bold}
#fd-details .fd-pastilles{display:flex;flex-wrap:wrap;gap:6px 12px}
#fd-details .fd-pastille{display:inline-flex;align-items:center;gap:5px;font-size:13px}
#fd-details .fd-rond{width:14px;height:14px;border-radius:7px;border:1px solid #8A8170;display:inline-block;box-sizing:border-box;flex-shrink:0}
#fd-desc-titre{font-size:13px;color:#6B6254;margin:0 0 4px}
#similaires{margin-top:14px}
.sim-titre{font-size:14px;font-weight:bold;margin:0 0 8px;color:#1E1A14}
.sim-grille{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.sim-carte{background:#fff;border:1px solid #E6DECB;border-radius:12px;overflow:hidden;cursor:pointer}
.sim-img{height:110px;background:#D9B26F}
.sim-img img{width:100%;height:100%;object-fit:cover;display:block}
.sim-info{padding:8px}
.sim-nom{font-size:13px;font-weight:bold;color:#1E1A14;line-height:1.2}
.sim-prix{font-size:12px;color:#0E6B47;font-weight:bold;margin-top:2px}
`;
document.head.appendChild(styleFicheDetails);

function arrangerFiche(p){
const corps=document.querySelector('#fiche .corps');
if(!corps||!p) return;
const prix=document.getElementById('fprix');
const nom=document.getElementById('fnom');
const desc=document.getElementById('fdesc');
const boutique=corps.querySelector('.boutique');

let cat=document.getElementById('fcat');
if(!cat){cat=document.createElement('div');cat.id='fcat';}
cat.textContent=p.categorie||'';
cat.style.display=p.categorie?'block':'none';

let zone=document.getElementById('fd-details');
if(!zone){zone=document.createElement('div');zone.id='fd-details';}
const couleurs=p.couleurs?String(p.couleurs).split(',').map(x=>x.trim()).filter(Boolean):[];
const lignes=[];
if(p.etat) lignes.push(`<div class="fd-ligne"><span class="fd-label">État</span><span class="fd-val">${esc(p.etat)}</span></div>`);
if(couleurs.length){
const pastilles=couleurs.map(n=>{
const c=COULEURS_PRODUIT.find(x=>x.nom===n);
return `<span class="fd-pastille"><span class="fd-rond" style="background:${c?c.hex:'#FFFFFF'}"></span>${esc(n)}</span>`;
}).join('');
lignes.push(`<div class="fd-ligne"><span class="fd-label">Couleurs disponibles</span><div class="fd-pastilles">${pastilles}</div></div>`);
}
zone.innerHTML=lignes.join('');
zone.style.display=lignes.length?'block':'none';

let titreDesc=document.getElementById('fd-desc-titre');
if(!titreDesc){titreDesc=document.createElement('div');titreDesc.id='fd-desc-titre';titreDesc.textContent='Description et détails';}

if(prix) corps.appendChild(prix);
corps.appendChild(cat);
if(nom) corps.appendChild(nom);
corps.appendChild(zone);
corps.appendChild(titreDesc);
if(desc) corps.appendChild(desc);
if(boutique) corps.appendChild(boutique);
afficherSimilaires(p);
}

function afficherSimilaires(p){
const corps=document.querySelector('#fiche .corps');
if(!corps) return;
let zone=document.getElementById('similaires');
if(!zone){
zone=document.createElement('div');
zone.id='similaires';
}
const liste=tous().filter(x=>x.id&&x.id!==p.id&&x.categorie&&x.categorie===p.categorie).slice(0,6);
if(!liste.length){
zone.style.display='none';
return;
}
zone.innerHTML=`<div class="sim-titre">Produits similaires</div><div class="sim-grille">${liste.map(x=>{
const mini=urlMiniature(x.photo);
const image=mini?`<img src="${esc(mini)}" loading="lazy" alt="">`:'';
return `<div class="sim-carte" onclick="ouvrirParId(${Number(x.id)})"><div class="sim-img" style="background:${x.couleur||'#D9B26F'}">${image}</div><div class="sim-info"><div class="sim-nom">${esc(x.nom)}</div><div class="sim-prix">${esc(x.prix)}</div></div></div>`;
}).join('')}</div>`;
zone.style.display='block';
corps.appendChild(zone);
}

const ouvrirParIdAvant=ouvrirParId;
ouvrirParId=function(id){
ouvrirParIdAvant(id);
const i=tous().findIndex(x=>Number(x.id)===Number(id));
if(i>=0) arrangerFiche(tous()[i]);
};
