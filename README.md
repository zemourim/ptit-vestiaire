# PtitVestiaire

PtitVestiaire est une PWA familiale pour suivre les vêtements que portent Sanaa et Manelle le matin, puis vérifier ce qui est bien revenu à la maison.

## Arborescence

```text
src/
	components/
		BadgeStatut.tsx
		CarteVetement.tsx
		HistoriqueVetement.tsx
		PriseDePhoto.tsx
		ResolutionVetements.tsx
		SelecteurFille.tsx
	firebase/
		analyzePhoto.ts
		config.ts
		useAuth.ts
		useMouvements.ts
		useSettings.ts
		useStorage.ts
		useVetements.ts
	lib/
		constants.ts
		dates.ts
		images.ts
		normalize.ts
		resolution.ts
	pages/
		Connexion.tsx
		GardeRobe.tsx
		Historique.tsx
		NouvelleSortie.tsx
		Reglages.tsx
		TableauDeBord.tsx
functions/
	src/index.ts
	scripts/migrer-sorties.mjs
firebase.json
firestore.rules
storage.rules
```

## Modèle de données Firestore

Le modèle sépare **le vêtement**, qui est permanent, et **le mouvement**, qui est un événement daté. Un manteau n'existe qu'une fois en base, quel que soit le nombre de fois où il sort.

```text
vetements/{vetementId}                  mouvements/{mouvementId}
┌────────────────────────────┐          ┌──────────────────────────────┐
│ fille        Sanaa         │◄────┐    │ vetementId   → vetements/... │
│ nom          Manteau bleu  │     ├────│ date         12/09 08:10     │
│ statutActuel sorti         │     │    │ statut       sorti           │
│ dernierMouvementId ────────┼─────┘    │ origine      photo           │
│ dateDernierMouvement       │     │    └──────────────────────────────┘
│ photoReference  https://...│     │    ┌──────────────────────────────┐
│ actif        true          │     └────│ vetementId   → vetements/... │
└────────────────────────────┘          │ date         12/09 17:40     │
        1                    ────────►  │ statut       revenu          │
                                  N     │ origine      bouton_rapide   │
                                        └──────────────────────────────┘
```

Un vêtement porte **N** mouvements. `statutActuel` et `dernierMouvementId` sont une photographie du dernier mouvement en date : ils évitent de relire tout l'historique pour afficher la garde-robe.

Collection `vetements`, le catalogue permanent :

```js
{
	id: string,
	fille: "Sanaa" | "Manelle",
	nom: string,                          // "Manteau bleu"
	nomNormalise: string,                 // "manteau bleu", sans accent ni casse
	photoReference: string | null,
	dateCreation: timestamp,
	actif: boolean,                       // false = archivé (trop petit, perdu)
	statutActuel: "sorti" | "revenu",
	dernierMouvementId: string | null,
	dateDernierMouvement: timestamp | null
}
```

Collection `mouvements`, un document par sortie ou par retour :

```js
{
	id: string,
	vetementId: string,                   // référence vers vetements/{id}
	fille: "Sanaa" | "Manelle",
	date: timestamp,
	photoUrl: string | null,              // null pour un changement rapide sans photo
	statut: "sorti" | "revenu",
	dateRetour: timestamp | null,
	origine: "photo" | "bouton_rapide"
}
```

`nomNormalise` et `dateDernierMouvement` ne sont pas des données nouvelles : ce sont des dérivées stockées pour éviter, respectivement, une recherche approximative coûteuse et une requête par vêtement à l'affichage.

Document `settings/global` :

```js
{
	alertAfterDays: number
}
```

### Ne jamais créer deux fois le même vêtement

Quand une photo est analysée, chaque nom identifié passe par `normaliserNom()` ([src/lib/normalize.ts](src/lib/normalize.ts)) : minuscules, accents retirés, ponctuation supprimée, pluriels simples réduits. « Manteau Bleu », « manteau bleu » et « manteaux bleus » donnent donc tous `manteau bleu`.

- **Nom déjà présent au catalogue** pour cette fille : le vêtement est réutilisé tel quel, seul un nouveau mouvement est écrit. Aucune intervention n'est demandée.
- **Nom seulement proche** (distance de Levenshtein au-dessus de 0,7) : l'application propose les vêtements ressemblants et un bouton « Nouveau vêtement ». C'est toi qui tranches, avant enregistrement.
- **Aucune correspondance** : la création est proposée par défaut, et le bouton d'enregistrement indique combien de vêtements vont être ajoutés au catalogue.

