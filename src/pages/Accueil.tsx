import {
  ArrowRight,
  Camera,
  Check,
  History,
  Shirt,
  Sparkles,
  Users
} from 'lucide-react';
import { PiedDePage } from '../components/PiedDePage';

const features = [
  { icon: Camera, title: 'Une photo avant l’école', text: 'Photographiez simplement la tenue portée avant le départ.' },
  { icon: Sparkles, title: 'Identification facilitée', text: 'L’IA suggère les vêtements visibles, avec une saisie manuelle toujours disponible.' },
  { icon: History, title: 'Sorti ou revenu', text: 'Suivez le statut de chaque vêtement et retrouvez tous ses mouvements.' },
  { icon: Shirt, title: 'Une garde-robe par enfant', text: 'Centralisez les vêtements suivis et leur historique au même endroit.' },
  { icon: Users, title: 'Un suivi partagé', text: 'Invitez l’autre parent pour garder un repère commun entre les deux foyers.' }
];

const freeFeatures = ['1 enfant', 'Jusqu’à 20 vêtements', 'Historique sur 30 jours', 'Saisie manuelle', '1 membre invité', '1 photo par vêtement'];
const premiumFeatures = ['Enfants illimités', 'Vêtements illimités', 'Historique illimité', 'Reconnaissance IA automatique', 'Membres invités illimités', 'Export des données', 'Plusieurs photos par vêtement'];

