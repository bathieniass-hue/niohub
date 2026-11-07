// Page "Modifier mon profil" enregistrée comme une vraie vue : le menu du bas la ferme correctement
VUES.push('profil-modif');
VUES_MENU['profil-modif']=2;

function creerPageModifProfil(){
if(document.getElementById('profil-modif')) return;
const p=document.createElement('div');
p.id='profil-modif';
p.className='page';
p.style.display='none';
p.innerHTML=`
<header><button class="retour" onclick="retourProfilModif()">←</button><span style="font-weight:bold;font-size:20px">Modifier mon profil</span><span></span></header>
<label>Nom complet</label>
<input id="pm-nom" placeholder="Ex. Fatou Diop" maxlength="80">
<label>Téléphone</label>
<div class="champ-tel"><span class="indicatif">+221</span><input id="pm-tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="77 123 45 67" maxlength="20"></div>
<label>Adresse</label>
<input id="pm-adresse" placeholder="Quartier, repère" maxlength="200">
<div id="pm-msg" class="msg"></div>
<button id="pm-valider" class="btn" style="margin-top:14px" onclick="enregistrerProfil()">Enregistrer</button>
`;
document.body.appendChild(p);
}
creerPageModifProfil();

let profilModifEnCours=false;

async function modifierProfil(){
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous pour modifier votre profil.');return;}
// On remplit tout de suite avec les infos du téléphone, puis on rafraîchit depuis le serveur
const avant={'pm-nom':s.nom||'','pm-tel':formaterTelephone(s.telephone),'pm-adresse':s.adresse||''};
Object.keys(avant).forEach(id=>{document.getElementById(id).value=avant[id];});
document.getElementById('pm-msg').textContent='';
montrer('profil-modif');
const res=await chargerProfil(s);
if(res.erreur){
if(!s.nom) document.getElementById('pm-msg').textContent='Impossible de charger votre profil. Vérifiez votre connexion.';
return;
}
if(res.profil){
const serveur={'pm-nom':res.profil.nom||'','pm-tel':formaterTelephone(res.profil.telephone),'pm-adresse':res.profil.adresse||''};
// On ne remplace que les champs que l'utilisateur n'a pas déjà modifiés
Object.keys(avant).forEach(id=>{
const el=document.getElementById(id);
if(el.value===avant[id]) el.value=serveur[id];
});
}
}

function retourProfilModif(){
voirProfil();
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
const entete={apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};
const donnees={nom:nom,telephone:tel,adresse:adresse||null};
const bouton=document.getElementById('pm-valider');
profilModifEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Enregistrement…';}
const fin=()=>{profilModifEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent='Enregistrer';}};
try{
let r=await fetch(SUPABASE_URL+'/rest/v1/profils?user_id=eq.'+s.user_id,{method:'PATCH',headers:Object.assign({},entete,{Prefer:'return=representation'}),body:JSON.stringify(donnees)});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
if(!lignes.length){
r=await fetch(SUPABASE_URL+'/rest/v1/profils',{method:'POST',headers:Object.assign({},entete,{Prefer:'return=minimal'}),body:JSON.stringify(Object.assign({user_id:s.user_id},donnees))});
if(!r.ok) throw new Error(r.status);
}
}catch(e){
fin();
msg.textContent='Enregistrement impossible. Vérifiez votre connexion et réessayez.';
return;
}
fin();
// Le profil gardé sur le téléphone est mis à jour : commandes, avis et carte du profil utilisent le nouveau nom
mettreAJourSession({nom:nom,telephone:tel,adresse:adresse||null});
voirProfil();
}

function deconnecter(){
if(!confirm('Voulez-vous vous déconnecter ?')) return;
oublierSession();
if(window.google&&google.accounts&&google.accounts.id) google.accounts.id.disableAutoSelect();
location.reload();
}
