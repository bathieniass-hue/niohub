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
const LIBELLE_DATE={produits:'Publié le',boutiques:'Créée le',profils:'Inscrit le',commandes:'Passée le',avis:'Publié le',messages:'Envoyé le'};

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

// ---------- nouveautés : pastilles chiffrées qui disparaissent à l'ouverture ----------
const SURVEILLES=['produits','boutiques','profils','commandes','avis'];
const NOMS_NOUVEAUX={produits:['nouveau produit','nouveaux produits'],boutiques:['nouvelle boutique','nouvelles boutiques'],profils:['nouveau profil','nouveaux profils'],commandes:['nouvelle commande','nouvelles commandes'],avis:['nouvel avis','nouveaux avis'],support:['nouveau message client','nouveaux messages clients']};
let nouveaux={produits:0,boutiques:0,profils:0,commandes:0,avis:0,support:0};
let nouveauxPrecedent=null;
let majEnCours=false;
function lireVuAdmin(){try{return JSON.parse(localStorage.getItem('niohub_admin_vu_v1')||'{}')||{};}catch(e){return {};}}
function ecrireVuAdmin(v){try{localStorage.setItem('niohub_admin_vu_v1',JSON.stringify(v));}catch(e){}}
async function derniereDateTable(t){
try{
const r=await api(t+'?select=created_at&order=created_at.desc&limit=1');
if(!r.ok) return null;
const l=await r.json();
return l[0]?l[0].created_at:'1970-01-01T00:00:00Z';
}catch(e){return null;}
}
// Ouvrir une liste = tout ce qu'elle contient est vu (on se fie aux dates du serveur, pas à l'horloge du téléphone)
async function marquerVuTable(t){
if(!SURVEILLES.includes(t)) return;
const d=await derniereDateTable(t);
if(!d) return;
const vu=lireVuAdmin();
if(!vu[t]||d>vu[t]){vu[t]=d;ecrireVuAdmin(vu);}
nouveaux[t]=0;
afficherPastilles();
}
function afficherPastilles(){
const total=Object.keys(nouveaux).reduce((s,k)=>s+(nouveaux[k]||0),0);
document.querySelectorAll('[data-pastille]').forEach(el=>{
const n=nouveaux[el.getAttribute('data-pastille')]||0;
el.textContent=n>99?'99+':String(n);
el.hidden=n<=0;
});
try{
if(navigator.setAppBadge){
if(total>0) navigator.setAppBadge(total).catch(()=>{}); else if(navigator.clearAppBadge) navigator.clearAppBadge().catch(()=>{});
}
}catch(e){}
}
async function majNouveaux(){
if(majEnCours||!estAdmin) return;
majEnCours=true;
try{
const vu=lireVuAdmin();
let change=false;
const res={produits:0,boutiques:0,profils:0,commandes:0,avis:0,support:0};
for(const t of SURVEILLES){
if(vu[t]===undefined){
// première fois : on ne signale pas tout l'ancien comme nouveau
const d=await derniereDateTable(t);
if(d===null) continue;
vu[t]=d;
change=true;
}
const n=await compter(t,'created_at=gt.'+encodeURIComponent(vu[t]));
res[t]=typeof n==='number'?n:0;
}
const s=await compter('support_messages','expediteur_admin=eq.false&lu=eq.false');
res.support=typeof s==='number'?s:0;
if(change) ecrireVuAdmin(vu);
// la liste ouverte en ce moment est déjà vue
const ouvert=ongletCourant;
if(SURVEILLES.includes(ouvert)&&etat.table===ouvert){
const d=await derniereDateTable(ouvert);
if(d&&(!vu[ouvert]||d>vu[ouvert])){vu[ouvert]=d;ecrireVuAdmin(vu);}
res[ouvert]=0;
}
if(ouvert==='support') res.support=0;
// annonce de ce qui vient d'arriver (pas au premier chargement)
if(nouveauxPrecedent){
Object.keys(res).forEach(k=>{
const plus=res[k]-(nouveauxPrecedent[k]||0);
if(plus>0&&document.visibilityState==='visible') toast(plus+' '+NOMS_NOUVEAUX[k][plus>1?1:0]);
});
}
nouveauxPrecedent=Object.assign({},res);
nouveaux=res;
afficherPastilles();
}catch(e){}
majEnCours=false;
}

// ---------- notifications du téléphone (même application fermée) ----------
const CLE_VAPID_PUBLIQUE='BGD0O90eHTnvelySaEXAcYBIZaTuUHTJtWFq9-82yw69R5m8xYYGODcLS97dChL6C13Rrax90-h8VKOCAzluTdg';
function cleVersOctets(b64){
const rempli=(b64+'='.repeat((4-b64.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/');
const brut=atob(rempli);
const sortie=new Uint8Array(brut.length);
for(let i=0;i<brut.length;i++) sortie[i]=brut.charCodeAt(i);
return sortie;
}
async function abonnerNotifAdmin(){
const reg=await navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready);
let sub=await reg.pushManager.getSubscription();
if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:cleVersOctets(CLE_VAPID_PUBLIQUE)});
const j=sub.toJSON();
const r=await api('rpc/enregistrer_push',{methode:'POST',corps:{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_cle_auth:j.keys.auth}});
if(!r.ok) throw new Error('serveur '+r.status);
}
function notifPossible(){return 'serviceWorker' in navigator&&'PushManager' in window&&typeof Notification!=='undefined';}
async function majBoutonNotif(){
const b=document.getElementById('notif-admin');
if(!b) return;
if(!notifPossible()){b.hidden=true;return;}
let actif=false;
try{
if(Notification.permission==='granted'){
const reg=await navigator.serviceWorker.getRegistration();
actif=!!(reg&&await reg.pushManager.getSubscription());
if(actif) abonnerNotifAdmin().catch(()=>{}); // remet à jour l'abonnement de ce compte
}
}catch(e){}
b.hidden=actif||Notification.permission==='denied';
}
async function activerNotifAdmin(){
try{
let p=Notification.permission;
if(p==='default') p=await Notification.requestPermission();
if(p!=='granted'){toast('Notifications refusées. Autorisez-les dans les réglages du téléphone.',true);return;}
await abonnerNotifAdmin();
toast('Notifications activées, même application fermée.');
}catch(e){
toast('Activation impossible : le serveur de notifications est-il prêt ?',true);
}
majBoutonNotif();
}

// ---------- navigation ----------
let ongletCourant='accueil';
let etat={table:null,lignes:[],debut:0,fini:false,filtre:'',recherche:''};

