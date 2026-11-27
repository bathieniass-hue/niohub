// Écrans de la boutique du vendeur (état, commandes, détail) : uniquement du HTML, aucune logique.
// Les données arrivent prêtes depuis boutique.js. Les boutons déclarent leur intention avec
// data-action (voir ecran-liaisons.js). Le style : style.css.

// Champ « Autre numéro » du formulaire boutique
function vueChampTel2(){
return '<label>Autre numéro (facultatif)</label><div class="champ-tel"><span class="indicatif">+221</span><input id="bt-tel2" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>';
}

// Cadre de la page « Ma boutique »
function vueBoutique(){
return `<header><span style="font-weight:bold;font-size:20px">Ma boutique</span><button id="bt-action" class="btn-modif" style="display:none" data-action="modifierBoutique"><span class="crayon" aria-hidden="true"></span>Modifier</button></header>
<div id="infos-boutique">Chargement…</div>
<div id="boutique-actions"></div>`;
}

function vueBoutiqueMessage(texte){
return '<div class="liste" style="margin-top:0">'+esc(texte)+'</div>';
}

function vueBoutiqueBouton(texte,action){
return '<button class="btn" data-action="'+esc(action)+'">'+esc(texte)+'</button>';
}

// Fiche de la boutique. d = { fond (valeur CSS prête), initiale, nom, telephones (HTML prêt), adresse, description }
function vueBoutiqueFiche(d){
return `<div class="boutique" style="margin-top:0;display:flex;gap:14px;align-items:center"><div class="avatar" style="background:${d.fond}">${esc(d.initiale)}</div><div style="flex:1"><div class="nomboutique" style="font-size:18px">${esc(d.nom)}</div><div style="font-size:13px;color:#6B6254">${d.telephones}</div><div style="font-size:13px;color:#6B6254">${esc(d.adresse)}</div></div></div><div class="liste" style="margin-top:10px">${esc(d.description)}</div>`;
}

function vueBoutiqueNonValidee(){
return '<div class="liste" style="margin-top:12px;border-color:#E0A52E"><b>Boutique non validée</b><br>Pour valider votre boutique, vérifiez votre numéro de téléphone avec NioHub sur WhatsApp. Vos produits seront visibles dès la validation.<button class="btn" style="margin-top:10px" data-action="validerNumero">Valider mon numéro de téléphone</button></div>';
}

function vueBoutiqueVerifiee(){
return '<div class="verifie" style="margin-top:8px">✓ Numéro de téléphone vérifié</div>';
}

function vueBoutiqueBloquee(suspendue){
return '<div class="liste" style="margin-top:12px;border-color:#B4291A"><b>'+(suspendue?'Votre boutique est suspendue.':'Votre boutique est en attente de validation.')+'</b><br>'+(suspendue?'Vos produits ne sont plus visibles par les acheteurs. Contactez NioHub pour en savoir plus.':'Vos produits seront visibles dès qu\'elle sera validée.')+'</div>';
}

function vueBoutiqueTuiles(){
return `<div class="tuiles">
<button class="tuile" data-action="messagesBoutique"><span class="gb-ic" style="--i:0" aria-hidden="true"></span>Messages<span class="pastille" data-compteur="messages" style="display:none"></span></button>
<button id="tuile-avis" class="tuile" data-action="avisRecus"><span class="gb-ic" style="--i:1" aria-hidden="true"></span>Avis reçus<span class="pastille" data-compteur="avis" style="display:none"></span></button>
<button class="tuile" data-action="commandes"><span class="gb-ic" style="--i:2" aria-hidden="true"></span>Commandes<span class="pastille" data-compteur="commandes" style="display:none"></span></button>
<button class="tuile" data-action="ajouterProduit" data-arg="boutique"><span class="gb-ic" style="--i:4" aria-hidden="true"></span>Ajouter</button>
<button class="tuile large" data-action="mesProduits"><span class="gb-ic" style="--i:3" aria-hidden="true"></span>Mes produits</button>
</div>`;
}

// Messages de NioHub sur la boutique. l = [{ id, lu, titre, resume }]
function vueNotifsBoutique(l){
return l.map(m=>`<div class="liste nio-boutique${m.lu?'':' non-lu'}"><b>${esc(m.titre)}</b><div class="nio-resume">${esc(m.resume)}</div><button class="btn2" type="button" data-action="detailNio" data-arg="${esc(m.id)}">Voir plus</button></div>`).join('');
}

// Page de détail d'une vente. lignes = [[libellé, valeur]] ; actions = HTML prêt (boutons)
function vueDetailVente(origine,titre,lignes,actions){
return `<header><button class="retour" data-action="afficherPage" data-arg="${esc(origine)}">←</button><span style="font-weight:bold;font-size:18px">${esc(titre)}</span><span></span></header><div class="liste" style="margin-top:0">${lignes.map(([k,v])=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-size:12px;color:#6B6254">${esc(k)}</div><div style="font-size:15px;font-weight:bold">${esc(v)}</div></div>`).join('')}</div>${actions||''}`;
}

function vueCommandesPage(){
return '<header><button class="retour" data-action="boutique">←</button><span style="font-weight:bold;font-size:20px">Commandes</span><span></span></header><div id="liste-commandes" class="liste" style="margin-top:0">Chargement…</div>';
}

// Liste des commandes. l = [{ produit, quantite, client, total (texte prêt), statut, couleur }]
function vueCommandesListe(l){
if(!l.length) return 'Aucune commande pour l\'instant.';
return l.map((c,i)=>`<div class="ligne" style="cursor:pointer" data-action="commandeDetail" data-arg="${i}"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div style="font-size:13px;color:#6B6254">${esc(c.client)}${esc(c.total)}</div></div><span style="font-size:12px;font-weight:bold;color:${c.couleur}">${esc(c.statut)}</span><span style="margin-left:6px">›</span></div>`).join('');
}
