// Écran « ajout d'un produit » (3 étapes : photos, nom, détails et prix) : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js).
// La logique (étapes, photos, clavier) est dans ajout-produit.js ; le style (.ep-…, .ap-…) dans style.css.
(window.Ecrans=window.Ecrans||{})['ajout']=`<div id="ajout" class="page">
<header><button class="retour" data-action="retourAjout">←</button><span id="ajout-titre" style="font-weight:bold">Ajouter un produit</span><span></span></header>
<input type="file" id="photo" accept="image/*" multiple style="display:none" data-change="choisirPhoto">
<div class="ep-etape" id="ep-etape"></div>
<div class="etape" id="ep1">
<div class="apercu" id="apercu" data-action="ouvrir" data-arg="photo">+ Ajouter une photo</div>
<div class="ap-miniatures" id="ap-mini1"></div>
<div class="ep-aide" id="ep-aide"></div>
</div>
<div class="etape" id="ep2">
<div class="apercu" id="ap-photo-nom"></div>
<div class="ap-miniatures" id="ap-mini-nom"></div>
<label>Nom du produit</label>
<input id="nom" placeholder="Ex. Boubou brodé">
</div>
<div class="etape" id="ep3">
<div class="ep-grande" id="ep-photo-recap"></div>
<div class="ep-petites" id="ep-petites"></div>
<div class="ep-nom" id="ep-nom"></div>
<label id="ep-titre-prix">Prix (FCFA)</label>
<input id="prix" type="text" inputmode="numeric" autocomplete="off" placeholder="Ex. 25.000">
<!-- La description est reprise par details-produit.js, qui la place dans la carte des détails (devant « Prix ») -->
<label>Description</label>
<textarea id="desc" placeholder="Décrivez le produit"></textarea>
</div>
<div class="ep-barre">
<button type="button" class="btn2" id="ep-gauche" data-action="ajoutGauche">Annuler</button>
<button type="button" class="btn" id="ajout-suivant" data-action="ajoutSuivant">Suivant</button>
<button id="ajout-publier" class="btn" style="margin:0" data-action="publier">Publier</button>
</div>
</div>
`;

// Fond d'une photo : src = adresse de l'image, '' si aucune
function fondPhotoAjout(src){
return src?"url('"+esc(src)+"') center/cover no-repeat":'';
}

// Étape 1 : petites cases avec croix + case « + ». fonds = adresses des photos, peutAjouter = reste de la place
function vueMiniaturesAjout(fonds,peutAjouter){
return fonds.map(function(f,i){
return `<div class="ap-case" style="background:${fondPhotoAjout(f)}"><button type="button" class="ap-x" aria-label="Retirer cette photo" data-action="ajoutRetirer" data-arg="${i}">×</button></div>`;
}).join('')+(peutAjouter
?`<button type="button" class="ap-case ap-plus" aria-label="Ajouter d'autres photos" data-action="ouvrir" data-arg="photo">+</button><span class="ap-legende">Ajouter d'autres photos</span>`
:'');
}

// Étape 2 : petites cases sans croix
function vueMiniaturesNom(fonds){
return fonds.map(function(f){return `<div class="ap-case" style="background:${fondPhotoAjout(f)}"></div>`;}).join('');
}

// Étape 3 : petites photos du récapitulatif (toutes sauf la première)
function vuePetitesRecap(fonds){
return fonds.map(function(f){return `<div class="ap-petite" style="background:${fondPhotoAjout(f)}"></div>`;}).join('');
}

// Fiche produit : zone des petites photos (créée une fois, sous la grande photo)
function vueZonePhotosFiche(){
return '<div class="fphotos" id="fphotos"></div>';
}

// Fiche produit : une petite photo cliquable. src = adresse sûre, choisie = photo affichée
function vueMiniFiche(src,choisie){
return `<button type="button" class="fphoto-mini${choisie?' on':''}" style="background:${fondPhotoAjout(src)}" data-action="fichePhoto" data-arg="${esc(src)}"></button>`;
}