function dessinerOnglets(){
const nav=document.getElementById('onglets');
nav.replaceChildren(...[['accueil','Tableau de bord'],['support','Service client']].concat(Object.keys(TABLES).map(k=>[k,TABLES[k].titre])).concat([['reglages','Réglages']]).map(([k,t])=>
h('button',{class:k===ongletCourant?'on':'',onclick:()=>ouvrirOnglet(k)},t,NOMS_NOUVEAUX[k]?h('span',{class:'pastille-onglet','data-pastille':k,hidden:'true'},'0'):null)));
afficherPastilles();
}
let pile=[];
function descripteurCourant(){return {k:ongletCourant,filtre:etat.filtre||'',lib:etat.libelleFiltre||''};}
function majBoutonRetour(){const b=document.getElementById('retour-haut');if(b) b.hidden=!pile.length;}
// Retour : ferme la fiche ouverte, sinon revient à l'écran précédent. Renvoie false s'il n'y a plus rien à fermer.
function retourInterne(){
const f=document.getElementById('fiche');
if(f&&!f.hidden){fermerFiche();return true;}
if(pile.length){
const d=pile.pop();
ouvrirOnglet(d.k,d.filtre,d.lib,true);
return true;
}
return false;
}
function ouvrirOnglet(k,filtre,libelleFiltre,depuisRetour){
if(!depuisRetour){
const c=descripteurCourant();
if(c.k!==k||c.filtre!==(filtre||'')){pile.push(c);if(pile.length>30) pile.shift();}
}
ongletCourant=k;
majBoutonRetour();
dessinerOnglets();
window.scrollTo(0,0);
if(k==='accueil') return tableauDeBord();
if(k==='support'){nouveaux.support=0;afficherPastilles();return ecranSupport();}
if(k==='reglages') return ecranReglages();
etat={table:k,lignes:[],debut:0,fini:false,filtre:filtre||'',libelleFiltre:libelleFiltre||'',recherche:''};
marquerVuTable(k);
dessinerListe();
chargerPage();
}

async function compter(table,filtre){
try{
const r=await api(table+'?select=*'+(filtre?'&'+filtre:''),{entetes:{Prefer:'count=exact',Range:'0-0'}});
if(!r.ok&&r.status!==206) return null;
const cr=r.headers.get('content-range')||'';
const n=Number(cr.split('/')[1]);
return isNaN(n)?'?':n;
}catch(e){return null;}
}
async function tableauDeBord(){
const c=document.getElementById('contenu');
c.replaceChildren(h('p',{class:'vide'},'Chargement…'));
const cles=Object.keys(TABLES);
const nombres=await Promise.all(cles.map(compter));
const clients=await compter('support_messages','expediteur_admin=eq.false&lu=eq.false');
const attente=await compter('boutiques','statut=eq.en_attente');
const suspendues=await compter('boutiques','statut=eq.suspendue');
const cartes=cles.map((k,i)=>h('button',{class:'compteur',onclick:()=>ouvrirOnglet(k)},h('b',null,nombres[i]===null?'?':nombres[i]),h('span',null,TABLES[k].titre),NOMS_NOUVEAUX[k]?h('span',{class:'pastille-carte','data-pastille':k,hidden:'true'},'0'):null));
if(clients!==null) cartes.unshift(h('button',{class:'compteur',onclick:()=>ouvrirOnglet('support')},h('b',{style:clients?'color:#E0A52E':''},clients),h('span',null,'Messages clients à lire'),h('span',{class:'pastille-carte','data-pastille':'support',hidden:'true'},'0')));
if(attente!==null){
cartes.unshift(h('button',{class:'compteur',onclick:()=>ouvrirOnglet('boutiques','statut=eq.suspendue','Boutiques suspendues')},h('b',null,suspendues),h('span',null,'Boutiques suspendues')));
cartes.unshift(h('button',{class:'compteur',onclick:()=>ouvrirOnglet('boutiques','statut=eq.en_attente','Boutiques à valider')},h('b',{style:attente?'color:#E0A52E':''},attente),h('span',null,'Boutiques à valider')));
}
c.replaceChildren(h('div',{class:'grille'},cartes));
afficherPastilles();
}

// ---------- validation des boutiques et des numéros ----------
function sqlValidation(){
return `-- Validation des boutiques par WhatsApp
-- 1) Réglages (le numéro WhatsApp de vérification se modifie ensuite depuis l'administration)
create table if not exists public.reglages (
  cle text primary key,
  valeur text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.reglages enable row level security;
drop policy if exists "lecture publique reglages" on public.reglages;
create policy "lecture publique reglages" on public.reglages for select using (true);
drop policy if exists "admin gere reglages" on public.reglages;
create policy "admin gere reglages" on public.reglages for all using (public.est_admin()) with check (public.est_admin());
insert into public.reglages (cle, valeur) values ('whatsapp_verification', '') on conflict (cle) do nothing;

-- 2) Numéro vérifié sur chaque boutique
alter table public.boutiques add column if not exists telephone_verifie boolean not null default false;

-- 3) Une nouvelle boutique commence « en attente » ; seul l'administrateur valide la boutique et le numéro.
--    Changer de numéro retire la vérification.
create or replace function public.proteger_statut_boutique() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.est_admin() then
    if tg_op = 'INSERT' then
      new.statut := 'en_attente';
      new.telephone_verifie := false;
    else
      new.statut := old.statut;
      new.telephone_verifie := old.telephone_verifie;
      if new.telephone is distinct from old.telephone or new.telephone2 is distinct from old.telephone2 then
        new.telephone_verifie := false;
      end if;
    end if;
  end if;
  return new;
end $$;`;
}
function panneauValidation(){
const sql=sqlValidation();
return h('div',{class:'config',style:'margin-bottom:12px'},
h('h2',null,'Activer la validation par WhatsApp'),
h('p',null,'Collez ce texte dans SQL Editor (Supabase), appuyez sur Run, puis actualisez cette page.'),
h('pre',null,sql),
h('button',{onclick:async()=>{try{await navigator.clipboard.writeText(sql);toast('Copié');}catch(e){toast('Copie impossible : sélectionnez le texte à la main.',true);}}},'Copier le texte'));
}
function neuf(t){
let n=String(t||'').replace(/\D/g,'');
if(n.startsWith('00221')) n=n.slice(5);
else if(n.startsWith('221')&&n.length>9) n=n.slice(3);
return n.slice(-9);
}
async function ecranReglages(){
const c=document.getElementById('contenu');
c.replaceChildren(h('p',{class:'vide'},'Chargement…'));
let valeur='';
try{
const r=await api('reglages?select=*&cle=eq.whatsapp_verification');
if(r.status===404||r.status===400){c.replaceChildren(panneauValidation());return;}
if(!r.ok) throw new Error(r.status);
const l=await r.json();
valeur=(l[0]&&l[0].valeur)||'';
}catch(e){
c.replaceChildren(h('p',{class:'vide'},'Chargement impossible. Vérifiez la connexion.'));
return;
}
const saisie=h('input',{type:'tel',inputmode:'tel',placeholder:'Ex. 221771234567',value:valeur});
const bSauver=h('button',{class:'btn-sauver',style:'width:100%;margin-top:12px'},'Enregistrer');
bSauver.onclick=async()=>{
let n=saisie.value.replace(/\D/g,'');
if(n.length===9) n='221'+n;
if(n.length<10||n.length>15){toast('Écrivez le numéro avec l\'indicatif du pays, par exemple 221771234567.',true);return;}
bSauver.disabled=true;
try{
const r=await api('reglages?on_conflict=cle',{methode:'POST',corps:{cle:'whatsapp_verification',valeur:n,updated_at:new Date().toISOString()},entetes:{Prefer:'resolution=merge-duplicates,return=representation'}});
if(!r.ok){const t=await r.text();throw new Error(t.slice(0,120));}
saisie.value=n;
toast('Numéro enregistré');
}catch(e){toast('Enregistrement impossible : '+(e.message||'erreur'),true);}
bSauver.disabled=false;
};
c.replaceChildren(h('div',{class:'config'},
h('h2',null,'Validation par WhatsApp'),
h('p',null,'Les vendeurs dont la boutique n\'est pas validée touchent « Valider mon numéro de téléphone » : WhatsApp s\'ouvre sur ce numéro avec les informations de la boutique et du profil déjà écrites.'),
h('div',{class:'champ'},h('label',null,'Numéro WhatsApp de vérification (avec l\'indicatif)'),saisie),
bSauver,
h('a',{class:'bouton',style:'margin-top:12px',href:'#',onclick:e=>{e.preventDefault();const n=saisie.value.replace(/\D/g,'');if(n.length<9){toast('Enregistrez d\'abord un numéro.',true);return;}window.open('https://wa.me/'+(n.length===9?'221'+n:n),'_blank','noopener');}},'Tester le lien WhatsApp')));
}

