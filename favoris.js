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
b.textContent=est?'❤️':'♡';
b.style.color=est?'#B4291A':'#6B6254';
b.setAttribute('aria-label',est?'Retirer des favoris':'Ajouter aux favoris');
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
b.onclick=basculerFavori;
b.style.cssText='position:absolute;right:12px;bottom:10px;border:0;background:none;padding:0;font-size:30px;line-height:1;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,.35);';
photo.appendChild(b);
}

const ouvrirAvantFavoris=ouvrir;
ouvrir=function(i){
ouvrirAvantFavoris(i);
ficheCle=cleProduit(tous()[i]);
majBoutonFavori();
};

creerBoutonFavori();
