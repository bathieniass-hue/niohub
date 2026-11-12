VUES.push('favoris');

const styleRaccourcis=document.createElement('style');
styleRaccourcis.textContent=`
.raccourci{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:76px;border-radius:16px;background:linear-gradient(160deg,#10301F,#050B07);border:1.5px solid #3BBF4B;box-shadow:0 2px 8px rgba(15,107,70,.3),inset 0 0 10px rgba(80,220,90,.25);padding:0;font-size:11px;font-weight:600;line-height:1.15;color:#fff;font-family:sans-serif;text-align:center;white-space:nowrap}
.gl{width:40px;height:40px;background:url(icones-accueil.png) no-repeat 0 0/120px 40px;background-position:calc(var(--i)*-40px) 0}
.gn{width:40px;height:40px;background:url(icones-favoris.png) no-repeat 0 0/80px 40px;background-position:calc(var(--i)*-40px) 0}
.badge{position:absolute;top:6px;right:8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E0A52E;color:#2A1B00;font-size:11px;font-weight:bold;line-height:18px;text-align:center;display:none}
#filtres{display:flex;gap:8px;overflow-x:auto;padding:0 20px 6px;margin:0 0 4px;scrollbar-width:none}
#filtres::-webkit-scrollbar{display:none}
.filtre{flex-shrink:0;height:40px;display:flex;align-items:center;gap:6px;padding:0 10px 0 5px;border:0;border-radius:10px;background:#fff;color:#1E1A14;font-size:14px;font-weight:600;font-family:sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(40,30,10,.1)}
.filtre.on{background:#0E6B47;color:#fff;font-weight:bold;box-shadow:none}
.filtre.tout{padding-left:10px}
.cat-ic{width:30px;height:30px;flex:none;border-radius:8px;background:url(icones-categories.png) no-repeat 0 0/330px 30px;background-position:calc(var(--i)*-30px) 0}
.cat-tout{width:16px;height:16px;flex:none;fill:none;stroke:#0E6B47;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.on .cat-tout{stroke:#fff}
#categories-fond{position:fixed;inset:0;z-index:1002;background:rgba(30,26,20,.45);display:none;align-items:flex-end;justify-content:center}
#categories-boite{width:100%;max-width:430px;background:#FBF7EE;border-radius:24px 24px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px rgba(30,26,20,.25)}
#categories-titre{font-size:18px;font-weight:bold;color:#1E1A14;margin-bottom:12px}
#categories-liste{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.categorie-item{display:flex;align-items:center;gap:8px;min-height:48px;padding:8px 10px;border:1px solid #E6DECB;border-radius:14px;background:#fff;color:#1E1A14;font-size:13px;font-weight:bold;font-family:sans-serif;text-align:left}
.categorie-item.on{background:#0E6B47;border-color:#0E6B47;color:#fff}
`;
document.head.appendChild(styleRaccourcis);

const ICONE_TOUT='<svg class="cat-tout" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>';
function iconeCategorie(c){
const i=CATEGORIES_PRODUIT.indexOf(c);
return i<0?ICONE_TOUT:'<span class="cat-ic" style="--i:'+i+'" aria-hidden="true"></span>';
}
const ICONES={
messages:'<span class="gl" style="--i:1" aria-hidden="true"></span>',
favoris:'<span class="gn" style="--i:0" aria-hidden="true"></span>',
achats:'<span class="gl" style="--i:2" aria-hidden="true"></span>',
categories:'<svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true"><g fill="#2FB344" stroke="#EAF6EA" stroke-width="1.2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></g></svg>'
};

function afficherRaccourcis(){
const zone=document.getElementById('cats');
if(!zone) return;
zone.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 20px;margin:12px 0;';
zone.innerHTML=`
<button class="raccourci" onclick="voirConversations()">${ICONES.messages}<span>Messages</span><span class="badge" id="badge-messages" data-compteur="messages"></span></button>
<button class="raccourci" onclick="voirFavoris()">${ICONES.favoris}<span>Favoris</span><span class="badge" data-compteur="favoris"></span></button>
<button class="raccourci" onclick="voirAchats()">${ICONES.achats}<span>Mes achats</span><span class="badge" data-compteur="achats"></span></button>
<button class="raccourci" onclick="ouvrirCategories()">${ICONES.categories}<span>Catégories</span></button>`;
}
afficherRaccourcis();

function creerFenetreCategories(){
if(document.getElementById('categories-fond')) return;
const fond=document.createElement('div');
fond.id='categories-fond';
fond.innerHTML=`<div id="categories-boite"><div id="categories-titre">Choisir une catégorie</div><div id="categories-liste"></div></div>`;
fond.onclick=e=>{if(e.target.id==='categories-fond') fermerCategories();};
document.body.appendChild(fond);
}

function ouvrirCategories(){
creerFenetreCategories();
const liste=document.getElementById('categories-liste');
liste.innerHTML=[''].concat(CATEGORIES_PRODUIT).map(c=>`<button type="button" class="categorie-item${c===categorieActive?' on':''}" onclick="choisirCategorieModal('${esc(c)}')">${iconeCategorie(c)}<span>${c?esc(c):'Tout'}</span></button>`).join('');
document.getElementById('categories-fond').style.display='flex';
}