// Carte de vérification d'une boutique : numéros comparés côté boutique et côté profil, puis validation
function carteVerification(r){
const carte=h('div',{class:'config verification',style:'margin-bottom:14px'});
if(r.telephone_verifie===undefined){
carte.append(h('h2',null,'Vérification du numéro'),h('p',null,'Pour vérifier les numéros, activez d\'abord la validation par WhatsApp (onglet Réglages, avec le texte SQL).'));
return carte;
}
carte.append(h('h2',null,'Vérification du numéro'),h('p',null,'Chargement du profil…'));
(async()=>{
let profil=null;
try{
const rp=await api('profils?select=*&user_id=eq.'+encodeURIComponent(r.user_id)+'&limit=1');
if(rp.ok) profil=(await rp.json())[0]||null;
}catch(e){}
const telsBoutique=[r.telephone,r.telephone2].filter(Boolean);
const telProfil=profil&&profil.telephone?profil.telephone:'';
const memeNumero=!!telProfil&&telsBoutique.some(t=>neuf(t)===neuf(telProfil));
const ligne=(a,b2)=>h('div',{class:'ligne-verif'},h('span',null,a),h('b',null,b2||'—'));
const verdict=!telsBoutique.length?h('div',{class:'verdict non'},'Aucun numéro sur la boutique'):!telProfil?h('div',{class:'verdict non'},'Aucun numéro sur le profil'):memeNumero?h('div',{class:'verdict oui'},'✓ Même numéro sur la boutique et le profil'):h('div',{class:'verdict non'},'✗ Numéros différents');
const actions=h('div',{class:'liens'});
async function appliquer(champs,message){
try{
const pk=cle('boutiques',r);
const r2=await api('boutiques?'+pk+'=eq.'+encodeURIComponent(r[pk]),{methode:'PATCH',corps:champs,entetes:{Prefer:'return=representation'}});
if(!r2.ok){const t=await r2.text();throw new Error(t.slice(0,140));}
const res=await r2.json();
if(!res.length){toast('Rien n\'a été modifié : droits administrateur manquants ?',true);return;}
Object.assign(r,res[0]);
const i=etat.lignes.findIndex(x=>x[pk]===r[pk]);
if(i>=0) Object.assign(etat.lignes[i],res[0]);
toast(message);
fermerFiche();
if(etat.table==='boutiques') majLignes();
}catch(e){toast('Changement impossible : '+(e.message||'erreur'),true);}
}
if(!r.telephone_verifie||r.statut!=='validee') actions.append(h('button',{onclick:()=>appliquer({telephone_verifie:true,statut:'validee'},'Numéro et boutique validés')},'Valider le numéro et la boutique'));
if(!r.telephone_verifie) actions.append(h('button',{onclick:()=>appliquer({telephone_verifie:true},'Numéro validé')},'Valider le numéro seulement'));
if(r.telephone_verifie) actions.append(h('button',{onclick:()=>appliquer({telephone_verifie:false},'Vérification retirée')},'Retirer la vérification'));
carte.replaceChildren(
h('h2',null,'Vérification du numéro'),
h('p',null,'Comparez avec le message WhatsApp reçu, puis validez.'),
h('div',{class:'bloc-verif'},h('div',{class:'titre-verif'},'Boutique'),ligne('Nom',r.nom),ligne('Adresse',r.adresse),ligne('Téléphone',telsBoutique.map(t=>neuf(t)).join(' / '))),
h('div',{class:'bloc-verif'},h('div',{class:'titre-verif'},'Profil du vendeur'),ligne('Nom',profil&&profil.nom),ligne('Téléphone',telProfil?neuf(telProfil):''),ligne('E-mail',profil&&profil.email)),
verdict,
h('div',{class:'ligne-verif'},h('span',null,'État'),h('b',null,(STATUTS[r.statut]||r.statut||'—')+(r.telephone_verifie?' · numéro vérifié':' · numéro non vérifié'))),
actions);
})();
return carte;
}

// ---------- date et heure ----------
function quand(iso){
const d=new Date(iso);
if(isNaN(d.getTime())) return '';
return d.toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
}

