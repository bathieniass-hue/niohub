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
  p.innerHTML=`<header><button class="retour" onclick="retourAchats()">←</button><span style="font-weight:bold;font-size:20px">Mes achats</span><span></span></header><div id="liste-achats" class="liste" style="margin-top:0">Chargement…</div>`;
  afficherPageAchats(PAGE_ACHATS);
  try{
    const r=await Donnees.commandes.deAcheteur(s);
    if(!r.ok) throw new Error(r.status);
    achatsCache=await r.json();
    document.getElementById('liste-achats').innerHTML=achatsCache.length
      ?achatsCache.map(c=>{
        const st=c.statut||'À préparer';
        return `<div class="ligne" style="cursor:pointer" data-id="${esc(String(c.id))}"><div style="flex:1"><div class="name">${esc(c.produit)} × ${esc(c.quantite)}</div><div style="font-size:12px;color:#6B6254">${esc(new Date(c.created_at).toLocaleDateString('fr-FR'))}</div></div><span style="font-size:12px;font-weight:bold;color:${couleurStatut(st)}">${esc(st)}</span><span style="margin-left:6px">›</span></div>`;
      }).join('')
      :"Vous n'avez pas encore passé de commande.";
    // On branche les clics sur data-id (pas de onclick inline)
    document.querySelectorAll('#liste-achats .ligne[data-id]').forEach(el=>{
      el.addEventListener('click',()=>voirAchatDetail(el.getAttribute('data-id')));
    });
  }catch(e){
    document.getElementById('liste-achats').innerHTML='Erreur de chargement. Vérifiez votre connexion. <button class="auth-lien" style="width:auto;margin:0 0 0 6px" onclick="voirAchats()">Réessayer</button>';
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
  ];
  const p=pageAchats(PAGE_ACHAT_DETAIL);
  p.innerHTML=`<header><button class="retour" onclick="afficherPageAchats('${PAGE_ACHATS}')">←</button><span style="font-weight:bold;font-size:18px">Achat</span><span></span></header>
<div class="liste" style="margin-top:0">${lignes.map(([k,v])=>`<div style="padding:8px 0;border-bottom:1px solid #EDE5D3"><div style="font-size:12px;color:#6B6254">${esc(k)}</div><div style="font-size:15px;font-weight:bold;color:${k==='Statut'?couleurStatut(st):'#1E1A14'}">${esc(v)}</div></div>`).join('')}</div>
<div style="font-size:12px;color:#6B6254;margin-top:8px">Le paiement se règle directement avec le vendeur, à la livraison ou par Wave / Orange Money.</div>
<a id="ach-wa" class="btn2" style="display:block;text-align:center;text-decoration:none;line-height:52px;margin-top:14px" href="#" target="_blank" rel="noopener">Contacter le vendeur</a>
${st==='Livrée'?`<button class="btn" style="margin-top:12px" onclick="donnerAvisAchat('${c.id}')">Donner un avis</button>`:''}
${st==='À préparer'?`<button class="btn2" style="margin-top:12px;color:#B4291A;border-color:#B4291A" onclick="annulerAchat('${c.id}')">Annuler cet achat</button><div style="font-size:12px;color:#6B6254;margin-top:6px">Vous pouvez annuler tant que le vendeur n'a pas expédié la commande.</div>`:''}`;
  afficherPageAchats(PAGE_ACHAT_DETAIL);
  telephoneVendeur(c).then(t=>{
    const a=document.getElementById('ach-wa');
    if(!a) return;
    if(t){
      a.href=lienWhatsapp(t);
    }else{
      a.textContent='Numéro du vendeur indisponible';
      a.style.opacity='.5';
      a.removeAttribute('target');
    }
  });
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
