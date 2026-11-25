// Données : connexion (Supabase Auth). Pas d'entête Authorization ici.
Donnees.auth={
_publier(chemin,corps){return fetch(SUPABASE_URL+'/auth/v1/'+chemin,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(corps)});},
rafraichir(refreshToken){return Donnees.auth._publier('token?grant_type=refresh_token',{refresh_token:refreshToken});},
connexionGoogle(idToken){return Donnees.auth._publier('token?grant_type=id_token',{provider:'google',id_token:idToken});}
};
