import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('CampusQuest UI error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6 dark:bg-ink-950">
          <div className="surface max-w-lg p-8 text-center">
            <span className="mx-auto mb-4 inline-flex rounded-2xl bg-rose-50 p-3 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle size={26} />
            </span>
            <h1 className="font-display text-xl font-bold text-ink-900 dark:text-white">Something broke on this screen</h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              The rest of CampusQuest is still running. Reload the page or head back to your dashboard.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
                Reload page
              </button>
              <a href="/dashboard" className="btn-secondary">
                Back to dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