Si un doublon passe malgré tout, Réglages → « Fusionner deux vêtements en doublon » transfère tous les mouvements du doublon vers le vêtement conservé, puis supprime le doublon. Aucun historique n'est perdu.

### Changement rapide de statut depuis la garde-robe

L'onglet **Garde-robe** liste tout le catalogue par fille, avec pour chaque vêtement son statut et depuis combien de jours il y est. Chaque carte porte un bouton unique dont le libellé suit le statut courant : « Marquer rentré » si le vêtement est sorti, « Marquer ressorti » sinon. L'onglet **Aperçu** présente les vêtements actuellement sortis.

Un clic sur ce bouton, sans photo ni formulaire :

1. écrit un document dans `mouvements` avec la date du jour, le nouveau statut, `photoUrl: null` et `origine: "bouton_rapide"` ;
2. si le vêtement rentre, complète la `dateRetour` du mouvement de sortie correspondant, pour que l'historique montre la durée réelle ;
3. met à jour `statutActuel`, `dernierMouvementId` et `dateDernierMouvement` sur le vêtement.

Ces écritures sont atomiques : le catalogue ne peut jamais pointer vers un mouvement inexistant. La création passe par une Cloud Function afin d’appliquer les quotas sans possibilité de contournement depuis le navigateur. Le badge et la couleur de la carte changent immédiatement, sans rechargement de page, grâce à l'abonnement `onSnapshot`.

## Formules et abonnements Stripe

Toute famille nouvelle commence avec `plan: "gratuit"`. Pour la compatibilité, l’absence de champ `plan` sur une ancienne famille est également interprétée comme la formule gratuite.

| Fonction | Gratuite | Payante |
| --- | --- | --- |
| Enfants actifs | 1 | Illimités |
| Vêtements actifs | 20 | Illimités |
| Historique | 30 jours | Illimité |
| Identification | Saisie manuelle | Saisie et reconnaissance IA |
| Membres invités actifs | 1 | Illimités |
| Photo de référence | 1 champ par vêtement | 1 champ par vêtement |
| Prix | 0 € | 2,99 €/mois ou 24,99 €/an |

Les contrôles sensibles sont effectués côté serveur : les créations de vêtements et les invitations passent par des fonctions appelables, l’IA vérifie le plan et l’appartenance, les règles interdisent au client de modifier les champs Stripe ou les compteurs, et les lectures d’historique gratuit sont limitées aux 30 derniers jours. Après une rétrogradation, les enfants après le premier, les vêtements après le vingtième et les invités après le premier sont conservés mais marqués archivés/bloqués ; ils sont réactivés après un nouveau paiement.

Cycle automatique : Checkout crée l’abonnement ; `invoice.paid` active ou renouvelle la formule, remet les compteurs de rappel à zéro et envoie une confirmation ; la tâche quotidienne rappelle une échéance annuelle à J-21 puis J-7, ou une échéance mensuelle à J-3 ; `invoice.payment_failed` démarre un délai de grâce de 7 jours (annuel) ou 3 jours (mensuel) ; sans régularisation, la famille repasse en gratuit et reçoit un dernier email. Le portail client Stripe permet de modifier le moyen de paiement ou d’annuler. Les webhooks sont dédupliqués par identifiant d’événement.

### Configuration Stripe, emails et Scheduler

1. Utilise d’abord une clé Stripe **de test** et crée le produit ainsi que les deux prix :

   ```bash
   cd functions
   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
   ```

   Le script refuse volontairement une clé live. Il crée ou retrouve le produit et les deux prix, crée l’endpoint webhook du projet de test s’il manque, configure un portail client de base, puis affiche les identifiants à enregistrer. Le secret du webhook n’est retourné par Stripe que lors de sa création.
2. Configure les secrets des fonctions, sans jamais les préfixer par `VITE_` ni les placer dans le client :

   ```bash
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase functions:secrets:set STRIPE_PRICE_MONTHLY
   firebase functions:secrets:set STRIPE_PRICE_ANNUAL
   firebase functions:secrets:set RESEND_API_KEY
   ```

   `APP_PUBLIC_URL` et `EMAIL_FROM` sont des paramètres serveur non sensibles, avec pour valeurs par défaut l’URL Vercel de la branche et `PtitVestiaire <contact@inopia.fr>`. Ils peuvent être surchargés lors du déploiement. Le domaine d’envoi doit être validé chez Resend.
