// Écrans du catalogue de l'accueil (cartes produit, boutiques trouvées, recherche, Mes produits) :
// uniquement du HTML, aucune logique. Les données arrivent prêtes depuis app.js.
// Les clics déclarent leur intention avec data-action (voir ecran-liaisons.js). Le style : style.css.

// Les pastilles de catégories. l = [{ nom, fond }]
function vueCategories(l){
return l.map(c=>'<div class="cat" style="background:'+c.fond+'">'+esc(c.nom)+'</div>').join('');
}

const ICONE_LIEU='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

// Le vendeur sous une carte. d = { fond (valeur CSS prête), initiale, nom, note ('4,5' ou '' si nouveau), lieu }
function vueVendeurCarte(d){
const note=d.note?`<span class="v-etoiles">★</span> <b>${esc(d.note)}</b>`:'<span class="v-nouveau">Nouveau</span>';
const lieu=d.lieu?`<div class="v-lieu">${ICONE_LIEU}<span>${esc(d.lieu)}</span></div>`:'';
return `<div class="vendeur"><div class="v-avatar" style="background:${d.fond}">${esc(d.initiale)}</div><div class="v-txt"><div class="v-ligne"><span class="v-nom">${esc(d.nom)}</span><span class="v-note">${note}</span></div>${lieu}</div></div>`;
}

// Une carte produit. d = { action ('ouvrirProduitId' ou 'ouvrirDemo'), arg, fond, nom, prix, classePrix, vendeur (HTML prêt) }
function vueCarteProduit(d){
return `<div class="card" data-action="${d.action}" data-arg="${esc(d.arg)}"><div class="img" style="background:${d.fond}"></div><div class="info"><div class="name">${esc(d.nom)}</div><div class="price${d.classePrix}">${esc(d.prix)}</div>${d.vendeur}</div></div>`;
}

// Boutiques trouvées par la recherche. l = [{ userId, fond, nom, adresse }]
function vueBoutiquesTrouvees(l){
if(!l.length) return '';
return `<div class="titre-section">Boutiques</div><div class="liste" style="margin-top:0">${l.map(b=>`<div class="ligne" style="cursor:pointer" data-action="vitrine" data-arg="${esc(b.userId)}"><div class="vignette" style="border-radius:28px;background:${b.fond}"></div><div style="flex:1"><div class="name">${esc(b.nom)}</div><div style="font-size:12px;color:#6B6254">${esc(b.adresse)}</div></div><span>›</span></div>`).join('')}</div>`;
}

function vueFinListe(texte){
return '<div class="fin-liste">'+esc(texte)+'</div>';
}
function vueFinChargement(){
return '<div class="fin-liste"><span class="roue"></span>Chargement des produits…</div>';
}
function vueSqueletteGrille(){
return Array(6).fill('<div class="sk-carte"></div>').join('');
}
function vueMessageVide(texte){
return '<div class="vide">'+esc(texte)+'</div>';
}

// Accueil sans aucun produit
function vueAccueilVide(){
return `<div class="accueil-vide">
<img src="logo-n.png" alt="" class="accueil-vide-logo">
<div class="accueil-vide-titre">Bienvenue sur NioHub</div>
<div class="accueil-vide-texte">Aucun produit n'est encore en vente près de chez vous. Lancez le marché : publiez le premier article, il sera vu par tous les visiteurs.</div>
<button class="btn" type="button" data-action="ajouterProduit" data-arg="accueil">Publier un produit</button>
<button class="accueil-vide-lien" type="button" data-action="boutique">Créer ma boutique</button>
</div>`;
}

// Zone de recherche (champ + suggestions)
function vueRecherche(){
return '<input id="q" type="search" placeholder="Rechercher un produit ou une boutique" autocomplete="off"><div id="suggest"></div>';
}

// Suggestions. l = [{ k, avant, milieu, apres, boutique (true/false) }]
function vueSuggestions(l){
return l.map(s=>`<button data-action="suggestion" data-arg="${s.k}">${esc(s.avant)}<b>${esc(s.milieu)}</b>${esc(s.apres)}${s.boutique?'<span class="tag-b">Boutique</span>':'<span class="tag-p">Produit</span>'}</button>`).join('');
}

// « Mes produits ». l = [{ id, fond (valeur CSS prête), nom, prix }]
function vueMesProduits(l){
return l.map(p=>`<div class="ligne"><div class="vignette" style="background:${p.fond}"></div><div style="flex:1"><div class="name">${esc(p.nom)}</div><div class="price">${esc(p.prix)}</div></div><button data-action="modifierProduit" data-arg="${p.id}" style="border:0;background:none;color:#0E6B47;font-weight:bold;font-size:13px">Modifier</button><button data-action="supprimerProduit" data-arg="${p.id}" style="border:0;background:none;color:#B4291A;font-weight:bold;font-size:13px">Supprimer</button></div>`).join('');
}