function fermerCategories(){
const fond=document.getElementById('categories-fond');
if(fond) fond.style.display='none';
}

function choisirCategorieModal(c){
choisirCategorie(c);
fermerCategories();
montrer('accueil');
}

function dessinerFiltres(){
const zone=document.getElementById('filtres');
if(!zone) return;
zone.innerHTML=[''].concat(CATEGORIES_PRODUIT).map(c=>`<button type="button" class="filtre${c?'':' tout'}${c===categorieActive?' on':''}" data-c="${esc(c)}" onclick="choisirCategorie(this.dataset.c)">${iconeCategorie(c)}${c?esc(c):'Tout'}</button>`).join('');
}

function installerFiltres(){
if(document.getElementById('filtres')) return;
const haut=document.getElementById('haut');
const cats=document.getElementById('cats');
const zone=document.createElement('div');
zone.id='filtres';
if(haut) haut.appendChild(zone);
else if(cats) cats.insertAdjacentElement('afterend',zone);
else return;
dessinerFiltres();
}

function centrerCategorieActive(){
const actif=document.querySelector('#filtres .filtre.on');
if(!actif||!actif.scrollIntoView) return;
actif.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

function choisirCategorie(c){
categorieActive=c;
dessinerFiltres();
afficherGrille();
centrerCategorieActive();
}

document.addEventListener('DOMContentLoaded',installerFiltres);

// ---------- Barre du haut : repli au défilement ----------
const SEUIL_DEFILEMENT=8;
const HAUTEUR_MIN_REPLI=120;
let dernierY=0,verrouBarre=0;

function basculerBarre(compact){
const haut=document.getElementById('haut');
if(!haut) return;
haut.classList.toggle('compact',compact);
verrouBarre=Date.now()+350;
}

window.addEventListener('scroll',()=>{
const haut=document.getElementById('haut');
const acc=document.getElementById('accueil');
if(!haut||!acc||acc.style.display==='none') return;
const y=window.scrollY;
if(Date.now()<verrouBarre){dernierY=y;return;}
if(y<=10){
if(haut.classList.contains('compact')) basculerBarre(false);
dernierY=y;
return;
}
const dy=y-dernierY;
if(Math.abs(dy)<SEUIL_DEFILEMENT) return;
const compact=haut.classList.contains('compact');
if(dy>0&&y>HAUTEUR_MIN_REPLI&&!compact) basculerBarre(true);
else if(dy<0&&compact) basculerBarre(false);
dernierY=y;
},{passive:true});

const montrerAvantBarre=montrer;
montrer=function(vue){
montrerAvantBarre(vue);
if(vue==='accueil'&&!restaurationScroll&&window.scrollY<=10){
const h=document.getElementById('haut');
if(h) h.classList.remove('compact');
dernierY=0;
}
};

// ---------- Favoris ----------
function creerPageFavoris(){
if(document.getElementById('favoris')) return;
const p=document.createElement('div');
p.id='favoris';
p.className='page';
p.style.display='none';
document.body.appendChild(p);
}
creerPageFavoris();

function rendreFavoris(){
const page=document.getElementById('favoris');
nettoyerFavoris();
const favs=lireFavoris();
const liste=tous().filter(p=>favs.includes(cleProduit(p)));
const corps=liste.length
?`<div class="grid" style="padding:6px 0 30px">${liste.map(p=>carteProduitHTML(p,tous().indexOf(p))).join('')}</div>`
:'<div class="liste" style="margin-top:20px">Aucun favori pour l\'instant. Touchez le cœur sur un produit pour le garder ici.</div>';
page.innerHTML=`<header><button class="retour" onclick="voirAccueil()">←</button><span style="font-weight:bold;font-size:20px">Favoris</span><span></span></header>${corps}`;
}

function voirFavoris(){
rendreFavoris();
montrer('favoris');
}

// ---------- Retour Android : identique au bouton ← de l’écran ----------
let profondeurHistoire=0;
let retourTelephoneEnCours=false;

function pousserSentinelle(){
try{
history.pushState({niohub:true},'','#niohub');
profondeurHistoire++;
}catch(e){}
}

const montrerAvantRetourAndroid=montrer;
montrer=function(vue){
const precedent=vueCourante;
if(retourTelephoneEnCours){
retourTelephoneEnCours=false;
montrerAvantRetourAndroid(vue);
if(vue==='accueil'){
try{history.replaceState({niohub:false},'','#accueil');}catch(e){}
}
return;
}
if(vue==='accueil'&&profondeurHistoire>0){
const n=profondeurHistoire;
profondeurHistoire=0;
try{history.go(-n);}catch(e){}
montrerAvantRetourAndroid(vue);
return;
}
montrerAvantRetourAndroid(vue);
if(vue!==precedent&&vue!=='accueil') pousserSentinelle();
};

window.addEventListener('popstate',()=>{
if(vueCourante==='accueil') return;
profondeurHistoire=Math.max(0,profondeurHistoire-1);
retourTelephoneEnCours=true;
const page=document.getElementById(vueCourante);
const bouton=page&&(page.querySelector('.retour')||page.querySelector('.retour-carre'));
if(bouton){bouton.click();return;}
montrer('accueil');
});
