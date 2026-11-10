// Vitrine : page publique d'une boutique (ses infos, sa note et ses produits en vente).
// Ouverte depuis la recherche (voirVitrine(user_id)). Dépend d'app.js, boutique.js, compte.js.

let vitrineOrigine='accueil';
let vitrineId=null;

(function(){
const st=document.createElement('style');
st.textContent='.vitrine-grille .vendeur,.vitrine-grille .v-lieu{display:none}'
+'.vitrine-contact{display:flex;gap:8px;margin-top:12px}'
+'.vitrine-contact a{flex:1;text-align:center;text-decoration:none;padding:12px 0;border-radius:14px;border:1.5px solid #0E6B47;color:#0E6B47;font-weight:bold;font-size:14px}';
document.head.appendChild(st);
creerPage('vitrine');
})();

async function vitrineTrouverBoutique(userId){
const b=boutiquesCache.find(x=>x.user_id===userId);
if(b) return b;
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/boutiques?select=*&user_id=eq.'+encodeURIComponent(userId)+'&limit=1',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
return (await r.json())[0]||null;
}catch(e){return null;}
}

function vitrineContact(b){
const tel=[b.telephone,b.telephone2].find(t=>t&&telephoneValide(t));
if(!tel) return '';
return `<div class="vitrine-contact"><a href="tel:+221${chiffresTelephone(tel)}">Appeler</a><a href="${lienWhatsapp(tel)}" target="_blank" rel="noopener">WhatsApp</a></div>`;
}

async function voirVitrine(userId){
if(!userId) return;
if(vueCourante!=='vitrine'&&vueCourante!=='fiche') vitrineOrigine=vueCourante;
vitrineId=userId;
const page=document.getElementById('vitrine');
const entete='<header><button class="retour" onclick="fermerVitrine()">←</button><span style="font-weight:bold;font-size:20px">Boutique</span><span></span></header>';
page.innerHTML=entete+'<div style="margin-top:14px">Chargement…</div>';
montrer('vitrine');
const b=await vitrineTrouverBoutique(userId);
// Si l'utilisateur est parti ailleurs ou a ouvert une autre boutique entre-temps, on n'écrit rien
if(vitrineId!==userId||vueCourante!=='vitrine') return;
if(!b){
page.innerHTML=entete+'<div style="margin-top:14px">Cette boutique est introuvable pour le moment. Vérifiez votre connexion.</div>';
return;
}
const n=notesVendeurs[userId];
const note=n&&n.nb
?`<span style="color:#F2B233;font-size:14px">★</span> <b>${n.moyenne.toFixed(1).replace('.',',')}</b> <span style="font-size:12px;color:#6B6254">(${n.nb} avis)</span>`
:'<span style="font-size:12px;color:#6B6254">Aucun avis</span>';
const initiale=esc((b.nom||'N').charAt(0).toUpperCase());
const tels=telephonesBoutique(b);
const produits=distants.filter(p=>p.user_id===userId);
const carte=`<div style="display:flex;gap:12px;align-items:center;margin-top:14px">`
+`<div class="avatar" style="width:64px;height:64px;font-size:22px;flex-shrink:0;background:${fondImage(b.logo,'#F2B233')}">${urlSure(b.logo)?'':initiale}</div>`
+`<div style="flex:1;min-width:0"><div style="font-weight:bold;font-size:18px">${esc(b.nom)}</div>`
+`<div style="margin-top:2px">${note}</div>`
+`<div style="font-size:13px;color:#6B6254;margin-top:2px">${esc(b.adresse||'Adresse non indiquée')}</div>`
+(tels?`<div style="font-size:13px;color:#6B6254">${tels}</div>`:'')
+`</div></div>`+vitrineContact(b);
const corps=produits.length
?`<div class="titre-section" style="margin-top:18px">Produits en vente (${produits.length})</div><div class="grid vitrine-grille" style="padding:6px 0 110px">${produits.map(p=>carteProduitHTML(p,0)).join('')}</div>`
:'<div style="margin-top:18px;color:#6B6254">Cette boutique n\'a pas encore de produit en vente.</div>';
page.innerHTML=entete+carte+corps;
}

function fermerVitrine(){
const cible=(vitrineOrigine&&vitrineOrigine!=='vitrine'&&vitrineOrigine!=='fiche')?vitrineOrigine:'accueil';
vitrineId=null;
montrer(cible);
}
