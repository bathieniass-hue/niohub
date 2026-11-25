// Données : commandes
Donnees.commandes={
deAcheteur(s){return Donnees._lire(s,'commandes?select=*&acheteur_id=eq.'+s.user_id+'&order=created_at.desc');},
deVendeur(s){return Donnees._lire(s,'commandes?select=*&vendeur_id=eq.'+s.user_id+'&order=created_at.desc');},
statutPourAcheteur(s,id){return Donnees._lire(s,'commandes?select=statut&id=eq.'+encodeURIComponent(id)+'&acheteur_id=eq.'+s.user_id+'&limit=1');},
// Cet acheteur a-t-il une commande livrée chez ce vendeur ?
livreeChezVendeur(s,vendeurId){return Donnees._lire(s,'commandes?select=id&acheteur_id=eq.'+s.user_id+'&vendeur_id=eq.'+encodeURIComponent(vendeurId)+'&statut=eq.'+encodeURIComponent('Livrée')+'&limit=1');},
creer(s,corps){return Donnees._ecrire(s,'POST','commandes',corps,'return=minimal');},
changerStatut(s,id,statut){return Donnees._ecrire(s,'PATCH','commandes?id=eq.'+encodeURIComponent(id)+'&vendeur_id=eq.'+s.user_id,{statut:statut},'return=representation');},
annulerAchat(s,id){return Donnees._rpc(s,'annuler_mon_achat',{p_id:String(id)});}
};
