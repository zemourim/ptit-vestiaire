import { Archive, LogOut, PlusCircle, Settings, Shirt, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Connexion } from './pages/Connexion';
import { GardeRobe } from './pages/GardeRobe';
import { Historique } from './pages/Historique';
import { NouvelleSortie } from './pages/NouvelleSortie';
import { Reglages } from './pages/Reglages';
import { TableauDeBord } from './pages/TableauDeBord';
import { hasFirebaseConfig } from './firebase/config';
import { useAuth } from './firebase/useAuth';

type Tab = 'dashboard' | 'garderobe' | 'nouvelle' | 'historique' | 'reglages';

const tabs: Array<{ id: Tab; label: string; icon: typeof Shirt }> = [
  { id: 'dashboard', label: 'Aperçu', icon: Sparkles },
  { id: 'garderobe', label: 'Garde-robe', icon: Shirt },
  { id: 'nouvelle', label: 'Ajouter', icon: PlusCircle },
  { id: 'historique', label: 'Historique', icon: Archive },
  { id: 'reglages', label: 'Réglages', icon: Settings }
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const auth = useAuth();

  useEffect(() => {
    const nextTab = window.location.hash.replace('#', '') as Tab;
    if (tabs.some((tab) => tab.id === nextTab)) setActiveTab(nextTab);
  }, []);

  function openTab(tab: Tab) {
    setActiveTab(tab);
    window.location.hash = tab;
  }

  if (auth.loading) {
    return <CenteredMessage title="PtitVestiaire" message="Chargement de la session..." />;
  }

  if (!hasFirebaseConfig || !auth.user || !auth.isAllowed) {
    return <Connexion auth={auth} firebaseReady={hasFirebaseConfig} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#cffafe_0,#f8fafc_34%,#fff7ed_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">PtitVestiaire</p>
            <h1 className="text-2xl font-black leading-tight">Sanaa & Manelle</h1>
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
        {activeTab === 'dashboard' && <TableauDeBord />}
        {activeTab === 'garderobe' && <GardeRobe />}
        {activeTab === 'nouvelle' && <NouvelleSortie userId={auth.user.uid} onCreated={() => openTab('dashboard')} />}
        {activeTab === 'historique' && <Historique />}
        {activeTab === 'reglages' && <Reglages userEmail={auth.user.email ?? ''} />}
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
