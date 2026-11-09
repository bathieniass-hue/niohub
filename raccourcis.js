VUES.push('favoris');

const styleRaccourcis=document.createElement('style');
styleRaccourcis.textContent=`
.raccourci{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:6px;min-height:92px;background:#fff;border:1px solid #E6DECB;border-radius:16px;padding:14px 2px 8px;font-size:13px;font-weight:bold;line-height:1.15;color:#1E1A14;font-family:sans-serif;text-align:center}
.raccourci svg{width:28px;height:28px;stroke:#0E6B47;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.badge{position:absolute;top:6px;right:8px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#D7263D;color:#fff;font-size:12px;font-weight:bold;line-height:20px;text-align:center;display:none}
#filtres{display:flex;gap:8px;overflow-x:auto;padding:0 20px 6px;margin:0 0 4px;scrollbar-width:none}
#filtres::-webkit-scrollbar{display:none}
.filtre{flex-shrink:0;padding:8px 14px;border:1px solid #E6DECB;border-radius:18px;background:#fff;color:#1E1A14;font-size:13px;font-family:sans-serif}
.filtre.on{background:#0E6B47;border-color:#0E6B47;color:#fff;font-weight:bold}
`;
document.head.appendChild(styleRaccourcis);

const ICONES={
messages:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><circle cx="8.5" cy="12" r=".6"/><circle cx="12" cy="12" r=".6"/><circle cx="15.5" cy="12" r=".6"/></svg>',
favoris:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
achats:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
boutique:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-4h4v4"/></svg>'
};

function afficherRaccourcis(){
const zone=document.getElementById('cats');
if(!zone) return;
zone.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 20px;margin:12px 0;';
zone.innerHTML=`
<button class="raccourci" onclick="voirConversations()">${ICONES.messages}<span>Messages</span><span class="badge" id="badge-messages"></span></button>
<button class="raccourci" onclick="voirFavoris()">${ICONES.favoris}<span>Favoris</span></button>
<button class="raccourci" onclick="voirAchats()">${ICONES.achats}<span>Mes achats</span></button>
<button class="raccourci" onclick="voirBoutique()">${ICONES.boutique}<span>Ma boutique</span></button>`;
}
afficherRaccourcis();

// Filtre par catégorie : "Tout" + les catégories de details-produit.js.
function dessinerFiltres(){
const zone=document.getElementById('filtres');
if(!zone) return;
zone.innerHTML=[''].concat(CATEGORIES_PRODUIT).map(c=>`<button type="button" class="filtre${c===categorieActive?' on':''}" data-c="${esc(c)}" onclick="choisirCategorie(this.dataset.c)">${c?esc(c):'Tout'}</button>`).join('');
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
let sentinelleHistoire=false;
let retourTelephoneEnCours=false;

function pousserSentinelle(){
if(sentinelleHistoire) return;
try{
history.pushState({niohub:true},'','#niohub');
sentinelleHistoire=true;
}catch(e){}
}

const montrerAvantRetourAndroid=montrer;
montrer=function(vue){
const precedent=vueCourante;
if(retourTelephoneEnCours){
retourTelephoneEnCours=false;
montrerAvantRetourAndroid(vue);
if(vue!=='accueil') pousserSentinelle();
return;
}
if(vue==='accueil'&&sentinelleHistoire){
sentinelleHistoire=false;
try{history.back();}catch(e){}
montrerAvantRetourAndroid(vue);
return;
}
montrerAvantRetourAndroid(vue);
if(vue!==precedent&&vue!=='accueil') pousserSentinelle();
};

window.addEventListener('popstate',()=>{
if(vueCourante==='accueil') return;
retourTelephoneEnCours=true;
const page=document.getElementById(vueCourante);
const bouton=page&&(page.querySelector('.retour')||page.querySelector('.retour-carre'));
if(bouton){bouton.click();return;}
if(vueCourante==='boutique'||vueCourante==='profil'){montrer('accueil');return;}
montrer('accueil');
});
