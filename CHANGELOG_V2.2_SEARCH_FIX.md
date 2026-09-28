# NoteJob V2.2 — Search Fix

## Correctif principal

La recherche `Entreprise + Ville` ne rejettera plus les entreprises situées dans les arrondissements de Paris, Lyon et Marseille.

Cause : `geo.api.gouv.fr` résout la ville mère (ex. Paris = 75056), tandis que SIRENE utilise des codes d'arrondissement pour les établissements (ex. Paris 15 = 75115). Le filtre strict par `code_commune` supprimait donc des résultats valides.

## Modifications

- Paris : recherche officielle limitée au département 75 puis filtrage par codes postaux 75001–75020.
- Lyon : même logique pour le département 69 et les codes postaux lyonnais.
- Marseille : même logique pour le département 13 et les codes postaux marseillais.
- L'Edge Function `employer-search` utilise la même logique.
- La preview locale bascule maintenant sur le moteur officiel si le resolver retourne zéro candidat au lieu d'afficher directement `Aucun résultat`.
- Correction d'une duplication accidentelle de la déclaration `normalize()` dans la source locale de l'Edge Function.
- Aucun changement de DA : l'interface V2.1 est conservée.

## Cas de contrôle

`ABATEC + Paris` doit pouvoir retrouver notamment le SIRET `49231967800016`, situé 19 rue Auguste Chabrières, 75015 Paris.
