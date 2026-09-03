import { ArrowLeft, Heart, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export type InformationSlug = 'a-propos' | 'faq' | 'cgu' | 'confidentialite' | 'cookies' | 'mentions-legales';

const publisherName = 'INOPIA GROUP';
const publisherAddress = '60 rue François Ier, 75008 Paris, France';
const publisherLegalForm = 'Société par actions simplifiée (SAS)';
const publisherCapital = '100 €';
const publisherRegistration = '990 843 807 R.C.S. Paris';
const contactEmail = 'contact@inopia.fr';
const publisherPhone = '06 21 34 45 67';
const lastUpdate = '3 septembre 2026';

function ContactLink() {
  return <a className="font-black text-cyan-800 underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>;
}

export function Informations({ page }: { page: InformationSlug }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#cffafe_0,#f8fafc_34%,#fff7ed_100%)] text-slate-950">
      <header className="border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <a href="#" className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 font-black text-slate-700 hover:bg-slate-100"><ArrowLeft size={18} /> Retour</a>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">PtitVestiaire</p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        {page === 'a-propos' && <APropos />}
        {page === 'faq' && <Faq />}
        {page === 'cgu' && <Cgu />}
        {page === 'confidentialite' && <Confidentialite />}
        {page === 'cookies' && <Cookies />}
        {page === 'mentions-legales' && <MentionsLegales />}
      </main>
    </div>
  );
}

