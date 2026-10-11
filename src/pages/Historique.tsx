import { Camera, MousePointerClick, ChevronLeft, ChevronRight } from ‘lucide-react’;
import { useMemo, useState } from ‘react’;
import { HistoriqueVetement } from ‘../components/HistoriqueVetement’;
import { FILLES, filleStyles } from ‘../lib/constants’;
import { formatDate, formatDateLong } from ‘../lib/dates’;
import { useJournalMouvements } from ‘../firebase/useMouvements’;
import { useVetements } from ‘../firebase/useVetements’;
import type { Fille, Mouvement, Vetement } from ‘../types’;

type Filter = Fille | ‘Toutes’;
type DateFilter = ‘today’ | ‘week’ | ‘month’ | ‘all’;

const ITEMS_PER_PAGE = 15;

function getDayDifference(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const other = new Date(date);
  other.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - other.getTime()) / (1000 * 60 * 60 * 24));
}

function getDateFilterLabel(dateFilter: DateFilter): string {
  switch (dateFilter) {
    case ‘today’:
      return ‘Aujourd\’hui’;
    case ‘week’:
      return ‘Cette semaine’;
    case ‘month’:
      return ‘Ce mois’;
    case ‘all’:
      return ‘Tous les mouvements’;
  }
}

function filterByDate(mouvements: Mouvement[], dateFilter: DateFilter): Mouvement[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return mouvements.filter((m) => {
    const movementDate = new Date(m.date.toDate?.() ?? m.date);
    const daysDiff = getDayDifference(movementDate);

    switch (dateFilter) {
      case ‘today’:
        return daysDiff === 0;
      case ‘week’:
        return daysDiff >= 0 && daysDiff < 7;
      case ‘month’:
        return daysDiff >= 0 && daysDiff < 30;
      case ‘all’:
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
      key = ‘Aujourd\’hui’;
    } else if (dayDiff === 1) {
      key = ‘Hier’;
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

export function Historique() {
  const [filleFilter, setFilleFilter] = useState<Filter>(‘Toutes’);
  const [dateFilter, setDateFilter] = useState<DateFilter>(‘all’);
  const [searchTerm, setSearchTerm] = useState(‘’);
  const [currentPage, setCurrentPage] = useState(0);
  const { mouvements, loading, error } = useJournalMouvements(filleFilter);
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

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Historique</p>
        <h2 className="mt-1 text-3xl font-black">Tous les mouvements</h2>
        <p className="mt-1 font-bold text-slate-500">{getDateFilterLabel(dateFilter)} du plus récent au plus ancien.</p>
      </div>

      {/* Filtre par fille */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([‘Toutes’, ...FILLES] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setFilleFilter(item);
              setCurrentPage(0);
            }}
            className={`shrink-0 rounded-full px-4 py-2 font-black ${filleFilter === item ? ‘bg-slate-950 text-white’ : ‘bg-white text-slate-600’}`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Filtre par date */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([‘today’, ‘week’, ‘month’, ‘all’] as DateFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setDateFilter(item);
              setCurrentPage(0);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap ${
              dateFilter === item ? ‘bg-cyan-600 text-white’ : ‘bg-cyan-100 text-cyan-700’
            }`}
          >
            {item === ‘today’
              ? ‘Aujourd\’hui’
              : item === ‘week’
                ? ‘Cette semaine’
                : item === ‘month’
                  ? ‘Ce mois’
                  : ‘Tous’}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div>
        <input
          type="text"
          placeholder="Rechercher un vêtement..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-950"
        />
      </div>

      {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement de l’historique...</p>}

      {/* Mouvements groupés par jour */}
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
                          <p className="truncate text-lg font-black capitalize">{vetement?.nom ?? ‘Vêtement supprimé’}</p>
                          <p className={`text-sm font-bold ${filleStyles[mouvement.fille].text}`}>{mouvement.fille}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                            {mouvement.origine === ‘photo’ ? <Camera size={14} /> : <MousePointerClick size={14} />}
                            {formatDate(mouvement.date)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                            mouvement.statut === ‘sorti’ ? ‘bg-slate-200 text-slate-700’ : ‘bg-emerald-100 text-emerald-700’
                          }`}
                        >
                          {mouvement.statut === ‘sorti’ ? ‘Sorti’ : ‘Rentré’}
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
          {searchTerm ? ‘Aucun vêtement ne correspond à votre recherche.’ : ‘Aucun mouvement enregistré.’}
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
            Précédent
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

      {detail && <HistoriqueVetement vetement={detail} onClose={() => setDetail(null)} />}
    </section>
  );
}
