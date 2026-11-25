// Données : messages avec l'équipe NioHub (support)
Donnees.support={
liste(s){return Donnees._lire(s,'support_messages?select=*&user_id=eq.'+encodeURIComponent(s.user_id)+'&order=created_at.asc&limit=300');},
envoyer(s,texte){return Donnees._ecrire(s,'POST','support_messages',{user_id:s.user_id,texte:texte,expediteur_admin:false},'return=representation');},
marquerLus(s){return Donnees._rpc(s,'marquer_support_lus');},
reponsesNonLues(s,uid){return Donnees._lire(s,'support_messages?select=id,texte,created_at&user_id=eq.'+uid+'&expediteur_admin=eq.true&lu=eq.false&order=created_at.desc&limit=50');}
};
