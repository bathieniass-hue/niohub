// Données : produits
Donnees.produits={
// Une page du catalogue (public)
lot(debut,taille){return Donnees._lirePublic("produits?select=*&order=created_at.desc&limit="+taille+"&offset="+debut);},
// 60 produits les plus récents ; filtre = fragment de requête déjà prêt (ou '')
recents(filtre){return Donnees._lirePublic('produits?select=*&order=created_at.desc&limit=60'+filtre);},
// Création (editId === null) ou modification d'un produit
enregistrer(s,editId,corps){
const modif=editId!==null;
const chemin=modif?'produits?id=eq.'+editId+'&user_id=eq.'+s.user_id:'produits';
return Donnees._ecrire(s,modif?'PATCH':'POST',chemin,corps,modif?'return=representation':'return=minimal');
},
supprimer(s,id){return Donnees._ecrire(s,'DELETE','produits?id=eq.'+id+'&user_id=eq.'+s.user_id,undefined,'return=representation');}
};
