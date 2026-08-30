# Rester dans le quota gratuit et être alerté

PtitVestiaire est dimensionné pour tenir dans les quotas gratuits de Firebase. Ce document explique les deux garde-fous mis en place :

1. **La compression des photos** avant l'upload, qui réduit le stockage consommé (voir le README).
2. **Une alerte de budget Google Cloud**, qui prévient par email si un coût apparaît malgré tout.

L'alerte de budget est volontairement **préventive et non bloquante** : elle envoie un email, elle ne coupe jamais le service.

## Ce que couvre le plan gratuit

Le projet utilise Firebase Authentication, Firestore, Storage, Hosting et Cloud Functions. Les Cloud Functions (2nd gen) exigent le plan **Blaze**, c'est-à-dire un compte de facturation actif, même si l'usage réel reste dans les quotas offerts. C'est précisément pour cette raison qu'une alerte est utile : sur Blaze, rien ne bloque automatiquement au-delà du gratuit.

Ordre de grandeur pour un usage familial : deux photos par jour compressées à ~250 Ko représentent environ 180 Mo par an, soit une fraction du quota Storage. Le coût attendu est de 0 €.

## Créer une alerte de budget à 1 €

Le budget se configure dans Google Cloud Console, sur le compte de facturation lié au projet Firebase.

1. Ouvre <https://console.cloud.google.com/billing> et connecte-toi avec le compte Google propriétaire du projet Firebase.
2. Sélectionne le **compte de facturation** associé au projet PtitVestiaire.
3. Dans le menu de gauche, clique sur **Budgets et alertes** (*Budgets & alerts*).
4. Clique sur **Créer un budget**.
5. **Périmètre** (*Scope*) :
   - Donne un nom, par exemple `Alerte PtitVestiaire`.
   - Dans **Projets**, sélectionne uniquement le projet Firebase de PtitVestiaire (sinon l'alerte couvre tous tes projets Google Cloud).
   - Laisse les autres filtres (services, remises) par défaut.
6. **Montant** (*Amount*) :
   - Choisis **Montant spécifié** (*Specified amount*).
   - Saisis `1` (en euros). Un budget à `0` est accepté mais déclenche l'alerte au premier centime théorique ; `1 €` évite les faux positifs tout en restant très bas.
7. **Actions** (*Actions*) — les seuils déclenchent l'email :
   - Garde ou définis des seuils à **50 %**, **90 %** et **100 %** du budget, en type **Réel** (*Actual*).
   - Ajoute éventuellement un seuil à **100 % en type Prévisionnel** (*Forecasted*) pour être prévenu avant même que la dépense n'arrive.
   - Coche **Envoyer des alertes par email aux administrateurs et utilisateurs de la facturation** (*Email alerts to billing admins and users*).
8. **Ne coche pas** l'option de connexion à un sujet Pub/Sub et ne mets en place aucun script de désactivation de la facturation : ce sont ces mécanismes qui couperaient le service. On veut uniquement l'email.
9. Clique sur **Terminer** (*Finish*).

### Envoyer l'alerte à d'autres adresses

Par défaut, seuls les administrateurs de facturation reçoivent l'email. Pour prévenir une autre adresse (celle de ta femme par exemple) :

1. Dans Google Cloud Console, va dans **Monitoring → Alertes → Gérer les canaux de notification**.
2. Ajoute un canal **Email** avec l'adresse voulue.
3. Reviens dans le budget, section **Actions**, et sélectionne ce canal dans **Gérer les canaux de notification**.

## Vérifier la consommation à tout moment

- **Usage Firebase** : <https://console.firebase.google.com/> → onglet **Usage and billing**, qui montre le stockage, les lectures Firestore et les invocations de Functions par rapport aux quotas gratuits.
- **Coûts Google Cloud** : <https://console.cloud.google.com/billing> → **Rapports**, filtré sur le projet.
- **Stockage réel** : Firebase Console → **Storage**, pour voir le poids cumulé du dossier `sorties/`.

## Rappel important

Une alerte de budget **n'arrête rien**. Elle informe. Si un email arrive, connecte-toi à la console pour comprendre l'origine du coût (souvent un usage inhabituel de Cloud Functions ou de Storage) avant de décider quoi faire. C'est le comportement souhaité ici : l'application reste toujours utilisable pour la famille.

Pense aussi à surveiller séparément le coût Anthropic, qui n'est pas facturé par Google : un plafond et une alerte de dépense se configurent sur <https://console.anthropic.com/>.
