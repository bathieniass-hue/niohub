// Données : profils utilisateurs
Donnees.profils={
mien(s){return Donnees._lire(s,'profils?select=*&user_id=eq.'+s.user_id);},
creer(s,corps,prefer){return Donnees._ecrire(s,'POST','profils',corps,prefer);},
modifier(s,corps,prefer){return Donnees._ecrire(s,'PATCH','profils?user_id=eq.'+s.user_id,corps,prefer);}
};
