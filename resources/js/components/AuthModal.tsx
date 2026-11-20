import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import type { User } from '../types/bakery';

interface AuthModalProps {
  isOpen: boolean;
  pendingCheckout: boolean;
  initialError?: string | null;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export function AuthModal({
  isOpen,
  pendingCheckout,
  initialError = null,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/auth/google/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setGoogleConfigured(Boolean(data.configured));
        }
      })
      .catch(() => {
        // Ignore transient status check failure
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login' ? { email, password } : { name, email, password, phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Terjadi kesalahan saat autentikasi.');
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setError('Gagal terhubung ke server. Coba lagi sebentar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsSubmitting(true);
    try {
      let configured = googleConfigured;
      if (configured === null) {
        const res = await fetch('/api/auth/google/status');
        const contentType = res.headers.get('content-type') ?? '';
        if (!res.ok || !contentType.includes('application/json')) {
          setError(
            'Server backend perlu di-restart agar fitur Google OAuth aktif. Tekan Ctrl+C di terminal lalu jalankan "npm run dev" kembali.'
          );
          setIsSubmitting(false);
          return;
        }
        const data = await res.json();
        configured = Boolean(data.configured);
        setGoogleConfigured(configured);
      }

      if (!configured) {
        setError(
          'Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env lalu restart server (npm run dev).'
        );
        setIsSubmitting(false);
        return;
      }

      const redirectUrl = pendingCheckout
        ? '/api/auth/google/redirect?checkout=1'
        : '/api/auth/google/redirect';
      window.location.href = redirectUrl;
    } catch {
      setError('Gagal terhubung ke layanan Google Login.');
      setIsSubmitting(false);
    }
  }

  function fillDemoCredentials() {
    setMode('login');
    setEmail('siti@rotihajatan.id');
    setPassword('password123');
    setError(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C3A21]/45 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-[#FFFDF9] rounded-2xl border border-[#5C3A21]/15 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#5C3A21]/10 flex items-start justify-between gap-4">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-xl font-bold text-[#5C3A21]"
            >
              {mode === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
            </h2>
            <p className="mt-1 text-xs text-[#6E5644]">
              {pendingCheckout
                ? 'Keranjang belanja Anda aman tersimpan. Masuk untuk melanjutkan checkout.'
                : 'Masuk untuk melacak pesanan dan mengisi data checkout secara otomatis.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog masuk"
            className="p-1.5 text-[#7C604C] hover:text-[#5C3A21] rounded-lg hover:bg-[#FAF5EC] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Google Login (Laravel Socialite flow) */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#5C3A21] bg-white hover:bg-[#FAF5EC] border border-[#5C3A21]/20 rounded-xl transition-colors min-h-[44px] disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-[#5C3A21]/10" />
            <span className="px-3 text-xs text-[#7C604C]">atau dengan email</span>
            <div className="flex-grow border-t border-[#5C3A21]/10" />
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF5EC] rounded-xl border border-[#5C3A21]/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'login' ? 'bg-white text-[#5C3A21] shadow-xs' : 'text-[#6E5644]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'register' ? 'bg-white text-[#5C3A21] shadow-xs' : 'text-[#6E5644]'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Siti Aminah"
                  className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-[#5C3A21] mb-1"
              >
                Alamat Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-phone"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#5C3A21] mb-1"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7C604C] hover:text-[#5C3A21] transition-colors rounded-lg focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors min-h-[44px] disabled:opacity-60"
            >
              {isSubmitting
                ? 'Memproses...'
                : mode === 'login'
                  ? 'Masuk Sekarang'
                  : 'Daftar & Lanjutkan'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="pt-2 border-t border-[#5C3A21]/10 flex items-center justify-between text-xs text-[#7C604C]">
              <span>Ingin coba cepat?</span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="font-semibold text-[#D97706] hover:underline underline-offset-4"
              >
                Isi Akun Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