// ---------- service client : les messages des utilisateurs, avec la réponse ----------
function sqlSupport(){
return `-- Service client (messages entre les utilisateurs et NioHub)
create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expediteur_admin boolean not null default false,
  texte text not null check (char_length(texte) between 1 and 2000),
  lu boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_user on public.support_messages (user_id, created_at);
alter table public.support_messages enable row level security;

drop policy if exists "client lit sa conversation" on public.support_messages;
create policy "client lit sa conversation" on public.support_messages for select using (user_id = auth.uid());
drop policy if exists "client ecrit" on public.support_messages;
create policy "client ecrit" on public.support_messages for insert with check (user_id = auth.uid() and expediteur_admin = false);
drop policy if exists "admin lit tout support" on public.support_messages;
create policy "admin lit tout support" on public.support_messages for select using (public.est_admin());
drop policy if exists "admin repond" on public.support_messages;
create policy "admin repond" on public.support_messages for insert with check (public.est_admin() and expediteur_admin = true);
drop policy if exists "admin modifie support" on public.support_messages;
create policy "admin modifie support" on public.support_messages for update using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admin supprime support" on public.support_messages;
create policy "admin supprime support" on public.support_messages for delete using (public.est_admin());

-- Un utilisateur marque comme lues les réponses de l'équipe
create or replace function public.marquer_support_lus() returns void
language sql security definer set search_path = public as $$
  update public.support_messages set lu = true where user_id = auth.uid() and expediteur_admin = true and lu = false
$$;
grant execute on function public.marquer_support_lus() to authenticated;

-- Protection contre l'abus : 20 messages maximum toutes les 10 minutes par utilisateur
create or replace function public.limiter_support() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not new.expediteur_admin and (select count(*) from public.support_messages
      where user_id = new.user_id and not expediteur_admin and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'trop de messages';
  end if;
  return new;
end $$;
drop trigger if exists trg_limiter_support on public.support_messages;
create trigger trg_limiter_support before insert on public.support_messages
  for each row execute function public.limiter_support();`;
}
function panneauSupport(){
const sql=sqlSupport();
return h('div',{class:'config'},
h('h2',null,'Activer le service client'),
h('p',null,'Pour recevoir les messages des utilisateurs, collez ce texte dans SQL Editor (Supabase), appuyez sur Run, puis actualisez cette page.'),
h('pre',null,sql),
h('button',{onclick:async()=>{try{await navigator.clipboard.writeText(sql);toast('Copié');}catch(e){toast('Copie impossible : sélectionnez le texte à la main.',true);}}},'Copier le texte'));
}
async function ecranSupport(){
const c=document.getElementById('contenu');
c.replaceChildren(h('p',{class:'vide'},'Chargement…'));
let lignes;
try{
const r=await api('support_messages?select=*&order=created_at.desc&limit=500');
if(r.status===404||r.status===400){c.replaceChildren(panneauSupport());return;}
if(r.status===401||r.status===403) return verifierAdmin(true);
if(!r.ok) throw new Error(r.status);
lignes=await r.json();
}catch(e){
c.replaceChildren(h('p',{class:'vide'},'Chargement impossible. Vérifiez la connexion.'));
return;
}
const fils=new Map();
lignes.forEach(m=>{
if(!fils.has(m.user_id)) fils.set(m.user_id,{user_id:m.user_id,dernier:m,nonLus:0});
if(!m.expediteur_admin&&!m.lu) fils.get(m.user_id).nonLus++;
});
const ids=[...fils.keys()];
const noms={};
if(ids.length){
try{
const r=await api('profils?select=user_id,nom,telephone&user_id=in.('+ids.join(',')+')');
if(r.ok) (await r.json()).forEach(p=>{noms[p.user_id]=p.nom||p.telephone||'';});
}catch(e){}
}
if(!ids.length){c.replaceChildren(h('p',{class:'vide'},'Aucun message de client pour le moment.'));return;}
c.replaceChildren(...ids.map(id=>{
const f=fils.get(id);
const nom=noms[id]||('Utilisateur '+String(id).slice(0,8));
const dernier=(f.dernier.expediteur_admin?'Vous : ':'')+f.dernier.texte;
return h('button',{class:'ligne',onclick:()=>ouvrirFilSupport(id,nom)},
h('div',{class:'vignette'},(nom.charAt(0)||'?').toUpperCase()),
h('div',{class:'txt'},h('div',{class:'nom'},nom),h('div',{class:'sous'},court(dernier,70)),h('div',{class:'sous'},quand(f.dernier.created_at))),
f.nonLus?h('span',{class:'pastille'},String(f.nonLus)):null);
}));
}
let supportTimer=null;
async function ouvrirFilSupport(userId,nom){
const f=document.getElementById('fiche');
const zone=h('div',{class:'fil'});
const champ=h('textarea',{class:'saisie',placeholder:'Répondre à '+nom+'…',rows:'1'});
const bEnvoyer=h('button',{class:'btn-sauver'},'Envoyer');
let vus='';
async function charger(){
try{
const r=await api('support_messages?select=*&user_id=eq.'+encodeURIComponent(userId)+'&order=created_at.asc&limit=500');
if(!r.ok) return;
const l=await r.json();
const sig=l.map(m=>m.id+':'+m.lu).join(',');
if(sig!==vus){
vus=sig;
const bas=zone.scrollHeight-zone.scrollTop-zone.clientHeight<80;
zone.replaceChildren(...l.map(m=>h('div',{class:'bulle '+(m.expediteur_admin?'moi':'client')},m.texte,h('div',{class:'heure'},quand(m.created_at)))));
if(bas||!zone.dataset.vu){zone.scrollTop=zone.scrollHeight;zone.dataset.vu='1';}
}
// les messages du client sont lus dès que la discussion est ouverte
if(l.some(m=>!m.expediteur_admin&&!m.lu)){
await api('support_messages?user_id=eq.'+encodeURIComponent(userId)+'&expediteur_admin=eq.false&lu=eq.false',{methode:'PATCH',corps:{lu:true}});
}
}catch(e){}
}
function fermer(){clearInterval(supportTimer);fermerFiche();if(ongletCourant==='support') ecranSupport();}
bEnvoyer.onclick=async()=>{
const t=champ.value.trim();
if(!t) return;
bEnvoyer.disabled=true;
try{
const r=await api('support_messages',{methode:'POST',corps:{user_id:userId,expediteur_admin:true,texte:t},entetes:{Prefer:'return=representation'}});
if(!r.ok){const x=await r.text();throw new Error(x.slice(0,120));}
champ.value='';
vus='';
await charger();
}catch(e){toast('Envoi impossible : '+(e.message||'erreur'),true);}
bEnvoyer.disabled=false;
};
f.replaceChildren(
h('div',{class:'fiche-entete'},h('button',{onclick:fermer,'aria-label':'Retour'},'←'),h('h2',null,nom)),
zone,
h('div',{class:'actions saisie-barre'},champ,bEnvoyer)
);
f.hidden=false;
f.scrollTop=0;
document.body.style.overflow='hidden';
await charger();
clearInterval(supportTimer);
supportTimer=setInterval(()=>{if(!f.hidden&&document.visibilityState==='visible') charger(); else if(f.hidden) clearInterval(supportTimer);},6000);
}