3. Déploie les règles, index, Storage et fonctions :

   ```bash
   firebase use ptit-vestiaire-multifamilles
   firebase deploy --only firestore:rules,firestore:indexes,storage,functions
   ```

   Le déploiement de `verifierAbonnements` crée automatiquement le job Cloud Scheduler quotidien. Le projet Firebase doit être sur Blaze ; Cloud Scheduler et l’envoi d’emails peuvent générer des coûts selon les quotas des fournisseurs.
4. Si l’endpoint existait déjà, vérifie dans Stripe Developers → Webhooks qu’il pointe vers `stripeWebhook` en `europe-west1` et écoute : `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`. Renouvelle son secret si nécessaire puis enregistre-le dans `STRIPE_WEBHOOK_SECRET`.

### Test complet en mode test

- Lance `npm test` dans `functions/` pour vérifier les seuils de rappel et les délais de grâce.
- Utilise Stripe CLI pour transmettre les webhooks à la fonction locale ou déployée, puis paie Checkout avec `4242 4242 4242 4242`.
- Vérifie dans `familles/{id}` le passage à `plan: "payant"`, les identifiants Stripe, la fréquence et la prochaine échéance.
- Simule `invoice.payment_failed`, avance `echecPaiementLe` dans une famille de test au-delà du délai de grâce, puis exécute la tâche planifiée depuis Google Cloud Scheduler. Vérifie `plan: "gratuit"`, `statutAbonnement: "expire"` et les drapeaux `bloqueParPlan`.
- Simule ensuite `invoice.paid` et vérifie que toutes les données archivées par le plan redeviennent actives.
- Ne passe en clés Stripe live qu’après validation des prix, emails, taxes, pages contractuelles et du parcours d’annulation.

## Fonctionnalités livrées

- Connexion Firebase Authentication par email/mot de passe.
- Connexion Google gratuite via Firebase Authentication, en complément de l'email/mot de passe. Apple Sign-In n'est pas activé car il nécessite le programme développeur Apple payant (99 $/an).
- Limitation côté interface à deux emails adultes via `VITE_ALLOWED_EMAILS`.
- Ajout avec photo prise depuis l'appareil ou choisie dans la galerie, prénom et tags modifiables.
- Choix explicite entre une sortie (mouvements `sorti`) et un simple ajout à la garde-robe (sans mouvement, statut initial `revenu`).
- Compression automatique de la photo dans le navigateur avant tout envoi vers Firebase Storage.
- Analyse des vêtements par Cloud Function `analyzeVetements` et API Anthropic Claude Vision.
- Les suggestions sont modifiables, supprimables et complétables manuellement avant l'enregistrement.
- Catalogue permanent de vêtements : un vêtement n'est créé qu'une fois, puis réutilisé à chaque sortie.
- Rapprochement automatique des noms pour éviter les doublons, avec confirmation manuelle en cas de doute.
- Onglet Aperçu compact des vêtements encore `sorti`, avec vignettes, date de sortie et retour rapide, trié du plus ancien au plus récent.
- Historique complet par vêtement : toutes ses sorties et tous ses retours, avec l'origine de chaque changement.
- Onglet Garde-robe listant le catalogue par fille, avec bouton de changement de statut en un clic.
- Suppression confirmée d'un vêtement du catalogue. Les mouvements liés sont conservés : le journal familial reste complet et les désigne comme « Vêtement supprimé ».
- Archivage d'un vêtement devenu trop petit ou perdu, sans perdre son historique.
- Fusion manuelle de deux vêtements en doublon depuis les Réglages.
- Badge rouge si une sortie dépasse le seuil configurable, par défaut 7 jours.
- Journal filtrable par Sanaa, Manelle ou toutes.
- PWA Vite installable depuis le navigateur après déploiement HTTPS.

## Installation locale

Installe Node.js 22 ou plus, puis lance :

```bash
npm install
npm run dev
```

Le terminal actuel ne contient pas `npm`; installe Node.js depuis <https://nodejs.org/> ou via Homebrew :

```bash
brew install node
```

## Configuration Firebase

