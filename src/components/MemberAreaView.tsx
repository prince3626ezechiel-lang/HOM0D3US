import React, { useEffect, useState } from 'react';
import { Check, LogIn, LogOut, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useConsole } from '../context/ConsoleContext';
import { CONSTRAINTS, type MemberStatus } from '../types/console';

export const MemberAreaView: React.FC = () => {
  const {
    user,
    authReady,
    isAdmin,
    authError,
    currentMember,
    privateProfile,
    members,
    signInWithGoogle,
    signOutUser,
    updateMemberProfile,
  } = useConsole();

  const [displayName, setDisplayName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Abidjan');
  const [status, setStatus] = useState<MemberStatus>('actif');
  const [clearanceNote, setClearanceNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentMember) {
      setDisplayName(currentMember.displayName);
      setCallsign(currentMember.callsign);
      setTitle(currentMember.title);
      setCity(currentMember.city);
      setStatus(currentMember.status);
    }
    if (privateProfile) {
      setClearanceNote(privateProfile.clearanceNote || '');
    }
  }, [currentMember, privateProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMemberProfile({
        displayName,
        callsign,
        title,
        city,
        status,
        clearanceNote,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!authReady) {
    return (
      <div className="bg-[#0D131D] border border-slate-800/80 p-8 text-sm text-slate-400">
        Initialisation de l’authentification Firebase...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#E6EDF5] tracking-tight">
            Espace Membre
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authentification Google sécurisée sur le projet Firebase ouroboros-maison
          </p>
        </div>

        <section className="hud-frame p-8 max-w-2xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#38BDF8]">
              <ShieldCheck className="w-4 h-4" />
              <span>Contrôle d’accès souverain</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-[#E6EDF5]">
              Connectez votre identité Google pour synchroniser votre console
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-[60ch]">
              La connexion active la synchronisation temps réel avec les collections Firestore{' '}
              <span className="font-mono text-xs text-slate-200">members</span>,{' '}
              <span className="font-mono text-xs text-slate-200">anchors</span>,{' '}
              <span className="font-mono text-xs text-slate-200">vault_memories</span> et{' '}
              <span className="font-mono text-xs text-slate-200">activity_history</span>.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 rounded">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            Se connecter avec Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#E6EDF5] tracking-tight">
            Espace Membre
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Profil opérateur vérifié · Isolation PII active · Projet ouroboros-maison
          </p>
        </div>
        <button
          type="button"
          onClick={signOutUser}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#131C2B] border border-slate-700 text-slate-200 rounded-md hover:border-rose-500/50 hover:text-rose-300 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Operator Profile Form */}
        <section className="lg:col-span-7 hud-frame p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-800/80">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Opérateur'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#131C2B] border border-slate-700 flex items-center justify-center text-[#38BDF8] shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-[#E6EDF5] truncate">
                {currentMember?.displayName || user.displayName || 'Opérateur'}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {privateProfile?.email || user.email}
                <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
                <span className="text-[#38BDF8]">
                  {isAdmin ? 'Habilitation Souverain' : 'Opérateur Razante'}
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="m-name" className="block text-xs text-slate-400 mb-1">
                  Nom d’affichage
                </label>
                <input
                  id="m-name"
                  type="text"
                  required
                  maxLength={CONSTRAINTS.DISPLAY_NAME_MAX}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label htmlFor="m-callsign" className="block text-xs text-slate-400 mb-1">
                  Indicatif tactique (MAJUSCULES)
                </label>
                <input
                  id="m-callsign"
                  type="text"
                  required
                  minLength={CONSTRAINTS.CALLSIGN_MIN}
                  maxLength={CONSTRAINTS.CALLSIGN_MAX}
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="m-title" className="block text-xs text-slate-400 mb-1">
                  Fonction / Rang
                </label>
                <input
                  id="m-title"
                  type="text"
                  required
                  maxLength={CONSTRAINTS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label htmlFor="m-city" className="block text-xs text-slate-400 mb-1">
                  Ville d’ancrage
                </label>
                <input
                  id="m-city"
                  type="text"
                  required
                  maxLength={CONSTRAINTS.CITY_MAX}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="m-status" className="block text-xs text-slate-400 mb-1">
                Statut opérationnel
              </label>
              <select
                id="m-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="actif">Actif</option>
                <option value="veille">En veille</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            <div>
              <label htmlFor="m-note" className="block text-xs text-slate-400 mb-1">
                Note d’habilitation privée (isolée dans /private/contact)
              </label>
              <input
                id="m-note"
                type="text"
                maxLength={CONSTRAINTS.CLEARANCE_NOTE_MAX}
                value={clearanceNote}
                onChange={(e) => setClearanceNote(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Synchronisation...' : 'Enregistrer le profil'}
              </button>
            </div>
          </form>
        </section>

        {/* Member Roster (collection: members) */}
        <section className="lg:col-span-5 bg-[#0D131D] border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="font-display text-base font-semibold text-[#E6EDF5]">
                Registre des Membres
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {members.length}
            </span>
          </div>

          <div className="divide-y divide-slate-800/70">
            {members.map((m) => (
              <div key={m.id} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#E6EDF5] truncate">
                    {m.displayName}
                  </span>
                  <span className="text-xs font-mono text-[#38BDF8] shrink-0">
                    {m.callsign}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {m.title}
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  {m.city}
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span className="capitalize">{m.status}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
