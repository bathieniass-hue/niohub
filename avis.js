const PAGE_AVIS='avis-page';
let avisVendeurCourant=null;
let avisNoteChoisie=0;
let avisEnCours=false;

const montrerAvantAvis=montrer;
montrer=function(vue){
const p=document.getElementById(PAGE_AVIS);
if(p&&vue!==PAGE_AVIS) p.style.display='none';
montrerAvantAvis(vue);
};

function etoiles(n){
const k=Math.max(0,Math.min(5,Math.round(n)));
return '★'.repeat(k)+'☆'.repeat(5-k);
}

function moyenne(lignes){
return lignes.length?lignes.reduce((t,a)=>t+a.note,0)/lignes.length:0;
}

function texteMoyenne(lignes){
return lignes.length?moyenne(lignes).toFixed(1).replace('.',','):'–';
}

function resumeTexte(lignes){
return lignes.length?lignes.length+' avis':'Aucun avis pour l\'instant';
}

// En cas d'erreur réseau, retourne une liste vide marquée .erreur = true
// (les autres fichiers continuent de fonctionner, ceux qui le veulent peuvent tester .erreur)
async function chargerAvisVendeur(vendeurId,colonnes){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/avis?select='+(colonnes||'*')+'&vendeur_id=eq.'+encodeURIComponent(vendeurId)+'&order=created_at.desc&limit=200',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
return await r.json();
}catch(e){
const vide=[];
vide.erreur=true;
return vide;
}
}

async function chargerMonAvis(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/avis?select=*&vendeur_id=eq.'+encodeURIComponent(avisVendeurCourant)+'&acheteur_id=eq.'+s.user_id+'&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
return {avis:lignes[0]||null};
}catch(e){return {erreur:true};}
}

// true = a une commande livrée chez ce vendeur, false = non, null = erreur réseau
async function commandeLivreeChez(s){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?select=id&acheteur_id=eq.'+s.user_id+'&vendeur_id=eq.'+encodeURIComponent(avisVendeurCourant)+'&statut=eq.'+encodeURIComponent('Livrée')+'&limit=1',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
return (await r.json()).length>0;
}catch(e){return null;}
}

async function afficherBoutiqueFiche(userId){
avisVendeurCourant=userId||null;
const zone=document.querySelector('#fiche .boutique');
if(!zone) return;
if(!userId){zone.innerHTML='<b>Produit de démonstration</b>';return;}
try{
const [r,lignes]=await Promise.all([
fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+encodeURIComponent(userId)+'&limit=1',{headers:{apikey:SUPABASE_KEY}}),
chargerAvisVendeur(userId,'note')
]);
// Si l'utilisateur a ouvert un autre produit entre-temps, on n'écrit rien
if(avisVendeurCourant!==userId) return;
if(!r.ok) throw new Error(r.status);
const b=(await r.json())[0];
if(!b){zone.innerHTML='<b>Boutique non ouverte</b>';return;}
const note=lignes.erreur?'':`<span style="color:#F2B233;font-size:14px">${etoiles(moyenne(lignes))} <span style="color:#1E1A14;font-weight:bold">${texteMoyenne(lignes)}</span></span>`;
const initiale=esc((b.nom||'N').charAt(0).toUpperCase());
zone.innerHTML=`<div style="display:flex;gap:12px;align-items:center">`+
`<div class="avatar" style="width:52px;height:52px;font-size:18px;flex-shrink:0;background:${fondImage(b.logo,'#F2B233')}">${urlSure(b.logo)?'':initiale}</div>`+
`<div style="flex:1;min-width:0">`+
`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b>${esc(b.nom)}</b>${note}</div>`+
`<div style="font-size:12px;color:#6B6254;margin-top:2px">${esc(b.adresse||'Adresse non indiquée')} · ${telephonesBoutique(b)}</div>`+
`</div></div>`+
`<button class="btn2" style="margin-top:12px" onclick="voirAvis()">Voir les avis</button>`;
}catch(e){
if(avisVendeurCourant===userId) zone.innerHTML='<b>Boutique</b>';
}
}

function creerPageAvis(){
let p=document.getElementById(PAGE_AVIS);
if(!p){
p=document.createElement('div');
p.id=PAGE_AVIS;
p.className='page';
document.body.appendChild(p);
}
return p;
}

async function voirAvis(){
if(!avisVendeurCourant){bandeau('Ce produit de démonstration ne peut pas recevoir d\'avis.');return;}
// Retour : vers "Mes achats" si on vient de là, sinon vers la fiche produit
const ach=document.getElementById('achats-detail');
const retour=(ach&&ach.style.display==='block')?"afficherPageAchats('achats-detail')":"montrer('fiche')";
const p=creerPageAvis();
p.innerHTML=`<header><button class="retour" onclick="${retour}">←</button><span style="font-weight:bold;font-size:20px">Avis</span><span></span></header><div id="avis-resume"></div><label>Avis des clients</label><div id="avis-liste" class="liste" style="margin-top:0">Chargement…</div><div id="avis-moi"></div>`;
montrer(PAGE_AVIS);
p.style.display='block';
window.scrollTo(0,0);
await rafraichirAvis();
}

