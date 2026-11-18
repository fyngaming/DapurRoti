import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  calculateOrderTotals,
  calculatePromoDiscount,
  formatRupiah,
  generateOrderCode,
  slugifyLabel,
  validateCheckoutForm,
} from './orderLogic';

test('slugifyLabel converts category or product titles cleanly', () => {
  assert.equal(slugifyLabel('Kue Basah & Jajanan Pasar!'), 'kue-basah-jajanan-pasar');
});

test('formatRupiah formats Indonesian currency without decimals', () => {
  assert.equal(formatRupiah(18000), 'Rp 18.000');
  assert.equal(formatRupiah(0), 'Rp 0');
});

test('calculatePromoDiscount handles percent, fixed, and minimum order rules', () => {
  const pctPromo = {
    id: 1,
    code: 'HAJATAN10',
    title: 'Diskon 10%',
    discount_type: 'percent' as const,
    discount_value: 10,
    min_order: 50000,
    is_active: true,
  };
  assert.equal(calculatePromoDiscount(40000, pctPromo), 0);
  assert.equal(calculatePromoDiscount(60000, pctPromo), 6000);

  const fixedPromo = {
    id: 2,
    code: 'HEMAT15RB',
    title: 'Potongan 15rb',
    discount_type: 'fixed' as const,
    discount_value: 15000,
    min_order: 100000,
    is_active: true,
  };
  assert.equal(calculatePromoDiscount(120000, fixedPromo), 15000);
});

test('calculateOrderTotals computes PO 50% DP after promo discount properly', () => {
  const items = [
    { price: 18000, quantity: 2 }, // 36.000
    { price: 22000, quantity: 1 }, // 22.000 -> total 58.000
  ];
  const promo = {
    id: 1,
    code: 'HAJATAN10',
    title: 'Diskon 10%',
    discount_type: 'percent' as const,
    discount_value: 10,
    min_order: 50000,
    is_active: true,
  };

  const poResult = calculateOrderTotals(items, 'po', promo);
  assert.equal(poResult.totalItems, 3);
  assert.equal(poResult.subtotalAmount, 58000);
  assert.equal(poResult.discountAmount, 5800);
  assert.equal(poResult.totalAmount, 52200);
  assert.equal(poResult.dpAmount, 26100);
  assert.equal(poResult.remainingAmount, 26100);
});

test('generateOrderCode uses ORD-YYYYMMDD-XXXX format', () => {
  const fixedDate = new Date('2026-11-17T08:30:00Z');
  const code = generateOrderCode(fixedDate, 'A9K2');
  assert.equal(code, 'ORD-20261117-A9K2');
});

test('validateCheckoutForm rejects empty or invalid required fields', () => {
  const invalid = validateCheckoutForm({
    store_id: 1,
    customer_name: '',
    customer_email: 'budi@example.com',
    customer_phone: '123',
    delivery_address: 'Pendek',
    event_datetime: '',
    order_type: 'po',
    payment_method: 'transfer',
    promo_code: '',
  });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.customer_name);
  assert.ok(invalid.errors.customer_phone);
  assert.ok(invalid.errors.delivery_address);
  assert.ok(invalid.errors.event_datetime);
});

test('buildWhatsAppMessage includes store branch, item variant, promo discount, and DP 50%', () => {
  const promo = {
    id: 1,
    code: 'HAJATAN10',
    title: 'Diskon 10%',
    discount_type: 'percent' as const,
    discount_value: 10,
    min_order: 50000,
    is_active: true,
  };
  const message = buildWhatsAppMessage({
    brandName: 'Dapur Roti Hajatan',
    storeName: 'Cabang Tebet',
    orderCode: 'ORD-20261117-TEST',
    customerName: 'Siti Aminah',
    customerEmail: 'siti@example.com',
    customerPhone: '081234567890',
    deliveryAddress: 'Jl. Melati No. 14, Jakarta Selatan',
    eventDatetime: '2026-11-25T09:00',
    orderType: 'po',
    paymentMethod: 'transfer',
    bankDetails: 'BCA 1234567890 a.n. Dapur Roti Hajatan',
    promoCode: 'HAJATAN10',
    promo,
    items: [
      { name: 'Roti Sobek Cokelat Keju', variant: 'Extra Keju', price: 18000, quantity: 3 },
    ],
  });

  assert.match(message, /Cabang Toko: \*Cabang Tebet\*/);
  assert.match(message, /Roti Sobek Cokelat Keju \[Extra Keju\]/);
  assert.match(message, /Diskon Promo \(HAJATAN10\)/);

  const url = buildWhatsAppUrl('081234567890', message);
  assert.ok(url.startsWith('https://wa.me/6281234567890?text='));
});
