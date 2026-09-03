import { Archive, LogOut, PlusCircle, Settings, Shirt, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Connexion } from './pages/Connexion';
import { Accueil } from './pages/Accueil';
import { ConfigurationFamille } from './pages/ConfigurationFamille';
import { GardeRobe } from './pages/GardeRobe';
import { Historique } from './pages/Historique';
import { NouvelleSortie } from './pages/NouvelleSortie';
import { Reglages } from './pages/Reglages';
import { TableauDeBord } from './pages/TableauDeBord';
import { VerificationEmail } from './pages/VerificationEmail';
import { ValidationEmail } from './pages/ValidationEmail';
import { ReinitialisationMotDePasse } from './pages/ReinitialisationMotDePasse';
import { Informations, type InformationSlug } from './pages/Informations';
import { PiedDePage } from './components/PiedDePage';
import { hasFirebaseConfig } from './firebase/config';
import { useAuth } from './firebase/useAuth';
import { useFamille, useFamillesUtilisateur } from './firebase/useFamilles';
import { definirFamilleCourante, familleIdCourante } from './firebase/familleCourante';

type Tab = 'dashboard' | 'garderobe' | 'nouvelle' | 'historique' | 'reglages';
type PublicRoute = 'accueil' | 'connexion' | 'inscription';

const tabs: Array<{ id: Tab; label: string; icon: typeof Shirt }> = [
  { id: 'dashboard', label: 'Aperçu', icon: Sparkles },
  { id: 'garderobe', label: 'Garde-robe', icon: Shirt },
  { id: 'nouvelle', label: 'Ajouter', icon: PlusCircle },
  { id: 'historique', label: 'Historique', icon: Archive },
  { id: 'reglages', label: 'Réglages', icon: Settings }
];

const informationPages: InformationSlug[] = ['a-propos', 'faq', 'cgu', 'confidentialite', 'cookies', 'mentions-legales'];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [informationPage, setInformationPage] = useState<InformationSlug | null>(() => {
    const hash = window.location.hash.replace('#', '') as InformationSlug;
    return informationPages.includes(hash) ? hash : null;
  });
  const [publicRoute, setPublicRoute] = useState<PublicRoute | null>(() => {
    const hash = window.location.hash.replace('#', '');
    if (informationPages.includes(hash as InformationSlug) || tabs.some((tab) => tab.id === hash)) return null;
    return hash === 'connexion' || hash === 'inscription' ? hash : 'accueil';
  });
  const auth = useAuth();
  const familles = useFamillesUtilisateur(auth.user?.emailVerified ? auth.user.uid : null);
  const familleId = familles.liens[0]?.familleId ?? null;
  const { famille, loading: familleLoading } = useFamille(familleId);
  const [familleActiveId, setFamilleActiveId] = useState<string | null>(() => familleIdCourante());
  const params = new URLSearchParams(window.location.search);
  const emailActionCode = params.get('mode') === 'verifyEmail' ? params.get('oobCode') : null;
  const passwordResetCode = params.get('mode') === 'resetPassword' ? params.get('oobCode') : null;

  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace('#', '');
      if (informationPages.includes(hash as InformationSlug)) {
        setInformationPage(hash as InformationSlug);
        setPublicRoute(null);
        return;
      }
      setInformationPage(null);
      if (tabs.some((tab) => tab.id === hash)) {
        setPublicRoute(null);
        setActiveTab(hash as Tab);
        return;
      }
      setPublicRoute(hash === 'connexion' || hash === 'inscription' ? hash : 'accueil');
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (!auth.loading && auth.user && publicRoute) window.location.hash = 'dashboard';
  }, [auth.loading, auth.user, publicRoute]);

  useEffect(() => {
    definirFamilleCourante(familleId);
    setFamilleActiveId(familleId);
  }, [familleId]);

  function openTab(tab: Tab) {
    setActiveTab(tab);
    window.location.hash = tab;
  }

  if (informationPage) {
    return <Informations page={informationPage} />;
  }

  if (auth.loading) {
    return <CenteredMessage title="PtitVestiaire" message="Chargement de la session..." />;
  }

  if (emailActionCode) {
    return <ValidationEmail actionCode={emailActionCode} />;
  }

  if (passwordResetCode) {
    return <ReinitialisationMotDePasse actionCode={passwordResetCode} />;
  }

  if (!hasFirebaseConfig || !auth.user || !auth.isAllowed) {
    if (publicRoute === 'connexion' || publicRoute === 'inscription') {
      return <Connexion key={publicRoute} auth={auth} firebaseReady={hasFirebaseConfig} initialMode={publicRoute} />;
    }
    return <Accueil />;
  }

  if (!auth.user.emailVerified) {
    return <VerificationEmail email={auth.user.email ?? ''} onResend={auth.sendVerification} onRefresh={auth.refreshVerification} onLogout={auth.logOut} />;
  }

  // Les écrans Firestore ne sont montés qu'après initialisation de la famille active.
  // Cela évite une première requête avec `__aucune__`, refusée à juste titre par les règles.
  if (familles.loading || (familleId && (familleLoading || familleActiveId !== familleId))) {
    return <CenteredMessage title="PtitVestiaire" message="Chargement de la famille..." />;
  }
  if (familles.liens.length === 0) {
    return <ConfigurationFamille userId={auth.user.uid} email={auth.user.email ?? ''} onCreated={() => window.location.reload()} onCancel={auth.logOut} />;
  }
  const enfants = famille?.enfants?.length ? famille.enfants : ['Enfant'];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#cffafe_0,#f8fafc_34%,#fff7ed_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">PtitVestiaire</p>
            <h1 className="text-2xl font-black leading-tight">{famille?.nom ?? 'Ma famille'}</h1>
          </div>
          <button
            type="button"
            onClick={() => void auth.logOut()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-8">
        {activeTab === 'dashboard' && <TableauDeBord enfants={enfants} />}
        {activeTab === 'garderobe' && <GardeRobe enfants={enfants} />}
        {activeTab === 'nouvelle' && <NouvelleSortie userId={auth.user.uid} enfants={enfants} onCreated={() => openTab('dashboard')} />}
        {activeTab === 'historique' && <Historique enfants={enfants} />}
        {activeTab === 'reglages' && <Reglages userEmail={auth.user.email ?? ''} userId={auth.user.uid} hasPasswordProvider={auth.hasPasswordProvider} onChangePassword={auth.changePassword} />}
      </main>

      <nav className="mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pt-2 backdrop-blur md:hidden">
        <div className="grid h-16 grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => openTab(tab.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-black ${
                  selected ? 'bg-slate-950 text-white' : 'text-slate-500'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <nav className="mx-auto hidden max-w-6xl px-4 pb-8 md:block">
        <div className="grid grid-cols-5 gap-3 rounded-3xl border border-white/80 bg-white/80 p-2 shadow-soft backdrop-blur">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => openTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black ${
                  selected ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={19} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
      <PiedDePage />
    </div>
  );
}

function CenteredMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center text-slate-950">
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 font-bold text-slate-600">{message}</p>
      </div>
    </main>
  );
}
