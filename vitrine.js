const styleVitrine=document.createElement('style');
styleVitrine.textContent='.voir-boutique{margin-top:8px;color:#0E6B47;font-weight:bold;font-size:13px}';
document.head.appendChild(styleVitrine);

function creerPageVitrine(){
if(document.getElementById('vitrine')) return;
const p=document.createElement('div');
p.id='vitrine';
p.className='page';
document.body.appendChild(p);
}
creerPageVitrine();

async function chargerBoutiqueDe(userId){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+userId+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
return (await r.json())[0]||null;
}catch(e){return null;}
}

async function voirVitrine(userId){
if(!userId){alert('Cette boutique n\'est pas disponible.');return;}
const fiche=document.getElementById('fiche');
const venantDeFiche=!!fiche&&fiche.style.display==='block';
const retour=venantDeFiche?"montrer('fiche')":"voirAccueil()";
const p=document.getElementById('vitrine');
p.innerHTML=`<header><button class="retour" onclick="${retour}">←</button><span style="font-weight:bold;font-size:18px">Boutique</span><span></span></header><div id="vit-corps">Chargement…</div>`;
montrer('vitrine');
const [b,avis]=await Promise.all([chargerBoutiqueDe(userId),chargerAvisVendeur(userId)]);
const zone=document.getElementById('vit-corps');
if(!zone) return;
if(!b){zone.innerHTML='<div class="liste" style="margin-top:0">Cette boutique n\'est pas encore ouverte.</div>';return;}
await chargerProduits();
const prods=distants.filter(x=>x.user_id===userId);
const tel=[b.telephone,b.telephone2].filter(Boolean);
const num=String(tel[0]||'').replace(/\D/g,'');
const wa=num?'https://wa.me/'+(num.length===9?'221'+num:num):'#';
zone.innerHTML=`
<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center">
<div class="avatar" style="width:64px;height:64px;flex-shrink:0;background:${b.logo?'url('+b.logo+') center/cover':'#F2B233'}">${b.logo?'':esc((b.nom||'N').charAt(0).toUpperCase())}</div>
<div style="flex:1;min-width:0"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div>
<div style="color:#F2B233;font-size:14px">${etoiles(moyenne(avis))} <span style="color:#1E1A14;font-weight:bold">${texteMoyenne(avis)}</span> <span style="font-size:12px;color:#6B6254">(${avis.length} avis)</span></div></div>
</div>
<div class="liste" style="margin-top:10px;font-size:13px">
<div>Adresse : ${esc(b.adresse||'Non indiquée')}</div>
<div style="margin-top:4px">Tél : ${tel.length?tel.map(esc).join(' / '):'Non indiqué'}</div>
<div style="margin-top:8px">${esc(b.description||'Pas de description.')}</div>
</div>
<div style="display:flex;gap:10px;margin-top:6px">
<a class="btn" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block" href="tel:${esc(tel[0]||'')}">Appeler</a>
<a class="btn2" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block;margin-top:0" href="${wa}" target="_blank">WhatsApp</a>
</div>
<label>Produits (${prods.length})</label>
${prods.length?`<div class="grid" style="padding:6px 0 30px">${prods.map(x=>`<div class="card" onclick="ouvrirProduitVitrine(${x.id})"><div class="img" style="background:${fond(x)}"></div><div class="info"><div class="name">${esc(x.nom)}</div><div class="price">${esc(x.prix)}</div></div></div>`).join('')}</div>`:'<div class="liste">Aucun produit publié pour l\'instant.</div>'}
<label>Avis des clients</label>
<div class="liste" style="margin-top:0">${avis.length?avis.map(a=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-weight:bold;font-size:14px">${esc(a.auteur)} <span style="color:#F2B233;font-weight:normal">${etoiles(a.note)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:''}</div>`).join(''):'Aucun avis pour l\'instant.'}</div>
<div style="font-size:12px;color:#6B6254;margin-top:8px">Pour donner un avis, ouvrez un produit de cette boutique.</div>`;
}

function ouvrirProduitVitrine(id){
const i=tous().findIndex(x=>x.id===id);
if(i>=0) ouvrir(i);
}

const afficherBoutiqueFicheAvantVitrine=afficherBoutiqueFiche;
afficherBoutiqueFiche=async function(userId){
await afficherBoutiqueFicheAvantVitrine(userId);
const zone=document.querySelector('#fiche .boutique');
if(zone&&userId&&!zone.querySelector('.voir-boutique')){
const d=document.createElement('div');
d.className='voir-boutique';
d.textContent='Voir la boutique ›';
zone.appendChild(d);
}
};

document.addEventListener('click',e=>{
const cible=e.target;
if(!cible.closest) return;
if(cible.closest('button, a, input, select, textarea')) return;
const zone=cible.closest('#fiche .boutique');
if(!zone) return;
if(typeof produitOuvert!=='undefined'&&produitOuvert&&produitOuvert.user_id) voirVitrine(produitOuvert.user_id);
});

const stylePied=document.createElement('style');
stylePied.textContent=`
#fdp-pied{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 16px 6px}
#fdp-gauche,#fdp-droite{display:flex;align-items:center;min-width:0}
#fdp-gauche>*{margin:0 !important;width:auto !important;height:auto !important;min-height:0 !important;padding:5px 12px !important;font-size:12px !important;line-height:1.2 !important;border:1px solid #0E6B47 !important;border-radius:14px !important;background:#fff !important;color:#0E6B47 !important;font-weight:bold !important;box-shadow:none !important;display:inline-block !important;text-decoration:none}
#fdp-droite>*{margin:0 !important;font-size:13px;font-weight:bold;color:#0E6B47;cursor:pointer;white-space:nowrap}
`;
document.head.appendChild(stylePied);

function creerPiedFiche(){
const fiche=document.getElementById('fiche');
const bar=fiche?fiche.querySelector('.bar'):null;
if(!fiche||!bar||document.getElementById('fdp-pied')) return;
const pied=document.createElement('div');
pied.id='fdp-pied';
pied.innerHTML='<div id="fdp-gauche"></div><div id="fdp-droite"></div>';
fiche.insertBefore(pied,bar);
}
creerPiedFiche();

function trouverDansFiche(motif){
const fiche=document.getElementById('fiche');
const pied=document.getElementById('fdp-pied');
if(!fiche||!pied) return null;
const trouve=Array.from(fiche.querySelectorAll('button,a,div,span')).find(el=>!pied.contains(el)&&el.children.length===0&&motif.test(el.textContent||''));
return trouve?(trouve.closest('button,a')||trouve):null;
}

function rangerPiedFiche(){
const gauche=document.getElementById('fdp-gauche');
const droite=document.getElementById('fdp-droite');
if(gauche&&!gauche.children.length){
const avis=trouverDansFiche(/voir les avis/i);
if(avis) gauche.appendChild(avis);
}
if(droite&&!droite.children.length){
const boutique=trouverDansFiche(/voir la boutique/i);
if(boutique){
boutique.onclick=()=>{
if(typeof produitOuvert!=='undefined'&&produitOuvert&&produitOuvert.user_id) voirVitrine(produitOuvert.user_id);
};
droite.appendChild(boutique);
}
}
}

function viderPiedFiche(){
const g=document.getElementById('fdp-gauche');
const d=document.getElementById('fdp-droite');
if(g) g.innerHTML='';
if(d) d.innerHTML='';
}

const ouvrirAvantPied=ouvrir;
ouvrir=function(i){
viderPiedFiche();
ouvrirAvantPied(i);
rangerPiedFiche();
};

const fichePied=document.getElementById('fiche');
if(fichePied) new MutationObserver(()=>rangerPiedFiche()).observe(fichePied,{childList:true,subtree:true});
