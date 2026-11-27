// Écran « Nous contacter » : uniquement du HTML, aucune logique.
// Reçoit des données déjà prêtes (voir contact.js). Les boutons déclarent leur intention
// avec data-action (voir ecran-liaisons.js). Le style : style.css (#contact, .bulle, .contact-qui…).

// La page entière : titre, message d'accueil, fil de la conversation, zone de saisie
function vueContact(){
return '<header><button class="retour" data-action="profil" aria-label="Retour">←</button><span style="font-weight:bold;font-size:20px">Nous contacter</span></header>'
+'<div class="chat-vide" id="contact-intro">Une question, un problème, une idée ? Écrivez-nous : notre équipe vous répond ici.</div>'
+'<div id="contact-fil"></div>'
+'<div class="chat-saisie"><div class="chat-erreur" id="contact-erreur"></div>'
+'<input id="contact-texte" type="text" placeholder="Écrire à NioHub…" maxlength="1000" enterkeyhint="send" autocomplete="off">'
+'<button id="contact-envoyer" class="chat-envoyer" data-action="envoyerContact" aria-label="Envoyer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>';
}

// Le fil de la conversation.
// l = [{ jour:'' ou le libellé du jour à afficher avant la bulle, miens:true/false, texte:HTML prêt, heure:'' }]
function vueContactFil(l){
return l.map(m=>(m.jour?`<div class="chat-jour">${esc(m.jour)}</div>`:'')
+`<div class="bulle ${m.miens?'moi':'autre'}">${m.miens?'':'<div class="contact-qui">Service client NioHub</div>'}${m.texte}<div class="heure">${esc(m.heure)}</div></div>`).join('');
}

function vueContactErreurChargement(){
return '<div class="chat-vide">Impossible de charger la conversation. Vérifiez votre connexion.</div>';
}
