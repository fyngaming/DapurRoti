/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdCarousel } from './components/AdCarousel';
import { AdminPage } from './components/AdminPage';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MyOrdersPage } from './components/MyOrdersPage';
import { Navbar } from './components/Navbar';
import { MapPin } from 'lucide-react';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ProductCatalog } from './components/ProductCatalog';
import { StoreBranchesSection } from './components/StoreBranchesSection';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_ADS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_PROMOS,
  SEED_STORES,
} from './data/seedProducts';
import type {
  AdBanner,
  CartItem,
  Category,
  Order,
  Product,
  ProductCategory,
  Promo,
  SiteSettings,
  StoreBranch,
  User,
  ViewMode,
} from './types/bakery';
import { calculateOrderTotals } from './utils/orderLogic';

const CART_STORAGE_KEY = 'roti_hajatan_cart_v1';
const VIEW_MODE_STORAGE_KEY = 'roti_hajatan_view_mode_v1';
const SELECTED_STORE_STORAGE_KEY = 'roti_hajatan_selected_store_v1';

function loadSavedStoreId(): number | null {
  try {
    const raw = localStorage.getItem(SELECTED_STORE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function loadInitialViewMode(): ViewMode {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === 'desktop' || saved === 'mobile') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
}

type ActiveRoute = 'home' | 'my-orders' | 'dapur-admin';

function resolveRoute(pathname: string): ActiveRoute {
  if (pathname === '/my-orders') return 'my-orders';
  if (pathname === '/dapur-admin') return 'dapur-admin';
  return 'home';
}

function loadSavedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.product_id === 'number' && typeof item.quantity === 'number')
      .map((item) => ({
        ...item,
        variant: typeof item.variant === 'string' && item.variant.trim() ? item.variant : 'Original',
      }));
  } catch {
    return [];
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [stores, setStores] = useState<StoreBranch[]>(SEED_STORES);
  const [promos, setPromos] = useState<Promo[]>(SEED_PROMOS);
  const [ads, setAds] = useState<AdBanner[]>(SEED_ADS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(loadSavedStoreId);
  const [cart, setCart] = useState<CartItem[]>(loadSavedCart);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [activeView, setActiveView] = useState<ActiveRoute>(() =>
    resolveRoute(window.location.pathname)
  );
  const [viewMode, setViewMode] = useState<ViewMode>(loadInitialViewMode);
  const [isViewModeManual, setIsViewModeManual] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return saved === 'desktop' || saved === 'mobile';
    } catch {
      return false;
    }
  });
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ order: Order; whatsappUrl: string } | null>(
    null
  );

  // Listen to PWA install prompt event
  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // Auto-adapt view mode on window resize when user has not manually locked a mode
  useEffect(() => {
    if (isViewModeManual) return;
    const onResize = () => {
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isViewModeManual]);

  function handleChangeViewMode(nextMode: ViewMode) {
    setViewMode(nextMode);
    setIsViewModeManual(true);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    } catch {
      // Ignore storage errors
    }
  }

  async function handleInstallPwa() {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch {
      // Ignore prompt choice errors
    }
    setDeferredInstallPrompt(null);
  }

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    const onPopState = () => {
      setActiveView(resolveRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Add noindex meta when viewing private admin route
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (activeView === 'dapur-admin') {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'robots';
        document.head.appendChild(meta);
      }
      meta.content = 'noindex, nofollow';
    } else if (meta) {
      meta.remove();
    }
  }, [activeView]);

  const fetchCatalog = useCallback(async () => {
    try {
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData.categories) && prodData.categories.length > 0) {
          setCategories(prodData.categories);
        }
        if (Array.isArray(prodData.products)) {
          setProducts(prodData.products);
        }
        if (Array.isArray(prodData.stores) && prodData.stores.length > 0) {
          setStores(prodData.stores);
        }
        if (Array.isArray(prodData.promos)) {
          setPromos(prodData.promos);
        }
        if (Array.isArray(prodData.ads)) {
          setAds(prodData.ads);
        }
        if (prodData.settings && typeof prodData.settings === 'object') {
          setSiteSettings((prev) => ({ ...prev, ...prodData.settings }));
        }
      }
    } catch {
      // Keep seed catalog fallback
    }
  }, []);

  useEffect(() => {
    if (siteSettings.brandName) {
      document.title =
        activeView === 'dapur-admin'
          ? `Admin · ${siteSettings.brandName}`
          : `${siteSettings.brandName} · ${siteSettings.footerServiceText}`;
    }
  }, [siteSettings.brandName, siteSettings.footerServiceText, activeView]);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {
      // Keep existing orders state on transient failure
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const authStatus = params.get('auth');
      const authError = params.get('auth_error');
      const shouldOpenCheckout = params.get('checkout') === '1';

      if (authStatus || authError || shouldOpenCheckout) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (authError) {
        const errorMap: Record<string, string> = {
          google_not_configured:
            'Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env lalu restart server.',
          google_cancelled: 'Login Google dibatalkan. Silakan coba lagi atau masuk dengan email.',
          google_state_invalid: 'Sesi verifikasi Google kedaluwarsa. Silakan klik Masuk dengan Google lagi.',
          google_token_failed:
            'Gagal memverifikasi token Google. Pastikan GOOGLE_CLIENT_SECRET & Authorized Redirect URI di Google Cloud Console sudah sesuai.',
          google_profile_failed: 'Gagal mengambil profil akun Google Anda. Silakan coba lagi.',
          google_server_error: 'Terjadi kesalahan saat menghubungkan ke server Google. Silakan coba lagi.',
        };
        setAuthErrorMessage(errorMap[authError] ?? 'Gagal masuk dengan Google. Silakan coba lagi.');
        setIsAuthOpen(true);
      }

      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            setUser(meData.user);
            if (authStatus === 'google_success' && shouldOpenCheckout && loadSavedCart().length > 0) {
              setIsCheckoutOpen(true);
            }
          }
        }
      } catch {
        // Ignore transient init auth failure
      }
      await fetchCatalog();
    }
    init();
  }, [fetchCatalog]);

  useEffect(() => {
    if (user && activeView === 'my-orders') {
      fetchOrders();
    }
  }, [user, activeView, fetchOrders]);

  const { totalItems, totalAmount } = useMemo(
    () => calculateOrderTotals(cart, 'direct'),
    [cart]
  );

  const activeStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) ?? stores[0] ?? null,
    [stores, selectedStoreId]
  );

  function handleSelectStore(storeId: number, scrollToCatalog = false) {
    setSelectedStoreId(storeId);
    try {
      localStorage.setItem(SELECTED_STORE_STORAGE_KEY, String(storeId));
    } catch {
      // Ignore storage errors
    }
    if (scrollToCatalog) {
      setTimeout(() => {
        document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    }
  }

  function handleNavigate(view: 'home' | 'my-orders', sectionId?: string) {
    setActiveView(view);
    const targetPath = view === 'my-orders' ? '/my-orders' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    if (view === 'home' && sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleAddToCart(product: Product, variant: string) {
    const maxStock = Math.max(0, Number(product.stock ?? 0));
    if (maxStock <= 0) return;

    const resolvedVariant = variant.trim() || product.variants?.[0] || 'Original';
    setCart((prev) => {
      const totalForProduct = prev
        .filter((i) => i.product_id === product.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (totalForProduct >= maxStock) {
        return prev;
      }

      const existing = prev.find(
        (i) => i.product_id === product.id && i.variant === resolvedVariant
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id && i.variant === resolvedVariant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          variant: resolvedVariant,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ];
    });
  }

  function handleUpdateQuantity(productId: number, variant: string, delta: number) {
    const product = products.find((p) => p.id === productId);
    const maxStock = product ? Math.max(0, Number(product.stock ?? 0)) : Infinity;

    setCart((prev) => {
      if (delta > 0) {
        const totalForProduct = prev
          .filter((i) => i.product_id === productId)
          .reduce((sum, i) => sum + i.quantity, 0);
        if (totalForProduct + delta > maxStock) {
          return prev;
        }
      }
      return prev
        .map((item) =>
          item.product_id === productId && item.variant === variant
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  }

  function handleProceedToCheckout() {
    if (!user) {
      setPendingCheckoutAfterAuth(true);
      setIsAuthOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  }

  function handleAuthenticated(authenticatedUser: User) {
    setUser(authenticatedUser);
    setIsAuthOpen(false);
    if (pendingCheckoutAfterAuth && cart.length > 0) {
      setPendingCheckoutAfterAuth(false);
      setIsCheckoutOpen(true);
    } else {
      setPendingCheckoutAfterAuth(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setOrders([]);
    if (activeView === 'my-orders') {
      handleNavigate('home');
    }
  }

  function handleOrderCreated(order: Order, whatsappUrl: string) {
    setIsCheckoutOpen(false);
    setCart([]);
    setCreatedOrder({ order, whatsappUrl });
    fetchOrders();
    fetchCatalog();
  }

  if (activeView === 'dapur-admin') {
    return (
      <AdminPage
        user={user}
        siteSettings={siteSettings}
        viewMode={viewMode}
        onChangeViewMode={handleChangeViewMode}
        canInstallPwa={Boolean(deferredInstallPrompt)}
        onInstallPwa={handleInstallPwa}
        onAdminAuthenticated={(adminUser) => setUser(adminUser)}
        onStorefrontDataChanged={fetchCatalog}
        onNavigateHome={() => handleNavigate('home')}
        onLogout={handleLogout}
      />
    );
  }

  const isMobileMode = viewMode === 'mobile';

  return (
    <div
      data-view-mode={viewMode}
      className={isMobileMode ? 'app-shell-mobile-backdrop' : 'min-h-screen bg-[#FFFDF9] text-[#5C3A21]'}
    >
      <div
        className={
          isMobileMode
            ? 'app-shell-mobile-frame flex flex-col text-[#5C3A21]'
            : 'min-h-screen flex flex-col bg-[#FFFDF9] text-[#5C3A21]'
        }
      >
        <Navbar
          user={user}
          siteSettings={siteSettings}
          activeView={activeView}
          cartCount={totalItems}
          viewMode={viewMode}
          onChangeViewMode={handleChangeViewMode}
          canInstallPwa={Boolean(deferredInstallPrompt)}
          onInstallPwa={handleInstallPwa}
          onNavigate={handleNavigate}
          onOpenAuth={() => {
            setPendingCheckoutAfterAuth(false);
            setIsAuthOpen(true);
          }}
          onOpenCartOrCheckout={handleProceedToCheckout}
          onLogout={handleLogout}
        />

        <main className="flex-1">
          {activeView === 'home' ? (
            <>
              <HeroSection
                isMobileMode={isMobileMode}
                onExploreCatalog={() => {
                  document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
              <AdCarousel
                ads={ads}
                isMobileMode={isMobileMode}
                onActionClick={() => {
                  document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Active Store Branch Selector Bar above Catalog */}
              {activeStore && (
                <div className={isMobileMode ? 'pt-5 px-4' : 'pt-6 px-4 sm:px-6'}>
                  <div className="max-w-6xl mx-auto px-4 py-3 rounded-2xl bg-[#FAF5EC] border border-[#5C3A21]/12 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#D97706]/15 text-[#D97706] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7C604C]">
                          Memesan dari Cabang
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[#5C3A21] truncate">
                          {activeStore.name}{' '}
                          <span className="font-normal text-[#6E5644]">· {activeStore.hours}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('cabang')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#5C3A21] bg-white hover:bg-[#F3E9D8] border border-[#5C3A21]/20 rounded-xl transition-colors whitespace-nowrap shrink-0"
                    >
                      Lihat {stores.length} Cabang &amp; Maps
                    </button>
                  </div>
                </div>
              )}

              <ProductCatalog
                categories={categories}
                products={products}
                cart={cart}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
              <StoreBranchesSection
                stores={stores}
                selectedStoreId={activeStore?.id ?? null}
                brandName={siteSettings.brandName}
                isMobileMode={isMobileMode}
                onSelectStore={handleSelectStore}
              />
              <HowItWorksSection />
            </>
          ) : (
            <MyOrdersPage
              user={user}
              orders={orders}
              isLoading={isLoadingOrders}
              onBackToCatalog={() => handleNavigate('home')}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>

        <Footer siteSettings={siteSettings} isMobileMode={isMobileMode} />

        {activeView === 'home' && !isCheckoutOpen && (
          <FloatingCartBar
            cart={cart}
            totalItems={totalItems}
            totalAmount={totalAmount}
            isMobileMode={isMobileMode}
            onUpdateQuantity={handleUpdateQuantity}
            onProceedToCheckout={handleProceedToCheckout}
            onClearCart={() => setCart([])}
          />
        )}

        {isMobileMode && !isCheckoutOpen && (
          <MobileBottomNav
            user={user}
            activeView={activeView}
            cartCount={totalItems}
            onNavigate={handleNavigate}
            onOpenCartOrCheckout={handleProceedToCheckout}
            onOpenAuth={() => {
              setPendingCheckoutAfterAuth(false);
              setIsAuthOpen(true);
            }}
          />
        )}

        <AuthModal
          isOpen={isAuthOpen}
          pendingCheckout={pendingCheckoutAfterAuth}
          initialError={authErrorMessage}
          onClose={() => {
            setIsAuthOpen(false);
            setAuthErrorMessage(null);
            setPendingCheckoutAfterAuth(false);
          }}
          onAuthenticated={(authenticatedUser) => {
            setAuthErrorMessage(null);
            handleAuthenticated(authenticatedUser);
          }}
        />

        <CheckoutModal
          isOpen={isCheckoutOpen}
          user={user}
          siteSettings={siteSettings}
          cart={cart}
          stores={stores}
          selectedStoreId={activeStore?.id ?? null}
          promos={promos}
          onClose={() => setIsCheckoutOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onOrderCreated={handleOrderCreated}
        />

        <OrderSuccessModal
          order={createdOrder?.order ?? null}
          whatsappUrl={createdOrder?.whatsappUrl ?? ''}
          onClose={() => setCreatedOrder(null)}
          onViewHistory={() => {
            setCreatedOrder(null);
            handleNavigate('my-orders');
          }}
        />
      </div>
    </div>
  );
}
