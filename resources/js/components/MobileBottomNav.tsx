import { ClipboardList, Home, ShieldCheck, ShoppingBag, User as UserIcon, UtensilsCrossed } from 'lucide-react';
import type { User } from '../types/bakery';

interface MobileBottomNavProps {
  user: User | null;
  activeView: 'home' | 'my-orders' | 'dapur-admin';
  cartCount: number;
  onNavigate: (view: 'home' | 'my-orders' | 'dapur-admin', sectionId?: string) => void;
  onOpenCartOrCheckout: () => void;
  onOpenAuth: () => void;
}

export function MobileBottomNav({
  user,
  activeView,
  cartCount,
  onNavigate,
  onOpenCartOrCheckout,
  onOpenAuth,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Navigasi aplikasi mobile"
      className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[430px] bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#5C3A21]/12 safe-area-bottom"
    >
      <div className="grid grid-cols-4 h-16 px-1">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
            activeView === 'home' ? 'text-[#D97706]' : 'text-[#7C604C] hover:text-[#5C3A21]'
          }`}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('home', 'katalog')}
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#7C604C] hover:text-[#5C3A21] transition-colors"
        >
          <UtensilsCrossed className="w-5 h-5" aria-hidden="true" />
          <span>Menu</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (cartCount > 0) {
              onOpenCartOrCheckout();
            } else {
              onNavigate('home', 'katalog');
            }
          }}
          className="relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#7C604C] hover:text-[#5C3A21] transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </div>
          <span>Keranjang</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else if (user.role === 'admin') {
              onNavigate('dapur-admin');
            } else {
              onNavigate('my-orders');
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
            activeView === 'my-orders' || activeView === 'dapur-admin' ? 'text-[#D97706]' : 'text-[#7C604C] hover:text-[#5C3A21]'
          }`}
        >
          {user?.role === 'admin' ? (
            <>
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              <span>Admin</span>
            </>
          ) : user ? (
            <>
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
              <span>Pesanan</span>
            </>
          ) : (
            <>
              <UserIcon className="w-5 h-5" aria-hidden="true" />
              <span>Masuk</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
