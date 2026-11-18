import React, { useEffect, useState } from 'react';
import {
  Anchor,
  ArrowUpRight,
  Check,
  Compass,
  Edit3,
  MapPin,
  Pin,
  Plus,
  Shield,
  X,
} from 'lucide-react';
import { useConsole } from '../context/ConsoleContext';
import {
  CONSTRAINTS,
  type ConsoleTab,
  type PostureMode,
  type VaultMemoryRecord,
} from '../types/console';

const POSTURES: PostureMode[] = ['Souverain', 'Vigilance', 'Immersion', 'Veille'];

const CREST_IMG = '/src/assets/images/ouroboros_crest_1795016712401.jpg';
const ABIDJAN_IMG = '/src/assets/images/abidjan_horizon_1795016713449.jpg';

interface MasterAnchorCardProps {
  onNavigate: (tab: ConsoleTab) => void;
  onSelectMemory: (mem: VaultMemoryRecord) => void;
}

export const MasterAnchorCard: React.FC<MasterAnchorCardProps> = ({
  onNavigate,
  onSelectMemory,
}) => {
  const {
    anchor,
    memories,
    activities,
    updateAnchor,
    logAnchorCheckIn,
    user,
  } = useConsole();

  const [abidjanTime, setAbidjanTime] = useState('');
  const [abidjanDate, setAbidjanDate] = useState('');
  const [editing, setEditing] = useState(false);
  const [draftDirective, setDraftDirective] = useState(anchor.directive);
  const [draftLocation, setDraftLocation] = useState(anchor.location);
  const [newModule, setNewModule] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [crestError, setCrestError] = useState(false);
  const [horizonError, setHorizonError] = useState(false);

  useEffect(() => {
    setDraftDirective(anchor.directive);
    setDraftLocation(anchor.location);
  }, [anchor.directive, anchor.location]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setAbidjanTime(
        new Intl.DateTimeFormat('fr-FR', {
          timeZone: 'Africa/Abidjan',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      );
      setAbidjanDate(
        new Intl.DateTimeFormat('fr-FR', {
          timeZone: 'Africa/Abidjan',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(now)
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveAnchor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftDirective.trim().length < CONSTRAINTS.DIRECTIVE_MIN) return;
    setSaving(true);
    try {
      await updateAnchor({
        directive: draftDirective.trim(),
        location: draftLocation.trim() || anchor.location,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePostureChange = async (posture: PostureMode) => {
    if (posture === anchor.posture) return;
    await updateAnchor({ posture });
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newModule.trim();
    if (!clean || anchor.focusModules.length >= CONSTRAINTS.FOCUS_MODULES_MAX) return;
    await updateAnchor({
      focusModules: [...anchor.focusModules, clean],
    });
    setNewModule('');
  };

  const handleRemoveModule = async (index: number) => {
    const next = anchor.focusModules.filter((_, i) => i !== index);
    await updateAnchor({ focusModules: next });
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await logAnchorCheckIn();
    } finally {
      setCheckingIn(false);
    }
  };

  const pinnedOrRecentMemories = [
    ...memories.filter((m) => m.pinned),
    ...memories.filter((m) => !m.pinned),
  ].slice(0, 4);

  const recentActivities = activities.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* DOMINANT FOCAL ANCHOR: Master Anchor Card */}
      <section className="hud-frame overflow-hidden">
        {/* Atmospheric Abidjan Horizon Header Strip */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden border-b border-slate-800/80 bg-[#0A101A]">
          {!horizonError ? (
            <img
              src={ABIDJAN_IMG}
              alt="Horizon nocturne d'Abidjan Plateau et Lagune Ébrié"
              referrerPolicy="no-referrer"
              onError={() => setHorizonError(true)}
              className="h-full w-full object-cover opacity-55"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0B1422] via-[#090F1A] to-[#070A0F] flex items-center justify-center">
              <Compass className="w-10 h-10 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D131D] via-[#0D131D]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F]/85 via-transparent to-[#070A0F]/70" />

          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{anchor.location}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="tabular-nums text-slate-400">{anchor.coordinates}</span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-lg sm:text-xl font-semibold text-[#E6EDF5] leading-none">
                  {abidjanTime} <span className="text-xs font-normal text-amber-400">GMT+0</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 capitalize">{abidjanDate}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-slate-700/80 bg-[#070A0F] shrink-0">
                  {!crestError ? (
                    <img
                      src={CREST_IMG}
                      alt="Emblème Ouroboros Razante"
                      referrerPolicy="no-referrer"
                      onError={() => setCrestError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#38BDF8]">
                      <Shield className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#38BDF8] font-medium tracking-wide">
                    Carte d’Ancrage Maître
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#E6EDF5] tracking-tight text-balance">
                    {anchor.ownerName}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {anchor.codename}
                    <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
                    Posture {anchor.posture}
                    <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
                    <span className="font-mono tabular-nums">
                      {anchor.checkInCount} ancrages validés
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                >
                  <Anchor className="w-4 h-4" />
                  {checkingIn ? 'Validation...' : 'Valider l’ancrage'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Master Anchor Body: Posture, Directive, Modules */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 cols: Directive & Posture */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-slate-200">
                  Posture opérationnelle
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {user ? 'Synchronisée Firestore' : 'Mode local hors-ligne'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#070A0F] border border-slate-800/90 rounded-md">
                {POSTURES.map((posture) => {
                  const active = anchor.posture === posture;
                  return (
                    <button
                      key={posture}
                      type="button"
                      onClick={() => handlePostureChange(posture)}
                      className={`px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#162235] text-[#38BDF8] border border-[#38BDF8]/35'
                          : 'text-slate-400 hover:text-[#E6EDF5] border border-transparent'
                      }`}
                    >
                      {posture}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/70">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-slate-200">
                  Directive souveraine active
                </h2>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38BDF8] transition-colors whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                )}
              </div>

              {!editing ? (
                <p className="text-[15px] text-slate-200 leading-relaxed max-w-[68ch]">
                  {anchor.directive}
                </p>
              ) : (
                <form onSubmit={handleSaveAnchor} className="space-y-3">
                  <div>
                    <label htmlFor="anchor-location" className="block text-xs text-slate-400 mb-1">
                      Secteur Abidjan
                    </label>
                    <input
                      id="anchor-location"
                      type="text"
                      value={draftLocation}
                      maxLength={CONSTRAINTS.LOCATION_MAX}
                      onChange={(e) => setDraftLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label htmlFor="anchor-directive" className="block text-xs text-slate-400 mb-1">
                      Directive ({draftDirective.length}/{CONSTRAINTS.DIRECTIVE_MAX})
                    </label>
                    <textarea
                      id="anchor-directive"
                      rows={3}
                      value={draftDirective}
                      maxLength={CONSTRAINTS.DIRECTIVE_MAX}
                      onChange={(e) => setDraftDirective(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8] leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={saving || draftDirective.trim().length < CONSTRAINTS.DIRECTIVE_MIN}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftDirective(anchor.directive);
                        setDraftLocation(anchor.location);
                        setEditing(false);
                      }}
                      className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 rounded-md hover:bg-slate-800 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right 5 cols: Active Focus Modules */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-800/70 lg:pl-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">
                Modules d’armure actifs
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {anchor.focusModules.length}/{CONSTRAINTS.FOCUS_MODULES_MAX}
              </span>
            </div>

            <ul className="divide-y divide-slate-800/70 border-y border-slate-800/70">
              {anchor.focusModules.map((mod, idx) => (
                <li
                  key={`${mod}-${idx}`}
                  className="py-2.5 flex items-center justify-between gap-3 text-sm text-slate-200"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-xs tabular-nums text-slate-500">
                      0{idx + 1}.
                    </span>
                    <span className="truncate">{mod}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveModule(idx)}
                    aria-label={`Retirer ${mod}`}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
              {anchor.focusModules.length === 0 && (
                <li className="py-4 text-xs text-slate-500">
                  Aucun module actif configuré. Ajoutez un module ci-dessous.
                </li>
              )}
            </ul>

            {anchor.focusModules.length < CONSTRAINTS.FOCUS_MODULES_MAX && (
              <form onSubmit={handleAddModule} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newModule}
                  maxLength={CONSTRAINTS.FOCUS_MODULE_MAX_LEN}
                  onChange={(e) => setNewModule(e.target.value)}
                  placeholder="Ajouter un module..."
                  className="flex-1 min-w-0 px-3 py-2 text-xs bg-[#070A0F] border border-slate-800 rounded-md text-[#E6EDF5] placeholder:text-slate-500 focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="submit"
                  disabled={!newModule.trim()}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-[#131C2B] border border-slate-700 text-[#E6EDF5] rounded-md hover:border-[#38BDF8]/60 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* BELOW HERO: Two balanced operational columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Memory Vault Quick Access */}
        <section className="lg:col-span-6 bg-[#0D131D] border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800/70">
            <div>
              <h2 className="font-display text-base font-semibold text-[#E6EDF5]">
                Coffre-fort Mémoire
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                {memories.length} entrées indexées hors-ligne
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('coffre')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC] transition-colors whitespace-nowrap"
            >
              Ouvrir le coffre
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/70">
            {pinnedOrRecentMemories.map((mem) => (
              <button
                key={mem.id}
                type="button"
                onClick={() => {
                  onSelectMemory(mem);
                  onNavigate('coffre');
                }}
                className="w-full py-3.5 text-left hover:bg-slate-800/25 transition-colors flex items-start justify-between gap-4 px-1"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {mem.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span className="text-sm font-medium text-[#E6EDF5] truncate">
                      {mem.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {mem.category}
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                    {mem.classification}
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                    {mem.source}
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                  {new Date(mem.updatedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity Journal */}
        <section className="lg:col-span-6 bg-[#0D131D] border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800/70">
            <div>
              <h2 className="font-display text-base font-semibold text-[#E6EDF5]">
                Journal d’Activité Récent
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                {activities.length} événements enregistrés
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('activite')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC] transition-colors whitespace-nowrap"
            >
              Tout consulter
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/70">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm text-[#E6EDF5] truncate">{act.summary}</p>
                  <p className="text-xs text-slate-400">
                    <span className="font-mono text-[#38BDF8]">{act.actionType}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                    <span>{act.location}</span>
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                  {new Date(act.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
