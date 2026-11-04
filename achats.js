const PAGE_ACHATS='achats-page';
const PAGE_ACHAT_DETAIL='achats-detail';
let achatsCache=[];

const montrerAvantAchats=montrer;
montrer=function(vue){
[PAGE_ACHATS,PAGE_ACHAT_DETAIL].forEach(id=>{const el=document.getElementById(id);if(el&&id!==vue) el.style.display='none';});
montrerAvantAchats(vue);
};

function pageAchats(id){
let p=document.getElementById(id);
if(!p){
p=document.createElement('div');
p.id=id;
p.className='page';
document.body.appendChild(p);
}
return p;
}

function afficherPageAchats(id){
montrer(id);
const el=document.getElementById(id);
if(el) el.style.display='block';
window.scrollTo(0,0);
}

function couleurStatut(st){
if(st==='Livrée') return '#0E6B47';
if(st==='Expédiée') return '#1B5FA8';
if(st==='Annulée') return '#B4291A';
return '#B4541A';
}

async function voirAchats(){
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil.');montrer('profil');return;}
const p=pageAchats(PAGE_ACHATS);
p.innerHTML=`<header><button class="retour" onclick="voirProfil()">←</button><span style="font-weight:bold;font-size:20px">Mes achats</span><span></span></header><div id="liste-achats" class="liste" style="margin-top:0">Chargement…</div>`;
afficherPageAchats(PAGE_ACHATS);
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?select=*&acheteur_id=eq.'+s.user_id+'&order=created_at.desc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token}});
if(!r.ok) throw new Error(r.status);
achatsCache=await r.json();
document.getElementById('liste-achats').innerHTML=achatsCache.length
?achatsCache.map((c,i)=>{
const st=c.statut||'À préparer';
return `<div class="ligne" style="cursor:pointer" onclick="voirAchatDetail(${i})"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div style="font-size:12px;color:#6B6254">${esc(new Date(c.created_at).toLocaleDateString('fr-FR'))}</div></div><span style="font-size:12px;font-weight:bold;color:${couleurStatut(st)}">${esc(st)}</span><span style="margin-left:6px">›</span></div>`;
}).join('')
:"Vous n'avez pas encore passé de commande.";
}catch(e){
document.getElementById('liste-achats').innerHTML='Erreur de chargement. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" onclick="voirAchats()">Réessayer</button>';
}
}

async function telephoneVendeur(vendeurId){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=telephone&user_id=eq.'+encodeURIComponent(vendeurId)+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) return '';
const l=await r.json();
return (l[0]&&l[0].telephone)||'';
}catch(e){return '';}
}

function voirAchatDetail(i){
const c=achatsCache[i];
if(!c) return;
const st=c.statut||'À préparer';
const total=c.total?Number(c.total).toLocaleString('fr-FR')+' FCFA':'Non indiqué';
const lignes=[
['Produit',c.produit],
['Quantité',String(c.quantite)],
['Total',total],
['Paiement',c.paiement||'Non indiqué'],
['Adresse de livraison',c.adresse||'Non indiquée'],
['Statut',st],
['Date',new Date(c.created_at).toLocaleString('fr-FR')]
];
const p=pageAchats(PAGE_ACHAT_DETAIL);
p.innerHTML=`<header><button class="retour" onclick="afficherPageAchats('${PAGE_ACHATS}')">←</button><span style="font-weight:bold;font-size:18px">Achat</span><span></span></header>
<div class="liste" style="margin-top:0">${lignes.map(([k,v])=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-size:12px;color:#6B6254">${esc(k)}</div><div style="font-size:15px;font-weight:bold;color:${k==='Statut'?couleurStatut(st):'#1E1A14'}">${esc(v)}</div></div>`).join('')}</div>
<div style="font-size:12px;color:#6B6254;margin-top:8px">Le paiement se règle directement avec le vendeur, à la livraison ou par Wave / Orange Money.</div>
<a id="ach-wa" class="btn2" style="display:block;text-align:center;text-decoration:none;line-height:52px;margin-top:14px" href="#" target="_blank" rel="noopener">Contacter le vendeur</a>
${st==='Livrée'?`<button class="btn" style="margin-top:12px" onclick="donnerAvisAchat(${i})">Donner un avis</button>`:''}`;
afficherPageAchats(PAGE_ACHAT_DETAIL);
telephoneVendeur(c.vendeur_id).then(t=>{
const a=document.getElementById('ach-wa');
if(!a) return;
if(t){
a.href=lienWhatsapp(t);
}else{
a.textContent='Numéro du vendeur indisponible';
a.style.opacity='.5';
a.removeAttribute('target');
}
});
}

function donnerAvisAchat(i){
const c=achatsCache[i];
if(!c) return;
avisVendeurCourant=c.vendeur_id;
voirAvis();
}
