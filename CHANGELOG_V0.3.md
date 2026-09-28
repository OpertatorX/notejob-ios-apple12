# NoteJob V0.3

- Backend Supabase durci : privilèges SQL + RLS + RPC contrôlées.
- Anonymous Auth conservée, sans compte nominatif.
- Une note par utilisateur anonyme + SIRET.
- Modification et suppression de sa propre note depuis l'app.
- Préremplissage automatique du formulaire lors d'une modification.
- Limite de 20 nouvelles notes / 24h / identité anonyme.
- Signalement structuré d'un établissement rendu fonctionnel.
- Table privée `establishment_reports`.
- L'écran Réglages affiche clairement mode cloud vs mode local.
- Texte d'anonymat rendu plus exact : aucun nom/profil public, sans promettre un anonymat absolu.
