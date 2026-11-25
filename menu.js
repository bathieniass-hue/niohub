// Écran « menu » : uniquement du HTML, aucune logique.
// Les boutons déclarent leur intention avec data-action (voir liaisons.js).
(window.Ecrans=window.Ecrans||{})['menu']=`<nav id="menu">
<button data-action="accueil"><span class="nav-ic" style="--i:0" aria-hidden="true"></span>Accueil</button>
<button data-action="boutique"><span class="nav-ic" style="--i:1" aria-hidden="true"></span>Boutique<span class="pastille-nav" data-compteur="boutiqueNav" style="display:none"></span></button>
<button data-action="profil"><span class="nav-ic" style="--i:2" aria-hidden="true"></span>Profil</button>
</nav>
`;
