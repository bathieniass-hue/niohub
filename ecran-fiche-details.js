// Écran « Fiche produit » : bloc des détails (état et couleurs). Uniquement du HTML, aucune logique.
// Reçoit des données déjà prêtes (voir fiche-details.js). Le style : style.css (#fd-details…).
// d = { etat:'' , couleurs:[{nom, hex}] } → HTML des lignes (vide s'il n'y a rien à montrer)
function vueDetailsFiche(d){
const lignes=[];
if(d.etat) lignes.push(`<div class="fd-ligne"><span class="fd-label">État</span><span class="fd-val">${esc(d.etat)}</span></div>`);
if(d.couleurs.length){
const pastilles=d.couleurs.map(c=>`<span class="fd-pastille"><span class="fd-rond" style="background:${c.hex}"></span>${esc(c.nom)}</span>`).join('');
lignes.push(`<div class="fd-ligne"><span class="fd-label">Couleurs disponibles</span><div class="fd-pastilles">${pastilles}</div></div>`);
}
return lignes.join('');
}
