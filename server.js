// server.ts
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createServer as createViteServer } from "vite";

// src/data/seedProducts.ts
var STORE_CONFIG = {
  brandName: "Dapur Roti Hajatan",
  tagline: "Roti Hajatan & Snack Box Segar dari Oven",
  adminWhatsapp: "6281234567890",
  bankName: "BCA",
  bankAccountNumber: "1234567890",
  bankAccountHolder: "Dapur Roti Hajatan"
};
var SEED_PRODUCTS = [
  {
    id: 1,
    name: "Roti Sobek Cokelat Keju",
    slug: "roti-sobek-cokelat-keju",
    category: "roti",
    description: "Roti sobek lembut isi selai cokelat lumer dan taburan keju cheddar parut panggang. Cocok untuk suguhan keluarga maupun hantaran.",
    price: 18e3,
    image: "/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg",
    is_available: true
  },
  {
    id: 2,
    name: "Roti Manis Pisang Cokelat",
    slug: "roti-manis-pisang-cokelat",
    category: "roti",
    description: "Roti manis empuk dengan isian pisang raja manis dan cokelat batang premium yang lumer di setiap gigitan.",
    price: 5e3,
    image: "/src/assets/images/roti_manis_pisang_cokelat_1794924157573.jpg",
    is_available: true
  },
  {
    id: 3,
    name: "Roti Sosis Mayo",
    slug: "roti-sosis-mayo",
    category: "roti",
    description: "Roti gurih lembut berbalut sosis sapi pilihan, saus tomat, mayones creamy, dan taburan peterseli harum.",
    price: 6500,
    image: "/src/assets/images/roti_sosis_mayo_1794924158329.jpg",
    is_available: true
  },
  {
    id: 4,
    name: "Paket Box Hajatan Hemat",
    slug: "paket-box-hajatan-hemat",
    category: "paket",
    description: "Isi 2 roti manis pilihan, 1 risoles ragout ayam renyah, dan air mineral botol 220ml dalam kemasan dus kraft rapi.",
    price: 15e3,
    image: "/src/assets/images/paket_box_hemat_1794924157948.jpg",
    is_available: true
  },
  {
    id: 5,
    name: "Paket Box Hajatan Komplit",
    slug: "paket-box-hajatan-komplit",
    category: "paket",
    description: "Paket istimewa berisi 1 roti almond premium, 1 pastel gurih, 1 kue lapis legit, dan 1 puding karamel dalam box elegan berpita.",
    price: 22e3,
    image: "/src/assets/images/paket_box_komplit_1794924158398.jpg",
    is_available: true
  },
  {
    id: 6,
    name: "Roti Sisir Mentega Klasik",
    slug: "roti-sisir-mentega-klasik",
    category: "roti",
    description: "Roti sisir berlapis olesan mentega wisman dan gula pasir halus dengan tekstur berserat lembut dan aroma klasik.",
    price: 16e3,
    image: "/src/assets/images/roti_sisir_mentega_1794924159095.jpg",
    is_available: true
  },
  {
    id: 7,
    name: "Roti Abon Sapi Spesial",
    slug: "roti-abon-sapi-spesial",
    category: "roti",
    description: "Roti gulung lembut dengan olesan mayones manis gurih dan taburan melimpah abon sapi asli renyah.",
    price: 7500,
    image: "/src/assets/images/roti_abon_sapi_1794924159421.jpg",
    is_available: true
  }
];

