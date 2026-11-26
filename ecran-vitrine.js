// Écran « Vitrine » (page publique d'une boutique) : uniquement du HTML, aucune logique.
// Reçoit des données déjà prêtes (voir vitrine.js). Le style est dans style.css (.vitrine-…).
// Le bouton retour déclare son intention avec data-action (voir ecran-liaisons.js).

// En-tête commun à tous les états de la page
function vueVitrineEntete(){
return '<header><button class="retour" data-action="fermerVitrine">←</button><span style="font-weight:bold;font-size:20px">Boutique</span><span></span></header>';
}

// Page avec un simple message (chargement, boutique introuvable…)
function vueVitrineMessage(texte){
return vueVitrineEntete()+'<div style="margin-top:14px">'+esc(texte)+'</div>';
}

// d = { nom, initiale, fond, aLogo, verifie, note:{texte,nb}|null, adresse, telephones (HTML prêt),
//       contact:{appel,whatsapp}|null, cartes:[HTML prêt de chaque produit] }
function vueVitrine(d){
const note=d.note
?`<span style="color:#F2B233;font-size:14px">★</span> <b>${esc(d.note.texte)}</b> <span style="font-size:12px;color:#6B6254">(${esc(d.note.nb)} avis)</span>`
:'<span style="font-size:12px;color:#6B6254">Aucun avis</span>';
const contact=d.contact
?`<div class="vitrine-contact"><a href="${esc(d.contact.appel)}">Appeler</a><a href="${esc(d.contact.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></div>`
:'';
const carte=`<div style="display:flex;gap:12px;align-items:center;margin-top:14px">`
+`<div class="avatar" style="width:64px;height:64px;font-size:22px;flex-shrink:0;background:${d.fond}">${d.aLogo?'':esc(d.initiale)}</div>`
+`<div style="flex:1;min-width:0"><div style="font-weight:bold;font-size:18px">${esc(d.nom)}</div>${d.verifie?'<div class="verifie">✓ Numéro vérifié</div>':''}`
+`<div style="margin-top:2px">${note}</div>`
+`<div style="font-size:13px;color:#6B6254;margin-top:2px">${esc(d.adresse)}</div>`
+(d.telephones?`<div style="font-size:13px;color:#6B6254">${d.telephones}</div>`:'')
+`</div></div>`+contact;
const corps=d.cartes.length
?`<div class="titre-section" style="margin-top:18px">Produits en vente (${d.cartes.length})</div><div class="grid vitrine-grille" style="padding:6px 0 110px">${d.cartes.join('')}</div>`
:'<div style="margin-top:18px;color:#6B6254">Cette boutique n\'a pas encore de produit en vente.</div>';
return vueVitrineEntete()+carte+corps;
}
