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
- Suggestions de vêtements par détection locale COCO-SSD dans le navigateur.
- Aucun appel à une API d'analyse, aucune clé API et aucun coût à l'usage pour la reconnaissance.
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

## Reconnaissance locale des vêtements

Quand une photo est choisie, l'application charge une seule fois le modèle pré-entraîné COCO-SSD via TensorFlow.js, puis exécute la détection entièrement dans le navigateur. Le modèle est mis en cache par le navigateur et aucune photo n'est envoyée à un service d'analyse tiers.

La détection propose uniquement les catégories accessoires disponibles dans COCO-SSD et pertinentes pour le vestiaire, comme les sacs, les valises et les cravates. Les suggestions sont modifiables, supprimables ou complétables manuellement. Si aucun objet pertinent n'est trouvé, le champ reste vide et l'enregistrement manuel reste disponible.

Cette fonctionnalité ne nécessite aucune clé API, aucun compte auprès d'un fournisseur d'IA et aucune facturation à l'usage.

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