1. Va sur <https://console.firebase.google.com/> et crée un projet Firebase.
2. Dans Authentication, active le fournisseur `Email/Password`.
3. Crée uniquement les deux comptes adultes autorisés.
4. Active Cloud Firestore en mode production.
5. Active Firebase Storage.
6. Active Firebase Hosting.
7. Dans Authentication → Sign-in method, active Google et renseigne l’adresse email de support du projet. Aucun compte développeur payant n’est requis.
8. Dans les paramètres du projet, ajoute une application Web et copie la configuration Firebase.
9. Copie `env.example` vers `.env` puis remplis les variables :

```bash
cp env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ALLOWED_EMAILS=ton.email@example.com,email.femme@example.com
```

## Compression des photos avant l'upload

Une photo prise avec un smartphone récent pèse souvent 3 à 6 Mo. À raison de deux sorties par jour, le quota gratuit de Firebase Storage (5 Go) serait consommé en quelques mois, avec un risque de facturation à la clé. Pour éviter cela, chaque photo est compressée **dans le navigateur**, juste après la prise de vue et **avant** l'envoi vers Firebase Storage.

La compression est faite par la librairie [`browser-image-compression`](https://www.npmjs.com/package/browser-image-compression), entièrement côté client, sans service externe ni coût. Le code se trouve dans `compresserPhoto` ([src/lib/images.ts](src/lib/images.ts)) et est appelé par [src/components/PriseDePhoto.tsx](src/components/PriseDePhoto.tsx).

Paramètres appliqués :

| Paramètre | Valeur | Raison |
| --- | --- | --- |
| Poids visé | environ 200 à 300 Ko | Divise le stockage par 10 à 20 par rapport à l'original |
| Dimension max | 1280 px sur le plus grand côté | Largement suffisant pour identifier un vêtement |
| Format | JPEG, qualité ~78 % | Format universel, bon rapport poids/lisibilité |
| Exécution | Web Worker | L'interface reste fluide pendant la compression |

Pendant les quelques centaines de millisecondes que dure l'opération, la zone photo affiche un indicateur « Optimisation de la photo… » et le champ de sélection est désactivé. Une fois terminée, l'aperçu et le poids final en Ko sont affichés.

Seule l'image compressée circule ensuite dans l'application :

- elle est envoyée à Firebase Storage par `uploadSortiePhoto` ;
- elle sert aussi de base à l'analyse IA (le data URL transmis à la Cloud Function est celui de l'image compressée).

L'original en pleine résolution n'est jamais envoyé. Si la compression échoue, l'application affiche une erreur et n'enregistre rien plutôt que de basculer sur l'image d'origine.

### Lisibilité conservée

1280 px et une qualité de 78 % restent confortablement au-dessus de ce dont Claude Vision a besoin : Anthropic redimensionne de toute façon les images au-delà de ~1568 px, donc une photo plus lourde n'améliorerait pas la reconnaissance des vêtements — elle coûterait juste plus cher en stockage et en tokens. Côté affichage, le tableau de bord et l'historique montrent les photos en vignette ou en largeur d'écran mobile, où 1280 px reste net y compris sur un écran haute densité.

Pour vérifier concrètement : prends une photo depuis l'application, regarde le poids affiché sous l'aperçu (il doit tourner autour de 200 à 300 Ko), lance « Analyser » et contrôle que les vêtements proposés sont corrects.

## Migration depuis l'ancienne collection `sorties`

Les données antérieures vivaient dans une collection `sorties` où les vêtements étaient de simples chaînes de caractères, recréées à chaque photo. Le script [functions/scripts/migrer-sorties.mjs](functions/scripts/migrer-sorties.mjs) les reprend dans le nouveau modèle :

1. il parcourt `sorties` par date croissante ;
2. pour chaque tag, il retrouve le vêtement au catalogue par nom normalisé, ou le crée ;
3. il écrit le mouvement correspondant avec `origine: "photo"`, en conservant la date, la photo et la date de retour d'origine ;
4. il recalcule `statutActuel`, `dernierMouvementId` et `dateDernierMouvement` à partir du dernier mouvement de chaque vêtement.

Le script **ne supprime rien** : la collection `sorties` reste intacte. Chaque mouvement créé garde l'identifiant de la sortie d'origine dans `sortieOrigineId`, ce qui rend le script rejouable sans créer de doublon.

Identifie-toi auprès de Google, puis lance d'abord une simulation :

