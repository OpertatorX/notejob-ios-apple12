# NoteJob — APP STORE READY 1.0

## Identité
- Nom : NoteJob
- Bundle ID : `com.operatorx.notejob`
- SKU : `NOTEJOB-IOS-001`
- Version : `1.0.0`
- Build initial : `1` (EAS remote autoIncrement ensuite)
- Langue principale : Français
- Catégorie principale : Business
- Catégorie secondaire : Productivity
- Prix : Gratuit
- Achats intégrés : Aucun
- Publicité : Oui
- iPhone : Oui
- iPad : Oui
- Mac / Vision Pro : Non
- Disponibilité : Monde

## Sous-titre FR
Les entreprises vues de l’intérieur

## Texte promotionnel FR
Découvrez ce que les salariés pensent de leur entreprise : management, salaire, ambiance, équilibre et évolution, établissement par établissement.

## Description FR
NoteJob permet de consulter l’expérience de travail dans une entreprise précise, ville par ville.

Recherchez une entreprise et sa ville, sélectionnez le bon établissement, puis consultez les évaluations agrégées des personnes qui y travaillent ou y ont travaillé.

Les évaluations portent sur le management, le salaire et les avantages, l’ambiance, l’équilibre vie professionnelle / vie personnelle, les possibilités d’évolution et la recommandation de l’entreprise.

Aucun nom ni profil public n’est associé aux évaluations. NoteJob ne publie pas de commentaires libres dans cette version : les résultats sont structurés et présentés sous forme de statistiques agrégées.

Les entreprises françaises sont identifiées grâce aux données publiques de l’Annuaire des Entreprises. Les notes sont liées à l’établissement exact afin d’éviter de mélanger des expériences provenant de sites différents d’une même enseigne.

Vous pouvez modifier ou supprimer votre propre évaluation tant que votre session anonyme reste disponible sur votre appareil.

Les évaluations reflètent des expériences et opinions individuelles et ne constituent pas des faits vérifiés sur les employeurs.

## Mots-clés FR
entreprise,travail,emploi,salaire,management,avis,employeur,ambiance,carrière,job

## URLs
- Marketing : `${SITE_URL}`
- Support : `${SITE_URL}/support.html`
- Confidentialité : `${SITE_URL}/privacy.html`
- Conditions : `${SITE_URL}/terms.html`
- app-ads.txt : `${SITE_URL}/app-ads.txt`

## Review Notes
NoteJob is a structured workplace-rating utility for French establishments.

1. Search uses the public French Annuaire des Entreprises API. The user enters a company/brand name and a city/postal code to identify a specific establishment.
2. Reading aggregated scores does not require a named account.
3. Publishing a rating creates a Supabase anonymous authentication session. The app does not request the employee’s name, email address or public profile.
4. Public users never see individual rating rows. They only see aggregate averages, rating count and recommendation percentage.
5. There is no public free-text review or user-to-user communication in version 1.0.
6. Users can edit or delete their own rating from the establishment page.
7. Incorrect establishment data can be reported using predefined reasons. Reports are private.
8. Ads use Google Mobile Ads with UMP consent handling. Production ad unit IDs are embedded only in the production build. Requests are non-personalized.

## App Privacy — saisie manuelle finale
À revalider dans App Store Connect d’après le build final et la documentation Google Mobile Ads. Base de travail : emplacement approximatif, identifiant appareil, interaction produit, données publicitaires, pannes et performance. Ne déclarer le suivi que si le comportement réel du build l’exige.

## Âge
Tout Non sauf publicité tierce = Oui.
