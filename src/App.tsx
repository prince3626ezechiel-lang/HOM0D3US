import React, { useState } from 'react';
import {
  Anchor,
  Database,
  History,
  LogIn,
  Menu,
  UserCheck,
  X,
} from 'lucide-react';
import { ActivityHistoryView } from './components/ActivityHistoryView';
import { MasterAnchorCard } from './components/MasterAnchorCard';
import { MemberAreaView } from './components/MemberAreaView';
import { MemoryVaultView } from './components/MemoryVaultView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useConsole } from './context/ConsoleContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import type { ConsoleTab, VaultMemoryRecord } from './types/console';

const NAV_ITEMS: Array<{
  id: ConsoleTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'accueil', label: 'Accueil', icon: Anchor },
  { id: 'coffre', label: 'Coffre-fort', icon: Database },
  { id: 'activite', label: 'Journal', icon: History },
  { id: 'membre', label: 'Espace Membre', icon: UserCheck },
];

export default function App() {
  const { user, currentMember, syncNotice, clearSyncNotice, signInWithGoogle } = useConsole();
  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<ConsoleTab>('accueil');
  const [selectedMemory, setSelectedMemory] = useState<VaultMemoryRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNavLabel =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? 'Accueil';

  const handleNavigate = (tab: ConsoleTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#E6EDF5] flex">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#0A0F17] border-r border-slate-800/80">
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
          <span className="font-display text-base font-bold tracking-wider text-[#E6EDF5] whitespace-nowrap">
            OUROBOROS RAZANTE
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#131C2B] text-[#38BDF8] border border-[#38BDF8]/30'
                    : 'text-slate-400 hover:text-[#E6EDF5] hover:bg-slate-800/35 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
          <div className="text-[#E6EDF5] font-medium truncate">
            {currentMember?.displayName || user?.displayName || 'Prince Ezechiel'}
          </div>
          <div>
            Abidjan · GMT+0
            <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
            <span>{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-[#0A0F17] border-r border-slate-800 flex flex-col">
            <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800">
              <span className="font-display text-sm font-bold tracking-wider text-[#E6EDF5]">
                OUROBOROS RAZANTE
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
                className="p-1.5 text-slate-400 hover:text-[#E6EDF5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      active
                        ? 'bg-[#131C2B] text-[#38BDF8] border border-[#38BDF8]/30'
                        : 'text-slate-400 hover:text-[#E6EDF5]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Viewport */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 lg:h-16 px-4 sm:px-8 border-b border-slate-800/80 bg-[#070A0F]/95 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 -ml-1 text-slate-300 hover:text-[#E6EDF5]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">OUROBOROS RAZANTE</span>
              <span aria-hidden="true" className="text-slate-600 hidden sm:inline">/</span>
              <span className="font-medium text-[#E6EDF5] truncate">{currentNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
            {user ? (
              <button
                type="button"
                onClick={() => handleNavigate('membre')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#131C2B] border border-slate-700/80 text-[#E6EDF5] rounded-md hover:border-[#38BDF8]/60 transition-colors whitespace-nowrap shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="max-w-[140px] truncate">
                  {currentMember?.displayName || user.displayName || 'Membre'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                Connexion Google
              </button>
            )}
          </div>
        </header>

        {/* Sync Feedback Notice */}
        {syncNotice && (
          <div className="px-4 sm:px-8 pt-4">
            <div className="max-w-6xl mx-auto bg-[#0D131D] border border-[#38BDF8]/35 px-4 py-2.5 flex items-center justify-between gap-4 text-xs text-slate-200">
              <span>{syncNotice}</span>
              <button
                type="button"
                onClick={clearSyncNotice}
                aria-label="Fermer la notification"
                className="text-slate-400 hover:text-[#E6EDF5]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active View Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'accueil' && (
              <MasterAnchorCard
                onNavigate={handleNavigate}
                onSelectMemory={(mem) => setSelectedMemory(mem)}
              />
            )}
            {activeTab === 'coffre' && (
              <MemoryVaultView initialSelected={selectedMemory} />
            )}
            {activeTab === 'activite' && <ActivityHistoryView />}
            {activeTab === 'membre' && <MemberAreaView />}
          </div>
        </main>
      </div>

      <OfflineIndicator />
    </div>
  );
}
