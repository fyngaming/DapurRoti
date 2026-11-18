import type {
  AdBanner,
  Category,
  Product,
  Promo,
  SiteSettings,
  StoreBranch,
} from '../types/bakery';

export const STORE_CONFIG = {
  brandName: 'Dapur Roti Hajatan',
  tagline: 'Roti Hajatan & Snack Box Segar dari Oven',
  adminWhatsapp: '6281234567890',
  bankName: 'BCA',
  bankAccountNumber: '1234567890',
  bankAccountHolder: 'Dapur Roti Hajatan',
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: STORE_CONFIG.brandName,
  tagline: STORE_CONFIG.tagline,
  footerServiceText: 'Layanan Roti Hajatan & Snack Box',
  operatingHours: 'Setiap hari 06.00 – 19.00 WIB',
  footerAddress: '',
  footerCopyright: 'Seluruh hak cipta dilindungi.',
  adminWhatsapp: STORE_CONFIG.adminWhatsapp,
  bankName: STORE_CONFIG.bankName,
  bankAccountNumber: STORE_CONFIG.bankAccountNumber,
  bankAccountHolder: STORE_CONFIG.bankAccountHolder,
};

export const SEED_CATEGORIES: Category[] = [
  { id: 1, name: 'Roti Manis & Gurih', slug: 'roti' },
  { id: 2, name: 'Paket Snack Box', slug: 'paket' },
];

export const SEED_STORES: StoreBranch[] = [
  {
    id: 1,
    name: 'Cabang Kemang (Dapur Pusat)',
    address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    phone: '6281234567890',
    hours: '06.00 – 19.00 WIB',
    is_active: true,
  },
  {
    id: 2,
    name: 'Cabang Tebet',
    address: 'Jl. Tebet Barat Dalam Raya No. 12, Jakarta Selatan',
    phone: '6281234567891',
    hours: '06.30 – 19.00 WIB',
    is_active: true,
  },
  {
    id: 3,
    name: 'Cabang BSD Serpong',
    address: 'Ruko Golden Boulevard Blok C-08, Tangerang Selatan',
    phone: '6281234567892',
    hours: '07.00 – 19.00 WIB',
    is_active: true,
  },
  {
    id: 4,
    name: 'Cabang Bekasi Barat',
    address: 'Jl. Kalimalang Raya No. 88, Bekasi',
    phone: '6281234567893',
    hours: '06.30 – 18.30 WIB',
    is_active: true,
  },
];

export const SEED_PROMOS: Promo[] = [
  {
    id: 1,
    code: 'HAJATAN10',
    title: 'Diskon 10% Pesanan Hajatan',
    discount_type: 'percent',
    discount_value: 10,
    min_order: 50000,
    is_active: true,
  },
  {
    id: 2,
    code: 'HEMAT15RB',
    title: 'Potongan Langsung Rp 15.000',
    discount_type: 'fixed',
    discount_value: 15000,
    min_order: 100000,
    is_active: true,
  },
];

