VUES.push('favoris');
VUES_MENU.favoris=0;

const styleRaccourcis=document.createElement('style');
styleRaccourcis.textContent='.raccourci{background:#fff;border:1px solid #E6DECB;border-radius:12px;padding:12px 4px;font-size:13px;font-weight:bold;color:#1E1A14;font-family:sans-serif;text-align:center}';
document.head.appendChild(styleRaccourcis);

function afficherRaccourcis(){
const zone=document.getElementById('cats');
if(!zone) return;
zone.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 20px;margin:12px 0;';
zone.innerHTML=`
<button class="raccourci" onclick="voirFavoris()">Favoris</button>
<button class="raccourci" onclick="voirAchats()">Mes achats</button>
<button class="raccourci" onclick="voirBoutique()">Ma boutique</button>
<button class="raccourci" onclick="voirAjout('accueil')">Vendre</button>`;
}
afficherRaccourcis();

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
const favs=lireFavoris();
const liste=tous().map((p,i)=>({p,i})).filter(x=>favs.includes(cleProduit(x.p)));
const corps=liste.length
?`<div class="grid" style="padding:6px 0 30px">${liste.map(x=>`<div class="card" onclick="ouvrir(${x.i})"><div class="img" style="background:${fond(x.p)}"></div><div class="info"><div class="name">${esc(x.p.nom)}</div><div class="price">${esc(x.p.prix)}</div></div></div>`).join('')}</div>`
:'<div class="liste" style="margin-top:20px">Aucun favori pour l\'instant. Touchez ❤️ sur un produit pour le garder ici.</div>';
page.innerHTML=`<header><button class="retour" onclick="voirAccueil()">←</button><span style="font-weight:bold;font-size:20px">Favoris</span><span></span></header>${corps}`;
}

function voirFavoris(){
rendreFavoris();
montrer('favoris');
}
