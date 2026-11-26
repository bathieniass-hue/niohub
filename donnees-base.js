// ============================================================
// Couche données : outils de base.
// Aucune manipulation de l'écran ici. Chaque fonction de donnees-
// renvoie la réponse brute de fetch (même comportement qu'avant) :
// l'appelant garde sa propre gestion des erreurs.
// Tout est rangé dans l'objet global « Donnees », sauf entetesAuth
// qui reste globale car d'autres fichiers l'utilisent.
// ============================================================
const Donnees={};
const REST_URL=SUPABASE_URL+'/rest/v1/';

// Entêtes avec session (s = session de l'utilisateur connecté)
function entetesAuth(s,json){
const h={apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token};
if(json) h['Content-Type']='application/json';
return h;
}

// Outils internes de la couche données
Donnees._lirePublic=function(chemin){return fetch(REST_URL+chemin,{headers:{apikey:SUPABASE_KEY}});};
Donnees._lire=function(s,chemin){return fetch(REST_URL+chemin,{headers:entetesAuth(s)});};
// methode = POST | PATCH | DELETE ; prefer = valeur de l'entête Prefer (facultatif)
Donnees._ecrire=function(s,methode,chemin,corps,prefer){
const h=entetesAuth(s,true);
if(prefer) h.Prefer=prefer;
const opt={method:methode,headers:h};
if(corps!==undefined) opt.body=JSON.stringify(corps);
return fetch(REST_URL+chemin,opt);
};
// Lecture générique avec session (chemin = ex. 'avis?select=...'), utilisée par le préchargement des notifications
Donnees.lire=Donnees._lire;
// Fonction serveur (RPC)
Donnees._rpc=function(s,nom,params){
return fetch(REST_URL+'rpc/'+nom,{method:'POST',headers:entetesAuth(s,true),body:params===undefined?'{}':JSON.stringify(params)});
};
