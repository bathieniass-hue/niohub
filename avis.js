const PAGE_AVIS='avis-page';
let avisVendeurCourant=null;

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

function resumeTexte(lignes){
if(!lignes.length) return 'Aucun avis';
const moy=lignes.reduce((t,a)=>t+a.note,0)/lignes.length;
return moy.toFixed(1).replace('.',',')+' sur 5 · '+lignes.length+' avis';
}

async function chargerAvisVendeur(vendeurId){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/avis?select=*&vendeur_id=eq.'+vendeurId+'&order=created_at.desc',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
return await r.json();
}catch(e){return [];}
}

async function afficherResumeFiche(){
const z=document.querySelector('#fiche .corps');
if(!z) return;
let bloc=document.getElementById('fiche-avis');
if(!bloc){
bloc=document.createElement('div');
bloc.id='fiche-avis';
bloc.style.marginTop='14px';
z.appendChild(bloc);
}
if(!avisVendeurCourant){bloc.innerHTML='';return;}
const lignes=await chargerAvisVendeur(avisVendeurCourant);
const moy=lignes.length?lignes.reduce((t,a)=>t+a.note,0)/lignes.length:0;
bloc.innerHTML=`<div class="liste" style="margin-top:0;display:flex;justify-content:space-between;align-items:center"><span style="color:#F2B233;font-size:16px">${etoiles(moy)}</span><span style="font-size:13px;color:#6B6254">${resumeTexte(lignes)}</span></div><button class="btn2" style="margin-top:10px" onclick="voirAvis()">Voir les avis et donner le mien</button>`;
}

const afficherBoutiqueFicheAvant=afficherBoutiqueFiche;
afficherBoutiqueFiche=async function(userId){
avisVendeurCourant=userId||null;
await afficherBoutiqueFicheAvant(userId);
await afficherResumeFiche();
};

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
if(!avisVendeurCourant){alert('Ce produit de démonstration ne peut pas recevoir d\'avis.');return;}
const p=creerPageAvis();
p.innerHTML=`<header><button class="retour" onclick="montrer('fiche')">←</button><span style="font-weight:bold;font-size:20px">Avis</span><span></span></header><div id="avis-resume"></div><div id="avis-liste" class="liste" style="margin-top:0">Chargement…</div><label>Votre avis</label><div id="avis-form"></div>`;
montrer(PAGE_AVIS);
p.style.display='block';
window.scrollTo(0,0);
await rafraichirAvis();
}

async function rafraichirAvis(){
const lignes=await chargerAvisVendeur(avisVendeurCourant);
const moy=lignes.length?lignes.reduce((t,a)=>t+a.note,0)/lignes.length:0;
document.getElementById('avis-resume').innerHTML=`<div class="boutique" style="margin-top:0;text-align:center"><div style="font-size:36px;font-weight:800;color:#0E6B47">${lignes.length?moy.toFixed(1).replace('.',','):'–'}</div><div style="color:#F2B233;font-size:18px">${etoiles(moy)}</div><div style="font-size:13px;color:#6B6254">${resumeTexte(lignes)}</div></div>`;
document.getElementById('avis-liste').innerHTML=lignes.length
?lignes.map(a=>`<div class="ligne" style="display:block"><div class="name">${esc(a.auteur)} · <span style="color:#F2B233">${etoiles(a.note)}</span></div>${a.commentaire?`<div style="font-size:14px;margin-top:4px">${esc(a.commentaire)}</div>`:''}</div>`).join('')
:"Aucun avis pour l'instant.";
await afficherFormulaireAvis();
}

async function afficherFormulaireAvis(){
const zone=document.getElementById('avis-form');
const s=await sessionValide();
if(!s||!s.user_id){
zone.innerHTML='<div class="liste" style="margin-top:0">Connectez-vous pour donner votre avis.</div><button class="btn" onclick="afficherConnexion()">Se connecter</button>';
return;
}
if(s.user_id===avisVendeurCourant){
zone.innerHTML='<div class="liste" style="margin-top:0">Vous ne pouvez pas donner d\'avis sur votre propre boutique.</div>';
return;
}
zone.innerHTML=`<select id="av-note" style="width:100%;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px"><option value="5">★★★★★ (5)</option><option value="4">★★★★☆ (4)</option><option value="3">★★★☆☆ (3)</option><option value="2">★★☆☆☆ (2)</option><option value="1">★☆☆☆☆ (1)</option></select><label>Commentaire (facultatif)</label><textarea id="av-texte" style="width:100%;height:90px;padding:12px;border:1px solid #E6DECB;border-radius:12px;background:#fff;font-size:15px;font-family:sans-serif"></textarea><div id="av-msg" class="msg"></div><button class="btn" style="margin-top:14px" onclick="envoyerAvis()">Publier mon avis</button>`;
}

async function envoyerAvis(){
const msg=document.getElementById('av-msg');
msg.textContent='';
const s=await sessionValide();
if(!s||!s.user_id){afficherConnexion();return;}
const note=parseInt(document.getElementById('av-note').value,10);
const commentaire=document.getElementById('av-texte').value.trim();
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/avis',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({vendeur_id:avisVendeurCourant,acheteur_id:s.user_id,auteur:s.nom||'Client',note:note,commentaire:commentaire||null})});
if(r.status===409){msg.textContent='Vous avez déjà donné un avis à ce vendeur.';return;}
if(!r.ok) throw new Error(r.status);
}catch(e){
msg.textContent='Avis non enregistré. Réessayez.';
return;
}
alert('Merci pour votre avis !');
await rafraichirAvis();
await afficherResumeFiche();
}
