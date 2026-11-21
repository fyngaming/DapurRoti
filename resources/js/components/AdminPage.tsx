import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Settings,
  Store,
  Tag,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { ImageUploadEditor } from './ImageUploadEditor';
import { ProductCsvImportPanel } from './ProductCsvImportPanel';
import { ViewModeSwitch } from './ViewModeSwitch';
import type {
  AdBanner,
  Category,
  DiscountType,
  Order,
  OrderStatus,
  Product,
  Promo,
  SiteSettings,
  StoreBranch,
  User,
  ViewMode,
} from '../types/bakery';
import { formatEventDateTime, formatRupiah } from '../utils/orderLogic';

interface AdminPageProps {
  user: User | null;
  siteSettings: SiteSettings;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  onAdminAuthenticated: (user: User) => void;
  onStorefrontDataChanged: () => void;
  onNavigateHome: () => void;
  onLogout: () => void;
}

type AdminTab =
  | 'orders'
  | 'products'
  | 'categories'
  | 'stores'
  | 'customers'
  | 'promos'
  | 'ads'
  | 'settings';

const IMAGE_PRESETS = [
  {
    label: 'Meja Sajian Roti Hajatan (Banner)',
    url: '/src/assets/images/hero_bakery_spread_1794924158422.jpg',
  },
  {
    label: 'Roti Sobek Cokelat Keju',
    url: '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg',
  },
  {
    label: 'Roti Manis Pisang Cokelat',
    url: '/src/assets/images/roti_manis_pisang_cokelat_1794924157573.jpg',
  },
  {
    label: 'Roti Sosis Mayo',
    url: '/src/assets/images/roti_sosis_mayo_1794924158329.jpg',
  },
  {
    label: 'Paket Box Hajatan Hemat',
    url: '/src/assets/images/paket_box_hemat_1794924157948.jpg',
  },
  {
    label: 'Paket Box Hajatan Komplit',
    url: '/src/assets/images/paket_box_komplit_1794924158398.jpg',
  },
  {
    label: 'Roti Sisir Mentega',
    url: '/src/assets/images/roti_sisir_mentega_1794924159095.jpg',
  },
  {
    label: 'Roti Abon Sapi',
    url: '/src/assets/images/roti_abon_sapi_1794924159421.jpg',
  },
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending_wa: {
    label: 'Menunggu WA',
    className: 'text-amber-800 bg-amber-50 border-amber-200',
    Icon: Clock,
  },
  confirmed: {
    label: 'Dikonfirmasi',
    className: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    Icon: CheckCircle2,
  },
  completed: {
    label: 'Selesai',
    className: 'text-slate-700 bg-slate-100 border-slate-200',
    Icon: PackageCheck,
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'text-red-800 bg-red-50 border-red-200',
    Icon: XCircle,
  },
};

