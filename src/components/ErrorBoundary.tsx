import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application Error Boundary caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Unknown runtime error';
      const isApiKeyOrDomain =
        errorMsg.includes('api-key') ||
        errorMsg.includes('unauthorized-domain') ||
        errorMsg.includes('referrer') ||
        errorMsg.includes('permission-denied');

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black tracking-tight">JERSEY INVESTMENT</h2>
              <p className="text-xs text-slate-400">
                {isApiKeyOrDomain
                  ? 'Cloud Services or Domain Authorization is currently synchronizing.'
                  : 'An unexpected application display error occurred.'}
              </p>
            </div>

            {isApiKeyOrDomain && (
              <div className="bg-slate-800/80 rounded-2xl p-3 text-left border border-slate-700/60 text-[11px] text-slate-300 space-y-1.5">
                <span className="font-bold text-amber-400 block">Notice for Domain / Public URL:</span>
                <p className="leading-relaxed">
                  If you just deployed to a new public domain (e.g. Vercel), ensure your domain is added to{' '}
                  <strong className="text-white">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</strong>.
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Website</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
