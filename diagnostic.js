// ============================================================
// NioHub : diagnostic de démarrage.
// Chargé EN PREMIER par index.html. Ne fait rien tant que tout va bien.
// Si un fichier manque, est ancien ou incorrect (envoi incomplet sur GitHub,
// copie en cache périmée...), il affiche une barre rouge qui dit lequel.
// Pour ajouter un fichier au contrôle : l'ajouter à ATTENDUS ci-dessous.
// ============================================================
(function(){
const problemes=[];
const deja={};
function noter(texte){if(deja[texte]) return;deja[texte]=1;problemes.push(texte);if(pret) afficher();}
function nom(url){try{return String(url).split('?')[0].split('/').pop()||String(url);}catch(e){return String(url);}}
let pret=false;

// 1. Un fichier du site qui ne se charge pas (introuvable, hors réseau...)
window.addEventListener('error',function(e){
const c=e.target;
if(c&&c!==window&&c.tagName==='SCRIPT'){
const u=c.src||'';
if(u.indexOf(location.origin)===0) noter('Fichier introuvable : '+nom(u));
return;
}
// 2. Une erreur de programmation au démarrage
const m=e.message||'';
if(!m||m==='Script error.'||m.indexOf('ResizeObserver')>-1) return;
noter('Erreur : '+m+(e.filename?' ('+nom(e.filename)+(e.lineno?':'+e.lineno:'')+')':''));
},true);
window.addEventListener('unhandledrejection',function(e){
const r=e.reason;
if(r&&(r.name==='ReferenceError'||r.name==='TypeError')) noter('Erreur : '+r.message);
});

// 3. Contrôle de présence, une fois la page chargée
// [fonction attendue, fichier qui doit la définir]
const ATTENDUS=[
['apresAccueil','app.js'],['envoyerCommande','commande.js'],['telephonesBoutique','boutique.js'],
['lireSession','compte.js'],['heureMsg','messages.js'],['texteMoyenne','avis.js'],
['changerStatut','statut.js'],['vueCommandeVendeur','ecran-statut.js'],['afficherPageAchats','achats.js'],['voirVitrine','vitrine.js'],['vueVitrine','ecran-vitrine.js'],['vueBandeau','ecran-bandeau.js'],
['dessinerPhotoProfil','profil.js'],['themeActuel','parametres.js'],['chargerContact','contact.js'],
['notifUid','notifications.js'],['lireFavoris','favoris.js'],['afficherRaccourcis','raccourcis.js'],
['completerFicheBoutique','boutique-fiche.js'],['creerChampsDetails','details-produit.js'],
['televerserNouvellesPhotos','ajout-produit.js'],['arrangerFiche','fiche-details.js'],
['bandeau','bandeau.js'],['verifierMiseAJour','pwa.js']
];
// [module de la couche données, fichier]
const MODULES=[
['produits','donnees-produits.js'],['boutiques','donnees-boutiques.js'],['reglages','donnees-boutiques.js'],
['commandes','donnees-commandes.js'],['avis','donnees-avis.js'],['profils','donnees-profils.js'],
['messages','donnees-messages.js'],['support','donnees-support.js'],['notifications','donnees-notifications.js'],
['push','donnees-notifications.js'],['photos','donnees-photos.js'],['auth','donnees-auth.js']
];
function controler(){
if(typeof SUPABASE_URL==='undefined'||typeof SUPABASE_KEY==='undefined') noter('Fichier absent ou incorrect : config.js');
if(typeof NIOHUB_VERSION==='undefined') noter('Fichier absent ou incorrect : version.js');
if(typeof Donnees==='undefined') noter('Fichier absent ou incorrect : donnees-base.js');
else MODULES.forEach(function(m){if(!Donnees[m[0]]) noter('Fichier absent ou incorrect : '+m[1]);});
ATTENDUS.forEach(function(a){if(typeof window[a[0]]!=='function') noter('Fichier absent ou incorrect : '+a[1]);});
['grid','menu','accueil','fiche','commande'].forEach(function(id){
if(!document.getElementById(id)) noter('Écran absent (#'+id+') : vérifier les fichiers ecran-*.js');
});
}

// Barre rouge, repliable
function afficher(){
let b=document.getElementById('diagnostic-nio');
if(!b){
b=document.createElement('div');
b.id='diagnostic-nio';
b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:0;width:100%;max-width:430px;box-sizing:border-box;z-index:100000;background:#B4291A;color:#fff;padding:10px 14px;font:13px/1.4 sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);max-height:60vh;overflow:auto';
document.body.appendChild(b);
}
b.textContent='';
const t=document.createElement('div');
t.style.cssText='display:flex;gap:10px;align-items:center;margin-bottom:6px';
const titre=document.createElement('b');
titre.style.flex='1';
titre.textContent='NioHub : un fichier du site pose problème';
const x=document.createElement('button');
x.type='button';x.textContent='✕';x.setAttribute('aria-label','Fermer');
x.style.cssText='border:0;background:none;color:#fff;font-size:18px;line-height:1';
x.onclick=function(){b.remove();};
t.appendChild(titre);t.appendChild(x);b.appendChild(t);
problemes.forEach(function(p){const l=document.createElement('div');l.textContent='• '+p;b.appendChild(l);});
const aide=document.createElement('div');
aide.style.cssText='margin-top:6px;opacity:.85';
aide.textContent='Renvoyez ce fichier sur GitHub, puis rechargez deux fois.';
b.appendChild(aide);
}

window.addEventListener('load',function(){
setTimeout(function(){
pret=true;
controler();
if(problemes.length) afficher();
},800);
});
})();
