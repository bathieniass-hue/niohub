let ficheCle=null;

function cleProduit(p){
return p.id?'id:'+p.id:'nom:'+p.nom;
}

function lireFavoris(){
try{return JSON.parse(localStorage.getItem('niohub_favoris')||'[]');}catch(e){return [];}
}

function ecrireFavoris(liste){
localStorage.setItem('niohub_favoris',JSON.stringify(liste));
}

function majBoutonFavori(){
const b=document.getElementById('btn-favori');
if(!b) return;
const est=lireFavoris().includes(ficheCle);
b.textContent=est?'♥':'♡';
b.style.color=est?'#B4291A':'#6B6254';
}

function basculerFavori(){
if(!ficheCle) return;
const liste=lireFavoris();
ecrireFavoris(liste.includes(ficheCle)?liste.filter(x=>x!==ficheCle):liste.concat([ficheCle]));
majBoutonFavori();
}

function creerBoutonFavori(){
const photo=document.getElementById('fphoto');
if(!photo||document.getElementById('btn-favori')) return;
photo.style.position='relative';
const b=document.createElement('button');
b.id='btn-favori';
b.type='button';
b.setAttribute('aria-label','Ajouter aux favoris');
b.onclick=basculerFavori;
b.style.cssText='position:absolute;right:14px;bottom:14px;width:46px;height:46px;border-radius:23px;border:0;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:24px;line-height:46px;padding:0;cursor:pointer;';
photo.appendChild(b);
}

const ouvrirAvantFavoris=ouvrir;
ouvrir=function(i){
ouvrirAvantFavoris(i);
ficheCle=cleProduit(tous()[i]);
majBoutonFavori();
};

creerBoutonFavori();
