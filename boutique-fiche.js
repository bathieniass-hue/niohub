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

// boutique.js affiche déjà la carte de la boutique (avec gestion des erreurs réseau).
// Ici on ajoute seulement la note et le bouton "Avis reçus", avec un seul appel réseau (les avis).
async function completerFicheBoutique(){
const b=boutiqueActuelle;
if(!b) return;
const s=await sessionValide();
if(!s||!s.user_id) return;
const avis=await chargerAvisVendeur(s.user_id);
// Si l'utilisateur a changé d'écran ou de boutique entre-temps, on n'écrit rien
if(boutiqueActuelle!==b) return;
const nom=document.querySelector('#infos-boutique .nomboutique');
const actions=document.getElementById('boutique-actions');
if(!nom||!actions) return;
nom.insertAdjacentHTML('afterend',`<div style="color:#F2B233;font-size:14px;margin-top:2px">${etoiles(moyenne(avis))} <span style="color:#1E1A14;font-weight:bold">${texteMoyenne(avis)}</span> <span style="font-size:12px;color:#6B6254">(${avis.length} avis)</span></div>`);
actions.insertAdjacentHTML('beforeend',`<button class="btn2" onclick="voirAvisRecus()">Avis reçus (${avis.length})</button>`);
}

const voirBoutiqueAvantAvis=voirBoutique;
voirBoutique=async function(){
await voirBoutiqueAvantAvis();
await completerFicheBoutique();
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
