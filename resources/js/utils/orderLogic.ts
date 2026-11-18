import type {
  CartItem,
  CheckoutFormData,
  CheckoutValidationErrors,
  OrderType,
  PaymentMethod,
  Promo,
} from '../types/bakery';

export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rp ${safeAmount.toLocaleString('id-ID')}`;
}

export function calculatePromoDiscount(subtotal: number, promo: Promo | null | undefined): number {
  if (!promo || !promo.is_active) return 0;
  if (subtotal < promo.min_order) return 0;

  if (promo.discount_type === 'percent') {
    const pct = Math.min(100, Math.max(0, promo.discount_value));
    return Math.round((subtotal * pct) / 100);
  }
  return Math.min(subtotal, Math.max(0, Math.round(promo.discount_value)));
}

export function calculateOrderTotals(
  items: Pick<CartItem, 'price' | 'quantity'>[],
  orderType: OrderType,
  promo?: Promo | null
): {
  totalItems: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
} {
  let totalItems = 0;
  let subtotalAmount = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, Math.floor(item.price));
    totalItems += qty;
    subtotalAmount += price * qty;
  }

  const discountAmount = calculatePromoDiscount(subtotalAmount, promo);
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);
  const dpAmount = orderType === 'po' ? Math.round(totalAmount * 0.5) : 0;
  const remainingAmount = orderType === 'po' ? totalAmount - dpAmount : 0;

  return {
    totalItems,
    subtotalAmount,
    discountAmount,
    totalAmount,
    dpAmount,
    remainingAmount,
  };
}

export function generateOrderCode(date: Date = new Date(), randomSuffix?: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const suffix =
    randomSuffix ??
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()
      .padEnd(4, 'X');
  return `ORD-${year}${month}${day}-${suffix}`;
}

export function formatEventDateTime(rawDatetime: string): string {
  if (!rawDatetime) return '-';
  const parsed = new Date(rawDatetime);
  if (Number.isNaN(parsed.getTime())) return rawDatetime;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function validateCheckoutForm(form: CheckoutFormData): {
  isValid: boolean;
  errors: CheckoutValidationErrors;
} {
  const errors: CheckoutValidationErrors = {};

  if (!form.customer_name.trim()) {
    errors.customer_name = 'Nama pemesan wajib diisi.';
  }

  const normalizedPhone = form.customer_phone.replace(/[\s-]/g, '');
  if (!normalizedPhone) {
    errors.customer_phone = 'Nomor WhatsApp pemesan wajib diisi.';
  } else if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(normalizedPhone)) {
    errors.customer_phone = 'Gunakan format nomor WhatsApp Indonesia yang valid (mis. 081234567890).';
  }

  if (!form.delivery_address.trim() || form.delivery_address.trim().length < 8) {
    errors.delivery_address = 'Alamat lengkap pengiriman / pengambilan wajib diisi minimal 8 karakter.';
  }

  if (!form.event_datetime.trim()) {
    errors.event_datetime = 'Tanggal & jam acara wajib diisi.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface BuildWhatsAppMessageInput {
  brandName: string;
  storeName?: string;
  orderCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  eventDatetime: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  bankDetails: string;
  promoCode?: string | null;
  promo?: Promo | null;
  items: { name: string; variant?: string; price: number; quantity: number }[];
}

export function buildWhatsAppMessage(input: BuildWhatsAppMessageInput): string {
  const { subtotalAmount, discountAmount, totalAmount, dpAmount, remainingAmount } =
    calculateOrderTotals(input.items, input.orderType, input.promo);

  const lines: string[] = [];
  lines.push(`Halo Admin *${input.brandName}*, saya ingin memesan roti/snack box untuk acara.`);
  if (input.orderCode) {
    lines.push(`Kode Pesanan: *${input.orderCode}*`);
  }
  if (input.storeName) {
    lines.push(`Cabang Toko: *${input.storeName}*`);
  }
  lines.push('');
  lines.push('*DATA PEMESAN*');
  lines.push(`- Nama: ${input.customerName.trim() || '-'}`);
  lines.push(`- Email: ${input.customerEmail.trim() || '-'}`);
  lines.push(`- No. WhatsApp: ${input.customerPhone.trim() || '-'}`);
  lines.push(`- Alamat: ${input.deliveryAddress.trim() || '-'}`);
  lines.push(`- Tanggal & Jam Acara: ${formatEventDateTime(input.eventDatetime)}`);
  lines.push('');
  lines.push('*RINCIAN PESANAN*');

  if (input.items.length === 0) {
    lines.push('(Belum ada item di keranjang)');
  } else {
    input.items.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      const variantText = item.variant ? ` [${item.variant}]` : '';
      lines.push(
        `${index + 1}. ${item.name}${variantText} (${item.quantity}x @ ${formatRupiah(item.price)}) = ${formatRupiah(subtotal)}`
      );
    });
  }

  lines.push('');
  lines.push('*RINGKASAN PEMBAYARAN*');
  if (discountAmount > 0 && input.promoCode) {
    lines.push(`- Subtotal: ${formatRupiah(subtotalAmount)}`);
    lines.push(`- Diskon Promo (${input.promoCode}): -${formatRupiah(discountAmount)}`);
  }
  lines.push(`- Total Harga: *${formatRupiah(totalAmount)}*`);

  if (input.orderType === 'po') {
    lines.push(`- Jenis Pesanan: Pre-Order (PO) - DP 50%`);
    lines.push(`- Nominal DP 50%: *${formatRupiah(dpAmount)}*`);
    lines.push(`- Sisa Pelunasan: ${formatRupiah(remainingAmount)}`);
  } else {
    lines.push(`- Jenis Pesanan: Pesan Langsung / Lunas`);
  }

  const paymentLabel =
    input.paymentMethod === 'transfer'
      ? `Transfer Bank Manual (${input.bankDetails})`
      : 'Bayar Tunai / COD (Saat barang diambil/diantar)';
  lines.push(`- Metode Pembayaran: ${paymentLabel}`);
  lines.push('');
  lines.push('Mohon konfirmasi ketersediaan jadwal & total tagihan. Terima kasih!');

  return lines.join('\n');
}

export function buildWhatsAppUrl(adminWhatsappNumber: string, message: string): string {
  const cleanNumber = adminWhatsappNumber.replace(/[^0-9]/g, '');
  const normalizedNumber = cleanNumber.startsWith('0')
    ? `62${cleanNumber.slice(1)}`
    : cleanNumber;
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

export function slugifyLabel(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
