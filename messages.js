let msgProduit="";

function voirMessage(){
msgProduit=document.getElementById('fnom').textContent;
document.getElementById('msg-produit').textContent=msgProduit;
document.getElementById('msg-msg').textContent='';
document.getElementById('fiche').style.display='none';
document.getElementById('message').style.display='block';
window.scrollTo(0,0);
}

function retourFicheMessage(){
document.getElementById('message').style.display='none';
document.getElementById('fiche').style.display='block';
window.scrollTo(0,0);
}

async function envoyerMessage(){
const nom=document.getElementById('msg-nom').value.trim();
const texte=document.getElementById('msg-texte').value.trim();
const msg=document.getElementById('msg-msg');
if(!nom||!texte){msg.textContent='Indiquez votre nom et votre message.';return;}
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({produit:msgProduit,expediteur:nom,texte:texte})});
if(!r.ok) throw new Error(r.status);
}catch(e){
msg.textContent='Erreur, message non envoyé. Réessayez.';
return;
}
alert('Message envoyé au vendeur.');
document.getElementById('message').style.display='none';
document.getElementById('msg-texte').value='';
voirAccueil();
}

async function chargerMessages(){
const zone=document.getElementById('messages-liste');
if(!zone) return;
zone.textContent='Chargement…';
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/messages?select=*&order=created_at.desc',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) throw new Error(r.status);
const lignes=await r.json();
zone.innerHTML=lignes.length
?lignes.map(m=>`<div class="ligne" style="display:block"><div class="name">${esc(m.expediteur)} · <span style="font-weight:normal;color:#6B6254">${esc(m.produit)}</span></div><div style="font-size:14px;margin-top:4px">${esc(m.texte)}</div></div>`).join('')
:"Aucun message pour l'instant.";
}catch(e){
zone.textContent='Erreur de chargement.';
}
}

const voirBoutiqueAvantMessages=voirBoutique;
voirBoutique=function(){
voirBoutiqueAvantMessages();
chargerMessages();
};
