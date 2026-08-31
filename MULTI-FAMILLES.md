# Architecture multi-familles

Cette évolution est développée exclusivement sur la branche `multi-familles` et utilise le projet Firebase de test `ptit-vestiaire-multifamilles`.

## Configuration

Le fichier `.env.multi-familles` est ignoré par Git. Lance le front avec `npm run dev -- --mode multi-familles` pour charger cette configuration. `src/firebase/config.ts` lit déjà les variables `import.meta.env.VITE_FIREBASE_*`.

## Données

`familles/{familleId}` contient `nom`, `dateCreation`, `proprietaireUserId` et `enfants`. `utilisateurs/{uid}` contient l'email, les liens `{ familleId, role }` et le champ technique `familleIds`, utilisé par les règles Firestore pour vérifier rapidement l'appartenance. Chaque document `vetements` et `mouvements` porte `familleId`.

Les règles refusent l'accès aux vêtements, mouvements et familles dont l'identifiant n'appartient pas à `utilisateurs/{uid}.familleIds`. Le champ `familleIds` est une dénormalisation de la liste de liens : il ne remplace pas les rôles.

Les lectures de catalogue et de mouvements appliquent également ce filtre côté client Firestore, et toutes les nouvelles écritures portent `familleId`. Un index `familleId + nom` est fourni pour le catalogue.

## Invitation et migration future

Les invitations devront être représentées par une collection à durée de vie courte (code aléatoire, `familleId`, créateur et expiration), puis consommées par une Cloud Function authentifiée qui ajoute le lien `invite` au document utilisateur. Aucun compte ni donnée de production n'est migré sur cette branche. Une migration ultérieure devra créer une famille pour le foyer existant, ajouter son propriétaire dans `utilisateurs`, puis renseigner `familleId` sur `vetements` et `mouvements` par lots vérifiés avant tout déploiement.