// ---------- listes ----------
const STATUTS={validee:'Validée',en_attente:'En attente',suspendue:'Suspendue'};
function resume(table,r){
const titre=r.nom||r.produit||r.titre||r.email||r.statut||('#'+court(r.id||r.user_id||'',8));
const champs=table==='produits'?['prix','categorie','etat']:table==='boutiques'?['statut','adresse','ville','telephone']:table==='profils'?['telephone','adresse','email']:table==='commandes'?['statut','total','prix','mode_livraison']:table==='avis'?['note','texte']:['expediteur','texte'];
const sous=champs.filter(k=>r[k]!==undefined&&r[k]!==null&&r[k]!=='').map(k=>k==='prix'||k==='total'?prixTexte(r[k]):(k==='statut'&&table==='boutiques'?(STATUTS[r[k]]||r[k]):String(r[k]))).join(' · ');
const verifie=(table==='boutiques'&&r.telephone_verifie)?' · Numéro vérifié':'';
return {titre:court(titre,60),sous:court(sous+verifie,90)};
}
function vignette(table,r){
const v=h('div',{class:'vignette'});
const cle=(TABLES[table].img||[]).find(k=>urlImage(r[k]));
if(cle) v.style.backgroundImage="url('"+urlImage(r[cle])+"')";
else v.textContent=(String(resume(table,r).titre).charAt(0)||'?').toUpperCase();
return v;
}
function sqlStatut(){
return `-- Validation et suspension des boutiques
-- 1) Colonne « statut » : validee, en_attente ou suspendue (les boutiques existantes restent validées)
alter table public.boutiques add column if not exists statut text not null default 'validee';
alter table public.boutiques drop constraint if exists boutiques_statut_check;
alter table public.boutiques add constraint boutiques_statut_check check (statut in ('en_attente','validee','suspendue'));

-- 2) Seul l'administrateur peut changer le statut (un vendeur ne peut pas se valider lui-même)
create or replace function public.proteger_statut_boutique() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
if auth.uid() is not null and not public.est_admin() then
if tg_op = 'INSERT' then
-- Remplacez 'validee' par 'en_attente' si vous voulez valider chaque nouvelle boutique à la main
new.statut := 'validee';
else
new.statut := old.statut;
end if;
end if;
return new;
end $$;
drop trigger if exists trg_proteger_statut on public.boutiques;
create trigger trg_proteger_statut before insert or update on public.boutiques
for each row execute function public.proteger_statut_boutique();

-- 3) Les produits d'une boutique non validée ne sont visibles que par son propriétaire et l'administrateur
create or replace function public.boutique_bloquee(uid uuid) returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.boutiques b where b.user_id = uid and b.statut <> 'validee') $$;
drop policy if exists "boutique validee seulement" on public.produits;
create policy "boutique validee seulement" on public.produits as restrictive for select
using (user_id = auth.uid() or public.est_admin() or not public.boutique_bloquee(user_id));
drop policy if exists "boutique validee pour publier" on public.produits;
create policy "boutique validee pour publier" on public.produits as restrictive for insert
with check (public.est_admin() or not public.boutique_bloquee(user_id));`;
}
function panneauStatut(){
const sql=sqlStatut();
return h('div',{class:'config',style:'margin-bottom:12px'},
h('h2',null,'Activer la validation des boutiques'),
h('p',null,'Pour valider ou suspendre des boutiques, collez ce texte dans SQL Editor (Supabase), appuyez sur Run, puis actualisez cette page.'),
h('pre',null,sql),
h('button',{onclick:async()=>{try{await navigator.clipboard.writeText(sql);toast('Copié');}catch(e){toast('Copie impossible : sélectionnez le texte à la main.',true);}}},'Copier le texte'));
}
function dessinerListe(){
const c=document.getElementById('contenu');
const t=etat.table;
const q=etat.recherche.trim().toLowerCase();
const visibles=etat.lignes.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q));
c.replaceChildren(
h('div',{class:'barre'},h('input',{type:'search',placeholder:'Rechercher dans '+TABLES[t].titre.toLowerCase()+'…',value:etat.recherche,oninput:e=>{etat.recherche=e.target.value;majLignes();}})),
(t==='boutiques'&&etat.lignes.length&&etat.lignes[0].statut===undefined)?panneauStatut():null,
(t==='boutiques'&&etat.lignes.length&&etat.lignes[0].statut!==undefined&&!etat.filtre)?h('div',{class:'liens'},h('button',{onclick:()=>ouvrirOnglet('boutiques','statut=eq.en_attente','Boutiques à valider')},'À valider'),h('button',{onclick:()=>ouvrirOnglet('boutiques','statut=eq.suspendue','Boutiques suspendues')},'Suspendues')):null,
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
return h('button',{class:'ligne',onclick:()=>ouvrirFiche(t,r)},vignette(t,r),h('div',{class:'txt'},h('div',{class:'nom'},re.titre),h('div',{class:'sous'},re.sous||' '),r.created_at?h('div',{class:'sous date'},(LIBELLE_DATE[t]||'Le')+' '+quand(r.created_at)):null));
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
// Pour les boutiques, l'en-tête (raccourcis ou activation du statut) dépend des lignes chargées
if(t==='boutiques'&&etat.table===t&&etat.debut<=PAGE) dessinerListe(); else majLignes();
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
if(table==='boutiques'&&r.statut!==undefined){
if(r.statut!=='validee') l.push(['Valider la boutique',()=>changerStatut(table,r,'validee')]);
if(r.statut!=='suspendue') l.push(['Suspendre',()=>changerStatut(table,r,'suspendue')]);
if(r.statut==='validee') l.push(['Remettre en attente',()=>changerStatut(table,r,'en_attente')]);
}
if(table==='boutiques'&&uid){l.push(['Ses produits',()=>{fermerFiche();ouvrirOnglet('produits','user_id=eq.'+uid,'Produits de cette boutique');}]);l.push(['Son profil',()=>{fermerFiche();ouvrirOnglet('profils','user_id=eq.'+uid,'Profil du propriétaire');}]);}
if(table==='produits'&&uid){l.push(['Sa boutique',()=>{fermerFiche();ouvrirOnglet('boutiques','user_id=eq.'+uid,'Boutique du vendeur');}]);l.push(['Son profil',()=>{fermerFiche();ouvrirOnglet('profils','user_id=eq.'+uid,'Profil du vendeur');}]);}
if(table==='profils'&&uid){l.push(['Sa boutique',()=>{fermerFiche();ouvrirOnglet('boutiques','user_id=eq.'+uid,'Boutique de ce profil');}]);l.push(['Ses produits',()=>{fermerFiche();ouvrirOnglet('produits','user_id=eq.'+uid,'Produits de ce profil');}]);}
if(table==='commandes'||table==='avis'||table==='messages'){
if(r.produit_id) l.push(['Le produit',()=>{fermerFiche();ouvrirOnglet('produits','id=eq.'+r.produit_id,'Produit concerné');}]);
}
return l;
}
async function changerStatut(table,r,statut){
const pk=cle(table,r);
if(!pk) return;
if(statut==='suspendue'&&!confirm('Suspendre « '+resume(table,r).titre+' » ? Ses produits ne seront plus visibles par les acheteurs.')) return;
try{
const r2=await api(table+'?'+pk+'=eq.'+encodeURIComponent(r[pk]),{methode:'PATCH',corps:{statut:statut},entetes:{Prefer:'return=representation'}});
if(!r2.ok){const t=await r2.text();throw new Error(t.slice(0,160));}
const res=await r2.json();
if(!res.length){toast('Rien n\'a été modifié : droits administrateur manquants ?',true);return;}
Object.assign(r,res[0]);
const i=etat.lignes.findIndex(x=>x[pk]===r[pk]);
if(i>=0) Object.assign(etat.lignes[i],res[0]);
toast(statut==='validee'?'Boutique validée':statut==='suspendue'?'Boutique suspendue':'Remise en attente');
fermerFiche();
if(etat.table===table) majLignes();
}catch(e){
toast('Changement impossible : '+(e.message||'erreur'),true);
}
}
// ---------- fenêtres de choix (catégorie, état, couleurs…) ----------
const CATEGORIES=["Mode & accessoires","Téléphone & high-tech","Maison & décoration","Beauté & hygiène","Alimentation","Sport et loisir","Électroménager","Bébé & enfants","École & bureau","Auto & moto","Autres"];
const ETATS=["Neuf","Comme neuf","Bon état","Occasion"];
const COULEURS=["Multicolore","Noir","Blanc","Bleu","Rouge","Vert","Jaune","Rose","Gris","Marron","Beige","Orange","Violet","Bleu marine","Bordeaux","Turquoise","Doré","Argenté","Bleu ciel","Kaki","Fuchsia","Corail","Crème","Camel","Lavande","Vert clair","Saumon","Transparent"];
const CHOIX={
produits:{categorie:{titre:'Catégorie',options:CATEGORIES},etat:{titre:'État',options:ETATS,nullable:true},couleurs:{titre:'Couleurs',options:COULEURS,multiple:true,nullable:true}},
boutiques:{statut:{titre:'Statut de la boutique',options:[['validee','Validée'],['en_attente','En attente'],['suspendue','Suspendue']]}},
commandes:{statut:{titre:'Statut de la commande',options:['À préparer','Expédiée','Livrée','Annulée']}},
avis:{note:{titre:'Note',options:[1,2,3,4,5],nombre:true}}
};
function optionsNormalisees(cfg){return cfg.options.map(o=>Array.isArray(o)?o:[o,String(o)]);}

