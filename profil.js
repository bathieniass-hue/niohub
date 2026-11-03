function modifierProfil(){
alert('Bientôt disponible');
}

function deconnecter(){
if(!confirm('Voulez-vous vous déconnecter ?')) return;
localStorage.removeItem('niohub_session_v2');
location.reload();
}
