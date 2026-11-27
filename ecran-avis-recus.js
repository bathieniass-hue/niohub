// Écrans « Avis reçus » (vendeur) et note de la boutique : uniquement du HTML, aucune logique.
// Reçoivent des données déjà prêtes (voir boutique-fiche.js). Les boutons déclarent leur intention
// avec data-action (voir ecran-liaisons.js).

// Note affichée sous le nom de la boutique : d = { etoiles, texte, nb }
function vueNoteBoutique(d){
return `<div style="color:#F2B233;font-size:14px;margin-top:2px">${esc(d.etoiles)} <span style="color:#1E1A14;font-weight:bold">${esc(d.texte)}</span> <span style="font-size:12px;color:#6B6254">(${esc(d.nb)} avis)</span></div>`;
}

// Page « Avis reçus » (cadre : en-tête + zone « Chargement… » remplie ensuite)
function vueAvisRecus(){
return `<header><button class="retour" data-action="boutique">←</button><span style="font-weight:bold;font-size:20px">Avis reçus</span><span></span></header><div id="ar-corps" class="liste" style="margin-top:14px">Chargement…</div>`;
}

function vueAvisRecusErreur(){
return 'Impossible de charger vos avis. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" data-action="avisRecus">Réessayer</button>';
}

function vueAvisRecusVide(){
return 'Vous n\'avez pas encore reçu d\'avis.';
}

// d = { moyenne, etoiles, nb, avis:[{auteur, etoiles, commentaire}] }
function vueAvisRecusListe(d){
return `
<div style="text-align:center;padding:6px 0 12px">
<div style="font-size:32px;font-weight:bold">${esc(d.moyenne)}</div>
<div style="color:#F2B233;font-size:18px">${esc(d.etoiles)}</div>
<div style="font-size:13px;color:#6B6254">${esc(d.nb)} avis reçus</div>
</div>
${d.avis.map(a=>`<div style="padding:10px 0;border-top:1px solid #EDE5D3"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">${esc(a.auteur)}</b><span style="color:#F2B233;font-size:14px">${esc(a.etoiles)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:'<div style="font-size:13px;color:#6B6254;margin-top:4px">Sans commentaire</div>'}</div>`).join('')}`;
}
