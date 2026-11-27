// Service client : écrire à l'équipe NioHub. Les messages arrivent dans l'application d'administration, où la réponse s'écrit. Logique seulement.
// L'affichage : ecran-contact.js (vueContact…). Les clics : ecran-liaisons.js (actions « profil », « envoyerContact »).

VUES.push('contact');
VUES_MENU['contact']=2;
creerPage('contact');

let contactLignes=[];
let contactTimer=null;
let contactSignature='';
let contactMoi=null;

async function voirContact(){
const s=await sessionValide();
if(!s||!s.user_id){
bandeau('Connectez-vous dans Profil pour écrire à NioHub.');
return;
}
contactMoi=s.user_id;
contactLignes=[];
contactSignature='';
const page=document.getElementById('contact');
page.innerHTML=vueContact();
// Garde le clavier ouvert quand on touche « Envoyer »
document.getElementById('contact-envoyer').addEventListener('pointerdown',e=>e.preventDefault());
document.getElementById('contact-texte').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();envoyerContact();}});
montrer('contact');
await chargerContact(true);
clearInterval(contactTimer);
contactTimer=setInterval(()=>{
if(vueCourante!=='contact'){clearInterval(contactTimer);return;}
if(document.visibilityState==='visible') chargerContact(false);
},5000);
}

function dessinerContact(descendre){
const zone=document.getElementById('contact-fil');
if(!zone) return;
const proche=window.innerHeight+window.scrollY>=document.body.scrollHeight-140;
let jourPrec='';
const lignes=contactLignes.map(m=>{
const j=jourMsg(m.created_at);
const nouveau=j!==jourPrec;
jourPrec=j;
return {jour:nouveau?j:'',miens:!m.expediteur_admin,texte:typoFr(esc(m.texte)),heure:heureMsg(m.created_at)};
});
zone.innerHTML=vueContactFil(lignes);
const intro=document.getElementById('contact-intro');
if(intro) intro.style.display=contactLignes.length?'none':'block';
if(descendre||proche) window.scrollTo(0,document.body.scrollHeight);
}

async function chargerContact(initial){
const s=await sessionValide();
if(!s||!s.user_id) return;
try{
const r=await Donnees.support.liste(s);
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
if(vueCourante!=='contact') return;
const sig=lignes.map(m=>m.id+':'+m.lu).join(',');
if(initial||sig!==contactSignature){
contactSignature=sig;
// on garde les messages envoyés à l'instant qui ne sont pas encore revenus du serveur
const enAttente=contactLignes.filter(m=>m._attente);
contactLignes=lignes.concat(enAttente);
dessinerContact(initial);
}
// Les réponses de l'équipe sont lues dès que l'écran est ouvert
if(lignes.some(m=>m.expediteur_admin&&!m.lu)){
Donnees.support.marquerLus(s).then(()=>{if(typeof majCompteurs==='function') majCompteurs();}).catch(()=>{});
}
}catch(e){
if(initial){
document.getElementById('contact-fil').innerHTML=vueContactErreurChargement();
}
}
}

async function envoyerContact(){
const champ=document.getElementById('contact-texte');
const erreur=document.getElementById('contact-erreur');
const bouton=document.getElementById('contact-envoyer');
if(!champ) return;
const texte=champ.value.trim();
if(!texte) return;
erreur.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){erreur.textContent='Connectez-vous pour écrire à NioHub.';return;}
bouton.disabled=true;
champ.value='';
const temporaire={id:'attente-'+Date.now(),texte:texte,created_at:new Date().toISOString(),expediteur_admin:false,_attente:true};
contactLignes.push(temporaire);
dessinerContact(true);
try{
const r=await Donnees.support.envoyer(s,texte);
if(!r.ok){
const t=await r.text();
throw new Error(t.indexOf('trop de messages')>=0?'trop':String(r.status));
}
const lignes=await r.json();
contactLignes=contactLignes.filter(m=>m!==temporaire);
if(lignes[0]) contactLignes.push(lignes[0]);
contactSignature='';
dessinerContact(true);
}catch(e){
// Le message n'est pas parti : on le remet dans la case pour ne rien perdre
contactLignes=contactLignes.filter(m=>m!==temporaire);
champ.value=texte;
dessinerContact(false);
erreur.textContent=e.message==='trop'?'Vous avez envoyé beaucoup de messages. Réessayez dans quelques minutes.':'Message non envoyé. Vérifiez votre connexion et réessayez.';
}
bouton.disabled=false;
champ.focus();
}
