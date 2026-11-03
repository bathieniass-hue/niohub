function retirerSeDeconnecter(){
const profil=document.getElementById('profil');
if(!profil) return;
profil.querySelectorAll('*').forEach(el=>{
if(el.children.length===0 && el.textContent.trim().toLowerCase()==='se déconnecter'){
const cible=el.closest('button, a')||el;
cible.remove();
}
});
}

retirerSeDeconnecter();
new MutationObserver(retirerSeDeconnecter).observe(document.body,{childList:true,subtree:true,characterData:true});
