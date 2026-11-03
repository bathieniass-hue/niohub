VUES.push('avis-recus');
VUES_MENU['avis-recus']=1;

function creerPageAvisRecus(){
if(document.getElementById('avis-recus')) return;
const p=document.createElement('div');
p.id='avis-recus';
p.className='page';
p.style.display='none';
document.body.appendChild(p);
}
creerPageAvisRecus();

async function rendreFicheBoutique(){
const zone=document.getElementById('infos-boutique');
if(!zone) return;
const s=await sessionValide();
if(!s||!s.user_id){
zone.innerHTML='<div class="liste" style="margin-top:0">Connectez-vous pour voir votre boutique.</div>';
return;
}
const [b,avis]=await Promise.all([chargerBoutiqueDe(s.user_id),chargerAvisVendeur(s.user_id)]);
if(!b){
zone.innerHTML='<div class="liste" style="margin-top:0">Vous n\'avez pas encore de boutique. Touchez Modifier pour l\'ouvrir.</div>';
return;
}
const tel=[b.telephone,b.telephone2].filter(Boolean).join(' / ');
zone.innerHTML=`
<div class="boutique" style="margin-top:0">
<div style="display:flex;gap:14px;align-items:center">
<div class="avatar" style="width:64px;height:64px;flex-shrink:0;background:${b.logo?'url('+b.logo+') center/cover':'#F2B233'}">${b.logo?'':esc((b.nom||'N').charAt(0).toUpperCase())}</div>
<div style="flex:1;min-width:0">
<div class="nomboutique" style="font-size:18px">${esc(b.nom)}</div>
<div style="color:#F2B233;font-size:14px;margin-top:2px">${etoiles(moyenne(avis))} <span style="color:#1E1A14;font-weight:bold">${texteMoyenne(avis)}</span></div>
</div>
</div>
<div style="margin-top:12px;font-size:14px">${esc(b.description||'Pas de description.')}</div>
<div style="margin-top:14px;font-size:13px;line-height:1.6">
<div>Tél : ${tel?esc(tel):'Non indiqué'}</div>
<div>Adresse : ${esc(b.adresse||'Non indiquée')}</div>
</div>
</div>
<button class="btn2" style="margin-top:12px" onclick="voirAvisRecus()">Avis reçus (${avis.length})</button>`;
}

const voirBoutiqueAvantAvis=voirBoutique;
voirBoutique=async function(){
await voirBoutiqueAvantAvis();
await rendreFicheBoutique();
};

async function voirAvisRecus(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous pour voir vos avis.');return;}
const page=document.getElementById('avis-recus');
page.innerHTML=`<header><button class="retour" onclick="voirBoutique()">←</button><span style="font-weight:bold;font-size:20px">Avis reçus</span><span></span></header><div id="ar-corps" class="liste" style="margin-top:14px">Chargement…</div>`;
montrer('avis-recus');
const avis=await chargerAvisVendeur(s.user_id);
const zone=document.getElementById('ar-corps');
if(!zone) return;
if(!avis.length){
zone.innerHTML='Vous n\'avez pas encore reçu d\'avis.';
return;
}
zone.innerHTML=`
<div style="text-align:center;padding:6px 0 12px">
<div style="font-size:32px;font-weight:bold">${texteMoyenne(avis)}</div>
<div style="color:#F2B233;font-size:18px">${etoiles(moyenne(avis))}</div>
<div style="font-size:13px;color:#6B6254">${avis.length} avis reçus</div>
</div>
${avis.map(a=>`<div style="padding:10px 0;border-top:1px solid #EDE5D3"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">${esc(a.auteur||'Client')}</b><span style="color:#F2B233;font-size:14px">${etoiles(a.note)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:'<div style="font-size:13px;color:#6B6254;margin-top:4px">Sans commentaire</div>'}</div>`).join('')}`;
}
