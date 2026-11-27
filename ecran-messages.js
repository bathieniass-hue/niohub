// Écrans de la messagerie (liste des conversations, discussion) : uniquement du HTML, aucune logique.
// Les données arrivent prêtes depuis messages.js. Les boutons déclarent leur intention avec
// data-action (voir ecran-liaisons.js). Le style : style.css (.conv…, .chat-…, .bulle…).

const ICONE_APPEL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const ICONE_WHATSAPP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>';

// Pastille ronde d'une personne. d = { fond (valeur CSS prête), initiale } ; id facultatif
function vueAvatar(classe,d,id){
return '<div class="'+classe+'"'+(id?' id="'+id+'"':'')+' style="background:'+d.fond+'">'+esc(d.initiale)+'</div>';
}

// Boutons Appeler / WhatsApp. d = { tel (adresse tel:), wa (adresse WhatsApp) }
function vueBoutonsContact(d){
return '<a class="chat-action appel" href="'+d.tel+'" aria-label="Appeler">'+ICONE_APPEL+'</a><a class="chat-action whatsapp" href="'+d.wa+'" target="_blank" rel="noopener" aria-label="Continuer sur WhatsApp">'+ICONE_WHATSAPP+'</a>';
}

// ----- liste des conversations -----
function vueConversationsPage(){
return '<div class="entete-ecran"><button class="retour-carre" data-action="fermerListe" aria-label="Retour">←</button><span class="titre-ecran">Messages</span></div><div id="conv-corps" class="liste" style="margin-top:6px">Chargement…</div>';
}

// l = [{ i, nonLus, avatar:{fond,initiale}, titre, quand, produit, vous (true si mon message), apercu }]
function vueConversationsListe(l){
if(!l.length) return '<div class="chat-vide">Aucun message pour l\'instant.<br>Ouvrez un produit et touchez « Message » pour écrire au vendeur.</div>';
return l.map(c=>`<div class="conv${c.nonLus?' nonlu':''}" data-action="ouvrirConversation" data-arg="${c.i}">${vueAvatar('conv-img',c.avatar)}<div class="conv-corps"><div class="conv-haut"><span class="conv-nom">${esc(c.titre)}</span><span class="conv-heure">${esc(c.quand)}</span></div><div class="conv-produit">${c.produit?'À propos de : '+esc(c.produit):''}</div><div class="conv-apercu">${c.vous?'Vous : ':''}${esc(c.apercu)}</div></div>${c.nonLus?`<span class="conv-nonlus">${c.nonLus}</span>`:''}</div>`).join('');
}

function vueConversationsErreur(){
return 'Impossible de charger vos messages. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" data-action="reessayerListe">Réessayer</button>';
}

// ----- discussion -----
function vueChatPage(){
return `<div class="entete-ecran"><button class="retour-carre" data-action="fermerChat" aria-label="Retour">←</button><div class="chat-avatar" id="chat-avatar"></div><span class="titre-ecran" id="chat-titre"></span><div class="chat-actions" id="chat-actions"></div></div>
<div id="chat-produit"></div>
<div id="chat-fil"></div>
<div class="chat-saisie"><div class="chat-erreur" id="chat-erreur"></div><input id="chat-texte" type="text" placeholder="Écrire un message…" maxlength="1000" enterkeyhint="send" autocomplete="off"><button id="chat-envoyer" class="chat-envoyer" data-action="envoyerChat" aria-label="Envoyer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>`;
}

// Produit dont on parle. d = { nom, prix, ouvrable, fond (valeur CSS prête) }
function vueProduitChat(d){
return `<div class="chat-produit${d.ouvrable?' cliquable':''}"${d.ouvrable?' data-action="voirProduitChat"':''}><div class="cp-img" style="background:${d.fond}"></div><div class="cp-txt"><div class="cp-nom">${esc(d.nom)}</div><div class="cp-prix">${esc(d.prix)}</div></div>${d.ouvrable?'<span class="cp-voir">Voir ›</span>':''}</div>`;
}

function vueChatVide(texte){
return '<div class="chat-vide">'+texte+'</div>';
}

function vueChatErreur(){
return '<div class="chat-vide">Impossible de charger la conversation. Vérifiez votre connexion.<br><button class="auth-lien" style="width:auto" data-action="reessayerChat">Réessayer</button></div>';
}

// Le fil. l = liste d'éléments :
//  { type:'jour', texte } | { type:'sujet', texte, produitId ('' si non cliquable) }
//  { type:'supprime', miens, heure } | { type:'bulle', miens, attente, actionnable, mid, texte (HTML prêt), heure }
function vueFilChat(l){
return l.map(e=>{
if(e.type==='jour') return '<div class="chat-jour">'+esc(e.texte)+'</div>';
if(e.type==='sujet') return '<div class="chat-sujet'+(e.produitId?' cliquable':'')+'"><span'+(e.produitId?' data-action="ouvrirProduitId" data-arg="'+esc(e.produitId)+'"':'')+'>À propos de : '+esc(e.texte)+'</span></div>';
if(e.type==='supprime') return '<div class="bulle '+(e.miens?'moi':'autre')+' supprime"><i>Message supprimé</i><div class="heure">'+esc(e.heure)+'</div></div>';
return '<div class="bulle '+(e.miens?'moi':'autre')+(e.attente?' attente':'')+(e.actionnable?' touchable':'')+'"'+(e.actionnable?' data-action="menuMessage" data-mid="'+esc(e.mid)+'" data-attente="'+(e.attente?'1':'')+'"':'')+'>'+e.texte+'<div class="heure">'+esc(e.heure)+'</div></div>';
}).join('');
}

// Petit menu sous un de mes messages
function vueMenuMessage(mid,attente){
return '<div class="bulle-actions"><button type="button" class="bulle-supprimer" data-action="supprimerMessage" data-arg="'+esc(mid)+'|'+(attente?1:0)+'">'+(attente?'Annuler l\'envoi':'Supprimer ce message')+'</button></div>';
}
