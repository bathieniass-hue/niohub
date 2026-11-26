// Statut des commandes : logique seulement (étapes autorisées, changement de statut).
// L'affichage du détail : ecran-statut.js. Le clic sur un bouton de statut : ecran-liaisons.js (action « statut »).
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
const total=c.total?Number(c.total).toLocaleString('fr-FR')+' FCFA':'Non indiqué';
ouvrirDetail('commandes-page','Commande',[
['Produit',c.produit],
['Quantité',String(c.quantite)],
['Total',total],
['Client',c.nom_client],
['Adresse',c.adresse||'Non indiquée'],
['Téléphone',tel?formaterTelephone(tel):''],
['Paiement',c.paiement||'Non indiqué'],
['Statut',statut],
['Date',new Date(c.created_at).toLocaleString('fr-FR')]
],
vueCommandeVendeur({id:c.id,suivants:suivants.map(x=>({statut:x,libelle:ACTIONS[x]})),appel:lienAppel(tel),whatsapp:lienWhatsapp(tel)}));
};

async function changerStatut(id,nouveau){
if(statutEnCours) return;
const i=commandesCache.findIndex(x=>String(x.id)===String(id));
const c=commandesCache[i];
if(!c) return;
const actuel=STATUTS.includes(c.statut)?c.statut:'À préparer';
if(!(SUIVANTS[actuel]||[]).includes(nouveau)) return;
if(nouveau==='Annulée'&&!(await confirmer('Le client verra que sa commande est annulée. Cette action est définitive.',{titre:'Annuler cette commande ?',ok:'Oui, annuler',annuler:'Garder',danger:true}))) return;
const msg=document.getElementById('statut-msg');
const s=await sessionValide();
if(!s||!s.user_id){bandeau('Connectez-vous dans Profil.');return;}
statutEnCours=true;
try{
const r=await Donnees.commandes.changerStatut(s,c.id,nouveau);
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
