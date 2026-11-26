// Écrans « Mes achats » (liste) et « Achat » (détail) : uniquement du HTML, aucune logique.
// Reçoivent des données déjà prêtes (voir achats.js). Les boutons déclarent leur intention avec
// data-action (voir ecran-liaisons.js).

// Cadre de la liste (en-tête + zone « Chargement… » qui sera remplie ensuite)
function vueAchats(){
return `<header><button class="retour" data-action="retourAchats">←</button><span style="font-weight:bold;font-size:20px">Mes achats</span><span></span></header><div id="liste-achats" class="liste" style="margin-top:0">Chargement…</div>`;
}

// d = { achats:[{id, produit, quantite, date, statut, couleur}] }
function vueAchatsListe(d){
if(!d.achats.length) return "Vous n'avez pas encore passé de commande.";
return d.achats.map(c=>`<div class="ligne" style="cursor:pointer" data-action="achatDetail" data-arg="${esc(c.id)}"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div style="font-size:12px;color:#6B6254">${esc(c.date)}</div></div><span style="font-size:12px;font-weight:bold;color:${c.couleur}">${esc(c.statut)}</span><span style="margin-left:6px">›</span></div>`).join('');
}

function vueAchatsErreur(){
return 'Erreur de chargement. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" data-action="achats">Réessayer</button>';
}

// d = { id, lignes:[{k, v, couleur}], peutAvis, peutAnnuler }
function vueAchatDetail(d){
const lignes=d.lignes.map(l=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-size:12px;color:#6B6254">${esc(l.k)}</div><div style="font-size:15px;font-weight:bold;color:${l.couleur||'#1E1A14'}">${esc(l.v)}</div></div>`).join('');
return `<header><button class="retour" data-action="achatsListe">←</button><span style="font-weight:bold;font-size:18px">Achat</span><span></span></header>
<div class="liste" style="margin-top:0">${lignes}</div>
<div style="font-size:12px;color:#6B6254;margin-top:8px">Le paiement se règle directement avec le vendeur, à la livraison ou par Wave / Orange Money.</div>
<a id="ach-wa" class="btn2" style="display:block;text-align:center;text-decoration:none;line-height:52px;margin-top:14px" href="#" target="_blank" rel="noopener">Contacter le vendeur</a>
${d.peutAvis?`<button class="btn" style="margin-top:12px" data-action="avisAchat" data-arg="${esc(d.id)}">Donner un avis</button>`:''}
${d.peutAnnuler?`<button class="btn2" style="margin-top:12px;color:#B4291A;border-color:#B4291A" data-action="annulerAchat" data-arg="${esc(d.id)}">Annuler cet achat</button><div style="font-size:12px;color:#6B6254;margin-top:6px">Vous pouvez annuler tant que le vendeur n'a pas expédié la commande.</div>`:''}`;
}

// Bouton « Contacter le vendeur » : lien WhatsApp (ou vide s'il n'y a pas de numéro)
function vueContactVendeur(lien){
const a=document.getElementById('ach-wa');
if(!a) return;
if(lien){
a.href=lien;
}else{
a.textContent='Numéro du vendeur indisponible';
a.style.opacity='.5';
a.removeAttribute('target');
}
}
