// Paramètres : pour l'instant, le choix du thème (sombre par défaut, ou clair).
// Le choix est gardé sur le téléphone (localStorage) et appliqué dès l'ouverture de la page (voir index.html).

const CLE_THEME='niohub_theme';

function themeActuel(){
try{return localStorage.getItem(CLE_THEME)==='clair'?'clair':'sombre';}catch(e){return 'sombre';}
}

function appliquerTheme(t){
const sombre=t!=='clair';
document.documentElement.classList.toggle('sombre',sombre);
document.body.classList.toggle('sombre',sombre);
const m=document.querySelector('meta[name="theme-color"]');
if(m) m.setAttribute('content',sombre?'#07130C':'#FBF7EE');
}

function choisirTheme(t){
try{localStorage.setItem(CLE_THEME,t);}catch(e){}
appliquerTheme(t);
dessinerParametres();
}

VUES.push('parametres');
VUES_MENU['parametres']=2;
creerPage('parametres');

function dessinerParametres(){
const t=themeActuel();
document.getElementById('parametres').innerHTML=
'<header><button class="retour" onclick="voirProfil()">←</button><span style="font-weight:bold;font-size:20px">Paramètres</span><span></span></header>'
+'<div class="titre-section" style="margin-top:6px">Apparence</div>'
+'<div class="theme-choix">'
+'<button type="button" class="theme-opt'+(t==='sombre'?' on':'')+'" onclick="choisirTheme(\'sombre\')">Sombre</button>'
+'<button type="button" class="theme-opt'+(t==='clair'?' on':'')+'" onclick="choisirTheme(\'clair\')">Clair</button>'
+'</div>'
+'<div style="font-size:13px;color:#6B6254;margin-top:10px">Votre choix est gardé sur ce téléphone.</div>'
+(typeof blocNotificationsReglage==='function'?blocNotificationsReglage():'');
}

function voirParametres(){
dessinerParametres();
montrer('parametres');
}
