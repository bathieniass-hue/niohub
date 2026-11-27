// Écran « Paramètres » : uniquement du HTML, aucune logique.
// Reçoit des données déjà prêtes (voir parametres.js). Les boutons déclarent leur intention
// avec data-action (voir ecran-liaisons.js). Le style : style.css (.theme-…).
// d = { theme:'sombre'|'clair', notifications:HTML prêt du réglage des notifications (ou '') }
function vueParametres(d){
return '<header><button class="retour" data-action="profil">←</button><span style="font-weight:bold;font-size:20px">Paramètres</span><span></span></header>'
+'<div class="titre-section" style="margin-top:6px">Apparence</div>'
+'<div class="theme-choix">'
+'<button type="button" class="theme-opt'+(d.theme==='sombre'?' on':'')+'" data-action="theme" data-arg="sombre">Sombre</button>'
+'<button type="button" class="theme-opt'+(d.theme==='clair'?' on':'')+'" data-action="theme" data-arg="clair">Clair</button>'
+'</div>'
+'<div style="font-size:13px;color:#6B6254;margin-top:10px">Votre choix est gardé sur ce téléphone.</div>'
+d.notifications;
}
