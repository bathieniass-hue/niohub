// Données : messages entre acheteurs et vendeurs
// filtre = fragment de requête fourni par filtreConversation()
Donnees.messages={
toutes(s){return Donnees._lire(s,'messages?select=*&order=created_at.desc&limit=500');},
nonLus(s){return Donnees._lire(s,'messages?select=id&lu=eq.false&expediteur_id=neq.'+s.user_id+'&limit=99');},
// Détail des non lus (pour les notifications)
nonLusDetail(s,uid){return Donnees._lire(s,'messages?select=id,expediteur,expediteur_id,texte,produit,produit_id,vendeur_id,acheteur_id,created_at&lu=eq.false&expediteur_id=neq.'+uid+'&order=created_at.desc&limit=99');},
conversation(s,filtre,incremental){return Donnees._lire(s,'messages?select=*&'+filtre+(incremental?'&order=created_at.desc&limit=40':'&order=created_at.asc&limit=300'));},
marquerLus(s,filtre){return Donnees._ecrire(s,'PATCH','messages?'+filtre+'&expediteur_id=neq.'+s.user_id+'&lu=eq.false',{lu:true},'return=minimal');},
envoyer(s,corps){return Donnees._ecrire(s,'POST','messages',corps,'return=representation');},
supprimer(s,id){return Donnees._rpc(s,'supprimer_mon_message',{p_id:String(id)});},
contactsAcheteurs(s){return Donnees._rpc(s,'contacts_acheteurs');},
// Connexion temps réel (messages reçus instantanément) ; renvoie le WebSocket
ouvrirTempsReel(){return new WebSocket(SUPABASE_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SUPABASE_KEY)+'&vsn=1.0.0');}
};
