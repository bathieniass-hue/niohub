# NioHub : guide du projet

## Principe
Trois couches, chacune dans ses propres fichiers. On peut changer l'une sans toucher aux autres.

| Couche | Fichiers | Contient | Ne contient jamais |
|---|---|---|---|
| Écrans | `ecran-*.js`, `style.css` | du HTML et du style | de logique, d'appel serveur |
| Liaisons | `ecran-liaisons.js` | « ce bouton appelle cette fonction » | du HTML, de calcul |
| Données | `donnees-*.js`, `config.js` | tous les échanges avec Supabase | d'affichage |
| Moteur | `app.js`, `commande.js`, `boutique.js`, ... | les règles et le déroulement | d'appel direct à Supabase |

Étape 3 en cours : séparer, dans chaque fichier du moteur, la logique de l'affichage.
- Fait : `favoris.js` (logique seule). Le dessin du cœur est dans `ecran-fiche.js` + `style.css`, le clic dans `ecran-liaisons.js` (action `favori`).
- Fait : `statut.js` (logique seule). L'affichage du détail d'une commande est dans `ecran-statut.js` (fonction `vueCommandeVendeur`), le clic dans `ecran-liaisons.js` (action `statut`).
- Fait : `vitrine.js` (logique seule). L'affichage est dans `ecran-vitrine.js` (fonctions `vueVitrine`, `vueVitrineMessage`), le style `.vitrine-…` dans `style.css`, le clic ← dans `ecran-liaisons.js` (action `fermerVitrine`).
- Fait : `bandeau.js` (logique seule : durée, fermeture, clavier). Les éléments sont construits dans `ecran-bandeau.js` (`vueBandeau`, `vueConfirmation`, `vueZoneBandeaux`).
- Fait : `achats.js` (logique seule). L'affichage est dans `ecran-achats.js` (`vueAchats`, `vueAchatsListe`, `vueAchatDetail`…), les clics dans `ecran-liaisons.js` (actions `achatDetail`, `achatsListe`, `retourAchats`, `avisAchat`, `annulerAchat`).
- Fait : `raccourcis.js` (logique seule). L'affichage (raccourcis, filtres, fenêtre Catégories, page Favoris) est dans `ecran-raccourcis.js`, le style dans `style.css`, les clics dans `ecran-liaisons.js` (actions `conversations`, `favoris`, `categories`, `categorie`, `categorieModal`).
- Fait : `avis.js` (logique seule : calcul des notes, publication, modification). L'affichage (encadré boutique, page Avis, formulaire) est dans `ecran-avis.js`, le style des étoiles dans `style.css`, les clics dans `ecran-liaisons.js` (actions `avis`, `retourAvis`, `etoile`, `avisPublier`…).
- Fait : `parametres.js` (logique seule) → affichage dans `ecran-parametres.js` (`vueParametres`), clic action `theme`.
- Fait : `boutique-fiche.js` (logique seule) → affichage dans `ecran-avis-recus.js` (`vueNoteBoutique`, `vueAvisRecus…`), clic action `avisRecus`.
- Reste : `app.js`, `messages.js`, `notifications.js` et les autres, un par un.
- Écran qui dépend de données : une fonction `vue…` dans `ecran-<nom>.js` reçoit des données prêtes et rend le HTML (elle peut utiliser `esc`). Le moteur l'appelle.
- Méthode : le moteur ne fabrique plus de HTML ni de style ; il change seulement des classes (ex. `actif`) ou du texte, et le style est dans `style.css`.

## Je veux modifier...
- **Le design d'un écran** : `ecran-<nom>.js` (HTML) et `style.css`.
- **Ce qu'un bouton déclenche** : `ecran-liaisons.js`.
- **Un échange avec le serveur** : le fichier `donnees-<sujet>.js` correspondant.
- **L'adresse du serveur ou un réglage global** : `config.js`.

## Règles pour ne rien casser
1. **Tous les fichiers sont à la racine**, sans dossier (l'envoi GitHub sur téléphone ne garde pas les dossiers). On sépare par le nom : `ecran-`, `donnees-`.
2. **Deux fichiers ne portent jamais le même nom.**
3. **Un nouveau fichier JS** se déclare à trois endroits : `index.html` (balise script), `sw.js` (liste FICHIERS) et, s'il définit une fonction importante, `diagnostic.js` (liste ATTENDUS).
4. **Une modification à la fois**, puis test, puis envoi suivant.

## Mettre en ligne
1. Envoyer **seulement les fichiers modifiés** (Add file → Upload files, tous à plat), puis Commit.
2. À chaque livraison, changer le numéro de version **à un seul endroit** : la ligne `NIOHUB_VERSION` de `version.js` (sw.js et pwa.js la lisent). Sans cela, les téléphones gardent d'anciennes copies.
3. Attendre 1 à 2 minutes, recharger deux fois.
4. Si une barre rouge apparaît en haut : elle nomme le fichier absent ou ancien. Le renvoyer.

## Revenir en arrière
GitHub garde tout l'historique : onglet Commits, ouvrir le dernier envoi, bouton **Revert**. Rien n'est jamais perdu.

## Bonne pratique
Garder un second site de test (copie du dépôt avec GitHub Pages) : on y envoie d'abord, on vérifie, puis on envoie sur le vrai site.
