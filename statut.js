const STATUTS=['À préparer','Expédiée','Livrée'];

const voirCommandeDetailAvant=voirCommandeDetail;
voirCommandeDetail=function(i){
const c=commandesCache[i];
if(!c) return;
const statut=c.statut||'À préparer';
const tel=c.telephone||'';
ouvrirDetail('commandes-page','Commande',[
['Produit',c.produit],
['Quantité',String(c.quantite)],
['Client',c.nom_client],
['Téléphone',tel],
['Adresse',c.adresse||'Non indiquée'],
['Paiement',c.paiement||'Non indiqué'],
['Statut',statut],
['Date',new Date(c.created_at).toLocaleString('fr-FR')]
],
`<div style="display:flex;gap:10px;margin-top:14px"><a class="btn" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block" href="tel:${esc(tel)}">Appeler</a><a class="btn2" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block;margin-top:0" href="${lienWhatsapp(tel)}" target="_blank">WhatsApp</a></div>
<div style="margin-top:18px;font-size:13px;font-weight:bold;color:#6B6254">Changer le statut</div>
<div style="display:flex;gap:8px;margin-top:8px">${STATUTS.map(x=>`<button class="${x===statut?'btn':'btn2'}" style="margin-top:0;flex:1;font-size:13px;height:44px;padding:0 4px" onclick="changerStatut(${i},'${x}')">${x}</button>`).join('')}</div>
<div id="statut-msg" class="msg"></div>`);
};

async function changerStatut(i,nouveau){
const c=commandesCache[i];
if(!c) return;
const msg=document.getElementById('statut-msg');
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil.');return;}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?id=eq.'+c.id,{method:'PATCH',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({statut:nouveau})});
if(!r.ok) throw new Error(r.status);
}catch(e){
if(msg) msg.textContent='Statut non enregistré. Réessayez.';
return;
}
c.statut=nouveau;
voirCommandeDetail(i);
}
