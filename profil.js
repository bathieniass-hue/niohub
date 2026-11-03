function creerPageModifProfil(){
if(document.getElementById('profil-modif')) return;
const p=document.createElement('div');
p.id='profil-modif';
p.className='page';
p.style.display='none';
p.innerHTML=`
<header><button class="retour" onclick="retourProfilModif()">←</button><span style="font-weight:bold;font-size:20px">Modifier mon profil</span><span></span></header>
<label>Nom complet</label>
<input id="pm-nom" placeholder="Ex. Fatou Diop">
<label>Téléphone</label>
<input id="pm-tel" type="tel" inputmode="tel" placeholder="Ex. 77 123 45 67">
<label>Adresse</label>
<input id="pm-adresse" placeholder="Quartier, repère">
<div id="pm-msg" class="msg"></div>
<button class="btn" style="margin-top:14px" onclick="enregistrerProfil()">Enregistrer</button>
`;
document.body.appendChild(p);
}
creerPageModifProfil();

async function modifierProfil(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous pour modifier votre profil.');return;}
document.getElementById('profil').style.display='none';
document.getElementById('profil-modif').style.display='block';
document.getElementById('pm-msg').textContent='';
window.scrollTo(0,0);
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/profils?select=*&user_id=eq.'+s.user_id+'&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const p=(await r.json())[0]||{};
document.getElementById('pm-nom').value=p.nom||'';
document.getElementById('pm-tel').value=p.telephone||'';
document.getElementById('pm-adresse').value=p.adresse||'';
}catch(e){
document.getElementById('pm-msg').textContent='Impossible de charger votre profil.';
}
}

function retourProfilModif(){
document.getElementById('profil-modif').style.display='none';
montrer('profil');
}

async function enregistrerProfil(){
const msg=document.getElementById('pm-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous pour modifier votre profil.');return;}
const nom=document.getElementById('pm-nom').value.trim();
const tel=document.getElementById('pm-tel').value.trim();
const adresse=document.getElementById('pm-adresse').value.trim();
if(!nom||!tel){msg.textContent='Le nom et le téléphone sont obligatoires.';return;}
const entete={apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};
const donnees={nom:nom,telephone:tel,adresse:adresse||null};
try{
let r=await fetch(SUPABASE_URL+'/rest/v1/profils?user_id=eq.'+s.user_id,{method:'PATCH',headers:Object.assign({},entete,{Prefer:'return=representation'}),body:JSON.stringify(donnees)});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
if(!lignes.length){
r=await fetch(SUPABASE_URL+'/rest/v1/profils',{method:'POST',headers:Object.assign({},entete,{Prefer:'return=minimal'}),body:JSON.stringify(Object.assign({user_id:s.user_id},donnees))});
if(!r.ok) throw new Error(r.status);
}
}catch(e){
msg.textContent='Enregistrement impossible. Réessayez.';
return;
}
document.getElementById('profil-nom').textContent=nom;
retourProfilModif();
}

function deconnecter(){
if(!confirm('Voulez-vous vous déconnecter ?')) return;
localStorage.removeItem('niohub_session_v2');
location.reload();
}
