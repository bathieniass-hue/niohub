// Mes achats : logique seulement (chargement, annulation, avis, contact vendeur).
// L'affichage : ecran-achats.js (vueAchats…). Les clics : ecran-liaisons.js (actions achatDetail, achatsListe, retourAchats, avisAchat, annulerAchat).
const PAGE_ACHATS='achats-page';
const PAGE_ACHAT_DETAIL='achats-detail';
let achatsCache=[];
let origineAchats='accueil';

const montrerAvantAchats=montrer;
montrer=function(vue){
  [PAGE_ACHATS,PAGE_ACHAT_DETAIL].forEach(id=>{const el=document.getElementById(id);if(el&&id!==vue) el.style.display='none';});
  montrerAvantAchats(vue);
};

function pageAchats(id){
  let p=document.getElementById(id);
  if(!p){
    p=document.createElement('div');
    p.id=id;
    p.className='page';
    document.body.appendChild(p);
  }
  return p;
}

function afficherPageAchats(id){
  montrer(id);
  const el=document.getElementById(id);
  if(el) el.style.display='block';
  window.scrollTo(0,0);
}

function retourListeAchats(){
  afficherPageAchats(PAGE_ACHATS);
}

function retourAchats(){
  montrer(origineAchats==='profil'?'profil':'accueil');
}

function couleurStatut(st){
  if(st==='Livrée') return '#0E6B47';
  if(st==='Expédiée') return '#1B5FA8';
  if(st==='Annulée') return '#B4291A';
  return '#B4541A';
}

function achatParId(id){
  return achatsCache.find(c=>String(c.id)===String(id))||null;
}

async function voirAchats(){
  origineAchats=(typeof vueCourante!=='undefined'&&vueCourante==='profil')?'profil':'accueil';
  const s=await sessionValide();
  if(!s||!s.user_id){bandeau('Connectez-vous dans Profil.');montrer('profil');return;}
  const p=pageAchats(PAGE_ACHATS);
  p.innerHTML=vueAchats();
  afficherPageAchats(PAGE_ACHATS);
  try{
    const r=await Donnees.commandes.deAcheteur(s);
    if(!r.ok) throw new Error(r.status);
    achatsCache=await r.json();
    document.getElementById('liste-achats').innerHTML=vueAchatsListe({achats:achatsCache.map(c=>{
      const st=c.statut||'À préparer';
      return {id:c.id,produit:c.produit,quantite:c.quantite,date:new Date(c.created_at).toLocaleDateString('fr-FR'),statut:st,couleur:couleurStatut(st)};
    })});
  }catch(e){
    document.getElementById('liste-achats').innerHTML=vueAchatsErreur();
  }
}

async function telephoneVendeur(commande){
  try{
    // 1) La boutique exacte de la commande (si la colonne boutique_id existe)
    if(commande.boutique_id){
      const r=await Donnees.boutiques.telephoneParId(commande.boutique_id);
      if(r.ok){
        const l=await r.json();
        if(l[0]&&l[0].telephone) return l[0].telephone;
      }
    }
    // 2) Repli : la boutique la plus récente du vendeur (plus fiable que la plus ancienne)
    if(commande.vendeur_id){
      const r=await Donnees.boutiques.telephoneParVendeur(commande.vendeur_id);
      if(!r.ok) return '';
      const l=await r.json();
      return (l[0]&&l[0].telephone)||'';
    }
    return '';
  }catch(e){return '';}
}

// Resynchronise un seul achat (statut à jour, sans recharger toute la liste)
async function rafraichirAchat(id){
  const s=await sessionValide();
  if(!s||!s.user_id) return;
  try{
    const r=await Donnees.commandes.statutPourAcheteur(s,id);
    if(!r.ok) return;
    const l=await r.json();
    if(!l[0]) return;
    const c=achatParId(id);
    if(c) c.statut=l[0].statut;
  }catch(e){}
}

function voirAchatDetail(id){
  const c=achatParId(id);
  if(!c) return;
  const st=c.statut||'À préparer';
  const total=c.total?Number(c.total).toLocaleString('fr-FR')+' FCFA':'Non indiqué';
  const lignes=[
    ['Produit',c.produit],
    ['Quantité',String(c.quantite)],
    ['Total',total],
    ['Paiement',c.paiement||'Non indiqué'],
    ['Adresse de livraison',c.adresse||'Non indiquée'],
    ['Statut',st],
    ['Date',new Date(c.created_at).toLocaleString('fr-FR')]
  ].map(([k,v])=>({k:k,v:v,couleur:k==='Statut'?couleurStatut(st):''}));
  const p=pageAchats(PAGE_ACHAT_DETAIL);
  p.innerHTML=vueAchatDetail({id:c.id,lignes:lignes,peutAvis:st==='Livrée',peutAnnuler:st==='À préparer'});
  afficherPageAchats(PAGE_ACHAT_DETAIL);
  telephoneVendeur(c).then(t=>vueContactVendeur(t?lienWhatsapp(t):''));
}

function donnerAvisAchat(id){
  const c=achatParId(id);
  if(!c) return;
  avisVendeurCourant=c.vendeur_id;
  voirAvis();
}

async function annulerAchat(id){
  const c=achatParId(id);
  if(!c) return;
  if(!(await confirmer('Votre commande de « '+(c.produit||'')+' » sera annulée et le vendeur sera prévenu.',{titre:'Annuler cet achat ?',ok:'Annuler l\'achat',danger:true}))) return;
  const s=await sessionValide();
  if(!s||!s.user_id){bandeau('Connectez-vous dans Profil.');return;}
  try{
    const r=await Donnees.commandes.annulerAchat(s,c.id);
    if(!r.ok) throw new Error(r.status);
    const ok=await r.json();
    if(ok===true){
      c.statut='Annulée';
      bandeau('Achat annulé');
      voirAchatDetail(id); // reste sur le détail, statut à jour
    }else{
      // Le serveur dit non (déjà expédié) : on resynchronise pour que le bouton disparaisse
      await rafraichirAchat(id);
      bandeau('Cet achat ne peut plus être annulé : le vendeur l\'a déjà expédié.','erreur');
      voirAchatDetail(id);
    }
  }catch(e){
    bandeau('Annulation impossible. Vérifiez votre connexion.','erreur');
  }
}
