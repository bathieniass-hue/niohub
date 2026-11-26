# NioHub : guide du projet

## Principe
Trois couches, chacune dans ses propres fichiers. On peut changer l'une sans toucher aux autres.

| Couche | Fichiers | Contient | Ne contient jamais |
|---|---|---|---|
| Écrans | `ecran-*.js`, `style.css` | du HTML et du style | de logique, d'appel serveur |
| Liaisons | `ecran-liaisons.js` | « ce bouton appelle cette fonction » | du HTML, de calcul |
| Données | `donnees-*.js`, `config.js` | tous les échanges avec Supabase | d'affichage |
| Moteur | `app.js`, `commande.js`, `boutique.js`, ... | les règles et le déroulement | d'appel direct à Supabase |

À venir (étape 3) : séparer, dans chaque fichier du moteur, la logique de l'affichage.

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
