# Architecture multi-familles

Cette évolution est développée exclusivement sur la branche `multi-familles` et utilise le projet Firebase de test `ptit-vestiaire-multifamilles`.

## Configuration

Le fichier `.env.multi-familles` est ignoré par Git. Lance le front avec `npm run dev -- --mode multi-familles` pour charger cette configuration. `src/firebase/config.ts` lit déjà les variables `import.meta.env.VITE_FIREBASE_*`.

## Données

Les inscriptions email/mot de passe déclenchent l'email de vérification natif de Firebase Authentication. Tant que l'adresse n'est pas validée, le frontend bloque la configuration familiale et les règles Firestore/Storage refusent tout accès aux données. Les comptes Google disposent déjà d'une adresse vérifiée et poursuivent directement le parcours. Le modèle Firebase **Authentication → Templates → Vérification de l'adresse email** doit utiliser comme URL d'action personnalisée l'URL publique de l'application : le gestionnaire intégré traite alors le code et redirige automatiquement vers la configuration de la famille.

Le lien « Mot de passe oublié ? » envoie l'email natif Firebase. Le modèle **Authentication → Templates → Réinitialisation du mot de passe** doit lui aussi utiliser l'URL publique de l'application comme URL d'action personnalisée : PtitVestiaire vérifie alors le code, demande deux fois le nouveau mot de passe puis ramène l'utilisateur à la connexion. Un utilisateur email connecté peut également modifier son mot de passe dans Réglages après avoir ressaisi le mot de passe actuel. Les comptes Google gèrent leur mot de passe chez Google.

Les pages publiques « Qui sommes-nous ? », FAQ, conditions d'utilisation, confidentialité, cookies et mentions légales sont accessibles depuis le pied de page. L'éditeur est identifié uniquement par les informations sociales publiques d'INOPIA GROUP : SAS au capital de 100 €, 990 843 807 R.C.S. Paris, siège social au 60 rue François Ier, 75008 Paris, `contact@inopia.fr`, 06 21 34 45 67. Les noms et domiciles personnels des dirigeants ne sont ni affichés ni stockés dans le projet. Le service étant gratuit et sans achat, il utilise des CGU ; des CGV ne deviendraient nécessaires qu'avant la commercialisation d'une offre payante.

La racine du site affiche une landing page statique aux visiteurs déconnectés. Les routes `#inscription` et `#connexion` ouvrent l'authentification existante ; une session déjà ouverte rejoint automatiquement `#dashboard`. La branche contient désormais le parcours Stripe en mode test et les quotas serveur. Le passage en clés live reste conditionné à la validation des prix, des emails transactionnels et des documents contractuels.

`familles/{familleId}` contient `nom`, `dateCreation`, `proprietaireUserId` et `enfants`. `utilisateurs/{uid}` contient l'email, les liens `{ familleId, role }` et le champ technique `familleIds`, utilisé par les règles Firestore pour vérifier rapidement l'appartenance. Chaque document `vetements` et `mouvements` porte `familleId`.

Les règles refusent l'accès aux vêtements, mouvements, réglages et familles dont l'identifiant n'appartient pas à `utilisateurs/{uid}.familleIds`. Le champ `familleIds` est une dénormalisation de la liste de liens : il ne remplace pas les rôles. Les modifications d'appartenance sont limitées à la création atomique d'une famille, à la consommation d'un code d'invitation précis ou au retrait par le propriétaire.

Les lectures de catalogue et de mouvements appliquent également ce filtre côté client Firestore, et toutes les nouvelles écritures portent `familleId`. Un index `familleId + nom` est fourni pour le catalogue.

Les photos sont stockées sous `familles/{familleId}/sorties/{uid}/{fichier}`. Les règles Storage consultent l'appartenance dans `familles/{familleId}/membres/{uid}`. Sur un nouveau projet Firebase, cette lecture interservice exige d'accorder au compte de service Storage le rôle IAM **Firebase Rules Firestore Service Agent** ; la console Firebase propose cette autorisation lors de la publication des règles.

Le script `node scripts/test-isolation-multifamilles.mjs` crée deux comptes et familles temporaires, vérifie les accès légitimes, puis tente des lectures/écritures croisées qui doivent être refusées.

## Invitation et migration future

Les invitations sont des documents à code aléatoire lus uniquement par identifiant exact. Leur consommation ajoute atomiquement le lien `invite`, crée le membre et supprime le code. Aucun compte ni donnée de production n'est migré sur cette branche. Une migration ultérieure devra créer une famille pour le foyer existant, ajouter son propriétaire dans `utilisateurs`, puis renseigner `familleId` sur `vetements` et `mouvements` par lots vérifiés avant tout déploiement.
