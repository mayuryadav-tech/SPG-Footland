import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let message = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(message) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed === 'object' && parsed.error) {
        message = `${parsed.error}${parsed.path ? ` (${parsed.operationType || 'request'} on ${parsed.path})` : ''}`;
      }
    } catch {
      // Keep original message
    }
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
