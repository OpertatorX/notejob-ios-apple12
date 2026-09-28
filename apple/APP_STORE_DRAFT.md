# App Store Connect — NoteJob V0.5

## Identité produit

- **Nom candidat** : NoteJob
- **Bundle provisoire** : `com.operatorx.notejob`
- **Sous-titre FR** : `Les entreprises vues de l’intérieur`
- **Sous-titre EN** : `Workplaces from the inside`
- **Catégorie principale** : Business
- **Catégorie secondaire** : Productivity
- **Prix** : Gratuit
- **Achats intégrés** : Aucun
- **Publicité** : Oui
- **Plateformes** : iPhone + iPad

> Le nom NoteJob reste à revérifier une dernière fois dans App Store Connect / marques avant création définitive de la fiche. Une recherche web rapide n’a pas fait ressortir d’app iOS actuelle exactement appelée « NoteJob », mais cela ne constitue pas une recherche juridique de marque.

## Proposition de description FR

**NoteJob permet de consulter l’expérience de travail dans un établissement précis, ville par ville.**

Recherchez une entreprise et sa ville, sélectionnez le bon établissement, puis consultez les évaluations agrégées des personnes qui y travaillent ou y ont travaillé.

Les évaluations portent sur :
- le management ;
- le salaire et les avantages ;
- l’ambiance ;
- l’équilibre entre vie professionnelle et vie personnelle ;
- les possibilités d’évolution ;
- la recommandation de l’établissement.

Aucun nom ni profil public n’est associé aux évaluations. NoteJob ne publie pas de commentaires libres dans cette version : les résultats sont structurés et présentés sous forme de statistiques agrégées.

Les établissements français sont identifiés grâce aux données publiques de l’Annuaire des Entreprises. Les notes sont liées à l’établissement exact, notamment via son SIRET et sa ville, afin d’éviter de mélanger des expériences provenant de sites différents d’une même enseigne.

Vous pouvez modifier ou supprimer votre propre évaluation tant que votre session anonyme reste disponible sur votre appareil.

Les évaluations reflètent des expériences et opinions individuelles et ne constituent pas des faits vérifiés sur les employeurs.

## Mots-clés FR — brouillon

`entreprise,travail,emploi,salaire,management,avis,employeur,ambiance,carrière,job`

## Promotional text FR

Découvrez ce que les salariés pensent réellement de leur établissement : management, salaire, ambiance, équilibre et évolution, ville par ville.

## Review Notes Apple

NoteJob is a structured workplace-rating utility for French establishments.

1. Search uses the public French “Annuaire des Entreprises” API. The user enters both a company/brand name and a city/postal code to identify a specific establishment.
2. Reading aggregated scores does not require a named account.
3. When a user publishes a rating, the app creates a Supabase anonymous authentication session. The app does not request the employee’s name, email address or public profile.
4. Public users never see individual rating rows. They only see aggregate averages, rating count and recommendation percentage.
5. There is no public free-text review or user-to-user communication in version 1.0.
6. Users can edit or delete their own rating from the same establishment page.
7. Incorrect establishment data can be reported using predefined reasons. Reports are private and only accessible to the developer in the backend moderation workflow.
8. Ads are provided through Google Mobile Ads with UMP consent handling. Final production IDs will be used in the submitted build.

## App Privacy — à finaliser après build AdMob

### Données liées à la fonctionnalité
- Identifiant utilisateur pseudonyme Supabase : fonctionnalité, anti-abus et gestion de sa propre évaluation.
- Interaction produit : uniquement si une solution analytics est ajoutée ultérieurement. Aucune analytics maison dans V0.5.

### Publicité
Revalider les catégories exactes déclarées par Google Mobile Ads / UMP au moment de la soumission finale : identifiant appareil, données d’utilisation, diagnostics et publicité tierce selon la configuration effective.

### Tracking
V0.5 ne demande pas ATT et force les requêtes AdMob en non-personnalisé. Revalider la déclaration App Privacy avec le comportement du SDK et la configuration AdMob de production.

## URLs nécessaires

À renseigner après déploiement du dossier `site/` :
- Privacy Policy URL : `/privacy.html`
- Support URL : `/support.html`
- Terms : `/terms.html` (également accessible dans l’app)

## Âge / contenu

- Aucun contenu utilisateur textuel public en V1.
- Notes structurées uniquement.
- Pas de messagerie.
- Pas de contenu violent/sexuel/jeu d’argent.
- Publicité tierce : oui.

## Checklist soumission

- [ ] Anonymous Sign-Ins activé dans Supabase
- [ ] Test multi-appareils réussi
- [ ] IDs AdMob production
- [ ] UMP configuré dans AdMob Privacy & messaging
- [ ] app-ads.txt publié sur domaine final
- [ ] EAS projectId renseigné
- [ ] Build production installé/testé
- [ ] Site public déployé
- [ ] App Privacy finalisée selon build réel
- [ ] Screenshots iPhone/iPad issus du vrai build
- [ ] Nom NoteJob revérifié avant création définitive de la fiche
