// Modifier mon profil : logique seulement.
// L'affichage : ecran-profil.js (vueModifProfil). Les clics : ecran-liaisons.js (actions « profil », « ouvrir », « enregistrerProfil », changement « choisirPhotoProfil »). Le style : style.css (.pm-…).
// Page enregistrée comme une vraie vue : le menu du bas la ferme correctement
VUES.push('profil-modif');
VUES_MENU['profil-modif']=2;

function creerPageModifProfil(){
if(document.getElementById('profil-modif')) return;
const p=document.createElement('div');
p.id='profil-modif';
p.className='page';
p.style.display='none';
p.innerHTML=vueModifProfil();
document.body.appendChild(p);
}
creerPageModifProfil();

// ---------- Photo de profil ----------
let pmPhotoBlob=null;
let pmApercu=null;
function dessinerPhotoProfil(url,nom){
const b=document.getElementById('pm-photo');
if(!b) return;
const sure=url&&(url.startsWith('blob:')?url:urlSure(url));
b.style.background=sure?'url('+sure+') center/cover no-repeat':'#F2B233';
b.textContent=sure?'':((String(nom||'').trim().charAt(0)||'N').toUpperCase());
}
// Recadre au centre en carré de 400 px
function photoCarree(img){
const cote=Math.min(img.width,img.height);
const c=document.createElement('canvas');
c.width=c.height=Math.min(400,cote);
c.getContext('2d').drawImage(img,(img.width-cote)/2,(img.height-cote)/2,cote,cote,0,0,c.width,c.height);
return new Promise(ok=>c.toBlob(ok,'image/jpeg',0.8));
}
async function choisirPhotoProfil(e){
const f=e.target.files[0];
e.target.value='';
if(!f) return;
if(!f.type.startsWith('image/')){bandeau('Choisissez une photo (image).','erreur');return;}
try{
pmPhotoBlob=await photoCarree(await chargerImageDepuis(f));
if(!pmPhotoBlob) throw new Error('image');
}catch(err){
pmPhotoBlob=null;
bandeau('Cette photo ne peut pas être lue. Essayez-en une autre.','erreur');
return;
}
if(pmApercu) URL.revokeObjectURL(pmApercu);
pmApercu=URL.createObjectURL(pmPhotoBlob);
dessinerPhotoProfil(pmApercu);
}
// Envoyée à part : si la colonne photo n'existe pas encore, le reste du profil s'enregistre quand même
async function enregistrerPhotoProfil(s){
if(!pmPhotoBlob) return true;
let url='';
try{
url=await televerserPhoto(pmPhotoBlob,null,s);
const r=await Donnees.profils.modifier(s,{photo:url},'return=minimal');
if(!r.ok) throw new Error(r.status);
}catch(e){
if(url) await supprimerPhotoStockee(url,s);
return false;
}
const ancienne=s.photo;
mettreAJourSession({photo:url});
s.photo=url;
if(ancienne&&ancienne!==url) supprimerPhotoStockee(ancienne,s);
pmPhotoBlob=null;
return true;
}

let profilModifEnCours=false;

async function modifierProfil(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous pour modifier votre profil.');return;}
// On remplit tout de suite avec les infos du téléphone, puis on rafraîchit depuis le serveur
const avant={'pm-nom':s.nom||'','pm-tel':formaterTelephone(s.telephone),'pm-adresse':s.adresse||''};
Object.keys(avant).forEach(id=>{document.getElementById(id).value=avant[id];});
document.getElementById('pm-msg').textContent='';
pmPhotoBlob=null;
dessinerPhotoProfil(s.photo,s.nom);
montrer('profil-modif');
const res=await chargerProfil(s);
if(res.erreur){
if(!s.nom) document.getElementById('pm-msg').textContent='Impossible de charger votre profil. Vérifiez votre connexion.';
return;
}
if(res.profil){
if(!pmPhotoBlob&&res.profil.photo!==undefined){
mettreAJourSession({photo:res.profil.photo||null});
dessinerPhotoProfil(res.profil.photo,res.profil.nom);
}
const serveur={'pm-nom':res.profil.nom||'','pm-tel':formaterTelephone(res.profil.telephone),'pm-adresse':res.profil.adresse||''};
// On ne remplace que les champs que l'utilisateur n'a pas déjà modifiés
Object.keys(avant).forEach(id=>{
const el=document.getElementById(id);
if(el.value===avant[id]) el.value=serveur[id];
});
}
}

async function enregistrerProfil(){
if(profilModifEnCours) return;
const msg=document.getElementById('pm-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous pour modifier votre profil.');return;}
const nom=document.getElementById('pm-nom').value.trim();
const tel=formaterTelephone(document.getElementById('pm-tel').value);
const adresse=document.getElementById('pm-adresse').value.trim();
if(!nom||!tel){msg.textContent='Le nom et le téléphone sont obligatoires.';return;}
if(nom.length<2||nom.length>80){msg.textContent='Le nom doit avoir entre 2 et 80 caractères.';return;}
if(!telephoneValide(tel)){msg.textContent=MESSAGE_TEL;return;}
if(adresse.length>200){msg.textContent='L\'adresse est trop longue (200 caractères maximum).';return;}
const donnees={nom:nom,telephone:tel,adresse:adresse||null};
const bouton=document.getElementById('pm-valider');
profilModifEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Enregistrement…';}
const fin=()=>{profilModifEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent='Enregistrer';}};
try{
let r=await Donnees.profils.modifier(s,donnees,'return=representation');
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
if(!lignes.length){
r=await Donnees.profils.creer(s,Object.assign({user_id:s.user_id},donnees),'return=minimal');
if(!r.ok) throw new Error(r.status);
}
}catch(e){
fin();
msg.textContent='Enregistrement impossible. Vérifiez votre connexion et réessayez.';
return;
}
const photoOk=await enregistrerPhotoProfil(s);
fin();
if(!photoOk) bandeau('Profil enregistré, mais la photo n\'a pas pu être envoyée. Réessayez.','erreur');
// Le profil gardé sur le téléphone est mis à jour : commandes, avis et carte du profil utilisent le nouveau nom
mettreAJourSession({nom:nom,telephone:tel,adresse:adresse||null});
voirProfil();
}

async function deconnecter(){
if(!(await confirmer('Vous devrez vous reconnecter pour publier, commander ou voir vos messages.',{titre:'Se déconnecter ?',ok:'Se déconnecter'}))) return;
oublierSession();
if(window.google&&google.accounts&&google.accounts.id) google.accounts.id.disableAutoSelect();
location.reload();
}
