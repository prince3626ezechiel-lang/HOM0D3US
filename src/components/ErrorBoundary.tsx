import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Erreur système inattendue',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070A0F] text-[#E6EDF5] flex items-center justify-center p-6">
          <div className="hud-frame max-w-lg w-full p-8 space-y-5">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="font-display text-xl font-semibold">
                Interruption du Noyau Console
              </h1>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Une erreur de sécurité ou de synchronisation Firestore a interrompu le rendu. Les données locales restent protégées.
            </p>
            <pre className="bg-[#070A0F] border border-slate-800 p-3 text-xs font-mono text-slate-400 overflow-x-auto max-h-40">
              {this.state.errorMessage}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser la console
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
