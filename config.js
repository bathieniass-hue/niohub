// ============================================================
// NioHub : configuration (seul fichier à modifier pour changer
// de serveur ou de réglage global). Chargé avant tous les autres.
// ============================================================
const SUPABASE_URL="https://zpmjbggzqwcajjrzfejg.supabase.co";
const SUPABASE_KEY="sb_publishable_dz22DUOnanzHiA2jLk305g_Cf6KCVPr";

// Adresse publique des photos stockées
const PREFIXE_PHOTOS=SUPABASE_URL+'/storage/v1/object/public/photos/';

// Mettre true pour revoir les 4 produits de démonstration
const AFFICHER_DEMO=false;

// Recherches rapides proposées sur l'écran Recherche (modifier cette liste librement)
const RECHERCHES_RAPIDES=['Téléphone','Chaussures','Robe','Sac','Ordinateur','Télévision','Parfum','Casque'];
