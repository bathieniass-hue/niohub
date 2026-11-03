const styleVitrine=document.createElement('style');
styleVitrine.textContent=`
#fd-bas{width:100%;flex:0 0 100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #EDE5D3}
#fd-bas .fd-avis{width:auto !important;margin:0 !important;padding:5px 12px !important;font-size:12px !important;line-height:1.2 !important;min-height:0 !important;border:1px solid #0E6B47 !important;border-radius:14px !important;background:#fff !important;color:#0E6B47 !important;font-weight:bold !important;box-shadow:none !important}
#fd-bas .fd-voirboutique{margin:0 !important;padding:0 !important;border:0 !important;background:none !important;font-size:13px;font-weight:bold;color:#0E6B47;font-family:sans-serif;cursor:pointer;white-space:nowrap}
`;
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

document.addEventListener('click',e=>{
const cible=e.target;
if(!cible.closest) return;
if(cible.closest('button, a, input, select, textarea')) return;
const zone=cible.closest('#fiche .boutique');
if(!zone) return;
if(typeof produitOuvert!=='undefined'&&produitOuvert&&produitOuvert.user_id) voirVitrine(produitOuvert.user_id);
});

function trouverBlocBoutique(){
const blocs=Array.from(document.querySelectorAll('#fiche .boutique'));
const avecCarte=blocs.find(b=>b.querySelector('.avatar,.nomboutique'));
if(avecCarte) return avecCarte;
const avecTexte=blocs.find(b=>(b.textContent||'').trim().length>10);
return avecTexte||blocs[blocs.length-1]||null;
}

function trouverBoutonFiche(motif){
const fiche=document.getElementById('fiche');
const rangee=document.getElementById('fd-bas');
if(!fiche) return null;
const el=Array.from(fiche.querySelectorAll('button,a,div,span')).find(x=>(!rangee||!rangee.contains(x))&&x.children.length===0&&motif.test(x.textContent||''));
return el?(el.closest('button,a')||el):null;
}

function rangerBlocBoutique(){
const bloc=trouverBlocBoutique();
if(!bloc) return;
bloc.style.flexWrap='wrap';
let rangee=document.getElementById('fd-bas');
if(!rangee){
rangee=document.createElement('div');
rangee.id='fd-bas';
}
if(rangee.parentElement===bloc&&rangee.querySelector('.fd-avis')&&rangee.querySelector('.fd-voirboutique')) return;
const avis=trouverBoutonFiche(/voir les avis/i);
if(avis){
avis.classList.add('fd-avis');
rangee.insertBefore(avis,rangee.firstChild);
}
if(!rangee.querySelector('.fd-voirboutique')){
const vb=document.createElement('button');
vb.type='button';
vb.className='fd-voirboutique';
vb.textContent='Voir la boutique ›';
vb.onclick=()=>{
if(typeof produitOuvert!=='undefined'&&produitOuvert&&produitOuvert.user_id) voirVitrine(produitOuvert.user_id);
};
rangee.appendChild(vb);
}
if(rangee.parentElement!==bloc) bloc.appendChild(rangee);
}

const afficherBoutiqueFicheAvantVitrine=afficherBoutiqueFiche;
afficherBoutiqueFiche=async function(userId){
await afficherBoutiqueFicheAvantVitrine(userId);
rangerBlocBoutique();
};

const ouvrirAvantVitrineBloc=ouvrir;
ouvrir=function(i){
ouvrirAvantVitrineBloc(i);
rangerBlocBoutique();
setTimeout(rangerBlocBoutique,300);
setTimeout(rangerBlocBoutique,800);
};

const ficheObservee=document.getElementById('fiche');
if(ficheObservee) new MutationObserver(()=>rangerBlocBoutique()).observe(ficheObservee,{childList:true,subtree:true});
