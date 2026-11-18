import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_ADS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_PROMOS,
  SEED_STORES,
  STORE_CONFIG,
} from './src/data/seedProducts';
import type {
  AdBanner,
  Category,
  DiscountType,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Product,
  Promo,
  SiteSettings,
  StoreBranch,
  User,
} from './src/types/bakery';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  calculateOrderTotals,
  generateOrderCode,
  slugifyLabel,
  validateCheckoutForm,
} from './src/utils/orderLogic';

interface StoredUser extends User {
  role: 'customer' | 'admin';
  password_hash: string | null;
}

interface DatabaseSchema {
  users: StoredUser[];
  categories: Category[];
  products: Product[];
  stores: StoreBranch[];
  promos: Promo[];
  ads: AdBanner[];
  settings: SiteSettings;
  sessions: Record<string, number>;
  orders: Order[];
  nextUserId: number;
  nextCategoryId: number;
  nextProductId: number;
  nextStoreId: number;
  nextPromoId: number;
  nextAdId: number;
  nextOrderId: number;
  nextOrderItemId: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (derived.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derived, keyBuffer);
}

function normalizeVariants(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    const cleaned = raw.map((v) => String(v).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : ['Original'];
  }
  if (typeof raw === 'string') {
    const cleaned = raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : ['Original'];
  }
  return ['Original'];
}

function ensureDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DatabaseSchema = {
      users: [
        {
          id: 1,
          name: 'Siti Aminah',
          email: 'siti@rotihajatan.id',
          role: 'customer',
          phone: '081234567890',
          default_address: 'Jl. Kenanga Raya No. 18, Kemang, Jakarta Selatan',
          google_id: null,
          avatar: null,
          password_hash: hashPassword('password123'),
        },
        {
          id: 2,
          name: 'Admin Dapur Roti',
          email: 'admin@rotihajatan.id',
          role: 'admin',
          phone: STORE_CONFIG.adminWhatsapp,
          default_address: 'Dapur Pusat',
          google_id: null,
          avatar: null,
          password_hash: hashPassword('adminDapur2026'),
        },
      ],
      categories: [...SEED_CATEGORIES],
      products: SEED_PRODUCTS.map((p) => ({ ...p, variants: [...p.variants] })),
      stores: SEED_STORES.map((s) => ({ ...s })),
      promos: SEED_PROMOS.map((pr) => ({ ...pr })),
      ads: SEED_ADS.map((a) => ({ ...a })),
      settings: { ...DEFAULT_SITE_SETTINGS },
      sessions: {},
      orders: [],
      nextUserId: 3,
      nextCategoryId: SEED_CATEGORIES.length + 1,
      nextProductId: SEED_PRODUCTS.length + 1,
      nextStoreId: SEED_STORES.length + 1,
      nextPromoId: SEED_PROMOS.length + 1,
      nextAdId: SEED_ADS.length + 1,
      nextOrderId: 1,
      nextOrderItemId: 1,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    let dirty = false;

    const users: StoredUser[] = (parsed.users ?? []).map((u) => ({
      ...u,
      role: u.role === 'admin' ? 'admin' : 'customer',
    }));

    if (!users.some((u) => u.role === 'admin')) {
      const nextId = Math.max(parsed.nextUserId ?? 1, ...users.map((u) => u.id + 1));
      users.push({
        id: nextId,
        name: 'Admin Dapur Roti',
        email: 'admin@rotihajatan.id',
        role: 'admin',
        phone: STORE_CONFIG.adminWhatsapp,
        default_address: 'Dapur Pusat',
        google_id: null,
        avatar: null,
        password_hash: hashPassword('adminDapur2026'),
      });
      parsed.nextUserId = nextId + 1;
      dirty = true;
    }

    const categories =
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : [...SEED_CATEGORIES];
    if (!parsed.categories) dirty = true;

    const products = (
      Array.isArray(parsed.products) && parsed.products.length > 0
        ? parsed.products
        : SEED_PRODUCTS
    ).map((p) => ({
      ...p,
      variants:
        Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants
          : SEED_PRODUCTS.find((sp) => sp.id === p.id)?.variants ?? ['Original'],
    }));
    if (!parsed.products) dirty = true;

    const stores =
      Array.isArray(parsed.stores) && parsed.stores.length > 0
        ? parsed.stores
        : SEED_STORES.map((s) => ({ ...s }));
    if (!parsed.stores) dirty = true;

    const promos =
      Array.isArray(parsed.promos)
        ? parsed.promos
        : SEED_PROMOS.map((pr) => ({ ...pr }));
    if (!parsed.promos) dirty = true;

    const ads =
      Array.isArray(parsed.ads)
        ? parsed.ads
        : SEED_ADS.map((a) => ({ ...a }));
    if (!parsed.ads) dirty = true;

    const settings: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...(parsed.settings ?? {}),
    };
    if (!parsed.settings) {
      dirty = true;
    }

    const migrated: DatabaseSchema = {
      users,
      categories,
      products,
      stores,
      promos,
      ads,
      settings,
      sessions: parsed.sessions ?? {},
      orders: (parsed.orders ?? []).map((o) => ({
        ...o,
        discount_amount: o.discount_amount ?? 0,
        items: (o.items ?? []).map((it) => ({
          ...it,
          variant: it.variant ?? 'Original',
        })),
      })),
      nextUserId: parsed.nextUserId ?? users.length + 1,
      nextCategoryId: parsed.nextCategoryId ?? categories.length + 1,
      nextProductId: parsed.nextProductId ?? products.length + 1,
      nextStoreId: parsed.nextStoreId ?? stores.length + 1,
      nextPromoId: parsed.nextPromoId ?? promos.length + 1,
      nextAdId: parsed.nextAdId ?? ads.length + 1,
      nextOrderId: parsed.nextOrderId ?? 1,
      nextOrderItemId: parsed.nextOrderItemId ?? 1,
    };

    if (dirty) {
      saveDatabase(migrated);
    }

    return migrated;
  } catch {
    return {
      users: [],
      categories: [...SEED_CATEGORIES],
      products: SEED_PRODUCTS.map((p) => ({ ...p, variants: [...p.variants] })),
      stores: SEED_STORES.map((s) => ({ ...s })),
      promos: SEED_PROMOS.map((pr) => ({ ...pr })),
      ads: SEED_ADS.map((a) => ({ ...a })),
      settings: { ...DEFAULT_SITE_SETTINGS },
      sessions: {},
      orders: [],
      nextUserId: 1,
      nextCategoryId: SEED_CATEGORIES.length + 1,
      nextProductId: SEED_PRODUCTS.length + 1,
      nextStoreId: SEED_STORES.length + 1,
      nextPromoId: SEED_PROMOS.length + 1,
      nextAdId: SEED_ADS.length + 1,
      nextOrderId: 1,
      nextOrderItemId: 1,
    };
  }
}