// Fenêtre de choix : renvoie la sélection (liste de valeurs), ou undefined si on annule
function ouvrirChoix(cfg,selection){
return new Promise(resolve=>{
const opts=optionsNormalisees(cfg);
const choisies=new Set(selection.map(String));
const fond=h('div',{class:'dialogue-fond'});
const boite=h('div',{class:'dialogue',role:'dialog','aria-modal':'true'});
const liste=h('div',{class:'dialogue-liste'});
function fermer(res){fond.remove();resolve(res);}
function ligne(valeur,libelle){
const coche=choisies.has(String(valeur));
const b=h('button',{type:'button',class:'dialogue-option'+(coche?' on':'')},h('span',{class:'dialogue-case'},coche?'✓':''),h('span',null,libelle));
b.onclick=()=>{
if(cfg.multiple){
if(choisies.has(String(valeur))) choisies.delete(String(valeur)); else choisies.add(String(valeur));
b.classList.toggle('on');
b.firstChild.textContent=choisies.has(String(valeur))?'✓':'';
}else{
fermer(valeur===null?[]:[valeur]);
}
};
return b;
}
if(cfg.nullable&&!cfg.multiple) liste.append(ligne(null,'— Aucun —'));
opts.forEach(([v,l])=>liste.append(ligne(v,l)));
boite.append(h('h3',null,cfg.titre||'Choisir'),liste);
const pied=h('div',{class:'dialogue-pied'},h('button',{type:'button',onclick:()=>fermer(undefined)},'Annuler'));
if(cfg.multiple){
pied.append(h('button',{type:'button',class:'valider',onclick:()=>fermer(opts.map(o=>o[0]).filter(v=>choisies.has(String(v))))},'Valider'));
}
boite.append(pied);
fond.append(boite);
fond.addEventListener('click',e=>{if(e.target===fond) fermer(undefined);});
document.body.append(fond);
});
}
function creerChoix(cfg,valeurInitiale){
const opts=optionsNormalisees(cfg);
let valeur=valeurInitiale===undefined?null:valeurInitiale;
const bouton=h('button',{type:'button',class:'choix'});
function selection(){
if(valeur===null||valeur==='') return [];
if(cfg.multiple) return String(valeur).split(',').map(x=>x.trim()).filter(Boolean);
return [valeur];
}
function libelle(){
const sel=selection();
if(!sel.length) return cfg.multiple?'— Aucune —':'— Aucun —';
if(cfg.multiple) return sel.join(', ');
const o=opts.find(x=>String(x[0])===String(sel[0]));
return o?o[1]:String(sel[0]);
}
function dessiner(){bouton.replaceChildren(h('span',null,libelle()),h('span',{class:'fleche'},'▾'));}
bouton.onclick=async()=>{
const res=await ouvrirChoix(cfg,selection());
if(res===undefined) return;
if(cfg.multiple) valeur=res.length?res.join(', '):null;
else valeur=res.length?(cfg.nombre?Number(res[0]):res[0]):null;
dessiner();
};
dessiner();
bouton.valeurChoix=()=>valeur;
return bouton;
}

