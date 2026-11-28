// Écrans des avis : encadré boutique de la fiche produit, page « Avis », formulaire de notation.
// Uniquement du HTML, aucune logique. Reçoivent des données déjà prêtes (voir avis.js).
// Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js). Le style des étoiles : style.css (.av-etoile).

// Encadré boutique de la fiche produit : simple message (ex. « Boutique non ouverte »)
function vueBoutiqueFicheMessage(texte){
return '<b>'+esc(texte)+'</b>';
}

// Nom propre à cet écran : la page Boutique a sa propre vueBoutiqueFiche (ecran-boutique-etat.js). Ne jamais réutiliser ce nom.
// d = { nom, initiale, fond, aLogo, adresse, telephones (HTML prêt), note:{etoiles,texte}|null }
function vueBoutiqueFicheProduit(d){
const note=d.note?`<span style="color:#F2B233;font-size:14px">${esc(d.note.etoiles)} <span style="color:#1E1A14;font-weight:bold">${esc(d.note.texte)}</span></span>`:'';
return `<div style="display:flex;gap:12px;align-items:center">`+
`<div class="avatar" style="width:52px;height:52px;font-size:18px;flex-shrink:0;background:${d.fond}">${d.aLogo?'':esc(d.initiale)}</div>`+
`<div style="flex:1;min-width:0">`+
`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b>${esc(d.nom)}</b>${note}</div>`+
`<div style="font-size:12px;color:#6B6254;margin-top:2px">${esc(d.adresse)} · ${d.telephones}</div>`+
`</div></div>`+
`<div class="bf-boutons"><button class="btn2" data-action="vitrineFiche">Voir la boutique</button><button class="btn2" data-action="avis">Voir les avis</button></div>`;
}

// Page « Avis » (cadre) : d = { origine:'achats'|'fiche' } (où revenir avec ←)
function vueAvis(d){
return `<header><button class="retour" data-action="retourAvis" data-arg="${esc(d.origine)}">←</button><span style="font-weight:bold;font-size:20px">Avis</span><span></span></header><div id="avis-resume"></div><label>Avis des clients</label><div id="avis-liste" class="liste" style="margin-top:0">Chargement…</div><div id="avis-moi"></div>`;
}

// d = { moyenne, etoiles, resume }
function vueAvisResume(d){
return `<div class="boutique" style="margin-top:0;text-align:center"><div style="font-size:36px;font-weight:800;color:#0E6B47">${esc(d.moyenne)}</div><div style="color:#F2B233;font-size:20px">${esc(d.etoiles)}</div><div style="font-size:13px;color:#6B6254">${esc(d.resume)}</div></div>`;
}

// d = { avis:[{auteur, etoiles, commentaire}] }
function vueAvisListe(d){
if(!d.avis.length) return "Aucun avis pour l'instant.";
return d.avis.map(a=>`<div class="ligne" style="display:block"><div class="name">${esc(a.auteur)} <span style="color:#F2B233;font-weight:normal">${esc(a.etoiles)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:''}</div>`).join('');
}

function vueAvisErreur(){
return 'Impossible de charger les avis. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" data-action="avisRafraichir">Réessayer</button>';
}

// --- Zone « Votre avis » ---
function vueMonAvisConnexion(){
return '<label>Votre avis</label><div class="liste" style="margin-top:0">Connectez-vous pour donner votre avis.</div><button class="btn" data-action="seConnecter">Se connecter</button>';
}

function vueMonAvisTexte(texte){
return '<label>Votre avis</label><div class="liste" style="margin-top:0">'+esc(texte)+'</div>';
}

function vueMonAvisErreur(){
return '<label>Votre avis</label><div class="liste" style="margin-top:0">Impossible de vérifier votre avis. Vérifiez votre connexion.</div><button class="btn2" data-action="avisMoi">Réessayer</button>';
}

// d = { etoiles, commentaire }
function vueMonAvisExistant(d){
return `<label>Votre avis</label><div class="liste" style="margin-top:0"><div style="color:#F2B233;font-size:18px">${esc(d.etoiles)}</div>${d.commentaire?`<div style="font-size:14px;margin-top:6px">${esc(d.commentaire)}</div>`:''}<div style="font-size:12px;color:#6B6254;margin-top:6px">Vous avez déjà donné votre avis à ce vendeur.</div></div>
<div style="display:flex;gap:10px;margin-top:10px"><button class="btn2" style="flex:1;margin:0" data-action="avisModifier">Modifier mon avis</button><button class="btn2" style="flex:1;margin:0;color:#B4291A;border-color:#B4291A" data-action="avisSupprimer">Supprimer</button></div>`;
}

// d = { modif:true|false } : formulaire de notation (nouveau ou modification)
function vueFormulaireAvis(d){
const boutons=[1,2,3,4,5].map(n=>`<button class="av-etoile" data-n="${n}" data-action="etoile" data-arg="${n}">★</button>`).join('');
return `<label>Votre avis</label>
<div id="av-etoiles" style="display:flex;justify-content:center;margin:4px 0 8px">${boutons}</div>
<label>Commentaire (facultatif)</label>
<textarea id="av-texte" maxlength="500" style="width:100%;height:90px;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif"></textarea>
<div id="av-msg" class="msg"></div>
<button class="btn" style="margin-top:14px" data-action="${d.modif?'avisEnregistrer':'avisPublier'}">${d.modif?'Enregistrer les modifications':'Publier mon avis'}</button>${d.modif?'<button class="btn2" style="margin-top:8px" data-action="avisMoi">Annuler</button>':''}`;
}
