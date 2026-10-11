import { Camera, MousePointerClick, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HistoriqueVetement } from '../components/HistoriqueVetement';
import { getFilleStyles } from '../lib/constants';
import { formatDate, formatDateLong } from '../lib/dates';
import { useJournalMouvements } from '../firebase/useMouvements';
import { useVetements } from '../firebase/useVetements';
import type { Mouvement, Vetement } from '../types';

type DateFilter = 'today' | 'week' | 'month' | 'all';
const ITEMS_PER_PAGE = 15;

function getDayDifference(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const other = new Date(date);
  other.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - other.getTime()) / (1000 * 60 * 60 * 24));
}

function filterByDate(mouvements: Mouvement[], dateFilter: DateFilter): Mouvement[] {
  return mouvements.filter((m) => {
    const movementDate = new Date(m.date.toDate?.() ?? m.date);
    const daysDiff = getDayDifference(movementDate);

    switch (dateFilter) {
      case 'today':
        return daysDiff === 0;
      case 'week':
        return daysDiff >= 0 && daysDiff < 7;
      case 'month':
        return daysDiff >= 0 && daysDiff < 30;
      case 'all':
        return true;
    }
  });
}

function groupByDay(mouvements: Mouvement[]): Map<string, Mouvement[]> {
  const groups = new Map<string, Mouvement[]>();

  mouvements.forEach((m) => {
    const date = new Date(m.date.toDate?.() ?? m.date);
    const dayDiff = getDayDifference(date);

    let key: string;
    if (dayDiff === 0) {
      key = 'Aujourd\'hui';
    } else if (dayDiff === 1) {
      key = 'Hier';
    } else if (dayDiff < 7) {
      key = `Il y a ${dayDiff} jours`;
    } else {
      key = formatDateLong(date);
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(m);
  });

  return groups;
}

export function Historique({ enfants, premium }: { enfants: string[]; premium: boolean }) {
  const [filter, setFilter] = useState<string>('Tout');
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const { mouvements, loading, error } = useJournalMouvements(filter as any, 120, premium);
  const { vetements } = useVetements();
  const [detail, setDetail] = useState<Vetement | null>(null);

  const parId = useMemo(() => new Map(vetements.map((vetement) => [vetement.id, vetement])), [vetements]);

  const filteredByDate = useMemo(() => filterByDate(mouvements, dateFilter), [mouvements, dateFilter]);

  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return filteredByDate;
    const term = searchTerm.toLowerCase();
    return filteredByDate.filter((m) => {
      const vetement = parId.get(m.vetementId);
      return vetement?.nom.toLowerCase().includes(term);
    });
  }, [filteredByDate, searchTerm, parId]);

  const groupedByDay = useMemo(() => groupByDay(filteredBySearch), [filteredBySearch]);
  const allDays = useMemo(() => Array.from(groupedByDay.keys()), [groupedByDay]);

  const paginatedDays = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return allDays.slice(start, start + ITEMS_PER_PAGE);
  }, [allDays, currentPage]);

  const totalPages = Math.ceil(allDays.length / ITEMS_PER_PAGE);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Historique</p>
        <h2 className="mt-1 text-3xl font-black">Tous les mouvements</h2>
        <p className="mt-1 font-bold text-slate-500">Du plus recent au plus ancien.</p>
      </div>

      {/* Filtre par enfant */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['Tout', ...enfants] as string[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setFilter(item);
              setCurrentPage(0);
            }}
            className={`shrink-0 rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base font-black transition-colors ${filter === item ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Filtre par date */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['today', 'week', 'month', 'all'] as DateFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setDateFilter(item);
              setCurrentPage(0);
            }}
            className={`shrink-0 rounded-full px-3 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              dateFilter === item ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
            }`}
          >
            <span className="inline sm:hidden">
              {item === 'today' ? 'Auj.' : item === 'week' ? 'Sem.' : item === 'month' ? 'Mois' : 'Tous'}
            </span>
            <span className="hidden sm:inline">
              {item === 'today'
                ? 'Aujourd\'hui'
                : item === 'week'
                  ? 'Cette semaine'
                  : item === 'month'
                    ? 'Ce mois'
                    : 'Tous'}
            </span>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div>
        <input
          type="text"
          placeholder="Rechercher un vetement..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-950"
        />
      </div>

      {!premium && (
        <p className="rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-800">
          La formule gratuite affiche et conserve les 30 derniers jours.{' '}
          <a href="#reglages" className="font-black underline">
            Debloquer l'historique illimite
          </a>
        </p>
      )}

      {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement de l'historique...</p>}

      {/* Mouvements groupes par jour */}
      <div className="space-y-6">
        {paginatedDays.map((day) => {
          const dayMovements = groupedByDay.get(day) || [];
          return (
            <div key={day}>
              <h3 className="mb-3 font-black text-slate-700">{day}</h3>
              <ol className="space-y-3">
                {dayMovements.map((mouvement) => {
                  const vetement = parId.get(mouvement.vetementId) ?? null;
                  return (
                    <li key={mouvement.id}>
                      <button
                        type="button"
                        onClick={() => vetement && setDetail(vetement)}
                        disabled={!vetement}
                        className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:shadow-md disabled:cursor-default transition-shadow"
                      >
                        {mouvement.photoUrl ? (
                          <img src={mouvement.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" loading="lazy" />
                        ) : (
                          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                            <MousePointerClick size={20} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-black capitalize">{vetement?.nom ?? 'Vetement supprime'}</p>
                          <p className={`text-sm font-bold ${getFilleStyles(mouvement.fille).text}`}>{mouvement.fille}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                            {mouvement.origine === 'photo' ? <Camera size={14} /> : <MousePointerClick size={14} />}
                            {formatDate(mouvement.date)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                            mouvement.statut === 'sorti' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {mouvement.statut === 'sorti' ? 'Sorti' : 'Rentre'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>

      {!loading && filteredBySearch.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-center font-bold text-slate-500">
          {searchTerm ? 'Aucun vetement ne correspond a votre recherche.' : 'Aucun mouvement enregistre.'}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-3xl bg-white p-4">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200"
          >
            <ChevronLeft size={20} />
            Precedent
          </button>
          <span className="font-bold text-slate-600">
            Page {currentPage + 1} sur {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200"
          >
            Suivant
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {detail && <HistoriqueVetement vetement={detail} historiqueIllimite={premium} onClose={() => setDetail(null)} />}
    </section>
  );
}
