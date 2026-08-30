# PtitVestiaire

PtitVestiaire est une PWA familiale pour suivre les vêtements que portent Sanaa et Manelle le matin, puis vérifier ce qui est bien revenu à la maison.

## Arborescence

```text
src/
	components/
		BadgeStatut.tsx
		CarteVetement.tsx
		PriseDePhoto.tsx
		SelecteurFille.tsx
	firebase/
		analyzePhoto.ts
		config.ts
		useAuth.ts
		useSettings.ts
		useSorties.ts
		useStorage.ts
	lib/
		constants.ts
		dates.ts
		images.ts
	pages/
		Connexion.tsx
		Historique.tsx
		NouvelleSortie.tsx
		Reglages.tsx
		TableauDeBord.tsx
functions/
	src/index.ts
firebase.json
firestore.rules
storage.rules
```

## Schéma Firestore

Collection `sorties` :

```js
{
	id: string,
	fille: "Sanaa" | "Manelle",
	date: timestamp,
	photoUrl: string,
	photoPath: string,
	vetements: string[],
	statut: "sorti" | "revenu",
	dateRetour: timestamp | null
}
```

Document `settings/global` :

```js
{
	alertAfterDays: number
}
```

## Fonctionnalités livrées

- Connexion Firebase Authentication par email/mot de passe.
- Limitation côté interface à deux emails adultes via `VITE_ALLOWED_EMAILS`.
- Ajout d'une sortie du matin avec photo, prénom, date automatique et tags modifiables.
- Compression automatique de la photo dans le navigateur avant tout envoi vers Firebase Storage.
- Analyse des vêtements par Cloud Function `analyzeVetements` et API Anthropic Claude Vision.
- Les suggestions sont modifiables, supprimables et complétables manuellement avant l'enregistrement.
- Tableau de bord des vêtements encore `sorti`, triés du plus ancien au plus récent.
- Badge rouge si une sortie dépasse le seuil configurable, par défaut 7 jours.
- Historique filtrable par Sanaa, Manelle ou toutes les sorties.
- Action groupée pour marquer plusieurs sorties comme `revenu`.
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
7. Dans les paramètres du projet, ajoute une application Web et copie la configuration Firebase.
8. Copie `env.example` vers `.env` puis remplis les variables :

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

## Surveillance du budget Google Cloud

La compression réduit fortement le risque de dépassement, mais elle ne le supprime pas totalement. Pour être averti par email si le projet venait à générer le moindre coût, configure une alerte de budget : la marche à suivre détaillée est dans [BILLING.md](BILLING.md).

## Reconnaissance des vêtements par Claude Vision

Quand une photo est analysée, le navigateur appelle la Cloud Function `analyzeVetements`. La Function envoie l'image à Anthropic avec le modèle `claude-haiku-4-5-20251001` et demande un tableau JSON de vêtements et accessoires visibles, par exemple `["manteau bleu", "baskets blanches"]`. La clé API n'est jamais envoyée au navigateur : elle est conservée dans Firebase Secret Manager et l'accès est limité à la Function.

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

Les règles incluses exigent une session Firebase authentifiée pour lire et écrire les sorties. Pour un usage familial, garde seulement les deux comptes adultes dans Firebase Authentication et renseigne `VITE_ALLOWED_EMAILS` pour bloquer l'interface côté client si un autre compte existe par erreur.