// ---------- prix : saisie guidée (1.000.000) ----------
function formaterMilliers(t){
const d=String(t||'').replace(/\D/g,'').replace(/^0+(?=\d)/,'').slice(0,9);
return d.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}
function creerPrix(v){
const initial=String(v===null||v===undefined?'':v);
const chiffresInitiaux=initial.replace(/\D/g,'');
const saisie=h('input',{type:'text',inputmode:'numeric',autocomplete:'off',value:formaterMilliers(chiffresInitiaux)});
saisie.addEventListener('input',()=>{saisie.value=formaterMilliers(saisie.value);});
const bloc=h('div',{class:'prix-champ'},saisie,h('span',{class:'suffixe'},'FCFA'));
bloc.valeurPrix=()=>{
const d=saisie.value.replace(/\D/g,'');
if(d===chiffresInitiaux) return v;
if(d==='') return null;
return Number(d).toLocaleString('fr-FR')+' FCFA';
};
return bloc;
}

// ---------- photos : changer ou supprimer ----------
const PREFIXE_PHOTOS=SUPABASE_URL+'/storage/v1/object/public/photos/';
const CLES_IMAGE=['photo','logo','avatar','avatar_url','photo_url','image','image_url','picture','photo_profil'];
function estChampImage(k,v){
if(k==='photos') return false;
return CLES_IMAGE.includes(k)||(typeof v==='string'&&v.startsWith(PREFIXE_PHOTOS));
}
function urlAffichable(u){return typeof u==='string'&&/^https:\/\//.test(u)?u:'';}
function lireImage(fichier){
return new Promise((ok,ko)=>{
const a=URL.createObjectURL(fichier);
const img=new Image();
img.onload=()=>{URL.revokeObjectURL(a);ok(img);};
img.onerror=()=>{URL.revokeObjectURL(a);ko(new Error('lecture'));};
img.src=a;
});
}
function recadrerLimites(img){
const MIN=2/3,MAX=3/2;
const r=img.width/img.height;
if(r>=MIN-0.001&&r<=MAX+0.001) return img;
let sx=0,sy=0,sw=img.width,sh=img.height;
if(r<MIN){sh=Math.round(img.width/MIN);sy=Math.round((img.height-sh)/2);}
else{sw=Math.round(img.height*MAX);sx=Math.round((img.width-sw)/2);}
const c=document.createElement('canvas');
c.width=sw;c.height=sh;
c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
return c;
}
function reduireImage(img,largeurMax,qualite){
const e=Math.min(1,largeurMax/img.width);
const c=document.createElement('canvas');
c.width=Math.max(1,Math.round(img.width*e));
c.height=Math.max(1,Math.round(img.height*e));
c.getContext('2d').drawImage(img,0,0,c.width,c.height);
return new Promise(ok=>c.toBlob(ok,'image/jpeg',qualite));
}
async function televerserFichierAdmin(chemin,blob,s){
const r=await fetch(SUPABASE_URL+'/storage/v1/object/photos/'+chemin,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'image/jpeg','cache-control':'max-age=31536000'},body:blob});
if(!r.ok) throw new Error(String(r.status));
}
async function televerserPhotoAdmin(blob,mini,s){
const base=s.user_id+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
await televerserFichierAdmin(base+'.jpg',blob,s);
if(mini){
try{await televerserFichierAdmin(base+'_m.jpg',mini,s);}
catch(e){await supprimerFichiers([PREFIXE_PHOTOS+base+'.jpg'],s);throw e;}
}
return PREFIXE_PHOTOS+base+'.jpg';
}
// Retire les fichiers photo (et leur petite version) du stockage ; sans effet pour les adresses extérieures
async function supprimerFichiers(urls,s){
const chemins=[];
(urls||[]).forEach(u=>{
const t=String(u||'');
if(!t.startsWith(PREFIXE_PHOTOS)) return;
const c=t.slice(PREFIXE_PHOTOS.length);
chemins.push(c);
if(c.endsWith('.jpg')&&!c.endsWith('_m.jpg')) chemins.push(c.replace(/\.jpg$/,'_m.jpg'));
});
if(!chemins.length||!s) return;
try{
await fetch(SUPABASE_URL+'/storage/v1/object/photos',{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({prefixes:chemins})});
}catch(e){}
}
// Zone de photos d'une fiche : chaque photo peut être changée ou supprimée
function creerPhotos(urlsInitiales,multiple,maxi){
const items=urlsInitiales.filter(Boolean).map(u=>({url:u,src:urlAffichable(u),blob:null,mini:null}));
const zone=h('div',{class:'photos-admin'});
const entree=h('input',{type:'file',accept:'image/*',style:'display:none'});
let cible=-1;
entree.addEventListener('change',async()=>{
const f=entree.files[0];
entree.value='';
if(!f) return;
try{
const img=await lireImage(f);
const source=recadrerLimites(img);   // format d'origine, limité à 2:3 / 3:2
const blob=await reduireImage(source,800,0.75);
const mini=await reduireImage(source,360,0.7);
if(!blob) throw new Error('image');
const it={url:null,src:URL.createObjectURL(blob),blob:blob,mini:mini};
if(cible>=0&&cible<items.length) items[cible]=it; else items.push(it);
dessiner();
}catch(e){toast('Cette photo ne peut pas être lue.',true);}
});
function dessiner(){
zone.replaceChildren(
...items.map((it,i)=>h('div',{class:'photo-carte'},
it.src?h('img',{src:it.src,alt:'',referrerpolicy:'no-referrer'}):h('div',{class:'photo-vide'},'Photo'),
h('div',{class:'photo-actions'},
h('button',{type:'button',onclick:()=>{cible=i;entree.click();}},'Changer'),
h('button',{type:'button',class:'danger',onclick:()=>{items.splice(i,1);dessiner();}},'Supprimer')))),
(multiple?items.length<maxi:items.length===0)?h('button',{type:'button',class:'photo-ajout',onclick:()=>{cible=-1;entree.click();}},items.length?'+ Ajouter une photo':'+ Ajouter une photo'):null,
entree);
}
dessiner();
return {
elem:zone,
initial:urlsInitiales.filter(Boolean),
items:()=>items,
modifie(){return items.some(i=>i.blob)||JSON.stringify(items.map(i=>i.url))!==JSON.stringify(this.initial);}
};
}