export function AdminPage({
  user,
  siteSettings,
  viewMode,
  onChangeViewMode,
  canInstallPwa = false,
  onInstallPwa,
  onAdminAuthenticated,
  onStorefrontDataChanged,
  onNavigateHome,
  onLogout,
}: AdminPageProps) {
  const isMobile = viewMode === 'mobile';
  const isAdmin = user?.role === 'admin';

  // Admin Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Workspace State
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreBranch[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Orders Filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');

  // 1. Barang / Roti Form State
  const [productInputMode, setProductInputMode] = useState<'single' | 'csv'>('single');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productPrice, setProductPrice] = useState('15000');
  const [productStock, setProductStock] = useState('20');
  const [productExpiredDays, setProductExpiredDays] = useState('3');
  const [productVariants, setProductVariants] = useState('Original, Cokelat, Keju');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState(IMAGE_PRESETS[1].url);
  const [productAvailable, setProductAvailable] = useState(true);
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<'all' | string>('all');

  // 2. Kelompok Barang Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // 3. Toko Form State
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('6281234567890');
  const [storeHours, setStoreHours] = useState('06.00 – 19.00 WIB');
  const [storeMapsUrl, setStoreMapsUrl] = useState('');
  const [storeActive, setStoreActive] = useState(true);

  // 4. Pelanggan Form State
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // 5. Promo Form State
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoType, setPromoType] = useState<DiscountType>('percent');
  const [promoValue, setPromoValue] = useState('10');
  const [promoMinOrder, setPromoMinOrder] = useState('50000');
  const [promoActive, setPromoActive] = useState(true);

  // 6. Iklan Carousel Form State
  const [editingAdId, setEditingAdId] = useState<number | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adImage, setAdImage] = useState(IMAGE_PRESETS[0].url);
  const [adCtaLabel, setAdCtaLabel] = useState('Pesan Sekarang');
  const [adActive, setAdActive] = useState(true);

  // 7. Pengaturan Toko & Footer State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setSettingsForm(siteSettings);
  }, [siteSettings]);

  const loadAdminOverview = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/dapur-admin/overview');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setCategories(data.categories ?? []);
        setProducts(data.products ?? []);
        setStores(data.stores ?? []);
        setCustomers(data.customers ?? []);
        setPromos(data.promos ?? []);
        setAds(data.ads ?? []);
        if (data.settings) {
          setSettingsForm(data.settings);
        }
        if (!productCategory && Array.isArray(data.categories) && data.categories.length > 0) {
          setProductCategory(data.categories[0].slug);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, productCategory]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminOverview();
    }
  }, [isAdmin, loadAdminOverview]);

  async function handleAdminLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/dapur-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message ?? 'Login admin gagal.');
        return;
      }
      onAdminAuthenticated(data.user);
    } catch {
      setLoginError('Gagal terhubung ke server.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleUpdateOrderStatus(orderId: number, status: OrderStatus) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal memperbarui status pesanan.' });
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    setFeedback({ type: 'ok', text: `Status pesanan ${data.order.order_code} diperbarui.` });
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  // --- 1. BARANG / ROTI HANDLERS ---
  function startEditProduct(product: Product) {
    setProductInputMode('single');
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductCategory(product.category);
    setProductPrice(String(product.price));
    setProductStock(String(product.stock ?? 0));
    setProductExpiredDays(String(product.expired_days ?? 3));
    setProductVariants((product.variants ?? ['Original']).join(', '));
    setProductDescription(product.description);
    setProductImage(product.image);
    setProductAvailable(product.is_available);
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductName('');
    setProductCategory(categories[0]?.slug ?? 'roti');
    setProductPrice('15000');
    setProductStock('20');
    setProductExpiredDays('3');
    setProductVariants('Original, Cokelat, Keju');
    setProductDescription('');
    setProductImage(IMAGE_PRESETS[1].url);
    setProductAvailable(true);
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      name: productName,
      category: productCategory || categories[0]?.slug || 'roti',
      price: Number(productPrice),
      stock: Number(productStock),
      expired_days: Number(productExpiredDays),
      variants: productVariants,
      description: productDescription,
      image: productImage,
      is_available: productAvailable,
    };

    const url = editingProductId
      ? `/api/dapur-admin/products/${editingProductId}`
      : '/api/dapur-admin/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menyimpan barang.' });
      return;
    }

    setFeedback({
      type: 'ok',
      text: editingProductId
        ? `Barang "${data.product.name}" berhasil diperbarui.`
        : `Barang baru "${data.product.name}" berhasil ditambahkan.`,
    });
    resetProductForm();
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  async function handleToggleAvailability(product: Product) {
    const res = await fetch(`/api/dapur-admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !product.is_available }),
    });
    if (res.ok) {
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  async function handleQuickAdjustStock(product: Product, delta: number) {
    const nextStock = Math.max(0, Number(product.stock ?? 0) + delta);
    const res = await fetch(`/api/dapur-admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: nextStock }),
    });
    if (res.ok) {
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  async function handleDeleteProduct(id: number) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFeedback({ type: 'ok', text: 'Barang dihapus dari katalog.' });
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  // --- 2. KELOMPOK BARANG HANDLERS ---
  async function handleSaveCategory(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (editingCategory) {
      const res = await fetch(`/api/dapur-admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategory.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.message ?? 'Gagal memperbarui kelompok barang.' });
        return;
      }
      setEditingCategory(null);
      setFeedback({ type: 'ok', text: 'Kelompok barang berhasil diperbarui.' });
    } else {
      const res = await fetch('/api/dapur-admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.message ?? 'Gagal menambah kelompok barang.' });
        return;
      }
      setNewCategoryName('');
      setFeedback({ type: 'ok', text: `Kelompok "${data.category.name}" ditambahkan.` });
    }

    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  async function handleDeleteCategory(id: number) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menghapus kelompok barang.' });
      return;
    }
    setFeedback({ type: 'ok', text: 'Kelompok barang berhasil dihapus.' });
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  // --- 3. TOKO HANDLERS ---
  function startEditStore(store: StoreBranch) {
    setEditingStoreId(store.id);
    setStoreName(store.name);
    setStoreAddress(store.address);
    setStorePhone(store.phone);
    setStoreHours(store.hours);
    setStoreMapsUrl(store.maps_url ?? '');
    setStoreActive(store.is_active);
  }

  function resetStoreForm() {
    setEditingStoreId(null);
    setStoreName('');
    setStoreAddress('');
    setStorePhone('6281234567890');
    setStoreHours('06.00 – 19.00 WIB');
    setStoreMapsUrl('');
    setStoreActive(true);
  }

  async function handleSaveStore(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const url = editingStoreId
      ? `/api/dapur-admin/stores/${editingStoreId}`
      : '/api/dapur-admin/stores';
    const method = editingStoreId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        hours: storeHours,
        maps_url: storeMapsUrl,
        is_active: storeActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menyimpan data toko.' });
      return;
    }
    setFeedback({
      type: 'ok',
      text: editingStoreId
        ? `Cabang "${data.store.name}" diperbarui.`
        : `Cabang "${data.store.name}" ditambahkan.`,
    });
    resetStoreForm();
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  async function handleDeleteStore(id: number) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/stores/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menghapus toko.' });
      return;
    }
    setFeedback({ type: 'ok', text: 'Cabang toko dihapus.' });
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  // --- 4. PELANGGAN HANDLERS ---
  function startEditCustomer(cust: User) {
    setEditingCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerEmail(cust.email);
    setCustomerPhone(cust.phone ?? '');
    setCustomerAddress(cust.default_address ?? '');
  }

  function resetCustomerForm() {
    setEditingCustomerId(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
  }

  async function handleSaveCustomer(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const url = editingCustomerId
      ? `/api/dapur-admin/customers/${editingCustomerId}`
      : '/api/dapur-admin/customers';
    const method = editingCustomerId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        default_address: customerAddress,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menyimpan data pelanggan.' });
      return;
    }
    setFeedback({
      type: 'ok',
      text: editingCustomerId
        ? `Data pelanggan "${data.customer.name}" diperbarui.`
        : `Pelanggan "${data.customer.name}" ditambahkan.`,
    });
    resetCustomerForm();
    await loadAdminOverview();
  }

  async function handleDeleteCustomer(id: number) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/customers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFeedback({ type: 'ok', text: 'Pelanggan dihapus.' });
      await loadAdminOverview();
    }
  }

  // --- 5. PROMO HANDLERS ---
  function startEditPromo(promo: Promo) {
    setEditingPromoId(promo.id);
    setPromoCode(promo.code);
    setPromoTitle(promo.title);
    setPromoType(promo.discount_type);
    setPromoValue(String(promo.discount_value));
    setPromoMinOrder(String(promo.min_order));
    setPromoActive(promo.is_active);
  }

  function resetPromoForm() {
    setEditingPromoId(null);
    setPromoCode('');
    setPromoTitle('');
    setPromoType('percent');
    setPromoValue('10');
    setPromoMinOrder('50000');
    setPromoActive(true);
  }

  async function handleSavePromo(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const url = editingPromoId
      ? `/api/dapur-admin/promos/${editingPromoId}`
      : '/api/dapur-admin/promos';
    const method = editingPromoId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: promoCode,
        title: promoTitle,
        discount_type: promoType,
        discount_value: Number(promoValue),
        min_order: Number(promoMinOrder),
        is_active: promoActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menyimpan promo.' });
      return;
    }
    setFeedback({
      type: 'ok',
      text: editingPromoId
        ? `Promo "${data.promo.code}" diperbarui.`
        : `Promo "${data.promo.code}" ditambahkan.`,
    });
    resetPromoForm();
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  async function handleTogglePromo(promo: Promo) {
    const res = await fetch(`/api/dapur-admin/promos/${promo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promo.is_active }),
    });
    if (res.ok) {
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  async function handleDeletePromo(id: number) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/promos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFeedback({ type: 'ok', text: 'Promo dihapus.' });
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  // --- 6. IKLAN CAROUSEL HANDLERS ---
  function startEditAd(ad: AdBanner) {
    setEditingAdId(ad.id);
    setAdTitle(ad.title);
    setAdSubtitle(ad.subtitle);
    setAdImage(ad.image);
    setAdCtaLabel(ad.cta_label);
    setAdActive(ad.is_active);
  }

  function resetAdForm() {
    setEditingAdId(null);
    setAdTitle('');
    setAdSubtitle('');
    setAdImage(IMAGE_PRESETS[0].url);
    setAdCtaLabel('Pesan Sekarang');
    setAdActive(true);
  }

  async function handleSaveAd(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const url = editingAdId ? `/api/dapur-admin/ads/${editingAdId}` : '/api/dapur-admin/ads';
    const method = editingAdId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: adTitle,
        subtitle: adSubtitle,
        image: adImage,
        cta_label: adCtaLabel,
        is_active: adActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'err', text: data.message ?? 'Gagal menyimpan iklan.' });
      return;
    }
    setFeedback({
      type: 'ok',
      text: editingAdId ? 'Slide iklan diperbarui.' : 'Slide iklan baru ditambahkan.',
    });
    resetAdForm();
    await loadAdminOverview();
    onStorefrontDataChanged();
  }

  async function handleToggleAd(ad: AdBanner) {
    const res = await fetch(`/api/dapur-admin/ads/${ad.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    if (res.ok) {
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  async function handleDeleteAd(id: number) {
    setFeedback(null);
    const res = await fetch(`/api/dapur-admin/ads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFeedback({ type: 'ok', text: 'Slide iklan dihapus.' });
      await loadAdminOverview();
      onStorefrontDataChanged();
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/dapur-admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setFeedback({
          type: 'err',
          text: 'Endpoint pengaturan belum aktif. Restart server (Ctrl+C lalu npm run dev) dan coba lagi.',
        });
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.message ?? 'Gagal menyimpan pengaturan toko.' });
        return;
      }
      if (data.settings) {
        setSettingsForm(data.settings);
      }
      setFeedback({
        type: 'ok',
        text: 'Pengaturan nama toko, jam buka & footer berhasil disimpan dan langsung tampil di website.',
      });
      onStorefrontDataChanged();
    } catch {
      setFeedback({ type: 'err', text: 'Gagal terhubung ke server.' });
    } finally {
      setIsSavingSettings(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.order_code.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_phone.toLowerCase().includes(q) ||
        (order.store_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const metrics = useMemo(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending_wa').length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);
    return {
      totalOrders: orders.length,
      pendingCount,
      activeStores: stores.filter((s) => s.is_active).length,
      revenue,
    };
  }, [orders, stores]);

  const tabs: { id: AdminTab; label: string; count: number | null; Icon: typeof Package }[] = [
    { id: 'orders', label: 'Pesanan', count: orders.length, Icon: PackageCheck },
    { id: 'products', label: 'Menu & Paket Penjualan', count: products.length, Icon: Package },
    { id: 'categories', label: 'Kelompok Barang', count: categories.length, Icon: Layers },
    { id: 'stores', label: 'Toko', count: stores.length, Icon: Store },
    { id: 'customers', label: 'Pelanggan', count: customers.length, Icon: Users },
    { id: 'promos', label: 'Promo', count: promos.length, Icon: Tag },
    { id: 'ads', label: 'Iklan Carousel', count: ads.length, Icon: ImageIcon },
    { id: 'settings', label: 'Pengaturan Toko', count: null, Icon: Settings },
  ];

  // Private Gate Screen if not logged in as admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FFFDF9] rounded-2xl border border-[#5C3A21]/15 shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#5C3A21] text-[#FDE68A] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#5C3A21]">
                Portal Pengelola Dapur
              </h1>
              <p className="text-xs text-[#7C604C]">
                Akses privat administrator {siteSettings.brandName}
              </p>
            </div>
          </div>

          {user && user.role !== 'admin' && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Akun saat ini ({user.email}) adalah akun pelanggan. Masuk dengan akun admin untuk
              mengelola pesanan, barang, cabang toko, pelanggan, promo, dan iklan.
            </div>
          )}

          {loginError && (
            <div
              role="alert"
              className="mb-4 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl"
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#5C3A21] mb-1"
              >
                Email / Username Admin
              </label>
              <input
                id="admin-email"
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin atau admin@rotihajatan.id"
                className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#5C3A21] mb-1"
              >
                Kata Sandi Admin
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan kata sandi pengelola"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  title={showLoginPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showLoginPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7C604C] hover:text-[#5C3A21] transition-colors rounded-lg focus:outline-none"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#5C3A21] hover:bg-[#462B17] rounded-xl transition-colors min-h-[44px] disabled:opacity-60"
            >
              {isLoggingIn ? 'Memverifikasi...' : 'Masuk Panel Admin'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#5C3A21]/10 flex items-center justify-between text-xs text-[#7C604C]">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-[#5C3A21] underline underline-offset-4"
            >
              Kembali ke Toko
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginEmail('admin@rotihajatan.id');
                setLoginPassword('adminDapur2026');
                setLoginError(null);
              }}
              className="font-semibold text-[#D97706] hover:underline underline-offset-4"
            >
              Isi Demo Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-view-mode={viewMode}
      className={isMobile ? 'app-shell-mobile-backdrop' : 'min-h-screen bg-[#FFFDF9] text-[#5C3A21]'}
    >
      <div className={isMobile ? 'app-shell-mobile-frame text-[#5C3A21]' : 'min-h-screen bg-[#FFFDF9] text-[#5C3A21]'}>
        {/* Admin Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#5C3A21]/10">
          <div
            className={`max-w-6xl mx-auto ${
              isMobile ? 'px-3 h-14 gap-1.5' : 'px-4 sm:px-6 h-16 gap-2 sm:gap-4'
            } flex items-center justify-between`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span
                className={`font-display ${
                  isMobile ? 'text-sm max-w-[125px]' : 'text-base sm:text-lg'
                } font-bold text-[#5C3A21] truncate`}
              >
                {siteSettings.brandName}
              </span>
              {!isMobile && (
                <>
                  <span className="text-[#5C3A21]/30 hidden md:inline">/</span>
                  <span className="text-xs sm:text-sm font-medium text-[#7C604C] hidden md:inline truncate">
                    Panel Pengelola Privat
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ViewModeSwitch
                viewMode={viewMode}
                onChangeMode={onChangeViewMode}
                canInstallPwa={canInstallPwa}
                onInstallPwa={onInstallPwa}
                compact={isMobile}
              />
              <button
                type="button"
                onClick={onNavigateHome}
                className={`${
                  isMobile ? 'px-2 py-1.5 text-[11px]' : 'px-2.5 sm:px-3.5 py-2 text-xs'
                } font-semibold text-[#5C3A21] hover:bg-[#FAF5EC] rounded-lg transition-colors whitespace-nowrap`}
              >
                {!isMobile && <span className="hidden sm:inline">Lihat Katalog </span>}Toko
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className={`inline-flex items-center gap-1.5 ${
                  isMobile ? 'px-2 py-1.5' : 'px-3 sm:px-3.5 py-2'
                } text-xs font-semibold text-white bg-[#5C3A21] hover:bg-[#462B17] rounded-lg transition-colors whitespace-nowrap`}
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                {!isMobile && <span>Logout</span>}
              </button>
            </div>
          </div>
        </header>

        <main
          className={`admin-mobile-stack max-w-6xl mx-auto ${
            isMobile ? 'px-3.5 py-5 space-y-5' : 'px-4 sm:px-6 py-8 space-y-6'
          }`}
        >
          {/* Metrics Summary Row */}
          <div className="mode-grid-services grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#5C3A21]/10">
            <p className="text-xs text-[#7C604C]">Total Pesanan</p>
            <p className="mt-1 text-2xl font-bold text-[#5C3A21] tabular-nums">
              {metrics.totalOrders}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#5C3A21]/10">
            <p className="text-xs text-[#7C604C]">Menunggu Konfirmasi WA</p>
            <p className="mt-1 text-2xl font-bold text-[#D97706] tabular-nums">
              {metrics.pendingCount}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#5C3A21]/10">
            <p className="text-xs text-[#7C604C]">Cabang Toko Aktif</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
              {metrics.activeStores}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#5C3A21]/10">
            <p className="text-xs text-[#7C604C]">Estimasi Nilai Pesanan</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-[#5C3A21] tabular-nums">
              {formatRupiah(metrics.revenue)}
            </p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="border-b border-[#5C3A21]/10 pb-4 overflow-x-auto">
          <div
            role="tablist"
            aria-label="Navigasi modul admin"
            className="inline-flex items-center gap-1 p-1 bg-[#FAF5EC] border border-[#5C3A21]/10 rounded-xl min-w-max"
          >
            {tabs.map(({ id, label, count, Icon }) => {
              const isSelected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveTab(id);
                    setFeedback(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#5C3A21] text-white'
                      : 'text-[#6E5644] hover:text-[#5C3A21]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                  {count !== null && (
                    <span
                      className={`tabular-nums text-[11px] ${
                        isSelected ? 'text-[#FDE68A]' : 'text-[#7C604C]'
                      }`}
                    >
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`px-4 py-3 rounded-xl border text-xs font-semibold ${
              feedback.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* TAB 1: KELOLA PESANAN */}
        {activeTab === 'orders' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="w-4 h-4 text-[#7C604C] absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cari kode order, nama, toko, atau no. WA..."
                  aria-label="Cari pesanan"
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'pending_wa', 'confirmed', 'completed', 'cancelled'] as const).map(
                  (statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setOrderStatusFilter(statusKey)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                        orderStatusFilter === statusKey
                          ? 'bg-[#5C3A21] text-white border-[#5C3A21]'
                          : 'bg-white text-[#6E5644] border-[#5C3A21]/15 hover:text-[#5C3A21]'
                      }`}
                    >
                      {statusKey === 'all' ? 'Semua' : STATUS_META[statusKey].label}
                    </button>
                  )
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-[#5C3A21]/10 p-8 text-center text-sm text-[#7C604C]">
                Memuat data pesanan...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#5C3A21]/10 p-8 text-center">
                <p className="text-sm font-semibold text-[#5C3A21]">
                  Belum ada pesanan yang sesuai filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_META[order.status] ?? STATUS_META.pending_wa;
                  const StatusIcon = statusInfo.Icon;

                  return (
                    <article
                      key={order.id}
                      data-testid={`admin-order-${order.order_code}`}
                      className="bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden"
                    >
                      <div className="px-5 py-3.5 bg-[#FAF5EC] border-b border-[#5C3A21]/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[#5C3A21]">
                            {order.order_code}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusInfo.className}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{statusInfo.label}</span>
                          </span>
                          {order.store_name && (
                            <span className="text-xs font-medium text-[#7C604C]">
                              · {order.store_name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <label htmlFor={`status-${order.id}`} className="sr-only">
                            Ubah status {order.order_code}
                          </label>
                          <select
                            id={`status-${order.id}`}
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-lg focus:outline-none focus:border-[#D97706]"
                          >
                            <option value="pending_wa">Menunggu WA</option>
                            <option value="confirmed">Dikonfirmasi Dapur</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>

                          {order.whatsapp_url && (
                            <a
                              href={order.whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#6E5644]">
                          <div>
                            <span className="font-semibold text-[#5C3A21]">Pemesan: </span>
                            {order.customer_name} ({order.customer_phone})
                          </div>
                          <div>
                            <span className="font-semibold text-[#5C3A21]">Jadwal Acara: </span>
                            {formatEventDateTime(order.event_datetime)}
                          </div>
                          <div>
                            <span className="font-semibold text-[#5C3A21]">Pembayaran: </span>
                            {order.order_type === 'po' ? 'PO DP 50%' : 'Lunas'} ·{' '}
                            {order.payment_method === 'transfer' ? 'Transfer Bank' : 'Tunai / COD'}
                          </div>
                          <div className="md:col-span-3">
                            <span className="font-semibold text-[#5C3A21]">Alamat: </span>
                            {order.delivery_address}
                          </div>
                        </div>

                        <div className="border-t border-[#5C3A21]/10 pt-3 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[#7C604C] border-b border-[#5C3A21]/10">
                                <th className="py-1.5 pr-2 font-medium">Item &amp; Varian</th>
                                <th className="py-1.5 px-2 font-medium text-right">Qty</th>
                                <th className="py-1.5 px-2 font-medium text-right">Harga</th>
                                <th className="py-1.5 pl-2 font-medium text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#5C3A21]/5">
                              {order.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1.5 pr-2 font-medium text-[#5C3A21]">
                                    {item.product_name}{' '}
                                    <span className="font-normal text-[#7C604C]">
                                      ({item.variant || 'Original'})
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 text-right tabular-nums">
                                    {item.quantity}
                                  </td>
                                  <td className="py-1.5 px-2 text-right tabular-nums whitespace-nowrap">
                                    {formatRupiah(item.price)}
                                  </td>
                                  <td className="py-1.5 pl-2 text-right font-semibold tabular-nums whitespace-nowrap">
                                    {formatRupiah(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#5C3A21]/10 text-xs">
                          <div className="flex flex-wrap items-center gap-3 text-[#6E5644]">
                            <span>
                              Total:{' '}
                              <strong className="text-sm text-[#5C3A21] tabular-nums">
                                {formatRupiah(order.total_amount)}
                              </strong>
                            </span>
                            {order.discount_amount > 0 && (
                              <span className="text-emerald-700 font-semibold tabular-nums">
                                Diskon {order.promo_code ? `(${order.promo_code})` : ''}: -
                                {formatRupiah(order.discount_amount)}
                              </span>
                            )}
                          </div>
                          {order.order_type === 'po' && (
                            <span className="font-semibold text-[#D97706] tabular-nums">
                              DP 50%: {formatRupiah(order.dp_amount)} · Sisa:{' '}
                              {formatRupiah(order.total_amount - order.dp_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: BARANG / ROTI & VARIAN CRUD */}
        {activeTab === 'products' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  {editingProductId
                    ? 'Edit Menu / Paket Penjualan'
                    : productInputMode === 'csv'
                      ? 'Import Menu via .CSV'
                      : 'Tambah Roti / Paket Penjualan'}
                </h2>
                {editingProductId ? (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21]"
                  >
                    Batal Edit
                  </button>
                ) : (
                  <div className="inline-flex items-center p-0.5 bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setProductInputMode('single')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        productInputMode === 'single'
                          ? 'bg-[#5C3A21] text-white'
                          : 'text-[#7C604C] hover:text-[#5C3A21]'
                      }`}
                    >
                      Satuan
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductInputMode('csv')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        productInputMode === 'csv'
                          ? 'bg-[#5C3A21] text-white'
                          : 'text-[#7C604C] hover:text-[#5C3A21]'
                      }`}
                    >
                      Import .CSV
                    </button>
                  </div>
                )}
              </div>

              {!editingProductId && productInputMode === 'csv' ? (
                <ProductCsvImportPanel
                  onImported={async (summaryMessage) => {
                    setFeedback({ type: 'ok', text: summaryMessage });
                    await loadAdminOverview();
                    onStorefrontDataChanged();
                  }}
                />
              ) : (
              <form onSubmit={handleSaveProduct} className="space-y-3">
                <div>
                  <label htmlFor="prod-name" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Nama Roti / Paket Penjualan *
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Contoh: Paket Box Hajatan Hemat / Roti Sobek Cokelat"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="prod-cat" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Kelompok / Kategori *
                    </label>
                    <select
                      id="prod-cat"
                      value={productCategory || categories[0]?.slug || ''}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-[#7C604C]">
                      Pilih <strong>Paket Snack Box</strong> untuk paket penjualan.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="prod-price" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Harga (Rp) *
                    </label>
                    <input
                      id="prod-price"
                      type="number"
                      min={500}
                      step={500}
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706] tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="prod-stock" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Stok Tersedia (pcs) *
                    </label>
                    <input
                      id="prod-stock"
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706] tabular-nums"
                    />
                  </div>

                  <div>
                    <label htmlFor="prod-expired" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Masa Simpan / Expired (hari) *
                    </label>
                    <input
                      id="prod-expired"
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={productExpiredDays}
                      onChange={(e) => setProductExpiredDays(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="prod-variants"
                    className="block text-xs font-semibold text-[#5C3A21] mb-1"
                  >
                    Varian (pisahkan dengan koma) *
                  </label>
                  <input
                    id="prod-variants"
                    type="text"
                    required
                    value={productVariants}
                    onChange={(e) => setProductVariants(e.target.value)}
                    placeholder="Cokelat Keju, Full Cokelat, Extra Keju"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <ImageUploadEditor
                  id="prod-img"
                  label="Foto Produk"
                  value={productImage}
                  defaultAspect="4:3"
                  presets={IMAGE_PRESETS}
                  onChange={setProductImage}
                />

                <div>
                  <label htmlFor="prod-desc" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Deskripsi *
                  </label>
                  <textarea
                    id="prod-desc"
                    rows={2}
                    required
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Deskripsi singkat bahan dan isi kemasan..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5C3A21] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productAvailable}
                    onChange={(e) => setProductAvailable(e.target.checked)}
                    className="accent-[#D97706]"
                  />
                  <span>Tampilkan di katalog (Tersedia)</span>
                </label>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{editingProductId ? 'Simpan Perubahan' : 'Tambah Menu / Paket'}</span>
                </button>
              </form>
              )}
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#5C3A21]/10 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Daftar Menu &amp; Paket Penjualan ({products.length})
                </h2>

                <div className="inline-flex flex-wrap items-center p-1 bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setAdminCategoryFilter('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      adminCategoryFilter === 'all'
                        ? 'bg-[#5C3A21] text-white'
                        : 'text-[#7C604C] hover:text-[#5C3A21]'
                    }`}
                  >
                    Semua ({products.length})
                  </button>
                  {categories.map((c) => {
                    const count = products.filter((p) => p.category === c.slug).length;
                    const isSelected = adminCategoryFilter === c.slug;
                    const isPaket = c.slug === 'paket';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setAdminCategoryFilter(c.slug)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          isSelected
                            ? isPaket
                              ? 'bg-[#D97706] text-white shadow-xs'
                              : 'bg-[#5C3A21] text-white'
                            : isPaket
                              ? 'text-[#D97706] font-bold hover:bg-[#D97706]/10'
                              : 'text-[#7C604C] hover:text-[#5C3A21]'
                        }`}
                      >
                        {c.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-[#5C3A21]/10">
                {(adminCategoryFilter === 'all'
                  ? products
                  : products.filter((p) => p.category === adminCategoryFilter)
                ).map((product) => {
                  const catName =
                    categories.find((c) => c.slug === product.category)?.name ?? product.category;
                  const isPaket = product.category === 'paket';
                  return (
                    <div
                      key={product.id}
                      data-testid={`admin-product-${product.id}`}
                      className={`p-4 flex items-start gap-4 hover:bg-[#FFFDF9] ${
                        isPaket ? 'bg-[#FFFDF9]/60' : ''
                      }`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-[#FAF5EC] shrink-0 border border-[#5C3A21]/10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-sm text-[#5C3A21] truncate">
                              {product.name}
                            </h3>
                            {isPaket && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30 shrink-0">
                                Paket Penjualan
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-sm text-[#5C3A21] tabular-nums">
                            {formatRupiah(product.price)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-[#7C604C] font-medium">
                            {catName} · {product.is_available ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold border tabular-nums ${
                              (product.stock ?? 0) <= 0
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : (product.stock ?? 0) <= 5
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            Stok: {product.stock ?? 0} pcs
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-semibold bg-[#FAF5EC] text-[#5C3A21] border border-[#5C3A21]/15">
                            Exp: {product.expired_days ?? 3} hari
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C3A21] font-medium mt-1">
                          Varian: {(product.variants ?? ['Original']).join(' · ')}
                        </p>
                        <p className="text-xs text-[#6E5644] mt-1 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1 bg-[#FAF5EC] rounded-lg p-0.5 border border-[#5C3A21]/15">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(product, -1)}
                              disabled={(product.stock ?? 0) <= 0}
                              title="Kurangi 1 stok"
                              className="px-1.5 py-0.5 text-[11px] font-bold text-[#5C3A21] hover:bg-white rounded disabled:opacity-40"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(product, 1)}
                              title="Tambah 1 stok"
                              className="px-1.5 py-0.5 text-[11px] font-bold text-[#5C3A21] hover:bg-white rounded"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(product, 5)}
                              title="Tambah 5 stok"
                              className="px-1.5 py-0.5 text-[11px] font-bold text-[#D97706] hover:bg-white rounded"
                            >
                              +5
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(product)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                          >
                            {product.is_available ? 'Tandai Habis' : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditProduct(product)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-red-700 rounded-lg border border-red-200 hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: KELOMPOK BARANG CRUD */}
        {activeTab === 'categories' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                {editingCategory ? 'Edit Kelompok Barang' : 'Tambah Kelompok Barang'}
              </h2>
              <form onSubmit={handleSaveCategory} className="space-y-3">
                <div>
                  <label
                    htmlFor="cat-name-input"
                    className="block text-xs font-semibold text-[#5C3A21] mb-1"
                  >
                    Nama Kelompok Barang *
                  </label>
                  <input
                    id="cat-name-input"
                    type="text"
                    required
                    value={editingCategory ? editingCategory.name : newCategoryName}
                    onChange={(e) =>
                      editingCategory
                        ? setEditingCategory({ ...editingCategory, name: e.target.value })
                        : setNewCategoryName(e.target.value)
                    }
                    placeholder="Contoh: Kue Basah Tradisional"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                  >
                    {editingCategory ? 'Simpan Perubahan' : 'Tambah Kelompok'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#7C604C] bg-[#FAF5EC] rounded-xl"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#5C3A21]/10">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Daftar Kelompok Barang ({categories.length})
                </h2>
              </div>
              <ul className="divide-y divide-[#5C3A21]/10">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.slug).length;
                  return (
                    <li
                      key={cat.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FFFDF9]"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#5C3A21]">{cat.name}</p>
                        <p className="text-xs text-[#7C604C] font-mono mt-0.5">
                          /{cat.slug} · {count} barang
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(cat)}
                          aria-label={`Edit kelompok ${cat.name}`}
                          className="p-2 text-[#5C3A21] hover:bg-[#FAF5EC] rounded-lg border border-[#5C3A21]/15"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          aria-label={`Hapus kelompok ${cat.name}`}
                          className="p-2 text-red-700 hover:bg-red-50 rounded-lg border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* TAB 4: TOKO (4 CABANG) CRUD */}
        {activeTab === 'stores' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  {editingStoreId ? 'Edit Cabang Toko' : 'Tambah Cabang Toko'}
                </h2>
                {editingStoreId && (
                  <button
                    type="button"
                    onClick={resetStoreForm}
                    className="text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21]"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveStore} className="space-y-3">
                <div>
                  <label htmlFor="store-name" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Nama Cabang Toko *
                  </label>
                  <input
                    id="store-name"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Contoh: Cabang Depok Margonda"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label htmlFor="store-address" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    id="store-address"
                    rows={2}
                    required
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Jl. Margonda Raya No. 120, Depok"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="store-phone" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      No. WhatsApp Toko *
                    </label>
                    <input
                      id="store-phone"
                      type="text"
                      required
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="6281234567890"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                  <div>
                    <label htmlFor="store-hours" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Jam Operasional
                    </label>
                    <input
                      id="store-hours"
                      type="text"
                      value={storeHours}
                      onChange={(e) => setStoreHours(e.target.value)}
                      placeholder="06.00 – 19.00 WIB"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="store-maps" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Link Google Maps (Opsional)
                  </label>
                  <input
                    id="store-maps"
                    type="url"
                    value={storeMapsUrl}
                    onChange={(e) => setStoreMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... (kosongkan agar otomatis dari alamat)"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5C3A21] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeActive}
                    onChange={(e) => setStoreActive(e.target.checked)}
                    className="accent-[#D97706]"
                  />
                  <span>Cabang aktif melayani pesanan</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                >
                  {editingStoreId ? 'Simpan Perubahan Toko' : 'Tambah Cabang Toko'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#5C3A21]/10">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Daftar Cabang Toko ({stores.length})
                </h2>
              </div>
              <div className="divide-y divide-[#5C3A21]/10">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    data-testid={`admin-store-${store.id}`}
                    className="p-4 flex items-start justify-between gap-4 hover:bg-[#FFFDF9]"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                        <h3 className="font-semibold text-sm text-[#5C3A21]">{store.name}</h3>
                        <span className="text-[11px] font-semibold text-[#7C604C]">
                          · {store.is_active ? 'Aktif' : 'Tutup'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E5644]">{store.address}</p>
                      <p className="text-[11px] text-[#7C604C] font-mono">
                        WA: {store.phone} · {store.hours}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditStore(store)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStore(store.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-red-700 rounded-lg border border-red-200 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: PELANGGAN CRUD */}
        {activeTab === 'customers' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  {editingCustomerId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                </h2>
                {editingCustomerId && (
                  <button
                    type="button"
                    onClick={resetCustomerForm}
                    className="text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21]"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label htmlFor="cust-name" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                {!editingCustomerId && (
                  <div>
                    <label
                      htmlFor="cust-email"
                      className="block text-xs font-semibold text-[#5C3A21] mb-1"
                    >
                      Email (Opsional)
                    </label>
                    <input
                      id="cust-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="budi@email.com"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="cust-phone" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    No. HP / WhatsApp
                  </label>
                  <input
                    id="cust-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cust-address"
                    className="block text-xs font-semibold text-[#5C3A21] mb-1"
                  >
                    Alamat Pelanggan
                  </label>
                  <textarea
                    id="cust-address"
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Jl. Melati No. 14, Jakarta Selatan"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                >
                  {editingCustomerId ? 'Simpan Perubahan Pelanggan' : 'Tambah Pelanggan'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#5C3A21]/10">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Daftar Pelanggan ({customers.length})
                </h2>
              </div>
              <div className="divide-y divide-[#5C3A21]/10">
                {customers.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#7C604C]">
                    Belum ada pelanggan terdaftar.
                  </p>
                ) : (
                  customers.map((cust) => {
                    const custOrdersCount = orders.filter((o) => o.user_id === cust.id).length;
                    return (
                      <div
                        key={cust.id}
                        data-testid={`admin-customer-${cust.id}`}
                        className="p-4 flex items-start justify-between gap-4 hover:bg-[#FFFDF9]"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {cust.avatar ? (
                            <img
                              src={cust.avatar}
                              alt={cust.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-[#5C3A21]/15 shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#FAF5EC] border border-[#5C3A21]/15 flex items-center justify-center text-xs font-bold text-[#5C3A21] shrink-0 mt-0.5">
                              {cust.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm text-[#5C3A21]">{cust.name}</h3>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                                  cust.google_id
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-[#FAF5EC] text-[#6E5644] border-[#5C3A21]/15'
                                }`}
                              >
                                {cust.google_id ? 'Google' : 'Email'}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                {custOrdersCount} pesanan
                              </span>
                            </div>
                            <p className="text-xs text-[#7C604C]">
                              {cust.email} · HP: {cust.phone || '-'}
                            </p>
                            <p className="text-xs text-[#6E5644]">
                              Alamat: {cust.default_address || 'Belum diisi'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCustomer(cust)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-red-700 rounded-lg border border-red-200 hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: PROMO CRUD */}
        {activeTab === 'promos' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  {editingPromoId ? 'Edit Promo & Diskon' : 'Tambah Promo Baru'}
                </h2>
                {editingPromoId && (
                  <button
                    type="button"
                    onClick={resetPromoForm}
                    className="text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21]"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSavePromo} className="space-y-3">
                <div>
                  <label htmlFor="promo-code" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Kode Promo *
                  </label>
                  <input
                    id="promo-code"
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: JUMATBERKAH"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono uppercase border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label htmlFor="promo-title" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Judul / Keterangan Promo *
                  </label>
                  <input
                    id="promo-title"
                    type="text"
                    required
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder="Diskon Spesial Jumat Berkah 15%"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="promo-type" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Tipe Diskon
                    </label>
                    <select
                      id="promo-type"
                      value={promoType}
                      onChange={(e) => setPromoType(e.target.value as DiscountType)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    >
                      <option value="percent">Persentase (%)</option>
                      <option value="fixed">Nominal Tetap (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="promo-value" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                      Nilai Diskon *
                    </label>
                    <input
                      id="promo-value"
                      type="number"
                      min={1}
                      required
                      value={promoValue}
                      onChange={(e) => setPromoValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="promo-min" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Minimal Belanja (Rp)
                  </label>
                  <input
                    id="promo-min"
                    type="number"
                    min={0}
                    step={5000}
                    value={promoMinOrder}
                    onChange={(e) => setPromoMinOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706] tabular-nums"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5C3A21] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoActive}
                    onChange={(e) => setPromoActive(e.target.checked)}
                    className="accent-[#D97706]"
                  />
                  <span>Promo aktif dipakai saat checkout</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                >
                  {editingPromoId ? 'Simpan Perubahan Promo' : 'Tambah Promo'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#5C3A21]/10">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Daftar Promo &amp; Diskon ({promos.length})
                </h2>
              </div>
              <div className="divide-y divide-[#5C3A21]/10">
                {promos.map((promo) => (
                  <div
                    key={promo.id}
                    data-testid={`admin-promo-${promo.code}`}
                    className="p-4 flex items-start justify-between gap-4 hover:bg-[#FFFDF9]"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#D97706] bg-[#FAF5EC] border border-[#D97706]/30 px-2 py-0.5 rounded-md">
                          {promo.code}
                        </span>
                        <h3 className="font-semibold text-sm text-[#5C3A21]">{promo.title}</h3>
                      </div>
                      <p className="text-xs text-[#6E5644] tabular-nums">
                        Diskon:{' '}
                        {promo.discount_type === 'percent'
                          ? `${promo.discount_value}%`
                          : formatRupiah(promo.discount_value)}{' '}
                        · Min. belanja {formatRupiah(promo.min_order)} ·{' '}
                        {promo.is_active ? 'Aktif' : 'Nonaktif'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePromo(promo)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                      >
                        {promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditPromo(promo)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-red-700 rounded-lg border border-red-200 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 7: IKLAN CAROUSEL CRUD */}
        {activeTab === 'ads' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  {editingAdId ? 'Edit Slide Iklan' : 'Tambah Slide Iklan'}
                </h2>
                {editingAdId && (
                  <button
                    type="button"
                    onClick={resetAdForm}
                    className="text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21]"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveAd} className="space-y-3">
                <div>
                  <label htmlFor="ad-title" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Judul Banner Iklan *
                  </label>
                  <input
                    id="ad-title"
                    type="text"
                    required
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Promo Spesial Snack Box Kantor Hemat 15%"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label htmlFor="ad-subtitle" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Subjudul / Keterangan
                  </label>
                  <textarea
                    id="ad-subtitle"
                    rows={2}
                    value={adSubtitle}
                    onChange={(e) => setAdSubtitle(e.target.value)}
                    placeholder="Gratis kartu ucapan untuk pemesanan di atas 50 box..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <ImageUploadEditor
                  id="ad-image"
                  label="Gambar Banner"
                  value={adImage}
                  defaultAspect="16:9"
                  presets={IMAGE_PRESETS}
                  onChange={setAdImage}
                />

                <div>
                  <label htmlFor="ad-cta" className="block text-xs font-semibold text-[#5C3A21] mb-1">
                    Teks Tombol CTA
                  </label>
                  <input
                    id="ad-cta"
                    type="text"
                    value={adCtaLabel}
                    onChange={(e) => setAdCtaLabel(e.target.value)}
                    placeholder="Pesan Sekarang"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5C3A21] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adActive}
                    onChange={(e) => setAdActive(e.target.checked)}
                    className="accent-[#D97706]"
                  />
                  <span>Tampilkan di carousel halaman utama</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                >
                  {editingAdId ? 'Simpan Perubahan Iklan' : 'Tambah Slide Iklan'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#5C3A21]/10">
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Daftar Slide Iklan Carousel ({ads.length})
                </h2>
              </div>
              <div className="divide-y divide-[#5C3A21]/10">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    data-testid={`admin-ad-${ad.id}`}
                    className="p-4 flex items-start gap-4 hover:bg-[#FFFDF9]"
                  >
                    <img
                      src={ad.image}
                      alt={ad.title}
                      referrerPolicy="no-referrer"
                      className="w-24 h-16 rounded-xl object-cover bg-[#FAF5EC] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-[#5C3A21] line-clamp-1">
                        {ad.title}
                      </h3>
                      <p className="text-xs text-[#6E5644] mt-0.5 line-clamp-2">{ad.subtitle}</p>
                      <p className="text-[11px] text-[#7C604C] mt-1">
                        Tombol: "{ad.cta_label}" · {ad.is_active ? 'Aktif' : 'Nonaktif'}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAd(ad)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                        >
                          {ad.is_active ? 'Sembunyikan' : 'Tampilkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditAd(ad)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#5C3A21]/15 hover:bg-[#FAF5EC]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAd(ad.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-700 rounded-lg border border-red-200 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 8: PENGATURAN TOKO & FOOTER */}
        {activeTab === 'settings' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#5C3A21]/12 p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold text-[#5C3A21]">
                  Customize Nama Toko &amp; Informasi Footer
                </h2>
                <p className="text-xs text-[#7C604C] mt-1">
                  Perubahan di sini langsung memperbarui nama brand di Header, teks jam buka di
                  Footer, info rekening transfer, serta pesan konfirmasi WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="set-brand"
                      className="block text-xs font-semibold text-[#5C3A21] mb-1"
                    >
                      Nama Toko / Brand *
                    </label>
                    <input
                      id="set-brand"
                      type="text"
                      required
                      value={settingsForm.brandName}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, brandName: e.target.value }))
                      }
                      placeholder="Contoh: Dapur Roti Hajatan"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="set-wa"
                      className="block text-xs font-semibold text-[#5C3A21] mb-1"
                    >
                      WhatsApp Utama (628...)
                    </label>
                    <input
                      id="set-wa"
                      type="tel"
                      value={settingsForm.adminWhatsapp}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, adminWhatsapp: e.target.value }))
                      }
                      placeholder="6281234567890"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="set-service"
                      className="block text-xs font-semibold text-[#5C3A21] mb-1"
                    >
                      Teks Deskripsi Layanan (Footer)
                    </label>
                    <input
                      id="set-service"
                      type="text"
                      value={settingsForm.footerServiceText}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, footerServiceText: e.target.value }))
                      }
                      placeholder="Layanan Roti Hajatan & Snack Box"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="set-hours"
                      className="block text-xs font-semibold text-[#5C3A21] mb-1"
                    >
                      Jam Buka / Operasional (Footer)
                    </label>
                    <input
                      id="set-hours"
                      type="text"
                      value={settingsForm.operatingHours}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, operatingHours: e.target.value }))
                      }
                      placeholder="Setiap hari 06.00 – 19.00 WIB"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="set-address"
                    className="block text-xs font-semibold text-[#5C3A21] mb-1"
                  >
                    Alamat / Info Tambahan di Footer (Opsional)
                  </label>
                  <input
                    id="set-address"
                    type="text"
                    value={settingsForm.footerAddress}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, footerAddress: e.target.value }))
                    }
                    placeholder="Contoh: Jl. Kemang Raya No. 45, Jakarta Selatan · Terima pesanan dadakan H-1"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div className="pt-2 border-t border-[#5C3A21]/10">
                  <h3 className="text-xs font-bold text-[#5C3A21] uppercase tracking-wider mb-3">
                    Rekening Pembayaran Resmi (Footer &amp; Checkout)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="set-bank-name"
                        className="block text-xs font-semibold text-[#5C3A21] mb-1"
                      >
                        Nama Bank
                      </label>
                      <input
                        id="set-bank-name"
                        type="text"
                        value={settingsForm.bankName}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({ ...prev, bankName: e.target.value }))
                        }
                        placeholder="BCA"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="set-bank-num"
                        className="block text-xs font-semibold text-[#5C3A21] mb-1"
                      >
                        No. Rekening
                      </label>
                      <input
                        id="set-bank-num"
                        type="text"
                        value={settingsForm.bankAccountNumber}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            bankAccountNumber: e.target.value,
                          }))
                        }
                        placeholder="1234567890"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="set-bank-holder"
                        className="block text-xs font-semibold text-[#5C3A21] mb-1"
                      >
                        Atas Nama
                      </label>
                      <input
                        id="set-bank-holder"
                        type="text"
                        value={settingsForm.bankAccountHolder}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            bankAccountHolder: e.target.value,
                          }))
                        }
                        placeholder="Dapur Roti Hajatan"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="set-copyright"
                    className="block text-xs font-semibold text-[#5C3A21] mb-1"
                  >
                    Teks Hak Cipta Footer
                  </label>
                  <input
                    id="set-copyright"
                    type="text"
                    value={settingsForm.footerCopyright}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, footerCopyright: e.target.value }))
                    }
                    placeholder="Seluruh hak cipta dilindungi."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors disabled:opacity-60"
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Toko & Footer'}
                </button>
              </form>
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-[#5C3A21]/12 p-5 space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#5C3A21]">
                    Live Preview Tampilan Web
                  </h3>
                  <p className="text-[11px] text-[#7C604C]">
                    Pratinjau langsung saat Anda mengetik perubahan di sebelah kiri.
                  </p>
                </div>

                {/* Preview Navbar */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C604C]">
                    Header / Navbar
                  </span>
                  <div className="px-4 py-3 bg-[#FFFDF9] rounded-xl border border-[#5C3A21]/15 flex items-center justify-between gap-2">
                    <span className="font-display text-base font-bold text-[#5C3A21] truncate">
                      {settingsForm.brandName || 'Nama Toko Anda'}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-semibold text-white bg-[#D97706] rounded-md shrink-0">
                      Masuk / Daftar
                    </span>
                  </div>
                </div>

                {/* Preview Footer */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C604C]">
                    Footer Website
                  </span>
                  <div className="p-4 bg-[#FFFDF9] rounded-xl border border-[#5C3A21]/15 space-y-3">
                    <div>
                      <p className="font-display text-base font-bold text-[#5C3A21]">
                        {settingsForm.brandName || 'Nama Toko Anda'}
                      </p>
                      <p className="mt-1 text-xs text-[#7C604C]">
                        {settingsForm.footerServiceText}
                        {settingsForm.operatingHours ? ` · ${settingsForm.operatingHours}` : ''}
                      </p>
                      {settingsForm.footerAddress && (
                        <p className="mt-1 text-xs text-[#6E5644]">{settingsForm.footerAddress}</p>
                      )}
                    </div>
                    <div className="pt-2.5 border-t border-[#5C3A21]/10 text-[11px] text-[#6E5644] space-y-1">
                      <p>
                        Rekening Resmi: {settingsForm.bankName} {settingsForm.bankAccountNumber} a.n.{' '}
                        {settingsForm.bankAccountHolder}
                      </p>
                      <p className="text-[#7C604C]">
                        © {new Date().getFullYear()} {settingsForm.brandName || 'Nama Toko Anda'}.{' '}
                        {settingsForm.footerCopyright}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      </div>
    </div>
  );
}
