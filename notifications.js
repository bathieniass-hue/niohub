// Données : notifications NioHub et notifications push
Donnees.notifications={
liste(s,limite){return Donnees._lire(s,'notifications_nio?select=*&user_id=eq.'+s.user_id+'&order=created_at.desc&limit='+limite);},
nonLues(s,uid){return Donnees._lire(s,'notifications_nio?select=id,titre,texte,type,created_at&user_id=eq.'+uid+'&lu=eq.false&order=created_at.desc&limit=50');},
marquerLue(s,id){return Donnees._rpc(s,'marquer_notif_nio_lue',{p_id:Number(id)});}
};
Donnees.push={
abonner(s,endpoint,p256dh,cleAuth){return Donnees._rpc(s,'enregistrer_push',{p_endpoint:endpoint,p_p256dh:p256dh,p_cle_auth:cleAuth});},
desabonner(s,endpoint){return Donnees._rpc(s,'supprimer_push',{p_endpoint:endpoint});}
};
