let cmdProduit="";

function voirCommande(){
cmdProduit=document.getElementById('fnom').textContent;
document.getElementById('cmd-produit').textContent=cmdProduit+' · '+document.getElementById('fprix').textContent;
document.getElementById('cmd-msg').textContent='';
document.getElementById('fiche').style.display='none';
document.getElementById('commande').style.display='block';
window.scrollTo(0,0);
}

function retourFiche(){
document.getElementById('commande').style.display='none';
document.getElementById('fiche').style.display='block';
}

async function envoyerCommande(){
const nom=document.getElementById('cmd-nom').value.trim();
const tel=document.getElementById('cmd-tel').value.trim();
const adresse=document.getElementById('cmd-adresse').value.trim();
const quantite=parseInt(document.getElementById('cmd-quantite').value,10)||1;
const paiement=document.getElementById('cmd-paiement').value;
const msg=document.getElementById('cmd-msg');
if(!nom||!tel){msg.textContent='Indiquez votre nom et votre numéro de téléphone.';return;}
const corps={produit:cmdProduit,quantite:quantite,nom_client:nom,telephone:tel,adresse:adresse||null,paiement:paiement};
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(corps)});
if(!r.ok) throw new Error(r.status);
}catch(e){
msg.textContent='Erreur, commande non envoyée. Réessayez.';
return;
}
alert('Commande envoyée ! Le vendeur vous contactera.');
document.getElementById('commande').style.display='none';
voirAccueil();
}

async function chargerCommandes(){
const zone=document.querySelectorAll('#boutique .liste')[1];
if(!zone) return;
zone.textContent='Chargement…';
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/commandes?select=*&order=created_at.desc',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
zone.innerHTML=lignes.length
?lignes.map(c=>`<div class="ligne"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div class="price" style="font-size:13px">${esc(c.nom_client)} · ${esc(c.telephone)}</div><div style="font-size:12px;color:#6B6254">${esc(c.adresse||'Adresse non indiquée')} · ${esc(c.paiement||'')}</div></div></div>`).join('')
:"Aucune commande pour l'instant.";
}catch(e){
zone.textContent='Erreur de chargement.';
}
}

const voirBoutiqueInitiale=voirBoutique;
voirBoutique=function(){
voirBoutiqueInitiale();
chargerCommandes();
};
