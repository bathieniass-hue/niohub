// NioHub Admin : voir et modifier toutes les boutiques, tous les produits et tous les profils.
// Les droits sont vérifiés par Supabase (table « admins » + règles RLS) : cette page seule ne donne aucun accès.

const SUPABASE_URL="https://zpmjbggzqwcajjrzfejg.supabase.co";
const SUPABASE_KEY="sb_publishable_dz22DUOnanzHiA2jLk305g_Cf6KCVPr";
const CLE_SESSION='niohub_session_v2';
const PAGE=50;

const TABLES={
boutiques:{titre:'Boutiques',img:['logo']},
produits:{titre:'Produits',img:['photo']},
profils:{titre:'Profils',img:[]},
commandes:{titre:'Commandes',img:[]},
avis:{titre:'Avis',img:[]},
messages:{titre:'Messages',img:[]}
};
const SANS_MODIF=['id','created_at','updated_at'];

// ---------- petits outils ----------
function h(tag,attrs,...enfants){
const e=document.createElement(tag);
for(const k in (attrs||{})){
if(k==='class') e.className=attrs[k];
else if(k.startsWith('on')) e.addEventListener(k.slice(2),attrs[k]);
else e.setAttribute(k,attrs[k]);
}
enfants.flat().forEach(c=>{if(c!==null&&c!==undefined&&c!==false) e.append(c.nodeType?c:document.createTextNode(String(c)));});
return e;
}
function toast(msg,erreur){
const t=document.getElementById('toast');
t.textContent=msg;
t.className='toast'+(erreur?' erreur':'');
t.hidden=false;
clearTimeout(toast.m);
toast.m=setTimeout(()=>{t.hidden=true;},erreur?5000:2600);
}
function court(v,n){const s=String(v===null||v===undefined?'':v);return s.length>n?s.slice(0,n-1)+'…':s;}
function urlImage(u){return typeof u==='string'&&u.startsWith(SUPABASE_URL+'/storage/')?u:'';}
function prixTexte(v){const n=Number(String(v).replace(/\D/g,''));return n?String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' F':String(v||'');}

// ---------- session (la même que celle de l'appli NioHub) ----------
function lireSession(){try{return JSON.parse(localStorage.getItem(CLE_SESSION)||'null');}catch(e){return null;}}
async function session(){
const s=lireSession();
if(!s||!s.access_token) return null;
if(s.expires_at-60>Date.now()/1000) return s;
try{
const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
if(!r.ok) return (r.status===400||r.status===401||r.status===403)?null:s;
const j=await r.json();
// on garde la session partagée avec l'appli à jour (le jeton de renouvellement ne sert qu'une fois)
const n=Object.assign({},s,{access_token:j.access_token,refresh_token:j.refresh_token||s.refresh_token,expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600)});
localStorage.setItem(CLE_SESSION,JSON.stringify(n));
return n;
}catch(e){return s;}
}
async function api(chemin,opts){
opts=opts||{};
const s=await session();
if(!s) throw new Error('session');
const r=await fetch(SUPABASE_URL+'/rest/v1/'+chemin,{
method:opts.methode||'GET',
headers:Object.assign({apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},opts.entetes||{}),
body:opts.corps?JSON.stringify(opts.corps):undefined
});
return r;
}

// ---------- écran de configuration (si pas encore administrateur) ----------
function sqlConfig(email){
return `-- 1) Liste des administrateurs
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admin se voit" on public.admins;
create policy "admin se voit" on public.admins for select using (user_id = auth.uid());

-- 2) Fonction : « suis-je administrateur ? »
create or replace function public.est_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- 3) Droits de l'administrateur sur toutes les tables
do $$
declare t text;
begin
foreach t in array array['boutiques','produits','profils','commandes','avis','messages'] loop
execute format('drop policy if exists "admin lit tout" on public.%I', t);
execute format('create policy "admin lit tout" on public.%I for select using (public.est_admin())', t);
execute format('drop policy if exists "admin modifie tout" on public.%I', t);
execute format('create policy "admin modifie tout" on public.%I for update using (public.est_admin()) with check (public.est_admin())', t);
execute format('drop policy if exists "admin supprime tout" on public.%I', t);
execute format('create policy "admin supprime tout" on public.%I for delete using (public.est_admin())', t);
end loop;
end $$;

-- 4) Vous, comme administrateur (avec l'adresse Google utilisée pour vous connecter)
insert into public.admins (user_id)
select id from auth.users where email = '${String(email||'votre.adresse@gmail.com').replace(/'/g,"''")}'
on conflict do nothing;`;
}
function ecranConfig(s){
const sql=sqlConfig(s&&s.email);
const c=document.getElementById('contenu');
c.replaceChildren(h('div',{class:'config'},
h('h2',null,'Activer le compte administrateur'),
h('p',null,'Ce compte n\'a pas encore les droits d\'administrateur. Dans Supabase, ouvrez SQL Editor, collez le texte ci-dessous, puis appuyez sur Run. Revenez ensuite ici et actualisez la page.'),
h('pre',null,sql),
h('button',{onclick:async()=>{try{await navigator.clipboard.writeText(sql);toast('Copié');}catch(e){toast('Copie impossible : sélectionnez le texte à la main.',true);}}},'Copier le texte'),
' ',
h('button',{onclick:()=>location.reload()},'Actualiser')
));
document.getElementById('onglets').replaceChildren();
}
function ecranConnexion(){
document.getElementById('contenu').replaceChildren(h('div',{class:'config'},
h('h2',null,'Connexion nécessaire'),
h('p',null,'Connectez-vous d\'abord avec votre compte dans l\'application NioHub (même navigateur), puis revenez sur cette page.'),
h('a',{class:'bouton',href:'index.html'},'Ouvrir NioHub')
));
}