function saveDatabase(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

function sanitizeUser(user: StoredUser): User {
  const { password_hash: _ignored, ...safeUser } = user;
  return safeUser;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawVal] = part.split('=');
    const key = rawKey?.trim();
    if (!key) continue;
    result[key] = decodeURIComponent(rawVal.join('=').trim());
  }
  return result;
}

const SESSION_COOKIE_NAME = 'roti_hajatan_session';
const GOOGLE_STATE_COOKIE_NAME = 'roti_hajatan_google_state';

function getSessionUser(req: express.Request, db: DatabaseSchema): StoredUser | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) ?? null;
}

function setSessionCookie(res: express.Response, token: string): void {
  res.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
}

function clearSessionCookie(res: express.Response): void {
  res.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function setGoogleStateCookie(res: express.Response, payload: { state: string; checkout: boolean }): void {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  res.append(
    'Set-Cookie',
    `${GOOGLE_STATE_COOKIE_NAME}=${encodeURIComponent(encoded)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
}

function clearGoogleStateCookie(res: express.Response): void {
  res.append(
    'Set-Cookie',
    `${GOOGLE_STATE_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function getGoogleOAuthConfig(req: express.Request) {
  const clientId = (process.env.GOOGLE_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim();
  const isConfigured =
    Boolean(clientId) &&
    Boolean(clientSecret) &&
    clientId !== 'YOUR_GOOGLE_CLIENT_ID' &&
    clientSecret !== 'YOUR_GOOGLE_CLIENT_SECRET';

  const host = req.get('host') || `localhost:${process.env.PORT ?? 3000}`;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : '') ||
    req.protocol ||
    'http';
  const defaultRedirectUri = `${protocol}://${host}/api/auth/google/callback`;
  const redirectUri = (process.env.GOOGLE_REDIRECT_URI ?? '').trim() || defaultRedirectUri;

  return { clientId, clientSecret, redirectUri, isConfigured };
}

function attachWhatsappUrl(order: Order, db?: DatabaseSchema): Order {
  const settings = db?.settings ?? DEFAULT_SITE_SETTINGS;
  const store = db?.stores.find((s) => s.id === order.store_id);
  const targetWa = store?.phone || settings.adminWhatsapp || STORE_CONFIG.adminWhatsapp;
  const promoObj: Promo | null =
    order.discount_amount > 0
      ? {
          id: 0,
          code: order.promo_code ?? 'PROMO',
          title: 'Diskon Promo',
          discount_type: 'fixed',
          discount_value: order.discount_amount,
          min_order: 0,
          is_active: true,
        }
      : null;

  const msg = buildWhatsAppMessage({
    brandName: settings.brandName || STORE_CONFIG.brandName,
    storeName: order.store_name || store?.name,
    orderCode: order.order_code,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    deliveryAddress: order.delivery_address,
    eventDatetime: order.event_datetime,
    orderType: order.order_type,
    paymentMethod: order.payment_method,
    bankDetails: `${settings.bankName} - ${settings.bankAccountNumber} a.n. ${settings.bankAccountHolder}`,
    promoCode: order.promo_code,
    promo: promoObj,
    items: order.items.map((item) => ({
      name: item.product_name,
      variant: item.variant,
      price: item.price,
      quantity: item.quantity,
    })),
  });
  return {
    ...order,
    whatsapp_url: buildWhatsAppUrl(targetWa, msg),
  };
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT ?? 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Public storefront catalog endpoint (products, categories, stores, promos, ads, settings)
  app.get('/api/products', (_req, res) => {
    const db = ensureDatabase();
    res.json({
      categories: db.categories,
      products: db.products.filter((p) => p.is_available),
      stores: db.stores.filter((s) => s.is_active),
      promos: db.promos.filter((pr) => pr.is_active),
      ads: db.ads.filter((a) => a.is_active),
      settings: db.settings,
    });
  });

  // Current authenticated user
  app.get('/api/auth/me', (req, res) => {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    res.json({ user: user ? sanitizeUser(user) : null });
  });

  // Register via Email & Password
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone } = req.body ?? {};
    const cleanName = String(name ?? '').trim();
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const cleanPassword = String(password ?? '');

    if (!cleanName || cleanName.length < 2) {
      res.status(422).json({ message: 'Nama lengkap minimal 2 karakter.' });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(422).json({ message: 'Format email tidak valid.' });
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      res.status(422).json({ message: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    const db = ensureDatabase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(422).json({ message: 'Email sudah terdaftar. Silakan masuk.' });
      return;
    }

    const newUser: StoredUser = {
      id: db.nextUserId++,
      name: cleanName,
      email: cleanEmail,
      role: 'customer',
      phone: phone ? String(phone).trim() : null,
      default_address: null,
      google_id: null,
      avatar: null,
      password_hash: hashPassword(cleanPassword),
    };

    const token = crypto.randomBytes(24).toString('hex');
    db.users.push(newUser);
    db.sessions[token] = newUser.id;
    saveDatabase(db);

    setSessionCookie(res, token);
    res.status(201).json({ user: sanitizeUser(newUser) });
  });

  // Login via Email & Password
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const cleanPassword = String(password ?? '');

    if (!cleanEmail || !cleanPassword) {
      res.status(422).json({ message: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const db = ensureDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(cleanPassword, user.password_hash)) {
      res.status(401).json({ message: 'Email atau kata sandi salah.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDatabase(db);

    setSessionCookie(res, token);
    res.json({ user: sanitizeUser(user) });
  });

  // Check Google OAuth 2.0 configuration status
  app.get('/api/auth/google/status', (req, res) => {
    const config = getGoogleOAuthConfig(req);
    res.json({
      configured: config.isConfigured,
      redirectUri: config.redirectUri,
    });
  });

  // Step 1: Redirect user to official Google OAuth 2.0 consent page
  app.get('/api/auth/google/redirect', (req, res) => {
    const config = getGoogleOAuthConfig(req);
    if (!config.isConfigured) {
      res.redirect('/?auth_error=google_not_configured');
      return;
    }

    const state = crypto.randomBytes(24).toString('hex');
    const checkout = req.query.checkout === '1';
    setGoogleStateCookie(res, { state, checkout });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
      access_type: 'online',
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  // Step 2: Handle Google OAuth 2.0 callback, fetch real profile, save to DB & login
  app.get('/api/auth/google/callback', async (req, res) => {
    const config = getGoogleOAuthConfig(req);
    const cookies = parseCookies(req.headers.cookie);
    const rawStateCookie = cookies[GOOGLE_STATE_COOKIE_NAME];
    clearGoogleStateCookie(res);

    if (!config.isConfigured) {
      res.redirect('/?auth_error=google_not_configured');
      return;
    }

    if (req.query.error) {
      res.redirect('/?auth_error=google_cancelled');
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const returnedState = typeof req.query.state === 'string' ? req.query.state : '';

    let savedState = '';
    let shouldOpenCheckout = false;
    try {
      if (rawStateCookie) {
        const parsed = JSON.parse(Buffer.from(rawStateCookie, 'base64url').toString('utf-8'));
        savedState = String(parsed?.state ?? '');
        shouldOpenCheckout = Boolean(parsed?.checkout);
      }
    } catch {
      savedState = '';
    }

    if (!code || !returnedState || !savedState || returnedState !== savedState) {
      res.redirect('/?auth_error=google_state_invalid');
      return;
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        console.error('Google OAuth token exchange failed:', await tokenRes.text());
        res.redirect('/?auth_error=google_token_failed');
        return;
      }

      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token) {
        res.redirect('/?auth_error=google_token_failed');
        return;
      }

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        console.error('Google OAuth userinfo failed:', await userInfoRes.text());
        res.redirect('/?auth_error=google_profile_failed');
        return;
      }

      const profile = (await userInfoRes.json()) as {
        sub?: string;
        name?: string;
        email?: string;
        picture?: string;
      };

      const cleanEmail = String(profile.email ?? '').trim().toLowerCase();
      const cleanGoogleId = String(profile.sub ?? '').trim();
      const cleanName = String(profile.name ?? '').trim() || cleanEmail.split('@')[0] || 'Pengguna Google';
      const cleanAvatar = typeof profile.picture === 'string' && profile.picture.trim() ? profile.picture.trim() : null;

      if (!cleanEmail || !cleanGoogleId) {
        res.redirect('/?auth_error=google_profile_failed');
        return;
      }

      const db = ensureDatabase();
      let user = db.users.find(
        (u) => u.google_id === cleanGoogleId || u.email.toLowerCase() === cleanEmail
      );

      if (!user) {
        user = {
          id: db.nextUserId++,
          name: cleanName,
          email: cleanEmail,
          role: 'customer',
          google_id: cleanGoogleId,
          avatar: cleanAvatar,
          phone: null,
          default_address: null,
          password_hash: null,
        };
        db.users.push(user);
      } else {
        user.google_id = cleanGoogleId;
        if (cleanAvatar) {
          user.avatar = cleanAvatar;
        }
        if (!user.name && cleanName) {
          user.name = cleanName;
        }
      }

      const token = crypto.randomBytes(24).toString('hex');
      db.sessions[token] = user.id;
      saveDatabase(db);

      setSessionCookie(res, token);
      const nextUrl = shouldOpenCheckout ? '/?auth=google_success&checkout=1' : '/?auth=google_success';
      res.redirect(nextUrl);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect('/?auth_error=google_server_error');
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const db = ensureDatabase();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (token && db.sessions[token]) {
      delete db.sessions[token];
      saveDatabase(db);
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  // List authenticated user's orders (/my-orders)
  app.get('/api/orders', (req, res) => {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    if (!user) {
      res
        .status(401)
        .json({ message: 'Silakan masuk terlebih dahulu untuk melihat riwayat pesanan.' });
      return;
    }

    const userOrders = db.orders
      .filter((o) => o.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((order) => attachWhatsappUrl(order, db));

    res.json({ orders: userOrders });
  });

  // Store new order
  app.post('/api/orders', (req, res) => {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    if (!user) {
      res.status(401).json({ message: 'Silakan masuk terlebih dahulu sebelum memesan.' });
      return;
    }

    const {
      store_id,
      customer_name,
      customer_phone,
      delivery_address,
      event_datetime,
      order_type,
      payment_method,
      promo_code,
      items,
    } = req.body ?? {};

    const cleanOrderType: OrderType = order_type === 'direct' ? 'direct' : 'po';
    const cleanPaymentMethod: PaymentMethod = payment_method === 'cash' ? 'cash' : 'transfer';
    const requestedStoreId = Number(store_id);
    const store =
      db.stores.find((s) => s.id === requestedStoreId && s.is_active) ??
      db.stores.find((s) => s.is_active) ??
      db.stores[0];

    const validation = validateCheckoutForm({
      store_id: store?.id ?? 1,
      customer_name: String(customer_name ?? ''),
      customer_email: user.email,
      customer_phone: String(customer_phone ?? ''),
      delivery_address: String(delivery_address ?? ''),
      event_datetime: String(event_datetime ?? ''),
      order_type: cleanOrderType,
      payment_method: cleanPaymentMethod,
      promo_code: String(promo_code ?? ''),
    });

    if (!validation.isValid) {
      res.status(422).json({
        message: 'Mohon periksa kembali data pemesanan Anda.',
        errors: validation.errors,
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(422).json({ message: 'Keranjang belanja masih kosong.' });
      return;
    }

    const resolvedItems: OrderItem[] = [];
    const orderId = db.nextOrderId++;

    for (const rawItem of items) {
      const productId = Number(rawItem?.product_id);
      const quantity = Math.floor(Number(rawItem?.quantity));
      if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity < 1) {
        res.status(422).json({ message: 'Item keranjang tidak valid.' });
        return;
      }
      const product = db.products.find((p) => p.id === productId && p.is_available);
      if (!product) {
        res.status(422).json({ message: `Produk dengan ID ${productId} tidak tersedia.` });
        return;
      }
      const variant = String(rawItem?.variant ?? '').trim() || product.variants[0] || 'Original';
      resolvedItems.push({
        id: db.nextOrderItemId++,
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        variant,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      });
    }

    const cleanPromoCode = String(promo_code ?? '').trim().toUpperCase();
    const matchedPromo = cleanPromoCode
      ? db.promos.find((pr) => pr.is_active && pr.code.toUpperCase() === cleanPromoCode)
      : null;

    const totals = calculateOrderTotals(resolvedItems, cleanOrderType, matchedPromo);
    const orderCode = generateOrderCode(new Date());

    const newOrder: Order = {
      id: orderId,
      order_code: orderCode,
      user_id: user.id,
      store_id: store?.id ?? null,
      store_name: store?.name ?? STORE_CONFIG.brandName,
      customer_name: String(customer_name).trim(),
      customer_email: user.email,
      customer_phone: String(customer_phone).trim(),
      delivery_address: String(delivery_address).trim(),
      event_datetime: String(event_datetime).trim(),
      order_type: cleanOrderType,
      payment_method: cleanPaymentMethod,
      promo_code: totals.discountAmount > 0 && matchedPromo ? matchedPromo.code : null,
      discount_amount: totals.discountAmount,
      total_amount: totals.totalAmount,
      dp_amount: totals.dpAmount,
      status: 'pending_wa',
      created_at: new Date().toISOString(),
      items: resolvedItems,
    };

    user.phone = newOrder.customer_phone;
    user.default_address = newOrder.delivery_address;

    db.orders.push(newOrder);
    saveDatabase(db);

    const enriched = attachWhatsappUrl(newOrder, db);
    res.status(201).json({
      order: enriched,
      whatsapp_url: enriched.whatsapp_url,
    });
  });

  // ==========================================================
  // PRIVATE ADMIN ROUTES (/api/dapur-admin/*)
  // ==========================================================
  app.post('/api/dapur-admin/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const cleanPassword = String(password ?? '');

    const db = ensureDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.role === 'admin'
    );

    if (!user || !verifyPassword(cleanPassword, user.password_hash)) {
      res.status(401).json({ message: 'Kredensial admin tidak valid.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDatabase(db);
    setSessionCookie(res, token);
    res.json({ user: sanitizeUser(user) });
  });

  function requireAdmin(req: express.Request, res: express.Response): {
    db: DatabaseSchema;
    user: StoredUser;
  } | null {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Akses ditolak. Khusus administrator.' });
      return null;
    }
    return { db, user };
  }

  app.get('/api/dapur-admin/overview', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const orders = [...auth.db.orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o) => attachWhatsappUrl(o, auth.db));

    const customers = auth.db.users
      .filter((u) => u.role === 'customer')
      .map(sanitizeUser);

    res.json({
      orders,
      categories: auth.db.categories,
      products: auth.db.products,
      stores: auth.db.stores,
      customers,
      promos: auth.db.promos,
      ads: auth.db.ads,
      settings: auth.db.settings,
    });
  });

  app.put('/api/dapur-admin/settings', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const brandName = String(req.body?.brandName ?? '').trim();
    if (!brandName || brandName.length < 2) {
      res.status(422).json({ message: 'Nama toko minimal 2 karakter.' });
      return;
    }

    const nextSettings: SiteSettings = {
      brandName,
      tagline: String(req.body?.tagline ?? '').trim(),
      footerServiceText:
        String(req.body?.footerServiceText ?? '').trim() || DEFAULT_SITE_SETTINGS.footerServiceText,
      operatingHours:
        String(req.body?.operatingHours ?? '').trim() || DEFAULT_SITE_SETTINGS.operatingHours,
      footerAddress: String(req.body?.footerAddress ?? '').trim(),
      footerCopyright:
        String(req.body?.footerCopyright ?? '').trim() || DEFAULT_SITE_SETTINGS.footerCopyright,
      adminWhatsapp:
        String(req.body?.adminWhatsapp ?? '')
          .replace(/[^0-9]/g, '')
          .trim() || auth.db.settings.adminWhatsapp,
      bankName: String(req.body?.bankName ?? '').trim() || auth.db.settings.bankName,
      bankAccountNumber:
        String(req.body?.bankAccountNumber ?? '').trim() || auth.db.settings.bankAccountNumber,
      bankAccountHolder:
        String(req.body?.bankAccountHolder ?? '').trim() || brandName,
    };

    auth.db.settings = nextSettings;
    saveDatabase(auth.db);
    res.json({ settings: nextSettings });
  });

  app.patch('/api/dapur-admin/orders/:id/status', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const orderId = Number(req.params.id);
    const nextStatus = req.body?.status as OrderStatus;
    const allowed: OrderStatus[] = ['pending_wa', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(nextStatus)) {
      res.status(422).json({ message: 'Status pesanan tidak valid.' });
      return;
    }

    const order = auth.db.orders.find((o) => o.id === orderId);
    if (!order) {
      res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
      return;
    }

    order.status = nextStatus;
    saveDatabase(auth.db);
    res.json({ order: attachWhatsappUrl(order, auth.db) });
  });

  // 0. Upload Foto Produk / Banner Iklan (Admin)
  app.post('/api/dapur-admin/upload-image', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl.trim() : '';
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(422).json({
        message: 'Format gambar tidak valid. Gunakan JPG, PNG, atau WebP.',
      });
      return;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const maxBytes = 8 * 1024 * 1024; // 8 MB
    if (buffer.length === 0 || buffer.length > maxBytes) {
      res.status(422).json({
        message: 'Ukuran gambar maksimal 8 MB.',
      });
      return;
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extMap[mimeType] ?? 'jpg';
    const filename = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

    res.status(201).json({ url: `/uploads/${filename}` });
  });

  // 1. CRUD Kelompok Barang (Categories)
  app.post('/api/dapur-admin/categories', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const name = String(req.body?.name ?? '').trim();
    const slug = slugifyLabel(req.body?.slug ? String(req.body.slug) : name);

    if (!name || name.length < 2) {
      res.status(422).json({ message: 'Nama kelompok barang minimal 2 karakter.' });
      return;
    }
    if (!slug) {
      res.status(422).json({ message: 'Slug kategori tidak valid.' });
      return;
    }
    if (auth.db.categories.some((c) => c.slug === slug)) {
      res.status(422).json({ message: 'Kelompok barang tersebut sudah ada.' });
      return;
    }

    const category: Category = {
      id: auth.db.nextCategoryId++,
      name,
      slug,
    };
    auth.db.categories.push(category);
    saveDatabase(auth.db);
    res.status(201).json({ category });
  });

  app.put('/api/dapur-admin/categories/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const catId = Number(req.params.id);
    const category = auth.db.categories.find((c) => c.id === catId);
    if (!category) {
      res.status(404).json({ message: 'Kelompok barang tidak ditemukan.' });
      return;
    }

    const name = String(req.body?.name ?? '').trim();
    if (!name || name.length < 2) {
      res.status(422).json({ message: 'Nama kelompok barang minimal 2 karakter.' });
      return;
    }

    const newSlug = slugifyLabel(req.body?.slug ? String(req.body.slug) : name);
    if (
      newSlug !== category.slug &&
      auth.db.categories.some((c) => c.slug === newSlug && c.id !== catId)
    ) {
      res.status(422).json({ message: 'Slug kategori sudah digunakan.' });
      return;
    }

    const oldSlug = category.slug;
    category.name = name;
    category.slug = newSlug;

    if (oldSlug !== newSlug) {
      for (const product of auth.db.products) {
        if (product.category === oldSlug) {
          product.category = newSlug;
        }
      }
    }

    saveDatabase(auth.db);
    res.json({ category });
  });

  app.delete('/api/dapur-admin/categories/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const catId = Number(req.params.id);
    const category = auth.db.categories.find((c) => c.id === catId);
    if (!category) {
      res.status(404).json({ message: 'Kelompok barang tidak ditemukan.' });
      return;
    }

    const usedCount = auth.db.products.filter((p) => p.category === category.slug).length;
    if (usedCount > 0) {
      res.status(422).json({
        message: `Kelompok masih dipakai oleh ${usedCount} barang. Pindahkan atau hapus barang terlebih dahulu.`,
      });
      return;
    }

    auth.db.categories = auth.db.categories.filter((c) => c.id !== catId);
    saveDatabase(auth.db);
    res.json({ ok: true });
  });

  // 2. CRUD Barang / Roti (nama, harga, varian, kelompok)
  app.post('/api/dapur-admin/products', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const name = String(req.body?.name ?? '').trim();
    const category = String(req.body?.category ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const price = Math.floor(Number(req.body?.price));
    const variants = normalizeVariants(req.body?.variants);
    const image =
      String(req.body?.image ?? '').trim() ||
      '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg';
    const isAvailable = req.body?.is_available !== false;

    if (!name || name.length < 2) {
      res.status(422).json({ message: 'Nama barang/roti wajib diisi.' });
      return;
    }
    if (!auth.db.categories.some((c) => c.slug === category)) {
      res.status(422).json({ message: 'Kelompok barang tidak valid.' });
      return;
    }
    if (!Number.isFinite(price) || price < 500) {
      res.status(422).json({ message: 'Harga minimal Rp 500.' });
      return;
    }
    if (!description || description.length < 5) {
      res.status(422).json({ message: 'Deskripsi produk minimal 5 karakter.' });
      return;
    }

    const baseSlug = slugifyLabel(name) || `produk-${Date.now()}`;
    let slug = baseSlug;
    let counter = 2;
    while (auth.db.products.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const product: Product = {
      id: auth.db.nextProductId++,
      name,
      slug,
      category,
      description,
      price,
      variants,
      image,
      is_available: isAvailable,
    };

    auth.db.products.push(product);
    saveDatabase(auth.db);
    res.status(201).json({ product });
  });

  app.put('/api/dapur-admin/products/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const productId = Number(req.params.id);
    const product = auth.db.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ message: 'Barang tidak ditemukan.' });
      return;
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name || name.length < 2) {
        res.status(422).json({ message: 'Nama barang minimal 2 karakter.' });
        return;
      }
      product.name = name;
    }
    if (req.body?.category !== undefined) {
      const cat = String(req.body.category).trim();
      if (!auth.db.categories.some((c) => c.slug === cat)) {
        res.status(422).json({ message: 'Kelompok barang tidak ditemukan.' });
        return;
      }
      product.category = cat;
    }
    if (req.body?.description !== undefined) {
      const desc = String(req.body.description).trim();
      if (!desc || desc.length < 5) {
        res.status(422).json({ message: 'Deskripsi produk minimal 5 karakter.' });
        return;
      }
      product.description = desc;
    }
    if (req.body?.price !== undefined) {
      const price = Math.floor(Number(req.body.price));
      if (!Number.isFinite(price) || price < 500) {
        res.status(422).json({ message: 'Harga minimal Rp 500.' });
        return;
      }
      product.price = price;
    }
    if (req.body?.variants !== undefined) {
      product.variants = normalizeVariants(req.body.variants);
    }
    if (req.body?.image !== undefined && String(req.body.image).trim()) {
      product.image = String(req.body.image).trim();
    }
    if (req.body?.is_available !== undefined) {
      product.is_available = Boolean(req.body.is_available);
    }

    saveDatabase(auth.db);
    res.json({ product });
  });

  app.delete('/api/dapur-admin/products/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const productId = Number(req.params.id);
    if (!auth.db.products.some((p) => p.id === productId)) {
      res.status(404).json({ message: 'Barang tidak ditemukan.' });
      return;
    }

    auth.db.products = auth.db.products.filter((p) => p.id !== productId);
    saveDatabase(auth.db);
    res.json({ ok: true });
  });

  // 3. CRUD Toko (Cabang Toko)
  app.post('/api/dapur-admin/stores', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const name = String(req.body?.name ?? '').trim();
    const address = String(req.body?.address ?? '').trim();
    const phone = String(req.body?.phone ?? '').trim();
    const hours = String(req.body?.hours ?? '').trim() || '06.00 – 19.00 WIB';
    const isActive = req.body?.is_active !== false;

    if (!name || name.length < 3) {
      res.status(422).json({ message: 'Nama cabang toko minimal 3 karakter.' });
      return;
    }
    if (!address || address.length < 5) {
      res.status(422).json({ message: 'Alamat toko wajib diisi.' });
      return;
    }
    if (!phone) {
      res.status(422).json({ message: 'Nomor telepon / WhatsApp toko wajib diisi.' });
      return;
    }

    const store: StoreBranch = {
      id: auth.db.nextStoreId++,
      name,
      address,
      phone,
      hours,
      is_active: isActive,
    };
    auth.db.stores.push(store);
    saveDatabase(auth.db);
    res.status(201).json({ store });
  });

  app.put('/api/dapur-admin/stores/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const storeId = Number(req.params.id);
    const store = auth.db.stores.find((s) => s.id === storeId);
    if (!store) {
      res.status(404).json({ message: 'Toko tidak ditemukan.' });
      return;
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) {
        res.status(422).json({ message: 'Nama toko wajib diisi.' });
        return;
      }
      store.name = name;
    }
    if (req.body?.address !== undefined) {
      const addr = String(req.body.address).trim();
      if (!addr) {
        res.status(422).json({ message: 'Alamat toko wajib diisi.' });
        return;
      }
      store.address = addr;
    }
    if (req.body?.phone !== undefined) {
      store.phone = String(req.body.phone).trim();
    }
    if (req.body?.hours !== undefined) {
      store.hours = String(req.body.hours).trim();
    }
    if (req.body?.is_active !== undefined) {
      store.is_active = Boolean(req.body.is_active);
    }

    saveDatabase(auth.db);
    res.json({ store });
  });

  app.delete('/api/dapur-admin/stores/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const storeId = Number(req.params.id);
    if (auth.db.stores.length <= 1) {
      res.status(422).json({ message: 'Minimal harus ada 1 toko aktif.' });
      return;
    }
    auth.db.stores = auth.db.stores.filter((s) => s.id !== storeId);
    saveDatabase(auth.db);
    res.json({ ok: true });
  });

  // 4. CRUD Pelanggan (nama, alamat, no hp)
  app.post('/api/dapur-admin/customers', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const phone = String(req.body?.phone ?? '').trim();
    const defaultAddress = String(req.body?.default_address ?? '').trim();

    if (!name || name.length < 2) {
      res.status(422).json({ message: 'Nama pelanggan minimal 2 karakter.' });
      return;
    }
    const resolvedEmail = email || `pelanggan.${Date.now()}@rotihajatan.id`;
    if (auth.db.users.some((u) => u.email.toLowerCase() === resolvedEmail)) {
      res.status(422).json({ message: 'Email pelanggan sudah terdaftar.' });
      return;
    }

    const customer: StoredUser = {
      id: auth.db.nextUserId++,
      name,
      email: resolvedEmail,
      role: 'customer',
      phone: phone || null,
      default_address: defaultAddress || null,
      google_id: null,
      avatar: null,
      password_hash: hashPassword('password123'),
    };
    auth.db.users.push(customer);
    saveDatabase(auth.db);
    res.status(201).json({ customer: sanitizeUser(customer) });
  });

  app.put('/api/dapur-admin/customers/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const custId = Number(req.params.id);
    const customer = auth.db.users.find((u) => u.id === custId && u.role === 'customer');
    if (!customer) {
      res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
      return;
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) {
        res.status(422).json({ message: 'Nama pelanggan wajib diisi.' });
        return;
      }
      customer.name = name;
    }
    if (req.body?.phone !== undefined) {
      customer.phone = String(req.body.phone).trim() || null;
    }
    if (req.body?.default_address !== undefined) {
      customer.default_address = String(req.body.default_address).trim() || null;
    }

    saveDatabase(auth.db);
    res.json({ customer: sanitizeUser(customer) });
  });

  app.delete('/api/dapur-admin/customers/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const custId = Number(req.params.id);
    auth.db.users = auth.db.users.filter((u) => !(u.id === custId && u.role === 'customer'));
    saveDatabase(auth.db);
    res.json({ ok: true });
  });

  // 5. CRUD Promo (diskon, dll)
  app.post('/api/dapur-admin/promos', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const code = String(req.body?.code ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const title = String(req.body?.title ?? '').trim();
    const discountType: DiscountType =
      req.body?.discount_type === 'fixed' ? 'fixed' : 'percent';
    const discountValue = Math.max(0, Math.floor(Number(req.body?.discount_value)));
    const minOrder = Math.max(0, Math.floor(Number(req.body?.min_order ?? 0)));
    const isActive = req.body?.is_active !== false;

    if (!code || code.length < 3) {
      res.status(422).json({ message: 'Kode promo minimal 3 karakter.' });
      return;
    }
    if (!title) {
      res.status(422).json({ message: 'Judul promo wajib diisi.' });
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      res.status(422).json({ message: 'Nilai diskon harus lebih dari 0.' });
      return;
    }
    if (auth.db.promos.some((p) => p.code.toUpperCase() === code)) {
      res.status(422).json({ message: 'Kode promo sudah digunakan.' });
      return;
    }

    const promo: Promo = {
      id: auth.db.nextPromoId++,
      code,
      title,
      discount_type: discountType,
      discount_value: discountValue,
      min_order: minOrder,
      is_active: isActive,
    };
    auth.db.promos.push(promo);
    saveDatabase(auth.db);
    res.status(201).json({ promo });
  });

  app.put('/api/dapur-admin/promos/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const promoId = Number(req.params.id);
    const promo = auth.db.promos.find((p) => p.id === promoId);
    if (!promo) {
      res.status(404).json({ message: 'Promo tidak ditemukan.' });
      return;
    }

    if (req.body?.code !== undefined) {
      const code = String(req.body.code).trim().toUpperCase().replace(/\s+/g, '');
      if (code.length < 3) {
        res.status(422).json({ message: 'Kode promo minimal 3 karakter.' });
        return;
      }
      promo.code = code;
    }
    if (req.body?.title !== undefined) {
      promo.title = String(req.body.title).trim();
    }
    if (req.body?.discount_type !== undefined) {
      promo.discount_type = req.body.discount_type === 'fixed' ? 'fixed' : 'percent';
    }
    if (req.body?.discount_value !== undefined) {
      promo.discount_value = Math.max(1, Math.floor(Number(req.body.discount_value)));
    }
    if (req.body?.min_order !== undefined) {
      promo.min_order = Math.max(0, Math.floor(Number(req.body.min_order)));
    }
    if (req.body?.is_active !== undefined) {
      promo.is_active = Boolean(req.body.is_active);
    }

    saveDatabase(auth.db);
    res.json({ promo });
  });

  app.delete('/api/dapur-admin/promos/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const promoId = Number(req.params.id);
    auth.db.promos = auth.db.promos.filter((p) => p.id !== promoId);
    saveDatabase(auth.db);
    res.json({ ok: true });
  });

  // 6. CRUD Iklan Carousel (Ads)
  app.post('/api/dapur-admin/ads', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const title = String(req.body?.title ?? '').trim();
    const subtitle = String(req.body?.subtitle ?? '').trim();
    const image =
      String(req.body?.image ?? '').trim() ||
      '/src/assets/images/hero_bakery_spread_1794924158422.jpg';
    const ctaLabel = String(req.body?.cta_label ?? '').trim() || 'Lihat Menu';
    const isActive = req.body?.is_active !== false;

    if (!title || title.length < 3) {
      res.status(422).json({ message: 'Judul iklan minimal 3 karakter.' });
      return;
    }

    const ad: AdBanner = {
      id: auth.db.nextAdId++,
      title,
      subtitle,
      image,
      cta_label: ctaLabel,
      is_active: isActive,
    };
    auth.db.ads.push(ad);
    saveDatabase(auth.db);
    res.status(201).json({ ad });
  });

  app.put('/api/dapur-admin/ads/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const adId = Number(req.params.id);
    const ad = auth.db.ads.find((a) => a.id === adId);
    if (!ad) {
      res.status(404).json({ message: 'Iklan tidak ditemukan.' });
      return;
    }

    if (req.body?.title !== undefined) {
      ad.title = String(req.body.title).trim();
    }
    if (req.body?.subtitle !== undefined) {
      ad.subtitle = String(req.body.subtitle).trim();
    }
    if (req.body?.image !== undefined && String(req.body.image).trim()) {
      ad.image = String(req.body.image).trim();
    }
    if (req.body?.cta_label !== undefined) {
      ad.cta_label = String(req.body.cta_label).trim() || 'Lihat Menu';
    }
    if (req.body?.is_active !== undefined) {
      ad.is_active = Boolean(req.body.is_active);
    }

    saveDatabase(auth.db);
    res.json({ ad });
  });

  app.delete('/api/dapur-admin/ads/:id', (req, res) => {
    const auth = requireAdmin(req, res);
    if (!auth) return;

    const adId = Number(req.params.id);
    auth.db.ads = auth.db.ads.filter((a) => a.id !== adId);
    saveDatabase(auth.db);
    res.json({ ok: true });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
