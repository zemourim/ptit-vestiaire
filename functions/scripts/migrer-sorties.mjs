/**
 * Migration unique : ancienne collection `sorties` -> `vetements` + `mouvements`.
 *
 * Le script est idempotent : chaque mouvement créé garde l'id de la sortie
 * d'origine dans `sortieOrigineId`, donc une seconde exécution ne duplique rien.
 * Il ne supprime jamais la collection `sorties`.
 *
 * Usage :
 *   cd functions && npm install
 *   gcloud auth application-default login          (une seule fois)
 *   node scripts/migrer-sorties.mjs                (simulation, n'écrit rien)
 *   node scripts/migrer-sorties.mjs --execute      (écriture réelle)
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const EXECUTE = process.argv.includes('--execute');
const PROJET = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? 'ptitvestiaire-40da8';

initializeApp({ credential: applicationDefault(), projectId: PROJET });
const db = getFirestore();

/** Identique à normaliserNom() côté application : les deux doivent rester alignés. */
function normaliserNom(nom) {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((mot) => (mot.length > 3 && mot.endsWith('s') ? mot.slice(0, -1) : mot))
    .join(' ');
}

const journal = { sorties: 0, ignorees: 0, vetementsCrees: 0, vetementsReutilises: 0, mouvementsCrees: 0 };

async function main() {
  console.log(`Projet ${PROJET} — mode ${EXECUTE ? 'ÉCRITURE' : 'SIMULATION'}\n`);

  const [sorties, vetementsExistants, mouvementsExistants] = await Promise.all([
    db.collection('sorties').orderBy('date', 'asc').get(),
    db.collection('vetements').get(),
    db.collection('mouvements').get()
  ]);

  // Catalogue en mémoire : clé "fille|nom normalisé" -> { id, ...état courant }.
  const catalogue = new Map();
  vetementsExistants.forEach((snapshot) => {
    const data = snapshot.data();
    catalogue.set(`${data.fille}|${data.nomNormalise}`, { id: snapshot.id, nom: data.nom, cree: false });
  });

  const dejaMigrees = new Set();
  mouvementsExistants.forEach((snapshot) => {
    const origine = snapshot.data().sortieOrigineId;
    if (origine) dejaMigrees.add(origine);
  });

  // On accumule l'état final de chaque vêtement, appliqué après la dernière sortie traitée.
  const etatFinal = new Map();

  for (const sortie of sorties.docs) {
    const data = sortie.data();
    if (dejaMigrees.has(sortie.id)) {
      journal.ignorees += 1;
      continue;
    }

    const tags = Array.isArray(data.vetements) ? data.vetements : [];
    if (tags.length === 0) {
      journal.ignorees += 1;
      continue;
    }

    journal.sorties += 1;
    const statut = data.statut === 'revenu' ? 'revenu' : 'sorti';
    const dateRetour = data.dateRetour ?? null;

    for (const tag of tags) {
      const nom = String(tag).trim();
      if (!nom) continue;
      const cle = `${data.fille}|${normaliserNom(nom)}`;

      let vetement = catalogue.get(cle);
      if (!vetement) {
        const ref = db.collection('vetements').doc();
        vetement = { id: ref.id, nom, cree: true };
        catalogue.set(cle, vetement);
        journal.vetementsCrees += 1;
        if (EXECUTE) {
          await ref.set({
            fille: data.fille,
            nom,
            nomNormalise: normaliserNom(nom),
            photoReference: data.photoUrl ?? null,
            dateCreation: data.date ?? FieldValue.serverTimestamp(),
            actif: true,
            statutActuel: 'sorti',
            dernierMouvementId: null,
            dateDernierMouvement: null
          });
        }
      } else {
        journal.vetementsReutilises += 1;
      }

      const mouvementRef = db.collection('mouvements').doc();
      journal.mouvementsCrees += 1;
      if (EXECUTE) {
        await mouvementRef.set({
          vetementId: vetement.id,
          fille: data.fille,
          date: data.date,
          photoUrl: data.photoUrl ?? null,
          statut: 'sorti',
          dateRetour,
          origine: 'photo',
          sortieOrigineId: sortie.id
        });
      }

      // Les sorties sont parcourues par date croissante : la dernière écrase les précédentes.
      etatFinal.set(vetement.id, {
        statutActuel: statut,
        dernierMouvementId: mouvementRef.id,
        dateDernierMouvement: statut === 'revenu' && dateRetour ? dateRetour : data.date
      });
    }
  }

  if (EXECUTE) {
    for (const [vetementId, etat] of etatFinal) {
      await db.collection('vetements').doc(vetementId).update(etat);
    }
  }

  console.log(`Sorties traitées        : ${journal.sorties}`);
  console.log(`Sorties déjà migrées    : ${journal.ignorees}`);
  console.log(`Vêtements créés         : ${journal.vetementsCrees}`);
  console.log(`Vêtements réutilisés    : ${journal.vetementsReutilises}`);
  console.log(`Mouvements créés        : ${journal.mouvementsCrees}`);
  console.log(`Statuts recalculés      : ${etatFinal.size}`);
  if (!EXECUTE) console.log('\nSimulation : aucune écriture. Relance avec --execute pour appliquer.');
}

main().catch((caught) => {
  if (String(caught?.message).includes('default credentials')) {
    console.error(
      'Aucune identification Google trouvée. Lance `gcloud auth application-default login`,\n' +
        'ou télécharge une clé de compte de service depuis la console Firebase puis exporte\n' +
        'GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/cle.json avant de relancer le script.'
    );
    process.exit(1);
  }
  console.error(caught);
  process.exit(1);
});
