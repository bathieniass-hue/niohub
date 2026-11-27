// Écrans des notifications (cloche, détail d'un message NioHub, réglage, fenêtre « Activez… ») :
// uniquement du HTML, aucune logique. Les données arrivent prêtes depuis notifications.js.
// Les boutons déclarent leur intention avec data-action (voir ecran-liaisons.js). Le style : style.css.

function vueEnteteNotif(titre){
return '<header><button class="retour" data-action="retourNotif" aria-label="Retour">←</button><span style="font-weight:bold;font-size:20px">'+esc(titre)+'</span></header>';
}

// Détail d'un message de NioHub. m = { titre, date, texte } ou null si introuvable
function vueNotifDetail(m){
const tete=vueEnteteNotif('Message de NioHub');
if(!m) return tete+'<div class="liste" style="margin-top:14px">Ce message est introuvable.</div>';
return tete+'<div class="liste nio-detail"><div class="nio-titre">'+esc(m.titre)+'</div><div class="nio-date">'+esc(m.date)+'</div><div class="nio-texte">'+esc(m.texte)+'</div></div><button class="btn2" style="margin-top:12px" data-action="contact">Répondre à NioHub</button>';
}

// La cloche. d = { nio:[{ id, lu, titre, texte, heure }], autres:[{ i, titre, texte, heure }] }
function vueNotifications(d){
let h=vueEnteteNotif('Notifications');
h+='<div class="titre-section" style="margin-top:6px">Messages de NioHub</div>';
if(!d.nio.length) h+='<div class="liste" style="margin-top:6px">Aucun message pour le moment.</div>';
h+=d.nio.map(m=>`<div class="ligne notif-item nio-ligne${m.lu?'':' non-lu'}" style="cursor:pointer" data-action="detailNio" data-arg="${esc(m.id)}"><span class="notif-point"${m.lu?' style="visibility:hidden"':''}></span><div style="flex:1;min-width:0"><div class="name">${esc(m.titre)}</div><div class="notif-texte">${esc(m.texte)}</div></div><div class="notif-heure">${esc(m.heure)}</div></div>`).join('');
if(d.autres.length){
h+='<div class="titre-section" style="margin-top:18px">Nouveautés</div><button class="notif-tout" type="button" data-action="toutVu">Tout marquer comme lu</button>';
h+=d.autres.map(it=>`<div class="ligne notif-item" style="cursor:pointer" data-action="notifAller" data-arg="${it.i}"><span class="notif-point"></span><div style="flex:1;min-width:0"><div class="name">${esc(it.titre)}</div><div class="notif-texte">${esc(it.texte)}</div></div><div class="notif-heure">${esc(it.heure)}</div></div>`).join('');
}
return h;
}

// Réglage « Notifications » (page Paramètres). d = { dispo, actif, serveurActif }
function vueReglageNotif(d){
return '<div class="titre-section" style="margin-top:22px">Notifications</div>'
+(d.dispo
?'<button type="button" class="theme-opt'+(d.actif?' on':'')+'" style="width:100%" data-action="basculerNotif">'+(d.actif?'Notifications du téléphone : activées':'Activer les notifications du téléphone')+'</button>'
:'<div style="font-size:13px;color:#6B6254">Les notifications du téléphone ne sont pas disponibles sur ce navigateur.</div>')
+'<div style="font-size:13px;color:#6B6254;margin-top:10px">'+(d.serveurActif?'Vous êtes prévenu d\'un nouveau message, d\'un avis ou d\'une commande, même quand l\'application est fermée.':'Vous êtes prévenu d\'un nouveau message, d\'un avis ou d\'une commande quand l\'application est ouverte ou en arrière-plan.')+'</div>';
}

// Fenêtre « Activez les notifications » (iphone = true : explication d'installation)
function vueDemandeNotif(iphone){
const titre=iphone?'Recevez les notifications sur iPhone':'Activez les notifications';
const texte=iphone?'Ajoutez d\'abord NioHub à l\'écran d\'accueil : appuyez sur le bouton Partager de Safari, puis sur « Sur l\'écran d\'accueil ». Ouvrez ensuite NioHub depuis son icône pour activer les notifications.':'Soyez prévenu tout de suite d\'un nouveau message, d\'une commande ou d\'un avis, même quand l\'application est fermée.';
return '<div class="dnotif-carte" role="dialog" aria-modal="true"><div class="dnotif-ic"></div><h2 class="dnotif-titre">'+esc(titre)+'</h2><p class="dnotif-texte">'+esc(texte)+'</p>'
+'<button type="button" class="dnotif-oui" data-action="demandeOui">'+(iphone?'J\'ai compris':'Activer les notifications')+'</button>'
+'<button type="button" class="dnotif-non" data-action="demandeNon"'+(iphone?' style="display:none"':'')+'>Plus tard</button></div>';
}
