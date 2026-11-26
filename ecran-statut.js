// Écran « détail d'une commande (vendeur) » : uniquement du HTML, aucune logique.
// Reçoit des données déjà prêtes (voir statut.js) et rend le bas de la page.
// d = { id, suivants:[{statut,libelle}], appel, whatsapp }
// Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js).
function vueCommandeVendeur(d){
const boutons=d.suivants.map(x=>`<button class="${x.statut==='Annulée'?'btn2':'btn'}" style="margin-top:0;flex:1;font-size:13px;height:44px;padding:0 4px;${x.statut==='Annulée'?'color:#B4291A;border-color:#B4291A':''}" data-action="statut" data-arg="${esc(d.id)}|${esc(x.statut)}">${esc(x.libelle)}</button>`).join('');
const blocStatut=d.suivants.length
?`<div style="margin-top:18px;font-size:13px;font-weight:bold;color:#6B6254">Changer le statut</div>
<div style="display:flex;gap:8px;margin-top:8px">${boutons}</div>`
:`<div style="margin-top:18px;font-size:13px;color:#6B6254">Cette commande est terminée : son statut ne peut plus changer.</div>`;
return `<div style="display:flex;gap:10px;margin-top:14px"><a class="btn" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block" href="${esc(d.appel)}">Appeler</a><a class="btn2" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block;margin-top:0" href="${esc(d.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></div>
${blocStatut}
<div id="statut-msg" class="msg"></div>`;
}