async function rafraichirAvis(){
const lignes=await chargerAvisVendeur(avisVendeurCourant);
const resume=document.getElementById('avis-resume');
const liste=document.getElementById('avis-liste');
if(!resume||!liste) return;
if(lignes.erreur){
resume.innerHTML='';
liste.innerHTML='Impossible de charger les avis. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" onclick="rafraichirAvis()">Réessayer</button>';
document.getElementById('avis-moi').innerHTML='';
return;
}
resume.innerHTML=`<div class="boutique" style="margin-top:0;text-align:center"><div style="font-size:36px;font-weight:800;color:#0E6B47">${texteMoyenne(lignes)}</div><div style="color:#F2B233;font-size:20px">${etoiles(moyenne(lignes))}</div><div style="font-size:13px;color:#6B6254">${resumeTexte(lignes)}</div></div>`;
liste.innerHTML=lignes.length
?lignes.map(a=>`<div class="ligne" style="display:block"><div class="name">${esc(a.auteur)} <span style="color:#F2B233;font-weight:normal">${etoiles(a.note)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:''}</div>`).join('')
:"Aucun avis pour l'instant.";
await afficherMonAvis();
}

async function afficherMonAvis(){
const zone=document.getElementById('avis-moi');
if(!zone) return;
const s=await sessionValide();
if(!s||!s.user_id){
zone.innerHTML='<label>Votre avis</label><div class="liste" style="margin-top:0">Connectez-vous pour donner votre avis.</div><button class="btn" onclick="afficherConnexion()">Se connecter</button>';
return;
}
if(s.user_id===avisVendeurCourant){
zone.innerHTML='<label>Votre avis</label><div class="liste" style="margin-top:0">Vous ne pouvez pas noter votre propre boutique.</div>';
return;
}
const [moi,livre]=await Promise.all([chargerMonAvis(s),commandeLivreeChez(s)]);
if(moi.erreur||livre===null){
zone.innerHTML='<label>Votre avis</label><div class="liste" style="margin-top:0">Impossible de vérifier votre avis. Vérifiez votre connexion.</div><button class="btn2" onclick="afficherMonAvis()">Réessayer</button>';
return;
}
const mien=moi.avis;
if(mien){
zone.innerHTML=`<label>Votre avis</label><div class="liste" style="margin-top:0"><div style="color:#F2B233;font-size:18px">${etoiles(mien.note)}</div>${mien.commentaire?`<div style="font-size:14px;margin-top:6px">${esc(mien.commentaire)}</div>`:''}<div style="font-size:12px;color:#6B6254;margin-top:6px">Vous avez déjà donné votre avis à ce vendeur.</div></div>`;
return;
}
if(!livre){
zone.innerHTML='<label>Votre avis</label><div class="liste" style="margin-top:0">Vous pourrez donner votre avis après la livraison d\'une commande auprès de cette boutique.</div>';
return;
}
zone.innerHTML=formulaireAvis();
}

function formulaireAvis(){
avisNoteChoisie=0;
const boutons=[1,2,3,4,5].map(n=>`<button data-n="${n}" onclick="choisirEtoile(${n})" style="border:0;background:none;font-size:44px;line-height:1;color:#D3C9B0;padding:0 6px">★</button>`).join('');
return `<label>Votre avis</label>
<div id="av-etoiles" style="display:flex;justify-content:center;margin:4px 0 8px">${boutons}</div>
<label>Commentaire (facultatif)</label>
<textarea id="av-texte" maxlength="500" style="width:100%;height:90px;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif"></textarea>
<div id="av-msg" class="msg"></div>
<button class="btn" style="margin-top:14px" onclick="envoyerAvis()">Publier mon avis</button>`;
}

function choisirEtoile(n){
avisNoteChoisie=n;
document.querySelectorAll('#av-etoiles button').forEach(b=>{b.style.color=Number(b.dataset.n)<=n?'#F2B233':'#D3C9B0';});
}

async function envoyerAvis(){
if(avisEnCours) return;
const msg=document.getElementById('av-msg');
msg.textContent='';
if(!avisNoteChoisie){msg.textContent='Touchez une étoile pour noter.';return;}
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const commentaire=document.getElementById('av-texte').value.trim();
if(commentaire.length>500){msg.textContent='Le commentaire est trop long (500 caractères maximum).';return;}
const bouton=document.querySelector('#avis-moi .btn');
const texteBouton=bouton?bouton.textContent:'';
avisEnCours=true;
if(bouton){bouton.disabled=true;bouton.textContent='Envoi en cours…';}
const fin=()=>{avisEnCours=false;if(bouton){bouton.disabled=false;bouton.textContent=texteBouton;}};
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/avis',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({vendeur_id:avisVendeurCourant,acheteur_id:s.user_id,auteur:s.nom||'Client',note:avisNoteChoisie,commentaire:commentaire||null})});
if(r.status===409){fin();msg.textContent='Vous avez déjà donné un avis.';return;}
if(r.status===401||r.status===403){fin();msg.textContent='Vous pourrez donner votre avis après la livraison d\'une commande auprès de cette boutique.';return;}
if(!r.ok) throw new Error(r.status);
}catch(e){
fin();
msg.textContent='Avis non enregistré. Vérifiez votre connexion et réessayez.';
return;
}
fin();
await rafraichirAvis();
afficherBoutiqueFiche(avisVendeurCourant);
}
