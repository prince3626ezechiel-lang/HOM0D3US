import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#E6EDF5] bg-[#131C2B] border border-slate-700/70 rounded-md hover:border-[#38BDF8]/60 hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        Installer l’app
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#E6EDF5] bg-[#131C2B] border border-slate-700/70 rounded-md hover:border-[#38BDF8]/60 hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
        >
          <Share className="w-3.5 h-3.5" />
          Installer sur iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="hud-frame w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#E6EDF5]">
                  Installer OUROBOROS RAZANTE
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fermer"
                  className="p-1.5 text-slate-400 hover:text-[#E6EDF5] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Appuyez sur le bouton <strong>Partager</strong> dans la barre Safari.</li>
                <li>Sélectionnez <strong>Sur l’écran d’accueil</strong> pour activer le mode autonome hors-ligne.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 text-xs font-medium bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
