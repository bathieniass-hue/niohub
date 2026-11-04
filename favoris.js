let ficheCle=null;

function cleProduit(p){
return p.id?'id:'+p.id:'nom:'+p.nom;
}

function lireFavoris(){
try{
const l=JSON.parse(localStorage.getItem('niohub_favoris')||'[]');
return Array.isArray(l)?l:[];
}catch(e){return [];}
}

function ecrireFavoris(liste){
// Peut échouer en navigation privée ou si le stockage est plein : on ne bloque pas l'application
try{localStorage.setItem('niohub_favoris',JSON.stringify(liste));}catch(e){}
}

// Retire des favoris les produits qui n'existent plus (supprimés par leur vendeur)
function nettoyerFavoris(){
if(chargementEchoue||!distants.length) return;
const ids=new Set(distants.map(p=>'id:'+p.id));
const favs=lireFavoris();
const gardes=favs.filter(k=>!String(k).startsWith('id:')||ids.has(k));
if(gardes.length!==favs.length) ecrireFavoris(gardes);
}

function dessinerCoeur(rempli){
return `<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="${rempli?'#D7263D':'none'}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

function majBoutonFavori(){
const b=document.getElementById('btn-favori');
if(!b) return;
const est=lireFavoris().includes(ficheCle);
b.innerHTML=dessinerCoeur(est);
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
b.style.cssText='position:absolute;right:12px;bottom:10px;border:0;background:none;padding:0;line-height:0;cursor:pointer;filter:drop-shadow(0 0 2px rgba(0,0,0,.8)) drop-shadow(0 0 4px rgba(0,0,0,.5));';
photo.appendChild(b);
}

const ouvrirAvantFavoris=ouvrir;
ouvrir=function(i){
ouvrirAvantFavoris(i);
ficheCle=cleProduit(tous()[i]);
majBoutonFavori();
};

creerBoutonFavori();