// src/utils/orderLogic.ts
function formatRupiah(amount) {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rp ${safeAmount.toLocaleString("id-ID")}`;
}
function calculateOrderTotals(items, orderType) {
  let totalItems = 0;
  let totalAmount = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, Math.floor(item.price));
    totalItems += qty;
    totalAmount += price * qty;
  }
  const dpAmount = orderType === "po" ? Math.round(totalAmount * 0.5) : 0;
  const remainingAmount = orderType === "po" ? totalAmount - dpAmount : 0;
  return {
    totalItems,
    totalAmount,
    dpAmount,
    remainingAmount
  };
}
function generateOrderCode(date = /* @__PURE__ */ new Date(), randomSuffix) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const suffix = randomSuffix ?? Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, "X");
  return `ORD-${year}${month}${day}-${suffix}`;
}
function formatEventDateTime(rawDatetime) {
  if (!rawDatetime) return "-";
  const parsed = new Date(rawDatetime);
  if (Number.isNaN(parsed.getTime())) return rawDatetime;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}
function validateCheckoutForm(form) {
  const errors = {};
  if (!form.customer_name.trim()) {
    errors.customer_name = "Nama pemesan wajib diisi.";
  }
  const normalizedPhone = form.customer_phone.replace(/[\s-]/g, "");
  if (!normalizedPhone) {
    errors.customer_phone = "Nomor WhatsApp pemesan wajib diisi.";
  } else if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(normalizedPhone)) {
    errors.customer_phone = "Gunakan format nomor WhatsApp Indonesia yang valid (mis. 081234567890).";
  }
  if (!form.delivery_address.trim() || form.delivery_address.trim().length < 8) {
    errors.delivery_address = "Alamat lengkap pengiriman / pengambilan wajib diisi minimal 8 karakter.";
  }
  if (!form.event_datetime.trim()) {
    errors.event_datetime = "Tanggal & jam acara wajib diisi.";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
function buildWhatsAppMessage(input) {
  const { totalAmount, dpAmount, remainingAmount } = calculateOrderTotals(
    input.items,
    input.orderType
  );
  const lines = [];
  lines.push(`Halo Admin *${input.brandName}*, saya ingin memesan roti/snack box untuk acara.`);
  if (input.orderCode) {
    lines.push(`Kode Pesanan: *${input.orderCode}*`);
  }
  lines.push("");
  lines.push("*DATA PEMESAN*");
  lines.push(`- Nama: ${input.customerName.trim() || "-"}`);
  lines.push(`- Email: ${input.customerEmail.trim() || "-"}`);
  lines.push(`- No. WhatsApp: ${input.customerPhone.trim() || "-"}`);
  lines.push(`- Alamat: ${input.deliveryAddress.trim() || "-"}`);
  lines.push(`- Tanggal & Jam Acara: ${formatEventDateTime(input.eventDatetime)}`);
  lines.push("");
  lines.push("*RINCIAN PESANAN*");
  if (input.items.length === 0) {
    lines.push("(Belum ada item di keranjang)");
  } else {
    input.items.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      lines.push(
        `${index + 1}. ${item.name} (${item.quantity}x @ ${formatRupiah(item.price)}) = ${formatRupiah(subtotal)}`
      );
    });
  }
  lines.push("");
  lines.push("*RINGKASAN PEMBAYARAN*");
  lines.push(`- Total Harga: *${formatRupiah(totalAmount)}*`);
  if (input.orderType === "po") {
    lines.push(`- Jenis Pesanan: Pre-Order (PO) - DP 50%`);
    lines.push(`- Nominal DP 50%: *${formatRupiah(dpAmount)}*`);
    lines.push(`- Sisa Pelunasan: ${formatRupiah(remainingAmount)}`);
  } else {
    lines.push(`- Jenis Pesanan: Pesan Langsung / Lunas`);
  }
  const paymentLabel = input.paymentMethod === "transfer" ? `Transfer Bank Manual (${input.bankDetails})` : "Bayar Tunai / COD (Saat barang diambil/diantar)";
  lines.push(`- Metode Pembayaran: ${paymentLabel}`);
  lines.push("");
  lines.push("Mohon konfirmasi ketersediaan jadwal & total tagihan. Terima kasih!");
  return lines.join("\n");
}
function buildWhatsAppUrl(adminWhatsappNumber, message) {
  const cleanNumber = adminWhatsappNumber.replace(/[^0-9]/g, "");
  const normalizedNumber = cleanNumber.startsWith("0") ? `62${cleanNumber.slice(1)}` : cleanNumber;
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

// server.ts
var DATA_DIR = path.resolve(process.cwd(), ".data");
var DB_PATH = path.join(DATA_DIR, "db.json");
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (derived.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derived, keyBuffer);
}
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [
        {
          id: 1,
          name: "Siti Aminah",
          email: "siti@rotihajatan.id",
          phone: "081234567890",
          default_address: "Jl. Kenanga Raya No. 18, Kemang, Jakarta Selatan",
          google_id: null,
          avatar: null,
          password_hash: hashPassword("password123")
        }
      ],
      sessions: {},
      orders: [],
      nextUserId: 2,
      nextOrderId: 1,
      nextOrderItemId: 1
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    const fallback = {
      users: [],
      sessions: {},
      orders: [],
      nextUserId: 1,
      nextOrderId: 1,
      nextOrderItemId: 1
    };
    return fallback;
  }
}
function saveDatabase(db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempPath, DB_PATH);
}
function sanitizeUser(user) {
  const { password_hash: _ignored, ...safeUser } = user;
  return safeUser;
}
function parseCookies(cookieHeader) {
  const result = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawVal] = part.split("=");
    const key = rawKey?.trim();
    if (!key) continue;
    result[key] = decodeURIComponent(rawVal.join("=").trim());
  }
  return result;
}
var SESSION_COOKIE_NAME = "roti_hajatan_session";
function getSessionUser(req, db) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) ?? null;
}
function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
}
function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}
async function startServer() {
  const app = express();
  const port = Number(process.env.PORT ?? 3e3);
  const isProd = process.env.NODE_ENV === "production";
  app.use(express.json());
  app.get("/api/products", (_req, res) => {
    res.json({
      products: SEED_PRODUCTS.filter((p) => p.is_available)
    });
  });
  app.get("/api/auth/me", (req, res) => {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    res.json({ user: user ? sanitizeUser(user) : null });
  });
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone } = req.body ?? {};
    const cleanName = String(name ?? "").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanPassword = String(password ?? "");
    if (!cleanName || cleanName.length < 2) {
      res.status(422).json({ message: "Nama lengkap minimal 2 karakter." });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(422).json({ message: "Format email tidak valid." });
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      res.status(422).json({ message: "Kata sandi minimal 6 karakter." });
      return;
    }
    const db = ensureDatabase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(422).json({ message: "Email sudah terdaftar. Silakan masuk." });
      return;
    }
    const newUser = {
      id: db.nextUserId++,
      name: cleanName,
      email: cleanEmail,
      phone: phone ? String(phone).trim() : null,
      default_address: null,
      google_id: null,
      avatar: null,
      password_hash: hashPassword(cleanPassword)
    };
    const token = crypto.randomBytes(24).toString("hex");
    db.users.push(newUser);
    db.sessions[token] = newUser.id;
    saveDatabase(db);
    setSessionCookie(res, token);
    res.status(201).json({ user: sanitizeUser(newUser) });
  });
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanPassword = String(password ?? "");
    if (!cleanEmail || !cleanPassword) {
      res.status(422).json({ message: "Email dan kata sandi wajib diisi." });
      return;
    }
    const db = ensureDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(cleanPassword, user.password_hash)) {
      res.status(401).json({ message: "Email atau kata sandi salah." });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    db.sessions[token] = user.id;
    saveDatabase(db);
    setSessionCookie(res, token);
    res.json({ user: sanitizeUser(user) });
  });
  app.post("/api/auth/google", (req, res) => {
    const { name, email, google_id } = req.body ?? {};
    const cleanEmail = String(email ?? "").trim().toLowerCase() || "tamu.google@gmail.com";
    const cleanName = String(name ?? "").trim() || "Pengguna Google";
    const cleanGoogleId = String(google_id ?? "").trim() || `google_${crypto.createHash("md5").update(cleanEmail).digest("hex").slice(0, 12)}`;
    const db = ensureDatabase();
    let user = db.users.find(
      (u) => u.google_id === cleanGoogleId || u.email.toLowerCase() === cleanEmail
    );
    if (!user) {
      user = {
        id: db.nextUserId++,
        name: cleanName,
        email: cleanEmail,
        google_id: cleanGoogleId,
        avatar: null,
        phone: null,
        default_address: null,
        password_hash: null
      };
      db.users.push(user);
    } else if (!user.google_id) {
      user.google_id = cleanGoogleId;
    }
    const token = crypto.randomBytes(24).toString("hex");
    db.sessions[token] = user.id;
    saveDatabase(db);
    setSessionCookie(res, token);
    res.json({ user: sanitizeUser(user) });
  });
  app.post("/api/auth/logout", (req, res) => {
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
  app.get("/api/orders", (req, res) => {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    if (!user) {
      res.status(401).json({ message: "Silakan masuk terlebih dahulu untuk melihat riwayat pesanan." });
      return;
    }
    const userOrders = db.orders.filter((o) => o.user_id === user.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((order) => {
      const msg = buildWhatsAppMessage({
        brandName: STORE_CONFIG.brandName,
        orderCode: order.order_code,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        deliveryAddress: order.delivery_address,
        eventDatetime: order.event_datetime,
        orderType: order.order_type,
        paymentMethod: order.payment_method,
        bankDetails: `${STORE_CONFIG.bankName} - ${STORE_CONFIG.bankAccountNumber} a.n. ${STORE_CONFIG.bankAccountHolder}`,
        items: order.items.map((item) => ({
          name: item.product_name,
          price: item.price,
          quantity: item.quantity
        }))
      });
      return {
        ...order,
        whatsapp_url: buildWhatsAppUrl(STORE_CONFIG.adminWhatsapp, msg)
      };
    });
    res.json({ orders: userOrders });
  });
  app.post("/api/orders", (req, res) => {
    const db = ensureDatabase();
    const user = getSessionUser(req, db);
    if (!user) {
      res.status(401).json({ message: "Silakan masuk terlebih dahulu sebelum memesan." });
      return;
    }
    const {
      customer_name,
      customer_phone,
      delivery_address,
      event_datetime,
      order_type,
      payment_method,
      items
    } = req.body ?? {};
    const cleanOrderType = order_type === "direct" ? "direct" : "po";
    const cleanPaymentMethod = payment_method === "cash" ? "cash" : "transfer";
    const validation = validateCheckoutForm({
      customer_name: String(customer_name ?? ""),
      customer_email: user.email,
      customer_phone: String(customer_phone ?? ""),
      delivery_address: String(delivery_address ?? ""),
      event_datetime: String(event_datetime ?? ""),
      order_type: cleanOrderType,
      payment_method: cleanPaymentMethod
    });
    if (!validation.isValid) {
      res.status(422).json({
        message: "Mohon periksa kembali data pemesanan Anda.",
        errors: validation.errors
      });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(422).json({ message: "Keranjang belanja masih kosong." });
      return;
    }
    const resolvedItems = [];
    const orderId = db.nextOrderId++;
    for (const rawItem of items) {
      const productId = Number(rawItem?.product_id);
      const quantity = Math.floor(Number(rawItem?.quantity));
      if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity < 1) {
        res.status(422).json({ message: "Item keranjang tidak valid." });
        return;
      }
      const product = SEED_PRODUCTS.find((p) => p.id === productId && p.is_available);
      if (!product) {
        res.status(422).json({ message: `Produk dengan ID ${productId} tidak ditemukan.` });
        return;
      }
      resolvedItems.push({
        id: db.nextOrderItemId++,
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity
      });
    }
    const totals = calculateOrderTotals(resolvedItems, cleanOrderType);
    const orderCode = generateOrderCode(/* @__PURE__ */ new Date());
    const newOrder = {
      id: orderId,
      order_code: orderCode,
      user_id: user.id,
      customer_name: String(customer_name).trim(),
      customer_email: user.email,
      customer_phone: String(customer_phone).trim(),
      delivery_address: String(delivery_address).trim(),
      event_datetime: String(event_datetime).trim(),
      order_type: cleanOrderType,
      payment_method: cleanPaymentMethod,
      total_amount: totals.totalAmount,
      dp_amount: totals.dpAmount,
      status: "pending_wa",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      items: resolvedItems
    };
    user.phone = newOrder.customer_phone;
    user.default_address = newOrder.delivery_address;
    db.orders.push(newOrder);
    saveDatabase(db);
    const waMessage = buildWhatsAppMessage({
      brandName: STORE_CONFIG.brandName,
      orderCode: newOrder.order_code,
      customerName: newOrder.customer_name,
      customerEmail: newOrder.customer_email,
      customerPhone: newOrder.customer_phone,
      deliveryAddress: newOrder.delivery_address,
      eventDatetime: newOrder.event_datetime,
      orderType: newOrder.order_type,
      paymentMethod: newOrder.payment_method,
      bankDetails: `${STORE_CONFIG.bankName} - ${STORE_CONFIG.bankAccountNumber} a.n. ${STORE_CONFIG.bankAccountHolder}`,
      items: resolvedItems.map((item) => ({
        name: item.product_name,
        price: item.price,
        quantity: item.quantity
      }))
    });
    const whatsappUrl = buildWhatsAppUrl(STORE_CONFIG.adminWhatsapp, waMessage);
    res.status(201).json({
      order: {
        ...newOrder,
        whatsapp_url: whatsappUrl
      },
      whatsapp_url: whatsappUrl
    });
  });
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
startServer();
