import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { MessageCircle, Minus, Plus, Send, Tag, X } from 'lucide-react';
import type {
  CartItem,
  CheckoutFormData,
  CheckoutValidationErrors,
  Order,
  Promo,
  SiteSettings,
  StoreBranch,
  User,
} from '../types/bakery';
import {
  buildWhatsAppMessage,
  calculateOrderTotals,
  formatRupiah,
  validateCheckoutForm,
} from '../utils/orderLogic';

interface CheckoutModalProps {
  isOpen: boolean;
  user: User | null;
  siteSettings: SiteSettings;
  cart: CartItem[];
  stores: StoreBranch[];
  selectedStoreId?: number | null;
  promos: Promo[];
  onClose: () => void;
  onUpdateQuantity: (productId: number, variant: string, delta: number) => void;
  onOrderCreated: (order: Order, whatsappUrl: string) => void;
}

function getDefaultEventDatetime(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T09:00`;
}

export function CheckoutModal({
  isOpen,
  user,
  siteSettings,
  cart,
  stores,
  selectedStoreId = null,
  promos,
  onClose,
  onUpdateQuantity,
  onOrderCreated,
}: CheckoutModalProps) {
  const [form, setForm] = useState<CheckoutFormData>({
    store_id: selectedStoreId ?? stores[0]?.id ?? 1,
    customer_name: user?.name ?? '',
    customer_email: user?.email ?? '',
    customer_phone: user?.phone ?? '',
    delivery_address: user?.default_address ?? '',
    event_datetime: getDefaultEventDatetime(),
    order_type: 'po',
    payment_method: 'transfer',
    promo_code: '',
  });
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const preferredStoreId =
        (selectedStoreId && stores.some((s) => s.id === selectedStoreId) ? selectedStoreId : null) ??
        (stores.some((s) => s.id === form.store_id) ? form.store_id : null) ??
        stores[0]?.id ??
        1;
      setForm((prev) => ({
        ...prev,
        store_id: preferredStoreId,
        customer_name: prev.customer_name || user.name,
        customer_email: user.email,
        customer_phone: prev.customer_phone || user.phone || '',
        delivery_address: prev.delivery_address || user.default_address || '',
      }));
      setFieldErrors({});
      setServerError(null);
      setPromoFeedback(null);
    }
  }, [isOpen, user, stores, selectedStoreId]);

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === form.store_id) ?? stores[0],
    [stores, form.store_id]
  );

  const activePromo = useMemo(() => {
    const code = form.promo_code.trim().toUpperCase();
    if (!code) return null;
    return promos.find((p) => p.is_active && p.code.toUpperCase() === code) ?? null;
  }, [form.promo_code, promos]);

  const totals = useMemo(
    () => calculateOrderTotals(cart, form.order_type, activePromo),
    [cart, form.order_type, activePromo]
  );

  const bankDetails = `${siteSettings.bankName} - ${siteSettings.bankAccountNumber} a.n. ${siteSettings.bankAccountHolder}`;

  const liveWhatsAppPreview = useMemo(
    () =>
      buildWhatsAppMessage({
        brandName: siteSettings.brandName,
        storeName: selectedStore?.name,
        customerName: form.customer_name,
        customerEmail: form.customer_email,
        customerPhone: form.customer_phone,
        deliveryAddress: form.delivery_address,
        eventDatetime: form.event_datetime,
        orderType: form.order_type,
        paymentMethod: form.payment_method,
        bankDetails,
        promoCode: totals.discountAmount > 0 ? activePromo?.code : null,
        promo: activePromo,
        items: cart,
      }),
    [form, cart, bankDetails, selectedStore, activePromo, totals.discountAmount, siteSettings.brandName]
  );

  if (!isOpen || !user) return null;

  function handleApplyPromo(codeToApply?: string) {
    const clean = (codeToApply ?? form.promo_code).trim().toUpperCase();
    setForm((prev) => ({ ...prev, promo_code: clean }));
    if (!clean) {
      setPromoFeedback(null);
      return;
    }
    const found = promos.find((p) => p.is_active && p.code.toUpperCase() === clean);
    if (!found) {
      setPromoFeedback('Kode promo tidak ditemukan atau sudah tidak aktif.');
      return;
    }
    if (totals.subtotalAmount < found.min_order) {
      setPromoFeedback(
        `Promo ${found.code} membutuhkan minimal belanja ${formatRupiah(found.min_order)}.`
      );
      return;
    }
    setPromoFeedback(`Promo ${found.code} aktif (${found.title}).`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validation = validateCheckoutForm(form);
    setFieldErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }

    if (cart.length === 0) {
      setServerError('Keranjang masih kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({
            product_id: item.product_id,
            variant: item.variant,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setServerError(data.message ?? 'Gagal menyimpan pesanan.');
        return;
      }

      onOrderCreated(data.order, data.whatsapp_url);
    } catch {
      setServerError('Gagal terhubung ke server. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#5C3A21]/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-5xl bg-[#FFFDF9] rounded-2xl border border-[#5C3A21]/15 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 border-b border-[#5C3A21]/10 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div>
            <h2
              id="checkout-modal-title"
              className="font-display text-xl font-bold text-[#5C3A21]"
            >
              Formulir Pemesanan &amp; Preview WhatsApp
            </h2>
            <p className="text-xs text-[#6E5644]">
              Pilih cabang toko, lengkapi jadwal acara, dan gunakan kode promo jika ada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal checkout"
            className="p-2 text-[#7C604C] hover:text-[#5C3A21] rounded-lg hover:bg-[#FAF5EC] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left Column: Checkout Inputs */}
          <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#5C3A21]/10 lg:overflow-y-auto">
            {serverError && (
              <div
                role="alert"
                className="px-4 py-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl"
              >
                {serverError}
              </div>
            )}

            {/* Mini Cart Review */}
            <div className="bg-[#FAF5EC] rounded-xl p-4 border border-[#5C3A21]/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C3A21]">
                  Item Pesanan ({totals.totalItems})
                </h3>
                <span className="text-sm font-bold text-[#5C3A21] tabular-nums">
                  {formatRupiah(totals.subtotalAmount)}
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={`${item.product_id}-${item.variant}`}
                    className="flex items-center justify-between gap-3 text-xs bg-white px-3 py-2 rounded-lg border border-[#5C3A21]/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#5C3A21] truncate">
                        {item.name}{' '}
                        <span className="font-normal text-[#7C604C]">({item.variant})</span>
                      </p>
                      <p className="text-[#7C604C] tabular-nums">
                        {formatRupiah(item.price)} x {item.quantity} ={' '}
                        <span className="font-semibold text-[#5C3A21]">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product_id, item.variant, -1)}
                        aria-label={`Kurangi ${item.name} (${item.variant})`}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-[#FAF5EC] text-[#5C3A21] hover:bg-[#E8DDD0]"
                      >
                        <Minus className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product_id, item.variant, 1)}
                        aria-label={`Tambah ${item.name} (${item.variant})`}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-[#FAF5EC] text-[#5C3A21] hover:bg-[#E8DDD0]"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Selection (4 Cabang Toko) */}
            {stores.length > 0 && (
              <div>
                <label
                  htmlFor="checkout-store"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Pilih Cabang Toko *
                </label>
                <select
                  id="checkout-store"
                  value={form.store_id}
                  onChange={(e) => setForm({ ...form, store_id: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} — {store.address}
                    </option>
                  ))}
                </select>
                {selectedStore && (
                  <p className="mt-1 text-[11px] text-[#7C604C]">
                    Jam operasional: {selectedStore.hours}
                  </p>
                )}
              </div>
            )}

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Nama Pemesan *
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
                {fieldErrors.customer_name && (
                  <p className="mt-1 text-xs text-red-700">{fieldErrors.customer_name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Email Pemesan (Terverifikasi)
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  readOnly
                  value={form.customer_email}
                  className="w-full px-3.5 py-2.5 text-sm text-[#7C604C] bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Nomor WhatsApp Pemesan *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
                {fieldErrors.customer_phone && (
                  <p className="mt-1 text-xs text-red-700">{fieldErrors.customer_phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-datetime"
                  className="block text-xs font-semibold text-[#5C3A21] mb-1"
                >
                  Tanggal &amp; Jam Acara *
                </label>
                <input
                  id="checkout-datetime"
                  type="datetime-local"
                  required
                  value={form.event_datetime}
                  onChange={(e) => setForm({ ...form, event_datetime: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
                {fieldErrors.event_datetime && (
                  <p className="mt-1 text-xs text-red-700">{fieldErrors.event_datetime}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-address"
                className="block text-xs font-semibold text-[#5C3A21] mb-1"
              >
                Alamat Lengkap Pengiriman / Pengambilan *
              </label>
              <textarea
                id="checkout-address"
                rows={2}
                required
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                placeholder="Jl. Contoh No. 12, RT 02/04, Kel. Sukamaju (atau tulis: Ambil di Toko)"
                className="w-full px-3.5 py-2.5 text-sm text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
              />
              {fieldErrors.delivery_address && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.delivery_address}</p>
              )}
            </div>

            {/* Promo Code Input */}
            <div className="p-3.5 rounded-xl bg-[#FAF5EC] border border-[#5C3A21]/10 space-y-2">
              <label
                htmlFor="checkout-promo"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#5C3A21]"
              >
                <Tag className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                <span>Kode Promo / Diskon (Opsional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="checkout-promo"
                  type="text"
                  value={form.promo_code}
                  onChange={(e) =>
                    setForm({ ...form, promo_code: e.target.value.toUpperCase() })
                  }
                  placeholder="Misal: HAJATAN10"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm uppercase font-mono text-[#5C3A21] bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#5C3A21] hover:bg-[#462B17] rounded-xl transition-colors whitespace-nowrap"
                >
                  Pakai
                </button>
              </div>
              {promos.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7C604C]">
                  <span>Promo tersedia:</span>
                  {promos.map((pr) => (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => handleApplyPromo(pr.code)}
                      className="font-mono font-semibold text-[#D97706] hover:underline"
                    >
                      {pr.code}
                    </button>
                  ))}
                </div>
              )}
              {promoFeedback && (
                <p
                  className={`text-xs font-medium ${
                    totals.discountAmount > 0 ? 'text-emerald-700' : 'text-[#B45309]'
                  }`}
                >
                  {promoFeedback}
                </p>
              )}
            </div>

            {/* Order Type Radio Buttons */}
            <div>
              <span className="block text-xs font-semibold text-[#5C3A21] mb-2">
                Jenis Pesanan
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    form.order_type === 'po'
                      ? 'bg-[#FAF5EC] border-[#D97706]'
                      : 'bg-white border-[#5C3A21]/15 hover:border-[#5C3A21]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value="po"
                    checked={form.order_type === 'po'}
                    onChange={() => setForm({ ...form, order_type: 'po' })}
                    className="mt-0.5 accent-[#D97706]"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-[#5C3A21]">
                      Pre-Order (PO) - DP 50%
                    </span>
                    <span className="block text-[#7C604C] mt-0.5 tabular-nums">
                      DP: {formatRupiah(totals.dpAmount)} · Sisa:{' '}
                      {formatRupiah(totals.remainingAmount)}
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    form.order_type === 'direct'
                      ? 'bg-[#FAF5EC] border-[#D97706]'
                      : 'bg-white border-[#5C3A21]/15 hover:border-[#5C3A21]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value="direct"
                    checked={form.order_type === 'direct'}
                    onChange={() => setForm({ ...form, order_type: 'direct' })}
                    className="mt-0.5 accent-[#D97706]"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-[#5C3A21]">
                      Pesan Langsung / Lunas
                    </span>
                    <span className="block text-[#7C604C] mt-0.5 tabular-nums">
                      Bayar penuh: {formatRupiah(totals.totalAmount)}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Method Radio Buttons */}
            <div>
              <span className="block text-xs font-semibold text-[#5C3A21] mb-2">
                Metode Pembayaran
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    form.payment_method === 'cash'
                      ? 'bg-[#FAF5EC] border-[#D97706]'
                      : 'bg-white border-[#5C3A21]/15 hover:border-[#5C3A21]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={form.payment_method === 'cash'}
                    onChange={() => setForm({ ...form, payment_method: 'cash' })}
                    className="mt-0.5 accent-[#D97706]"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-[#5C3A21]">Bayar Tunai / COD</span>
                    <span className="block text-[#7C604C] mt-0.5">
                      Saat barang diambil atau diantar kurir.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    form.payment_method === 'transfer'
                      ? 'bg-[#FAF5EC] border-[#D97706]'
                      : 'bg-white border-[#5C3A21]/15 hover:border-[#5C3A21]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="transfer"
                    checked={form.payment_method === 'transfer'}
                    onChange={() => setForm({ ...form, payment_method: 'transfer' })}
                    className="mt-0.5 accent-[#D97706]"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-[#5C3A21]">
                      Transfer Bank Manual
                    </span>
                    <span className="block text-[#7C604C] mt-0.5">
                      Kirim bukti transfer di chat WhatsApp Admin.
                    </span>
                  </div>
                </label>
              </div>

              {form.payment_method === 'transfer' && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#FAF5EC] border border-[#D97706]/30 text-xs text-[#5C3A21]">
                  <p className="font-bold">Rekening Pembayaran Resmi:</p>
                  <p className="mt-0.5 font-mono">
                    {siteSettings.bankName} · {siteSettings.bankAccountNumber} · a.n.{' '}
                    {siteSettings.bankAccountHolder}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live WhatsApp Preview */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[#FAF5EC] flex flex-col justify-between gap-4 lg:overflow-hidden">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <MessageCircle className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C3A21]">
                  Live Preview Chat WhatsApp
                </h3>
              </div>

              <div className="rounded-2xl bg-[#EFEAE2] border border-[#5C3A21]/10 p-3.5 overflow-y-auto flex-1">
                <div
                  data-testid="whatsapp-live-preview"
                  className="bg-[#E7FFDB] text-[#1E293B] rounded-xl rounded-tr-xs p-3.5 shadow-xs text-xs leading-relaxed whitespace-pre-wrap font-sans"
                >
                  {liveWhatsAppPreview}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[#5C3A21]/10 shrink-0">
              {totals.discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                  <span>Diskon Promo ({activePromo?.code})</span>
                  <span className="tabular-nums">-{formatRupiah(totals.discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6E5644]">
                  {form.order_type === 'po' ? 'Nominal DP 50% Sekarang' : 'Total Tagihan Lunas'}
                </span>
                <span className="font-bold text-base text-[#5C3A21] tabular-nums">
                  {formatRupiah(
                    form.order_type === 'po' ? totals.dpAmount : totals.totalAmount
                  )}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors min-h-[46px] disabled:opacity-60"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan Pesanan...'
                    : 'Simpan & Kirim Pesanan ke WhatsApp Admin'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
