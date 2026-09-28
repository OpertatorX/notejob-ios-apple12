# NoteJob V2.2 — Search Fix

Cette version conserve l'interface V2.1 et corrige le moteur Entreprise + Ville, notamment pour Paris, Lyon et Marseille.

À tester en priorité :

- ABATEC + Paris
- Super U + Pontarlier
- recherche par code postal
- ouverture d'une entreprise puis notation

Le moteur `employer-search` reste prioritaire, avec fallback automatique vers l'API officielle Recherche d'Entreprises si le resolver ne renvoie aucun candidat.