export const SEED_ADS: AdBanner[] = [
  {
    id: 1,
    title: 'Promo Paket Pengajian & Syukuran — Diskon 10% dengan Kode HAJATAN10',
    subtitle:
      'Berlaku untuk minimal pemesanan Rp 50.000 di seluruh 4 cabang dapur kami. Bisa Pre-Order DP 50%.',
    image: '/src/assets/images/hero_bakery_spread_1794924158422.jpg',
    cta_label: 'Pesan Sekarang',
    is_active: true,
  },
  {
    id: 2,
    title: 'Paket Box Hajatan Komplit Siap Bagi untuk Acara Kantor & Keluarga',
    subtitle:
      'Kemasan pita elegan berisi roti almond, pastel gurih, kue lapis, dan puding karamel hangat dari oven.',
    image: '/src/assets/images/paket_box_komplit_1794924158398.jpg',
    cta_label: 'Lihat Paket Box',
    is_active: true,
  },
  {
    id: 3,
    title: 'Roti Sobek Cokelat Keju & Roti Sisir Mentega Klasik Favorit Hantaran',
    subtitle:
      'Tersedia berbagai pilihan varian rasa dan isi untuk suguhan tamu spesial Anda.',
    image: '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg',
    cta_label: 'Pilih Varian Roti',
    is_active: true,
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Roti Sobek Cokelat Keju',
    slug: 'roti-sobek-cokelat-keju',
    category: 'roti',
    description:
      'Roti sobek lembut isi selai cokelat lumer dan taburan keju cheddar parut panggang. Cocok untuk suguhan keluarga maupun hantaran.',
    price: 18000,
    variants: ['Cokelat Keju', 'Full Cokelat', 'Extra Keju'],
    image: '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg',
    stock: 25,
    expired_days: 3,
    is_available: true,
  },
  {
    id: 2,
    name: 'Roti Manis Pisang Cokelat',
    slug: 'roti-manis-pisang-cokelat',
    category: 'roti',
    description:
      'Roti manis empuk dengan isian pisang raja manis dan cokelat batang premium yang lumer di setiap gigitan.',
    price: 5000,
    variants: ['Pisang Cokelat', 'Pisang Keju'],
    image: '/src/assets/images/roti_manis_pisang_cokelat_1794924157573.jpg',
    stock: 40,
    expired_days: 3,
    is_available: true,
  },
  {
    id: 3,
    name: 'Roti Sosis Mayo',
    slug: 'roti-sosis-mayo',
    category: 'roti',
    description:
      'Roti gurih lembut berbalut sosis sapi pilihan, saus tomat, mayones creamy, dan taburan peterseli harum.',
    price: 6500,
    variants: ['Original Mayo', 'Pedas Keju'],
    image: '/src/assets/images/roti_sosis_mayo_1794924158329.jpg',
    stock: 30,
    expired_days: 2,
    is_available: true,
  },
  {
    id: 4,
    name: 'Paket Box Hajatan Hemat',
    slug: 'paket-box-hajatan-hemat',
    category: 'paket',
    description:
      'Isi 2 roti manis pilihan, 1 risoles ragout ayam renyah, dan air mineral botol 220ml dalam kemasan dus kraft rapi.',
    price: 15000,
    variants: ['Box Manis + Risoles', 'Box Gurih + Lemper'],
    image: '/src/assets/images/paket_box_hemat_1794924157948.jpg',
    stock: 50,
    expired_days: 1,
    is_available: true,
  },
  {
    id: 5,
    name: 'Paket Box Hajatan Komplit',
    slug: 'paket-box-hajatan-komplit',
    category: 'paket',
    description:
      'Paket istimewa berisi 1 roti almond premium, 1 pastel gurih, 1 kue lapis legit, dan 1 puding karamel dalam box elegan berpita.',
    price: 22000,
    variants: ['Box Reguler Pita', 'Box Eksklusif Kartu Ucapan'],
    image: '/src/assets/images/paket_box_komplit_1794924158398.jpg',
    stock: 35,
    expired_days: 1,
    is_available: true,
  },
  {
    id: 6,
    name: 'Roti Sisir Mentega Klasik',
    slug: 'roti-sisir-mentega-klasik',
    category: 'roti',
    description:
      'Roti sisir berlapis olesan mentega wisman dan gula pasir halus dengan tekstur berserat lembut dan aroma klasik.',
    price: 16000,
    variants: ['Mentega Gula', 'Mentega Pandan'],
    image: '/src/assets/images/roti_sisir_mentega_1794924159095.jpg',
    stock: 20,
    expired_days: 5,
    is_available: true,
  },
  {
    id: 7,
    name: 'Roti Abon Sapi Spesial',
    slug: 'roti-abon-sapi-spesial',
    category: 'roti',
    description:
      'Roti gulung lembut dengan olesan mayones manis gurih dan taburan melimpah abon sapi asli renyah.',
    price: 7500,
    variants: ['Abon Manis', 'Abon Pedas'],
    image: '/src/assets/images/roti_abon_sapi_1794924159421.jpg',
    stock: 30,
    expired_days: 4,
    is_available: true,
  },
];
