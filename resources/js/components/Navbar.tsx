import { LogOut, ShieldCheck, ShoppingBag } from 'lucide-react';
import type { SiteSettings, User, ViewMode } from '../types/bakery';
import { ViewModeSwitch } from './ViewModeSwitch';

interface NavbarProps {
  user: User | null;
  siteSettings: SiteSettings;
  activeView: 'home' | 'my-orders' | 'dapur-admin';
  cartCount: number;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  onNavigate: (view: 'home' | 'my-orders' | 'dapur-admin', sectionId?: string) => void;
  onOpenAuth: () => void;
  onOpenCartOrCheckout: () => void;
  onLogout: () => void;
}

export function Navbar({
  user,
  siteSettings,
  activeView,
  cartCount,
  viewMode,
  onChangeViewMode,
  canInstallPwa = false,
  onInstallPwa,
  onNavigate,
  onOpenAuth,
  onOpenCartOrCheckout,
  onLogout,
}: NavbarProps) {
  const isMobile = viewMode === 'mobile';

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-sm border-b border-[#5C3A21]/10">
      <div
        className={`max-w-6xl mx-auto ${
          isMobile ? 'px-3.5 h-14 gap-2' : 'px-4 sm:px-6 h-16 gap-3 md:gap-6'
        } flex items-center justify-between`}
      >
        {/* Zone 1: Single-line Brand Title */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className={`font-display ${
            isMobile ? 'text-base truncate max-w-[145px]' : 'text-lg sm:text-xl whitespace-nowrap shrink-0'
          } font-bold tracking-tight text-[#5C3A21] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D97706] rounded`}
        >
          {siteSettings.brandName}
        </a>

        {/* Zone 2: Clean single-line text nav links (Desktop Mode only) */}
        {!isMobile && (
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#7C604C]"
          >
            <a
              href="#katalog"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'katalog');
              }}
              className="hover:text-[#5C3A21] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Katalog Roti
            </a>
            <a
              href="#cabang"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'cabang');
              }}
              className="hover:text-[#5C3A21] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Cabang Toko
            </a>
            <a
              href="#cara-pesan"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home', 'cara-pesan');
              }}
              className="hover:text-[#5C3A21] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Cara Pesan
            </a>
            {user?.role === 'admin' && (
              <a
                href="/dapur-admin"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('dapur-admin');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#5C3A21] hover:bg-[#462B17] rounded-xl transition-colors whitespace-nowrap shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FDE68A]" aria-hidden="true" />
                <span>Dashboard Admin</span>
              </a>
            )}
            {user && user.role !== 'admin' && (
              <a
                href="/my-orders"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('my-orders');
                }}
                className={`hover:text-[#5C3A21] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'my-orders' ? 'text-[#5C3A21] font-semibold underline' : ''
                }`}
              >
                Riwayat Pesanan
              </a>
            )}
          </nav>
        )}

        {/* Zone 3: Mode Switch + Cart / User Actions */}
        <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2.5 sm:gap-3'} shrink-0`}>
          <ViewModeSwitch
            viewMode={viewMode}
            onChangeMode={onChangeViewMode}
            canInstallPwa={canInstallPwa}
            onInstallPwa={onInstallPwa}
            compact={isMobile}
          />

          {!isMobile && cartCount > 0 && (
            <button
              type="button"
              onClick={onOpenCartOrCheckout}
              aria-label={`Keranjang belanja (${cartCount} item)`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#5C3A21] bg-[#FAF5EC] hover:bg-[#F3E9D8] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
              <span className="tabular-nums">{cartCount} item</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {!isMobile && (
                <>
                  {user.role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('dapur-admin')}
                      className="md:hidden inline-flex items-center gap-1 text-xs font-bold text-[#5C3A21] underline underline-offset-4 whitespace-nowrap shrink-0 px-1 py-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                      <span>Admin</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate('my-orders')}
                      className="md:hidden text-xs font-semibold text-[#5C3A21] underline underline-offset-4 whitespace-nowrap shrink-0 px-1 py-2"
                    >
                      Pesanan
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-2">
                    {user.avatar && (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-[#5C3A21]/15 shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-[#5C3A21] truncate max-w-[130px]">
                      {user.name}
                    </span>
                  </div>
                </>
              )}
              {isMobile && user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-[#5C3A21]/15 shrink-0"
                />
              )}
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className={`inline-flex items-center gap-1.5 ${
                  isMobile ? 'px-2.5 py-1.5 min-h-[34px]' : 'px-3.5 py-2 min-h-[40px]'
                } text-xs font-semibold text-[#5C3A21] border border-[#5C3A21]/20 hover:bg-[#FAF5EC] rounded-lg transition-colors whitespace-nowrap shrink-0`}
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                {!isMobile && <span>Logout</span>}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`${
                isMobile ? 'px-2.5 py-1.5 text-xs min-h-[34px]' : 'px-4 py-2 text-xs sm:text-sm min-h-[40px]'
              } font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors whitespace-nowrap shrink-0`}
            >
              {isMobile ? 'Masuk' : 'Masuk / Daftar'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