function Page({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <article className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur md:p-10"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-800">{eyebrow}</p><h1 className="mt-2 text-4xl font-black">{title}</h1><div className="mt-8 space-y-7 text-slate-700">{children}</div></article>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-xl font-black text-slate-950">{title}</h2><div className="mt-2 space-y-3 leading-7">{children}</div></section>;
}

function APropos() {
  return <Page eyebrow="Notre histoire" title="Une garde-robe pensée pour les familles">
    <div className="rounded-3xl bg-cyan-50 p-6"><Heart className="text-cyan-800" /><p className="mt-3 text-lg font-extrabold text-slate-800">PtitVestiaire est né d’une question très concrète : « Ce vêtement est-il revenu, et dans quelle maison se trouve-t-il ? »</p></div>
    <Section title="Le quotidien derrière l’idée"><p>Le projet a été imaginé par un père séparé de la maman de ses filles. Entre les matins d’école, les changements de domicile, les manteaux oubliés et les vêtements qui circulent, un détail banal pouvait vite devenir une source de confusion.</p><p>Une photo au départ, un retour marqué en un geste et un catalogue partagé ont d’abord répondu à ce besoin familial. PtitVestiaire a ensuite été repensé pour que chaque foyer puisse créer son propre espace, inviter l’autre parent ou un proche et suivre les vêtements sans mélanger les données des familles.</p></Section>
    <Section title="Notre intention"><p>Créer un outil simple, privé et apaisant. PtitVestiaire ne remplace ni le dialogue entre parents ni leur jugement : il donne un repère commun, réduit les oublis et fait gagner du temps.</p><p>L’application est réservée aux adultes responsables de l’espace familial. Elle n’a pas vocation à publier les photos des enfants ni à constituer un réseau social.</p></Section>
  </Page>;
}

function Faq() {
  const items: Array<[string, ReactNode]> = [
    ['Comment commencer ?', 'Créez un compte par email ou avec Google. Après validation de l’adresse email, l’application vous propose de créer une famille et d’ajouter au moins un enfant, ou de rejoindre une famille avec un code d’invitation.'],
    ['Comment inviter un autre parent ?', 'Le propriétaire génère un code dans Réglages. L’autre parent crée son propre compte, choisit « Rejoindre » lors de la configuration et saisit ce code. Chaque adulte conserve ses propres identifiants.'],
    ['Qui voit les données de ma famille ?', 'Seuls les comptes membres de la famille peuvent consulter ses vêtements, mouvements et photos. Cette isolation est intégrée à la conception technique de PtitVestiaire et ne repose pas uniquement sur ce qui est affiché à l’écran.'],
    ['Que fait l’analyse IA ?', 'Si vous lancez l’analyse, la photo est envoyée à un service d’intelligence artificielle pour proposer une courte liste de vêtements visibles. Vous devez vérifier et corriger ces suggestions avant l’enregistrement.'],
    ['Dois-je photographier le visage de mon enfant ?', 'Non. Cadrez de préférence uniquement les vêtements. Évitez toute image intime et respectez la vie privée, l’âge et l’avis de l’enfant ainsi que les droits de l’autre titulaire de l’autorité parentale.'],
    ['J’ai oublié mon mot de passe.', 'Sur la page de connexion, ouvrez « Continuer avec email », renseignez votre adresse puis cliquez sur « Mot de passe oublié ? ». Un lien à usage limité vous sera envoyé.'],
    ['Comment modifier mon mot de passe ?', 'Pour un compte email, ouvrez Réglages puis « Modifier mon mot de passe ». Pour un compte Google, le mot de passe se modifie dans votre compte Google.'],
    ['Que devient l’historique si je supprime un vêtement ?', 'Le vêtement disparaît du catalogue, mais les mouvements historiques sont conservés afin de préserver le journal familial ; ils sont alors indiqués comme liés à un vêtement supprimé.'],
    ['Comment demander la suppression de mes données ?', <>Supprimez d’abord les vêtements depuis la garde-robe. Pour une suppression complète du compte et des données restantes, contactez-nous à <ContactLink /> depuis l’adresse du compte.</>]
  ];
  return <Page eyebrow="Aide" title="Questions fréquentes">{items.map(([question, answer]) => <Section key={question} title={question}><p>{answer}</p></Section>)}</Page>;
}

function Cgu() {
  return <Page eyebrow="Cadre du service" title="Conditions générales d’utilisation">
    <p className="text-sm font-bold text-slate-500">Version du {lastUpdate}</p>
    <Section title="1. Objet et acceptation"><p>Les présentes conditions encadrent l’accès à PtitVestiaire, application destinée à aider des adultes à inventorier des vêtements d’enfants et à suivre leurs sorties et retours. La création ou l’utilisation d’un compte vaut acceptation de ces conditions.</p></Section>
    <Section title="2. Accès au service"><p>L’utilisateur doit être majeur, fournir une adresse email valide et préserver la confidentialité de ses identifiants. Il est responsable des actions réalisées depuis son compte et doit signaler sans délai tout accès suspect.</p><p>Le service est actuellement fourni gratuitement, sans achat ni abonnement. Il n’existe donc pas, à ce jour, de conditions générales de vente distinctes. Des CGV seront publiées avant toute éventuelle offre payante.</p></Section>
    <Section title="3. Familles et invitations"><p>Le créateur d’une famille en est le propriétaire. Il peut inviter d’autres adultes. Un code d’invitation est confidentiel et ne doit être transmis qu’à la personne concernée. Les membres invités disposent actuellement des mêmes droits d’usage sur le contenu familial, mais ne peuvent pas retirer le propriétaire.</p></Section>
    <Section title="4. Photos et données relatives aux enfants"><p>L’utilisateur garantit qu’il est autorisé à renseigner les prénoms et à téléverser les photos utilisées dans l’espace familial. Il doit respecter la vie privée et le droit à l’image de l’enfant, tenir compte de son âge et de son avis, et disposer des accords parentaux nécessaires.</p><p>Il est recommandé de cadrer les vêtements sans visage et interdit d’envoyer des contenus intimes, illicites, violents, haineux ou portant atteinte aux droits d’un tiers.</p></Section>
    <Section title="5. Reconnaissance automatique"><p>L’analyse d’image produit uniquement des suggestions. Elle peut être inexacte ou incomplète. L’utilisateur reste responsable de vérifier et modifier les vêtements proposés avant de les enregistrer.</p></Section>
    <Section title="6. Disponibilité et responsabilité"><p>PtitVestiaire est fourni avec soin mais sans garantie d’accès continu, d’absence d’erreur ou de conservation illimitée. L’utilisateur doit vérifier les informations importantes et conserver séparément tout contenu irremplaçable. Dans les limites permises par la loi, l’éditeur ne répond pas des dommages indirects dus à une interruption, une erreur de saisie ou un usage contraire aux présentes conditions.</p></Section>
    <Section title="7. Propriété intellectuelle"><p>L’interface, la marque, les textes et le code propre au service restent protégés par les droits applicables. L’utilisateur conserve ses droits sur les contenus qu’il ajoute et accorde seulement les autorisations techniques nécessaires à leur hébergement, affichage et analyse à sa demande.</p></Section>
    <Section title="8. Suspension et suppression"><p>Un compte ou un accès peut être suspendu en cas d’atteinte à la sécurité, d’usage illicite ou de violation grave des présentes conditions. L’utilisateur peut demander la suppression de son compte et de ses données en écrivant à <ContactLink />.</p></Section>
    <Section title="9. Évolution et droit applicable"><p>Ces conditions peuvent évoluer pour tenir compte du service ou de la loi. La version applicable est celle publiée dans l’application. Elles sont soumises au droit français. En cas de difficulté, contactez d’abord l’éditeur afin de rechercher une solution amiable.</p></Section>
  </Page>;
}

function Confidentialite() {
  return <Page eyebrow="Vos données" title="Politique de confidentialité">
    <p className="text-sm font-bold text-slate-500">Version du {lastUpdate}</p>
    <div className="rounded-3xl bg-cyan-50 p-5 font-bold text-cyan-950"><ShieldCheck className="mb-2" />Chaque famille dispose d’un espace isolé. Les photos ne sont pas publiques et ne servent pas à entraîner un modèle pour le compte de PtitVestiaire.</div>
    <Section title="Responsable du traitement"><p>Le responsable du traitement est la société {publisherName}, joignable à <ContactLink /> ou par courrier à son siège social. Ses coordonnées complètes figurent dans les mentions légales.</p></Section>
    <Section title="Données traitées"><p>PtitVestiaire traite les données de compte (identifiant Firebase, email, fournisseur de connexion et état de validation), le nom de la famille et ses membres, les prénoms des enfants, les photos ajoutées, les descriptions de vêtements, les mouvements de sortie ou de retour, les réglages et les données techniques de sécurité.</p></Section>
    <Section title="Finalités et bases légales"><p>Les données sont utilisées pour créer et sécuriser le compte, fournir l’espace familial, isoler les familles, stocker les photos et vêtements, produire l’historique, gérer les invitations, assister l’identification des vêtements lorsque l’utilisateur le demande et répondre aux demandes. Ces traitements sont nécessaires à l’exécution du service demandé. La prévention des abus et la sécurité reposent sur l’intérêt légitime de l’éditeur.</p></Section>
    <Section title="Destinataires et prestataires"><p>Les données sont accessibles aux membres autorisés de la famille et, lorsque cela est nécessaire au fonctionnement, aux prestataires techniques : Google Firebase (authentification, base de données, stockage et fonctions), Vercel (hébergement de l’interface) et Anthropic (analyse ponctuelle de la photo lorsque cette fonction est lancée).</p><p>Les données principales enregistrées dans PtitVestiaire — familles, vêtements, mouvements et photos — sont hébergées dans une zone européenne. Lorsqu’un utilisateur demande volontairement l’analyse automatisée d’une photo, cette photo est transmise ponctuellement au prestataire d’intelligence artificielle, dont le traitement peut avoir lieu hors de l’Espace économique européen. Ce transfert est limité à la fourniture de cette fonctionnalité et encadré par les garanties applicables du prestataire.</p></Section>
    <Section title="Durées de conservation"><p>Les données du compte et de la famille sont conservées pendant l’utilisation du service puis le temps nécessaire à leur suppression et aux sauvegardes techniques. Les mouvements volontairement conservés après la suppression d’un vêtement restent liés à la famille. Les journaux techniques des prestataires suivent leurs propres durées de sécurité et d’exploitation.</p></Section>
    <Section title="Vos droits"><p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer aux traitements fondés sur l’intérêt légitime. Les représentants légaux peuvent exercer ces droits pour les données d’un enfant. Écrivez à <ContactLink /> depuis l’adresse associée au compte. Une preuve d’identité peut être demandée uniquement en cas de doute raisonnable.</p><p>En l’absence de réponse satisfaisante, vous pouvez saisir la CNIL sur cnil.fr.</p></Section>
    <Section title="Sécurité"><p>L’accès nécessite une authentification et une adresse vérifiée. L’appartenance à chaque famille est contrôlée par les mécanismes de sécurité intégrés à la plateforme, indépendamment de l’interface affichée. Les photos sont compressées avant transfert et les secrets nécessaires à l’analyse automatisée ne sont pas exposés dans l’application. Aucun dispositif ne pouvant garantir un risque nul, utilisez un mot de passe unique et révoquez rapidement un membre qui ne doit plus accéder à la famille.</p></Section>
    <Section title="Vie privée des enfants"><p>PtitVestiaire s’adresse aux parents et responsables adultes, pas directement aux enfants. Ajoutez uniquement les informations nécessaires, évitez les visages et images intimes, informez l’enfant selon son âge et assurez-vous de disposer des autorisations nécessaires de l’autre parent.</p></Section>
  </Page>;
}

function Cookies() {
  return <Page eyebrow="Stockage local" title="Cookies et traceurs">
    <p className="text-sm font-bold text-slate-500">Version du {lastUpdate}</p>
    <Section title="Ce que PtitVestiaire utilise"><p>L’application utilise uniquement les mécanismes techniques indispensables à la connexion Firebase, à la sécurité de la session et au maintien de la famille active dans l’onglet du navigateur. Ces éléments ne servent ni à la publicité, ni au profilage, ni à la mesure d’audience commerciale.</p></Section>
    <Section title="Consentement"><p>Les traceurs strictement nécessaires au service demandé sont exemptés de consentement préalable. PtitVestiaire n’affiche donc pas de bannière de consentement tant qu’aucun outil facultatif d’analyse, de publicité ou de suivi tiers n’est ajouté.</p></Section>
    <Section title="Vos réglages"><p>Vous pouvez effacer les données du site depuis les paramètres de votre navigateur. Cela peut vous déconnecter ou réinitialiser la famille active. Cette page sera mise à jour avant l’ajout éventuel d’un traceur non essentiel.</p></Section>
  </Page>;
}

function MentionsLegales() {
  return <Page eyebrow="Informations légales" title="Mentions légales">
    <p className="text-sm font-bold text-slate-500">Version du {lastUpdate}</p>
    <Section title="Éditeur"><p>PtitVestiaire est édité par {publisherName}, {publisherLegalForm} au capital social de {publisherCapital}, immatriculée sous le numéro {publisherRegistration}.</p><p>Siège social : {publisherAddress}<br />Email : <ContactLink /><br />Téléphone : <a className="font-black text-cyan-800 underline" href="tel:+33621344567">{publisherPhone}</a></p><p>Direction de la publication : {publisherName}.</p></Section>
    <Section title="Hébergement"><p>Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Téléphone : +1 559 288 7060. Site : vercel.com.</p></Section>
    <Section title="Propriété intellectuelle"><p>Sauf indication contraire, la structure, l’identité visuelle, les textes et les éléments propres à PtitVestiaire sont protégés. Toute reproduction ou exploitation non autorisée est interdite. Les marques et services tiers restent la propriété de leurs titulaires.</p></Section>
    <Section title="Données personnelles"><p>Les informations sur les traitements, les prestataires et l’exercice des droits figurent dans la <a className="font-black text-cyan-800 underline" href="#confidentialite">politique de confidentialité</a>.</p></Section>
  </Page>;
}
