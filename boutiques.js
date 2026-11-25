// Données : boutiques
Donnees.boutiques={
toutes(){return Donnees._lirePublic('boutiques?select=*&order=created_at.asc');},
deVendeur(userId){return Donnees._lirePublic('boutiques?select=*&user_id=eq.'+encodeURIComponent(userId)+'&limit=1');},
telephoneParId(id){return Donnees._lirePublic('boutiques?select=telephone&id=eq.'+encodeURIComponent(id)+'&limit=1');},
telephoneParVendeur(vendeurId){return Donnees._lirePublic('boutiques?select=telephone&user_id=eq.'+encodeURIComponent(vendeurId)+'&order=created_at.desc&limit=1');},
// La boutique de l'utilisateur connecté
mienne(s){return Donnees._lire(s,'boutiques?select=*&user_id=eq.'+s.user_id+'&limit=1');},
creer(s,corps){return Donnees._ecrire(s,'POST','boutiques',corps,'return=minimal');},
modifier(s,id,corps){return Donnees._ecrire(s,'PATCH','boutiques?id=eq.'+encodeURIComponent(id)+'&user_id=eq.'+s.user_id,corps,'return=representation');}
};
// Données : réglages globaux
Donnees.reglages={
whatsappVerification(){return Donnees._lirePublic('reglages?select=valeur&cle=eq.whatsapp_verification');}
};