```bash
cd functions
npm install
gcloud auth application-default login
node scripts/migrer-sorties.mjs
```

La simulation n'écrit rien et affiche le nombre de vêtements et de mouvements qui seraient créés. Si le compte rendu est cohérent, applique la migration :

```bash
node scripts/migrer-sorties.mjs --execute
```

Si `gcloud` n'est pas installé, télécharge une clé de compte de service depuis la console Firebase (Paramètres du projet → Comptes de service) et exporte `GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/cle.json` avant de lancer le script.

Vérifie ensuite dans l'application que la garde-robe, les statuts et les historiques sont corrects. **Ne supprime la collection `sorties` qu'après cette vérification** : c'est la seule copie des données d'origine.

## Surveillance du budget Google Cloud

La compression réduit fortement le risque de dépassement, mais elle ne le supprime pas totalement. Pour être averti par email si le projet venait à générer le moindre coût, configure une alerte de budget : la marche à suivre détaillée est dans [BILLING.md](BILLING.md).

## Reconnaissance des vêtements par Claude Vision

Quand une photo est analysée, le navigateur appelle la Cloud Function `analyzeVetementsV2`. La Function envoie l'image à Anthropic avec le modèle `claude-haiku-4-5-20251001` et demande un tableau JSON de vêtements et accessoires visibles, par exemple `["manteau bleu", "baskets blanches"]`. La clé API n'est jamais envoyée au navigateur : elle est conservée dans Firebase Secret Manager et l'accès est limité à la Function. L’ancienne fonction `analyzeVetements` en `us-central1` peut être supprimée après validation de la V2 en `europe-west1`.

Pour créer une clé, utilise [console.anthropic.com](https://console.anthropic.com/), puis configure-la côté serveur :

```bash
cd functions
npm install
npx firebase functions:secrets:set ANTHROPIC_API_KEY
```

Déploie ensuite la Function avec son secret :

```bash
npx firebase deploy --only functions:analyzeVetements
```

Le compte Anthropic doit disposer de crédits. Pour un usage familial normal avec Haiku, le coût estimé reste de quelques centimes par mois, selon le nombre et la taille des photos analysées. Configure une alerte et un plafond de dépense dans [console.anthropic.com](https://console.anthropic.com/) afin d'éviter toute mauvaise surprise.

## Déploiement

Installe Node.js 22 ou plus, puis installe Firebase CLI si la commande `firebase` n'est pas disponible :

```bash
npm install -g firebase-tools
```

Connecte-toi à Firebase et lie ce dossier au projet Firebase existant utilisé pour Authentication, Firestore et Storage :

```bash
firebase login
firebase use --add
```

La configuration Hosting est déjà prête dans `firebase.json` : le dossier public est `dist`, et le mode single-page application redirige toutes les routes vers `index.html`.

Pour builder puis déployer uniquement le frontend sur Firebase Hosting :

```bash
npm run build
firebase deploy --only hosting
```

Après avoir activé Firebase CLI, publie aussi les règles si l'application affiche `Missing or insufficient permissions` :

```bash
firebase login
firebase deploy --only firestore:rules,storage
```

Cette commande ne modifie pas les données Firestore ni les fichiers Storage ; elle publie uniquement les règles de sécurité présentes dans `firestore.rules` et `storage.rules`.

Commande raccourcie équivalente :

```bash
npm run deploy
```

Le manifeste PWA est généré par `vite-plugin-pwa` pendant `npm run build` avec le nom `PtitVestiaire` et le short name `PtitVestiaire`. Vérifie le build avec `npm run preview`, puis ouvre `/manifest.json` dans le navigateur.

Firebase Hosting fournit HTTPS automatiquement, nécessaire pour l'accès caméra sur smartphone.

## Commandes utiles

```bash
npm run dev
npm run build
npm run preview
npm run deploy
```

## Règles de sécurité

Les règles incluses exigent une session Firebase authentifiée pour lire et écrire `vetements`, `mouvements` et `settings`. Côté Storage, un upload est refusé au-delà de 1 Mo ou si le fichier n'est pas une image, ce qui protège le quota même si un appareil exécute une version périmée de l'application. Pour un usage familial, garde seulement les deux comptes adultes dans Firebase Authentication et renseigne `VITE_ALLOWED_EMAILS` pour bloquer l'interface côté client si un autre compte existe par erreur.