// ---------- navigation ----------
let ongletCourant='accueil';
let etat={table:null,lignes:[],debut:0,fini:false,filtre:'',recherche:''};

function dessinerOnglets(){
const nav=document.getElementById('onglets');
nav.replaceChildren(...[['accueil','Tableau de bord']].concat(Object.keys(TABLES).map(k=>[k,TABLES[k].titre])).map(([k,t])=>
h('button',{class:k===ongletCourant?'on':'',onclick:()=>ouvrirOnglet(k)},t)));
}
function ouvrirOnglet(k,filtre,libelleFiltre){
ongletCourant=k;
dessinerOnglets();
window.scrollTo(0,0);
if(k==='accueil') return tableauDeBord();
etat={table:k,lignes:[],debut:0,fini:false,filtre:filtre||'',libelleFiltre:libelleFiltre||'',recherche:''};
dessinerListe();
chargerPage();
}

async function compter(table){
try{
const r=await api(table+'?select=*',{entetes:{Prefer:'count=exact',Range:'0-0'}});
const cr=r.headers.get('content-range')||'';
const n=Number(cr.split('/')[1]);
return isNaN(n)?'?':n;
}catch(e){return '?';}
}
async function tableauDeBord(){
const c=document.getElementById('contenu');
c.replaceChildren(h('p',{class:'vide'},'Chargement…'));
const cles=Object.keys(TABLES);
const nombres=await Promise.all(cles.map(compter));
c.replaceChildren(h('div',{class:'grille'},cles.map((k,i)=>
h('button',{class:'compteur',onclick:()=>ouvrirOnglet(k)},h('b',null,nombres[i]),h('span',null,TABLES[k].titre)))));
}

// ---------- listes ----------
function resume(table,r){
const titre=r.nom||r.produit||r.titre||r.email||r.statut||('#'+court(r.id||r.user_id||'',8));
const champs=table==='produits'?['prix','categorie','etat']:table==='boutiques'?['adresse','ville','telephone']:table==='profils'?['telephone','adresse','email']:table==='commandes'?['statut','total','prix','mode_livraison']:table==='avis'?['note','texte']:['expediteur','texte'];
const sous=champs.filter(k=>r[k]!==undefined&&r[k]!==null&&r[k]!=='').map(k=>k==='prix'||k==='total'?prixTexte(r[k]):String(r[k])).join(' · ');
return {titre:court(titre,60),sous:court(sous,90)};
}
function vignette(table,r){
const v=h('div',{class:'vignette'});
const cle=(TABLES[table].img||[]).find(k=>urlImage(r[k]));
if(cle) v.style.backgroundImage="url('"+urlImage(r[cle])+"')";
else v.textContent=(String(resume(table,r).titre).charAt(0)||'?').toUpperCase();
return v;
}
function dessinerListe(){
const c=document.getElementById('contenu');
const t=etat.table;
const q=etat.recherche.trim().toLowerCase();
const visibles=etat.lignes.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q));
c.replaceChildren(
h('div',{class:'barre'},h('input',{type:'search',placeholder:'Rechercher dans '+TABLES[t].titre.toLowerCase()+'…',value:etat.recherche,oninput:e=>{etat.recherche=e.target.value;majLignes();}})),
etat.filtre?h('div',{class:'filtre-actif'},h('span',null,etat.libelleFiltre||'Liste filtrée'),h('button',{onclick:()=>ouvrirOnglet(t)},'Tout afficher')):null,
h('div',{id:'lignes'}),
h('div',{id:'pied'})
);
majLignes();
}
function majLignes(){
const t=etat.table;
const q=etat.recherche.trim().toLowerCase();
const visibles=etat.lignes.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q));
const zone=document.getElementById('lignes');
if(!zone) return;
zone.replaceChildren(...visibles.map(r=>{
const re=resume(t,r);
return h('button',{class:'ligne',onclick:()=>ouvrirFiche(t,r)},vignette(t,r),h('div',{class:'txt'},h('div',{class:'nom'},re.titre),h('div',{class:'sous'},re.sous||' ')));
}));
const pied=document.getElementById('pied');
pied.replaceChildren(
etat.chargement?h('p',{class:'vide'},'Chargement…'):(!visibles.length?h('p',{class:'vide'},etat.lignes.length?'Aucun résultat dans les lignes chargées.':'Rien à afficher.'):null),
(!etat.fini&&!etat.chargement)?h('button',{class:'plus',onclick:chargerPage},'Charger plus'):null
);
}
async function chargerPage(){
if(etat.chargement) return;
const t=etat.table;
etat.chargement=true;
majLignes();
try{
let chemin=t+'?select=*'+(etat.filtre?'&'+etat.filtre:'');
let r=await api(chemin+'&order=created_at.desc',{entetes:{Range:etat.debut+'-'+(etat.debut+PAGE-1)}});
if(r.status===400) r=await api(chemin,{entetes:{Range:etat.debut+'-'+(etat.debut+PAGE-1)}}); // pas de colonne created_at
if(r.status===401||r.status===403||r.status===404){etat.chargement=false;return verifierAdmin(true);}
if(!r.ok&&r.status!==206) throw new Error(r.status);
const lignes=await r.json();
if(t!==etat.table) return;
etat.lignes=etat.lignes.concat(lignes);
etat.debut+=lignes.length;
if(lignes.length<PAGE) etat.fini=true;
}catch(e){
toast('Chargement impossible. Vérifiez la connexion.',true);
}
etat.chargement=false;
majLignes();
}

