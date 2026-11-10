const styleVitrine=document.createElement('style');
styleVitrine.textContent=`
#fd-bas{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #EDE5D3}
#fd-bas .fd-avis{width:auto !important;margin:0 !important;padding:5px 12px !important;font-size:12px !important;line-height:1.2 !important;min-height:0 !important;height:auto !important;border:1px solid #0E6B47 !important;border-radius:14px !important;background:#fff !important;color:#0E6B47 !important;font-weight:bold !important;box-shadow:none !important}
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

let limiteVitrine=20;
let produitsVitrine=[];

async function chargerBoutiqueDe(userId){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+encodeURIComponent(userId)+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
return {boutique:(await r.json())[0]||null};
}catch(e){return {erreur:true};}
}

async function voirVitrine(userId){
if(!userId){bandeau('Cette boutique n\'est pas disponible.','erreur');return;}
const fiche=document.getElementById('fiche');
const venantDeFiche=!!fiche&&fiche.style.display==='block';
const retour=venantDeFiche?"montrer('fiche')":"voirAccueil()";
const p=document.getElementById('vitrine');
p.innerHTML=`<header><button class="retour" onclick="${retour}">←</button><span style="font-weight:bold;font-size:18px">Boutique</span><span></span></header><div id="vit-corps">Chargement…</div>`;
montrer('vitrine');
const [res,avis]=await Promise.all([chargerBoutiqueDe(userId),chargerAvisVendeur(userId)]);
const zone=document.getElementById('vit-corps');
if(!zone) return;
if(res.erreur){
zone.innerHTML=`<div class="liste" style="margin-top:0">Impossible de charger la boutique. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" onclick="voirVitrine('${esc(userId)}')">Réessayer</button></div>`;
return;
}
const b=res.boutique;
if(!b){zone.innerHTML='<div class="liste" style="margin-top:0">Cette boutique n\'est pas encore ouverte.</div>';return;}
if(!distants.length) await chargerProduits();
const prods=distants.filter(x=>x.user_id===userId);
produitsVitrine=prods;
limiteVitrine=20;
const tel=[b.telephone,b.telephone2].filter(Boolean);
const note=avis.erreur
?''
:`<div style="color:#F2B233;font-size:14px">${etoiles(moyenne(avis))} <span style="color:#1E1A14;font-weight:bold">${texteMoyenne(avis)}</span> <span style="font-size:12px;color:#6B6254">(${avis.length} avis)</span></div>`;
const contact=tel.length
?`<div style="display:flex;gap:10px;margin-top:6px">
<a class="btn" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block" href="${esc(lienAppel(tel[0]))}">Appeler</a>
<a class="btn2" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block;margin-top:0" href="${esc(lienWhatsapp(tel[0]))}" target="_blank" rel="noopener">WhatsApp</a>
</div>`
:'';
const listeAvis=avis.erreur
?'Impossible de charger les avis.'
:(avis.length?avis.map(a=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-weight:bold;font-size:14px">${esc(a.auteur)} <span style="color:#F2B233;font-weight:normal">${etoiles(a.note)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:''}</div>`).join(''):'Aucun avis pour l\'instant.');
zone.innerHTML=`
<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center">
<div class="avatar" style="width:64px;height:64px;flex-shrink:0;background:${fondImage(b.logo,'#F2B233')}">${urlSure(b.logo)?'':esc((b.nom||'N').charAt(0).toUpperCase())}</div>
<div style="flex:1;min-width:0"><div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div>${note}</div>
</div>
<div class="liste" style="margin-top:10px;font-size:13px">
<div>Adresse : ${esc(b.adresse||'Non indiquée')}</div>
<div style="margin-top:4px">Tél : ${tel.length?tel.map(t=>'+221 '+esc(formaterTelephone(t))).join(' / '):'Non indiqué'}</div>
<div style="margin-top:8px">${esc(b.description||'Pas de description.')}</div>
</div>
${contact}
<label>Produits (${prods.length})</label>
<div id="vit-produits"></div>
<label>Avis des clients</label>
<div class="liste" style="margin-top:0">${listeAvis}</div>
<div style="font-size:12px;color:#6B6254;margin-top:8px">Pour donner un avis, ouvrez un produit de cette boutique.</div>`;
rendreProduitsVitrine();
}

function rendreProduitsVitrine(){
const zone=document.getElementById('vit-produits');
if(!zone) return;
const affichees=produitsVitrine.slice(0,limiteVitrine);
if(!affichees.length){
zone.innerHTML='<div class="liste">Aucun produit publié pour l\'instant.</div>';
return;
}
zone.innerHTML=`<div class="grid" style="padding:6px 0 0">${affichees.map(x=>`<div class="card" onclick="ouvrirProduitVitrine(${Number(x.id)})"><div class="img" style="background:${fondMini(x)}"></div><div class="info"><div class="name">${esc(x.nom)}</div><div class="price">${esc(x.prix)}</div></div></div>`).join('')}</div>`;
if(produitsVitrine.length>affichees.length){
zone.insertAdjacentHTML('beforeend',`<button class="btn2" style="width:100%;margin:10px 0 30px" onclick="afficherPlusVitrine()">Afficher plus (${produitsVitrine.length-affichees.length} restants)</button>`);
}
}

function afficherPlusVitrine(){
limiteVitrine+=20;
rendreProduitsVitrine();
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

function rangerBlocBoutique(){
const bloc=document.querySelector('#fiche .boutique');
if(!bloc) return;
const avis=bloc.querySelector('button[onclick="voirAvis()"]');
if(!avis||bloc.querySelector('#fd-bas')) return;
const rangee=document.createElement('div');
rangee.id='fd-bas';
avis.classList.add('fd-avis');
rangee.appendChild(avis);
const vb=document.createElement('button');
vb.type='button';
vb.className='fd-voirboutique';
vb.textContent='Voir la boutique ›';
vb.onclick=()=>{
if(typeof produitOuvert!=='undefined'&&produitOuvert&&produitOuvert.user_id) voirVitrine(produitOuvert.user_id);
};
rangee.appendChild(vb);
bloc.appendChild(rangee);
}

const afficherBoutiqueFicheAvantVitrine=afficherBoutiqueFiche;
afficherBoutiqueFiche=async function(userId){
await afficherBoutiqueFicheAvantVitrine(userId);
rangerBlocBoutique();
};