export function Accueil() {
  return (
    <div id="accueil" className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#cffafe_0,#f8fafc_36%,#fff7ed_100%)] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <a href="#accueil" className="text-lg font-black tracking-tight">PtitVestiaire</a>
          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 md:flex" aria-label="Navigation de présentation">
            <a href="#fonctionnalites" className="hover:text-slate-950">Fonctionnalités</a>
            <a href="#fonctionnement" className="hover:text-slate-950">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-slate-950">Tarifs</a>
          </nav>
          <a href="#connexion" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black shadow-sm hover:bg-slate-50">Se connecter</a>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <p className="inline-flex rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-cyan-900">Pensé pour les familles, entre deux foyers</p>
              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">Ne perdez plus le fil des vêtements entre deux maisons.</h1>
              <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-slate-600 md:text-xl">Une photo avant l’école, un statut au retour et une garde-robe partagée pour savoir simplement ce qui est sorti, revenu ou encore attendu.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#inscription" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white shadow-soft">Créer un compte gratuitement <ArrowRight size={19} /></a>
                <a href="#connexion" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-700">Se connecter</a>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-500">Aucune carte bancaire demandée.</p>
            </div>

            <div className="relative mx-auto w-full max-w-lg" aria-label="Aperçu illustré du suivi des vêtements">
              <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-cyan-200/70 blur-3xl" />
              <div className="absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-violet-200/70 blur-3xl" />
              <div className="relative rotate-1 rounded-[2.2rem] border border-white bg-white/90 p-5 shadow-soft backdrop-blur">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Aujourd’hui</p><h2 className="text-2xl font-black">Les vêtements sortis</h2></div>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-black text-cyan-800">2 en cours</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <MockClothing color="from-cyan-100 to-sky-200" label="Manteau bleu" child="Lina" childClass="bg-cyan-100 text-cyan-800" />
                  <MockClothing color="from-violet-100 to-fuchsia-100" label="Gilet violet" child="Noa" childClass="bg-violet-100 text-violet-800" />
                </div>
                <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white"><p className="text-sm font-black">Un retour en un geste</p><p className="mt-1 text-sm font-bold text-slate-300">L’historique se met à jour pour toute la famille.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/70 px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-800">L’origine</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Une petite contrainte qui revient chaque semaine</h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg font-bold leading-8 text-slate-600">En garde alternée ou partagée, les enfants partent à l’école avec une tenue et rentrent parfois dans l’autre foyer. Un manteau, un gilet ou une paire de chaussures peut alors mettre plusieurs jours à revenir. À force, il devient difficile de savoir où sont les vêtements et lesquels attendre. PtitVestiaire est né de ce quotidien pour donner aux parents un repère simple, commun et apaisant.</p>
          </div>
        </section>

        <section id="fonctionnalites" className="scroll-mt-24 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-700">Tout au même endroit</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">Suivre sans alourdir le quotidien</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {features.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className={`rounded-3xl border p-5 shadow-sm ${index % 2 === 0 ? 'border-cyan-100 bg-cyan-50/80' : 'border-violet-100 bg-violet-50/80'}`}>
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${index % 2 === 0 ? 'bg-cyan-100 text-cyan-800' : 'bg-violet-100 text-violet-800'}`}><Icon size={23} /></div>
                  <h3 className="mt-5 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="fonctionnement" className="scroll-mt-24 bg-slate-950 px-4 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Comment ça marche</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Trois étapes, pas davantage</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ['01', 'Créez votre famille', 'Ajoutez les enfants suivis et invitez l’autre parent si vous le souhaitez.'],
                ['02', 'Prenez une photo', 'Avant le départ, photographiez la tenue ou ajoutez les vêtements manuellement.'],
                ['03', 'Marquez le retour', 'Quand un vêtement revient, mettez son statut à jour en un geste.']
              ].map(([number, title, text]) => <article key={number} className="rounded-3xl border border-white/10 bg-white/5 p-6"><span className="text-4xl font-black text-cyan-300">{number}</span><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 font-bold leading-7 text-slate-300">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section id="tarifs" className="scroll-mt-24 px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-800">Formules prévues</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Commencez gratuitement</h2><p className="mx-auto mt-4 max-w-2xl font-bold text-slate-600">Le service est actuellement en phase de lancement. L’offre Premium et l’application définitive de ces quotas seront annoncées avant leur mise en service.</p></div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <PricingCard title="Gratuit" price="0 €" subtitle="Pour découvrir PtitVestiaire" features={freeFeatures} />
              <PricingCard title="Premium" price="24,99 €/an" subtitle="ou 2,99 €/mois · bientôt disponible" features={premiumFeatures} highlighted />
            </div>
            <div className="mt-8 text-center"><a href="#inscription" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 font-black text-white shadow-soft">Créer mon compte gratuitement <ArrowRight size={19} /></a></div>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-cyan-100 to-violet-100 p-7 text-center md:p-12">
            <h2 className="text-3xl font-black md:text-5xl">Un repère commun pour toute la famille</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-bold text-slate-600">Créez votre espace et commencez à suivre les vêtements qui circulent dès aujourd’hui.</p>
            <a href="#inscription" className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">Créer un compte gratuitement <ArrowRight size={19} /></a>
          </div>
        </section>
      </main>

      <div className="border-t border-slate-200 bg-white/80 px-4 pt-6 text-center text-sm font-bold text-slate-600">
        Une question ? <a className="font-black text-cyan-800 underline" href="mailto:contact@inopia.fr">contact@inopia.fr</a>
      </div>
      <PiedDePage />
    </div>
  );
}

function MockClothing({ color, label, child, childClass }: { color: string; label: string; child: string; childClass: string }) {
  return <article className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"><div className={`grid aspect-square place-items-center rounded-xl bg-gradient-to-br ${color}`}><Shirt size={54} className="text-slate-700/70" /></div><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-black ${childClass}`}>{child}</span><p className="mt-1 truncate text-sm font-black">{label}</p><p className="text-xs font-bold text-slate-400">Sorti aujourd’hui</p></article>;
}

function PricingCard({ title, price, subtitle, features, highlighted = false }: { title: string; price: string; subtitle: string; features: string[]; highlighted?: boolean }) {
  return <article className={`relative rounded-[2rem] border p-7 shadow-sm ${highlighted ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white'}`}>{highlighted && <span className="absolute right-5 top-5 rounded-full bg-violet-200 px-3 py-1 text-xs font-black text-violet-950">Bientôt</span>}<h3 className="text-2xl font-black">{title}</h3><p className="mt-4 text-4xl font-black">{price}</p><p className={`mt-2 font-bold ${highlighted ? 'text-slate-300' : 'text-slate-500'}`}>{subtitle}</p><ul className="mt-7 space-y-3">{features.map((feature) => <li key={feature} className="flex items-start gap-3 font-bold"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${highlighted ? 'bg-cyan-300 text-slate-950' : 'bg-cyan-100 text-cyan-900'}`}><Check size={13} strokeWidth={3} /></span>{feature}</li>)}</ul></article>;
}