// ---------- fiche : voir, modifier, supprimer ----------
function cle(table,r){return r.id!==undefined?'id':(r.user_id!==undefined?'user_id':null);}
function genreChamp(v){
if(typeof v==='boolean') return 'bool';
if(typeof v==='number') return 'nombre';
if(v!==null&&typeof v==='object') return 'json';
return 'texte';
}
function liensFiche(table,r){
const l=[];
const uid=r.user_id;
if(table==='boutiques'&&uid){l.push(['Ses produits',()=>{fermerFiche();ouvrirOnglet('produits','user_id=eq.'+uid,'Produits de cette boutique');}]);l.push(['Son profil',()=>{fermerFiche();ouvrirOnglet('profils','user_id=eq.'+uid,'Profil du propriétaire');}]);}
if(table==='produits'&&uid){l.push(['Sa boutique',()=>{fermerFiche();ouvrirOnglet('boutiques','user_id=eq.'+uid,'Boutique du vendeur');}]);l.push(['Son profil',()=>{fermerFiche();ouvrirOnglet('profils','user_id=eq.'+uid,'Profil du vendeur');}]);}
if(table==='profils'&&uid){l.push(['Sa boutique',()=>{fermerFiche();ouvrirOnglet('boutiques','user_id=eq.'+uid,'Boutique de ce profil');}]);l.push(['Ses produits',()=>{fermerFiche();ouvrirOnglet('produits','user_id=eq.'+uid,'Produits de ce profil');}]);}
if(table==='commandes'||table==='avis'||table==='messages'){
if(r.produit_id) l.push(['Le produit',()=>{fermerFiche();ouvrirOnglet('produits','id=eq.'+r.produit_id,'Produit concerné');}]);
}
return l;
}
function fermerFiche(){const f=document.getElementById('fiche');f.hidden=true;f.replaceChildren();document.body.style.overflow='';}
function ouvrirFiche(table,r){
const f=document.getElementById('fiche');
const champs={};
let deverrouille=false;
const corps=h('div',{class:'fiche-corps'});
const bSauver=h('button',{class:'btn-sauver'},'Enregistrer');
const bSuppr=h('button',{class:'btn-suppr'},'Supprimer');
const re=resume(table,r);
function dessiner(){
corps.replaceChildren();
const liens=liensFiche(table,r);
if(liens.length) corps.append(h('div',{class:'liens'},liens.map(([t,fn])=>h('button',{onclick:fn},t))));
const verrou=h('label',{class:'deverrouille'},h('input',{type:'checkbox',onchange:e=>{deverrouille=e.target.checked;majVerrous();}}),'Modifier aussi les identifiants (user_id, produit_id…)');
corps.append(verrou);
Object.keys(r).forEach(k=>{
const v=r[k];
const g=genreChamp(v);
let saisie;
if(g==='bool'){
saisie=h('select',null,h('option',{value:'true'},'Oui'),h('option',{value:'false'},'Non'));
saisie.value=String(v);
}else if(g==='json'){
saisie=h('textarea',null,JSON.stringify(v,null,2));
}else if(g==='nombre'){
saisie=h('input',{type:'number',step:'any',value:String(v)});
}else{
const s=v===null?'':String(v);
saisie=(s.length>70||s.includes('\n'))?h('textarea',null,s):h('input',{type:'text',value:s});
}
champs[k]={saisie,g,initial:v};
const bloc=h('div',{class:'champ'});
const u=urlImage(v);
if(u) bloc.append(h('img',{src:u,alt:''}));
bloc.append(h('label',null,k),saisie);
corps.append(bloc);
});
majVerrous();
}
function estVerrouille(k){return SANS_MODIF.includes(k)||(!deverrouille&&(k==='user_id'||k.endsWith('_id')));}
function majVerrous(){
Object.keys(champs).forEach(k=>{
const s=champs[k].saisie;
const v=estVerrouille(k);
if(s.tagName==='SELECT') s.disabled=v; else s.readOnly=v;
});
}
function valeur(k){
const {saisie,g,initial}=champs[k];
const brut=saisie.value;
if(g==='bool') return brut==='true';
if(g==='nombre') return brut===''?null:Number(brut);
if(g==='json'){return JSON.parse(brut);}
if(initial===null&&brut==='') return null;
return brut;
}
bSauver.onclick=async()=>{
const pk=cle(table,r);
if(!pk){toast('Cette ligne n\'a pas d\'identifiant : modification impossible.',true);return;}
const modifs={};
try{
Object.keys(champs).forEach(k=>{
if(estVerrouille(k)) return;
const v=valeur(k);
if(JSON.stringify(v)!==JSON.stringify(champs[k].initial)) modifs[k]=v;
});
}catch(e){toast('Un champ JSON n\'est pas valide.',true);return;}
if(!Object.keys(modifs).length){toast('Aucun changement.');return;}
bSauver.disabled=true;
try{
const r2=await api(table+'?'+pk+'=eq.'+encodeURIComponent(r[pk]),{methode:'PATCH',corps:modifs,entetes:{Prefer:'return=representation'}});
if(!r2.ok){const t=await r2.text();throw new Error(t.slice(0,160));}
const res=await r2.json();
if(!res.length){toast('Rien n\'a été modifié : droits administrateur manquants ?',true);bSauver.disabled=false;return;}
Object.assign(r,res[0]);
const i=etat.lignes.findIndex(x=>cle(table,x)&&x[pk]===r[pk]);
if(i>=0) etat.lignes[i]=Object.assign(etat.lignes[i],res[0]);
toast('Enregistré');
fermerFiche();
if(etat.table===table) majLignes();
}catch(e){
toast('Enregistrement impossible : '+(e.message||'erreur'),true);
bSauver.disabled=false;
}
};
bSuppr.onclick=async()=>{
const pk=cle(table,r);
if(!pk) return;
if(!confirm('Supprimer définitivement « '+re.titre+' » ? Cette action ne peut pas être annulée.')) return;
bSuppr.disabled=true;
try{
const r2=await api(table+'?'+pk+'=eq.'+encodeURIComponent(r[pk]),{methode:'DELETE',entetes:{Prefer:'return=representation'}});
if(!r2.ok){const t=await r2.text();throw new Error(t.slice(0,160));}
const res=await r2.json();
if(!res.length){toast('Rien n\'a été supprimé : droits administrateur manquants ?',true);bSuppr.disabled=false;return;}
etat.lignes=etat.lignes.filter(x=>x[pk]!==r[pk]);
toast('Supprimé');
fermerFiche();
if(etat.table===table) majLignes();
}catch(e){
toast('Suppression impossible : '+(e.message||'erreur'),true);
bSuppr.disabled=false;
}
};
f.replaceChildren(
h('div',{class:'fiche-entete'},h('button',{onclick:fermerFiche,'aria-label':'Fermer'},'←'),h('h2',null,re.titre)),
corps,
h('div',{class:'actions'},bSuppr,bSauver)
);
dessiner();
f.hidden=false;
f.scrollTop=0;
document.body.style.overflow='hidden';
}

// ---------- démarrage ----------
let estAdmin=false;
async function verifierAdmin(forcer){
const s=await session();
if(!s){ecranConnexion();return false;}
document.getElementById('qui').textContent=s.email||'';
if(!forcer&&estAdmin) return true;
try{
const r=await api('admins?select=user_id&user_id=eq.'+encodeURIComponent(s.user_id));
if(r.ok){
const l=await r.json();
if(l.length){estAdmin=true;return true;}
}
}catch(e){}
estAdmin=false;
ecranConfig(s);
return false;
}
(async function(){
const ok=await verifierAdmin(false);
if(ok){dessinerOnglets();tableauDeBord();}
})();
