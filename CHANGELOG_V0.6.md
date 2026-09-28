# NoteJob V0.6 — refonte DA finale

Refonte complète de l'interface à partir de la direction visuelle validée le 17 septembre 2026.

## Direction visuelle

- fond ivoire / papier clair `#F8F5ED` ;
- vert éditorial profond `#0A5B43` ;
- grands titres serif type magazine ;
- UI mobile claire, premium et chaleureuse ;
- champs et CTA légèrement arrondis uniquement lorsqu'ils ont une fonction ;
- suppression de l'ancienne DA orange/noire ;
- fiches entreprises construites autour d'un hero visuel, d'un gros score et de barres de critères ;
- écran de notation remis au même niveau de finition.

La maquette choisie par l'utilisateur est conservée dans `design/selected-reference.png`.

## Produit

- recherche volontaire : l'app ne lance plus une requête à chaque lettre ;
- champ ville vide au lancement (`Ville ou code postal`) ;
- exemples populaires uniquement comme raccourcis facultatifs ;
- navigation Accueil / Rechercher / Favoris / Profil ;
- favoris locaux fonctionnels ;
- fiche entreprise avec favori, note globale, recommandation et détails ;
- flux de notation 7 étapes redesigné ;
- Supabase, Anonymous Auth, SIRET/SIREN, signalements et AdMob/UMP conservés.

## Backend

Aucune migration backend n'est requise entre V0.5 et V0.6. Le projet Supabase existant reste compatible.
