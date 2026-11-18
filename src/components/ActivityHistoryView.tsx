import React, { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { useConsole } from '../context/ConsoleContext';
import type { ActivityActionType } from '../types/console';

const ACTION_FILTERS: Array<'TOUT' | ActivityActionType> = [
  'TOUT',
  'ANCRAGE',
  'MEMOIRE',
  'POSTURE',
  'AUTH',
  'SYNC',
];

export const ActivityHistoryView: React.FC = () => {
  const { activities, user } = useConsole();
  const [filter, setFilter] = useState<'TOUT' | ActivityActionType>('TOUT');
  const [queryText, setQueryText] = useState('');

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return activities.filter((act) => {
      if (filter !== 'TOUT' && act.actionType !== filter) return false;
      if (!q) return true;
      return (
        act.summary.toLowerCase().includes(q) ||
        act.memberName.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q) ||
        act.location.toLowerCase().includes(q)
      );
    });
  }, [activities, filter, queryText]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#E6EDF5] tracking-tight">
            Journal d’Activité
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {user
              ? 'Collection Firestore activity_history synchronisée en temps réel'
              : 'Journal local hors-ligne — connectez-vous pour synchroniser avec Firestore'}
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-400">
          {filtered.length} / {activities.length} entrées
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0D131D] border border-slate-800/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {ACTION_FILTERS.map((type) => {
            const active = filter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#162235] text-[#38BDF8] border border-[#38BDF8]/35'
                    : 'text-slate-400 hover:text-[#E6EDF5] border border-transparent'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Filtrer l’historique..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#070A0F] border border-slate-800 rounded-md text-[#E6EDF5] placeholder:text-slate-500 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
      </div>

      {/* High-density Table */}
      <div className="bg-[#0D131D] border border-slate-800/80 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-7 h-7 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Aucune activité trouvée</p>
            <p className="text-xs text-slate-500">
              Les ancrages, changements de posture et opérations du coffre apparaissent ici.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-medium">
                <th className="py-3 px-4 whitespace-nowrap">Horodatage</th>
                <th className="py-3 px-4 whitespace-nowrap">Type</th>
                <th className="py-3 px-4">Résumé</th>
                <th className="py-3 px-4 whitespace-nowrap">Opérateur</th>
                <th className="py-3 px-4 whitespace-nowrap">Secteur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-400 whitespace-nowrap">
                    {new Date(act.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#38BDF8] whitespace-nowrap">
                    {act.actionType}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{act.summary}</div>
                    {act.details && (
                      <div className="text-xs text-slate-500 mt-0.5">{act.details}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                    {act.memberName}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {act.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