function fermerFiche(){
clearInterval(supportTimer);
const f=document.getElementById('fiche');
f.hidden=true;
f.replaceChildren();
document.body.style.overflow='';
}
function ouvrirFiche(table,r){
const f=document.getElementById('fiche');
const champs={};
const photos=[];   // zones de photos {cle, multiple, w}
let deverrouille=false;
const corps=h('div',{class:'fiche-corps'});
const bSauver=h('button',{class:'btn-sauver'},'Enregistrer');
const bSuppr=h('button',{class:'btn-suppr'},'Supprimer');
const re=resume(table,r);
function dessiner(){
corps.replaceChildren();
const liens=liensFiche(table,r);
if(liens.length) corps.append(h('div',{class:'liens'},liens.map(([t,fn])=>h('button',{onclick:fn},t))));
if(table==='boutiques') corps.append(carteVerification(r));
if(r.created_at) corps.append(h('div',{class:'date-fiche'},(LIBELLE_DATE[table]||'Le')+' '+quand(r.created_at)));
const verrou=h('label',{class:'deverrouille'},h('input',{type:'checkbox',onchange:e=>{deverrouille=e.target.checked;majVerrous();}}),'Modifier aussi les identifiants (user_id, produit_id…)');
corps.append(verrou);
Object.keys(r).forEach(k=>{
const v=r[k];
if(table==='produits'&&k==='photos') return; // géré avec la photo principale
// Photos : zone avec « Changer » / « Supprimer »
if(estChampImage(k,v)||(table==='produits'&&k==='photo')){
let urls=[v];
let multiple=false;
if(table==='produits'&&k==='photo'){
multiple=true;
try{const extra=JSON.parse(r.photos||'[]');if(Array.isArray(extra)) urls=urls.concat(extra.filter(u=>typeof u==='string'));}catch(e){}
}
const w=creerPhotos(urls.slice(0,3),multiple,3);
photos.push({cle:k,multiple,w});
corps.append(h('div',{class:'champ'},h('label',null,multiple?'photos du produit (3 maximum)':k),w.elem));
return;
}
const g=genreChamp(v);
let saisie;
const cfg=(CHOIX[table]||{})[k];
if(cfg){
saisie=creerChoix(cfg,v);
champs[k]={saisie,g:'choix',initial:v};
}else if(table==='produits'&&k==='prix'){
saisie=creerPrix(v);
champs[k]={saisie,g:'prix',initial:v};
}else{
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
}
corps.append(h('div',{class:'champ'},h('label',null,k),saisie));
});
majVerrous();
}
function estVerrouille(k){return SANS_MODIF.includes(k)||(!deverrouille&&(k==='user_id'||k.endsWith('_id')));}
function majVerrous(){
Object.keys(champs).forEach(k=>{
const c=champs[k];
if(c.g==='choix'||c.g==='prix') return;
const s=c.saisie;
const v=estVerrouille(k);
if(s.tagName==='SELECT') s.disabled=v; else s.readOnly=v;
});
}
function valeur(k){
const {saisie,g,initial}=champs[k];
if(g==='choix') return saisie.valeurChoix();
if(g==='prix') return saisie.valeurPrix();
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
bSauver.disabled=true;
const s=await session();
const nouvelles=[];     // fichiers envoyés pendant cet enregistrement
const anciennes=[];     // fichiers remplacés ou supprimés
for(const z of photos){
if(!z.w.modifie()) continue;
try{
const urls=[];
for(const it of z.w.items()){
if(it.blob){
const u=await televerserPhotoAdmin(it.blob,it.mini,s);
it.url=u;
nouvelles.push(u);
}
urls.push(it.url);
}
if(z.multiple){
modifs.photo=urls[0]||null;
const extras=urls.slice(1);
if(extras.length||('photos' in r)) modifs.photos=JSON.stringify(extras);
}else{
modifs[z.cle]=urls[0]||null;
}
z.w.initial.forEach(u=>{if(u&&!urls.includes(u)) anciennes.push(u);});
}catch(e){
await supprimerFichiers(nouvelles,s);
toast('Envoi de la photo impossible ('+(e.message||'erreur')+'). Les droits photos de l\'administrateur sont-ils activés ?',true);
bSauver.disabled=false;
return;
}
}
if(!Object.keys(modifs).length){toast('Aucun changement.');bSauver.disabled=false;return;}
try{
const r2=await api(table+'?'+pk+'=eq.'+encodeURIComponent(r[pk]),{methode:'PATCH',corps:modifs,entetes:{Prefer:'return=representation'}});
if(!r2.ok){const t=await r2.text();throw new Error(t.slice(0,160));}
const res=await r2.json();
if(!res.length){await supprimerFichiers(nouvelles,s);toast('Rien n\'a été modifié : droits administrateur manquants ?',true);bSauver.disabled=false;return;}
Object.assign(r,res[0]);
const i=etat.lignes.findIndex(x=>cle(table,x)&&x[pk]===r[pk]);
if(i>=0) etat.lignes[i]=Object.assign(etat.lignes[i],res[0]);
await supprimerFichiers(anciennes,s);
toast('Enregistré');
fermerFiche();
if(etat.table===table) majLignes();
}catch(e){
await supprimerFichiers(nouvelles,s);
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
h('div',{class:'fiche-entete'},h('button',{onclick:fermerFiche,'aria-label':'Retour'},'←'),h('h2',null,re.titre)),
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
if(ok){
dessinerOnglets();
// ouverture depuis une notification : admin.html?onglet=produits
let cible=null;
try{cible=new URLSearchParams(location.search).get('onglet');}catch(e){}
if(cible&&(cible==='support'||TABLES[cible])){history.replaceState(null,'',location.pathname);ouvrirOnglet(cible,'','',true);}
else tableauDeBord();
majNouveaux();
setInterval(()=>{if(document.visibilityState==='visible') majNouveaux();},20000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible') majNouveaux();});
majBoutonNotif();
document.getElementById('notif-admin').addEventListener('click',activerNotifAdmin);
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',ev=>{if(ev.data&&ev.data.onglet) ouvrirOnglet(ev.data.onglet);});
}
})();
// Bouton ← en haut et touche retour du téléphone : on revient à l'écran précédent au lieu de quitter l'administration
document.getElementById('retour-haut').addEventListener('click',()=>{retourInterne();});
try{history.pushState({admin:1},'');}catch(e){}
window.addEventListener('popstate',()=>{
if(retourInterne()){try{history.pushState({admin:1},'');}catch(e){}}
});
