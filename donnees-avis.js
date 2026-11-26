// Données : avis sur les vendeurs
Donnees.avis={
deVendeur(vendeurId,colonnes){return Donnees._lirePublic('avis?select='+(colonnes||'*')+'&vendeur_id=eq.'+encodeURIComponent(vendeurId)+'&order=created_at.desc&limit=200');},
// L'avis laissé par l'utilisateur connecté à ce vendeur
monAvis(s,vendeurId){return Donnees._lire(s,'avis?select=*&vendeur_id=eq.'+encodeURIComponent(vendeurId)+'&acheteur_id=eq.'+s.user_id+'&limit=1');},
publier(s,corps){return Donnees._ecrire(s,'POST','avis',corps,'return=minimal');},
modifier(s,vendeurId,note,commentaire){return Donnees._rpc(s,'modifier_mon_avis',{p_vendeur:vendeurId,p_note:note,p_commentaire:commentaire});},
supprimer(s,vendeurId){return Donnees._rpc(s,'supprimer_mon_avis',{p_vendeur:vendeurId});},
// Moyenne et nombre d'avis par vendeur
notesVendeurs(){return Donnees._lirePublic('notes_vendeurs?select=vendeur_id,moyenne,nb');},
// Avis reçus par un vendeur (pour ses notifications)
recusPar(s,uid){return Donnees._lire(s,'avis?select=id,auteur,note,commentaire,created_at&vendeur_id=eq.'+uid+'&order=created_at.desc&limit=50');}
};
