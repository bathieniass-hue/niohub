const styleFicheDetails=document.createElement('style');
styleFicheDetails.textContent=`
#fd-details .fd-carte{background:#fff;border:1px solid #E6DECB;border-radius:12px;margin-top:12px;overflow:hidden;font-family:sans-serif}
#fd-details .fd-ligne{display:grid;grid-template-columns:90px minmax(0,1fr);align-items:center;padding:10px 14px;border-top:1px solid #EDE5D3;font-size:14px;color:#1E1A14}
#fd-details .fd-ligne:first-child{border-top:0}
#fd-details .fd-label{color:#6B6254}
#fd-details .fd-val{font-weight:bold}
#fd-details .fd-pastilles{display:flex;flex-wrap:wrap;gap:8px 14px}
#fd-details .fd-pastille{display:inline-flex;align-items:center;gap:6px}
#fd-details .fd-rond{width:16px;height:16px;border-radius:8px;border:1px solid #8A8170;display:inline-block;box-sizing:border-box}
`;
document.head.appendChild(styleFicheDetails);

const chargerProduitsAvantFiche=chargerProduits;
chargerProduits=async function(){
await chargerProduitsAvantFiche();
await ajouterDetailsProduits();
};

async function ajouterDetailsProduits(){
try{
const r=await fetch(SUPABASE_URL+'/rest/v1/produits?select=id,categorie,etat,couleurs',{headers:{apikey:SUPABASE_KEY}});
if(!r.ok) return;
const lignes=await r.json();
const par={};
lignes.forEach(l=>{par[l.id]=l;});
distants.forEach(p=>{
const l=par[p.id];
if(l){p.categorie=l.categorie;p.etat=l.etat;p.couleurs=l.couleurs;}
});
}catch(e){}
}

function afficherDetailsFiche(p){
let zone=document.getElementById('fd-details');
if(!zone){
zone=document.createElement('div');
zone.id='fd-details';
document.getElementById('fdesc').insertAdjacentElement('afterend',zone);
}
const couleurs=p&&p.couleurs?String(p.couleurs).split(',').map(x=>x.trim()).filter(Boolean):[];
if(!p||(!p.categorie&&!p.etat&&!couleurs.length)){
zone.innerHTML='';
return;
}
const lignes=[];
if(p.categorie) lignes.push(`<div class="fd-ligne"><span class="fd-label">Catégorie</span><span class="fd-val">${esc(p.categorie)}</span></div>`);
if(p.etat) lignes.push(`<div class="fd-ligne"><span class="fd-label">État</span><span class="fd-val">${esc(p.etat)}</span></div>`);
if(couleurs.length){
const pastilles=couleurs.map(n=>{
const c=COULEURS_PRODUIT.find(x=>x.nom===n);
return `<span class="fd-pastille"><span class="fd-rond" style="background:${c?c.hex:'#FFFFFF'}"></span>${esc(n)}</span>`;
}).join('');
lignes.push(`<div class="fd-ligne"><span class="fd-label">Couleurs</span><div class="fd-pastilles">${pastilles}</div></div>`);
}
zone.innerHTML=`<div class="fd-carte">${lignes.join('')}</div>`;
}

const ouvrirAvantFiche=ouvrir;
ouvrir=function(i){
ouvrirAvantFiche(i);
afficherDetailsFiche(tous()[i]);
};

chargerProduits();
