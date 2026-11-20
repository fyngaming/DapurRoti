import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Unhandled app error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFDF9] text-[#5C3A21] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#5C3A21]/15 p-6 shadow-md text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl mb-3">
              !
            </div>
            <h1 className="font-display text-xl font-bold text-[#5C3A21]">
              Terjadi Kendala Tampilan
            </h1>
            <p className="mt-2 text-xs text-[#7C604C] leading-relaxed">
              Halaman mengalami kesalahan sementara saat berpindah menu. Klik tombol di bawah untuk memuat ulang ke beranda.
            </p>
            <div className="mt-5 flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#5C3A21] hover:bg-[#462B17] rounded-xl transition-colors"
              >
                Kembali ke Beranda Toko
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore service worker registration errors in unsupported environments
    });
  });
}
