const STATUTS=['À préparer','Expédiée','Livrée','Annulée'];
// Étapes autorisées : on avance, on ne revient jamais en arrière.
const SUIVANTS={
'À préparer':['Expédiée','Annulée'],
'Expédiée':['Livrée','Annulée'],
'Livrée':[],
'Annulée':[]
};
const ACTIONS={'Expédiée':'Marquer expédiée','Livrée':'Marquer livrée','Annulée':'Annuler la commande'};
let statutEnCours=false;

voirCommandeDetail=function(i){
const c=commandesCache[i];
if(!c) return;
const statut=STATUTS.includes(c.statut)?c.statut:'À préparer';
const tel=c.telephone||'';
const suivants=SUIVANTS[statut]||[];
const idSur=esc(c.id);
const total=c.total?Number(c.total).toLocaleString('fr-FR')+' FCFA':'Non indiqué';
const blocStatut=suivants.length
?`<div style="margin-top:18px;font-size:13px;font-weight:bold;color:#6B6254">Changer le statut</div>
<div style="display:flex;gap:8px;margin-top:8px">${suivants.map(x=>`<button class="${x==='Annulée'?'btn2':'btn'}" style="margin-top:0;flex:1;font-size:13px;height:44px;padding:0 4px;${x==='Annulée'?'color:#B4291A;border-color:#B4291A':''}" onclick="changerStatut('${idSur}','${x}')">${ACTIONS[x]}</button>`).join('')}</div>`
:`<div style="margin-top:18px;font-size:13px;color:#6B6254">Cette commande est terminée : son statut ne peut plus changer.</div>`;
ouvrirDetail('commandes-page','Commande',[
['Produit',c.produit],
['Quantité',String(c.quantite)],
['Total',total],
['Client',c.nom_client],
['Téléphone',tel],
['Adresse',c.adresse||'Non indiquée'],
['Paiement',c.paiement||'Non indiqué'],
['Statut',statut],
['Date',new Date(c.created_at).toLocaleString('fr-FR')]
],
`<div style="display:flex;gap:10px;margin-top:14px"><a class="btn" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block" href="tel:${esc(tel)}">Appeler</a><a class="btn2" style="flex:1;text-align:center;text-decoration:none;line-height:52px;display:block;margin-top:0" href="${esc(lienWhatsapp(tel))}" target="_blank" rel="noopener">WhatsApp</a></div>
${blocStatut}
<div id="statut-msg" class="msg"></div>`);
};

async function changerStatut(id,nouveau){
if(statutEnCours) return;
const i=commandesCache.findIndex(x=>String(x.id)===String(id));
const c=commandesCache[i];
if(!c) return;
const actuel=STATUTS.includes(c.statut)?c.statut:'À préparer';
if(!(SUIVANTS[actuel]||[]).includes(nouveau)) return;
if(nouveau==='Annulée'&&!confirm('Annuler cette commande ? Cette action est définitive.')) return;
const msg=document.getElementById('statut-msg');
const s=await sessionValide();
if(!s||!s.user_id){alert('Connectez-vous dans Profil.');return;}
statutEnCours=true;
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?id=eq.'+encodeURIComponent(c.id)+'&vendeur_id=eq.'+s.user_id,{method:'PATCH',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({statut:nouveau})});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
// Supabase répond "OK" même si la règle de sécurité bloque : on vérifie qu'une ligne a bien été modifiée
if(!lignes.length) throw new Error('refusé');
}catch(e){
statutEnCours=false;
if(msg) msg.textContent='Statut non enregistré. Réessayez.';
return;
}
statutEnCours=false;
c.statut=nouveau;
voirCommandeDetail(i);
}
