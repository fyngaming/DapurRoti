<?php

namespace Database\Seeders;

use App\Models\Ad;
use App\Models\Category;
use App\Models\Product;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Default Demo Customer & Admin
        User::updateOrCreate(
            ['email' => 'siti@rotihajatan.id'],
            [
                'name' => 'Siti Aminah',
                'role' => 'customer',
                'phone' => '081234567890',
                'default_address' => 'Jl. Kenanga Raya No. 18, Kemang, Jakarta Selatan',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@rotihajatan.id'],
            [
                'name' => 'Admin Dapur Roti',
                'role' => 'admin',
                'phone' => '6281234567890',
                'default_address' => 'Dapur Pusat',
                'password' => Hash::make('adminDapur2026'),
                'email_verified_at' => now(),
            ]
        );

        // 2. Categories
        $categories = [
            ['name' => 'Roti Manis & Gurih', 'slug' => 'roti'],
            ['name' => 'Paket Snack Box', 'slug' => 'paket'],
        ];
        foreach ($categories as $cat) {
            Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 3. Products (with stock & expired_days)
        $products = [
            [
                'name' => 'Roti Sobek Cokelat Keju',
                'slug' => 'roti-sobek-cokelat-keju',
                'category' => 'roti',
                'description' => 'Roti sobek lembut isi selai cokelat lumer dan taburan keju cheddar parut panggang. Cocok untuk suguhan keluarga maupun hantaran.',
                'price' => 18000,
                'variants' => ['Cokelat Keju', 'Full Cokelat', 'Extra Keju'],
                'image' => '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg',
                'stock' => 25,
                'expired_days' => 3,
                'is_available' => true,
            ],
            [
                'name' => 'Roti Manis Pisang Cokelat',
                'slug' => 'roti-manis-pisang-cokelat',
                'category' => 'roti',
                'description' => 'Roti manis empuk dengan isian pisang raja manis dan cokelat batang premium yang lumer di setiap gigitan.',
                'price' => 5000,
                'variants' => ['Pisang Cokelat', 'Pisang Keju'],
                'image' => '/src/assets/images/roti_manis_pisang_cokelat_1794924157573.jpg',
                'stock' => 40,
                'expired_days' => 3,
                'is_available' => true,
            ],
            [
                'name' => 'Roti Sosis Mayo',
                'slug' => 'roti-sosis-mayo',
                'category' => 'roti',
                'description' => 'Roti gurih lembut berbalut sosis sapi pilihan, saus tomat, mayones creamy, dan taburan peterseli harum.',
                'price' => 6500,
                'variants' => ['Original Mayo', 'Pedas Keju'],
                'image' => '/src/assets/images/roti_sosis_mayo_1794924158329.jpg',
                'stock' => 30,
                'expired_days' => 2,
                'is_available' => true,
            ],
            [
                'name' => 'Paket Box Hajatan Hemat',
                'slug' => 'paket-box-hajatan-hemat',
                'category' => 'paket',
                'description' => 'Isi 2 roti manis pilihan, 1 risoles ragout ayam renyah, dan air mineral botol 220ml dalam kemasan dus kraft rapi.',
                'price' => 15000,
                'variants' => ['Box Manis + Risoles', 'Box Gurih + Lemper'],
                'image' => '/src/assets/images/paket_box_hemat_1794924157948.jpg',
                'stock' => 50,
                'expired_days' => 1,
                'is_available' => true,
            ],
            [
                'name' => 'Paket Box Hajatan Komplit',
                'slug' => 'paket-box-hajatan-komplit',
                'category' => 'paket',
                'description' => 'Paket istimewa berisi 1 roti almond premium, 1 pastel gurih, 1 kue lapis legit, dan 1 puding karamel dalam box elegan berpita.',
                'price' => 22000,
                'variants' => ['Box Reguler Pita', 'Box Eksklusif Kartu Ucapan'],
                'image' => '/src/assets/images/paket_box_komplit_1794924158398.jpg',
                'stock' => 35,
                'expired_days' => 1,
                'is_available' => true,
            ],
            [
                'name' => 'Roti Sisir Mentega Klasik',
                'slug' => 'roti-sisir-mentega-klasik',
                'category' => 'roti',
                'description' => 'Roti sisir berlapis olesan mentega wisman dan gula pasir halus dengan tekstur berserat lembut dan aroma klasik.',
                'price' => 16000,
                'variants' => ['Mentega Gula', 'Mentega Pandan'],
                'image' => '/src/assets/images/roti_sisir_mentega_1794924159095.jpg',
                'stock' => 20,
                'expired_days' => 5,
                'is_available' => true,
            ],
            [
                'name' => 'Roti Abon Sapi Spesial',
                'slug' => 'roti-abon-sapi-spesial',
                'category' => 'roti',
                'description' => 'Roti gulung lembut dengan olesan mayones manis gurih dan taburan melimpah abon sapi asli renyah.',
                'price' => 7500,
                'variants' => ['Abon Manis', 'Abon Pedas'],
                'image' => '/src/assets/images/roti_abon_sapi_1794924159421.jpg',
                'stock' => 30,
                'expired_days' => 4,
                'is_available' => true,
            ],
        ];
        foreach ($products as $prod) {
            Product::firstOrCreate(['slug' => $prod['slug']], $prod);
        }

        // 4. Store Branches
        if (Store::query()->count() === 0) {
            $stores = [
                [
                    'name' => 'Cabang Kemang (Dapur Pusat)',
                    'address' => 'Jl. Kemang Raya No. 45, Jakarta Selatan',
                    'phone' => '6281234567890',
                    'hours' => '06.00 – 19.00 WIB',
                    'is_active' => true,
                ],
                [
                    'name' => 'Cabang Tebet',
                    'address' => 'Jl. Tebet Barat Dalam Raya No. 12, Jakarta Selatan',
                    'phone' => '6281234567891',
                    'hours' => '06.30 – 19.00 WIB',
                    'is_active' => true,
                ],
                [
                    'name' => 'Cabang BSD Serpong',
                    'address' => 'Ruko Golden Boulevard Blok C-08, Tangerang Selatan',
                    'phone' => '6281234567892',
                    'hours' => '07.00 – 19.00 WIB',
                    'is_active' => true,
                ],
                [
                    'name' => 'Cabang Bekasi Barat',
                    'address' => 'Jl. Kalimalang Raya No. 88, Bekasi',
                    'phone' => '6281234567893',
                    'hours' => '06.30 – 18.30 WIB',
                    'is_active' => true,
                ],
            ];
            foreach ($stores as $store) {
                Store::create($store);
            }
        }

        // 5. Promos
        $promos = [
            [
                'code' => 'HAJATAN10',
                'title' => 'Diskon 10% Pesanan Hajatan',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_order' => 50000,
                'is_active' => true,
            ],
            [
                'code' => 'HEMAT15RB',
                'title' => 'Potongan Langsung Rp 15.000',
                'discount_type' => 'fixed',
                'discount_value' => 15000,
                'min_order' => 100000,
                'is_active' => true,
            ],
        ];
        foreach ($promos as $promo) {
            Promo::firstOrCreate(['code' => $promo['code']], $promo);
        }

        // 6. Ads Carousel
        if (Ad::query()->count() === 0) {
            $ads = [
                [
                    'title' => 'Promo Paket Pengajian & Syukuran — Diskon 10% dengan Kode HAJATAN10',
                    'subtitle' => 'Berlaku untuk minimal pemesanan Rp 50.000 di seluruh 4 cabang dapur kami. Bisa Pre-Order DP 50%.',
                    'image' => '/src/assets/images/hero_bakery_spread_1794924158422.jpg',
                    'cta_label' => 'Pesan Sekarang',
                    'is_active' => true,
                ],
                [
                    'title' => 'Paket Box Hajatan Komplit Siap Bagi untuk Acara Kantor & Keluarga',
                    'subtitle' => 'Kemasan pita elegan berisi roti almond, pastel gurih, kue lapis, dan puding karamel hangat dari oven.',
                    'image' => '/src/assets/images/paket_box_komplit_1794924158398.jpg',
                    'cta_label' => 'Lihat Paket Box',
                    'is_active' => true,
                ],
                [
                    'title' => 'Roti Sobek Cokelat Keju & Roti Sisir Mentega Klasik Favorit Hantaran',
                    'subtitle' => 'Tersedia berbagai pilihan varian rasa dan isi untuk suguhan tamu spesial Anda.',
                    'image' => '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg',
                    'cta_label' => 'Pilih Varian Roti',
                    'is_active' => true,
                ],
            ];
            foreach ($ads as $ad) {
                Ad::create($ad);
            }
        }

        // 7. Site Settings
        SiteSetting::firstOrCreate(
            ['id' => 1],
            [
                'brand_name' => 'Dapur Roti Hajatan',
                'tagline' => 'Roti Hajatan & Snack Box Segar dari Oven',
                'footer_service_text' => 'Layanan Roti Hajatan & Snack Box',
                'operating_hours' => 'Setiap hari 06.00 – 19.00 WIB',
                'footer_address' => '',
                'footer_copyright' => 'Seluruh hak cipta dilindungi.',
                'admin_whatsapp' => '6281234567890',
                'bank_name' => 'BCA',
                'bank_account_number' => '1234567890',
                'bank_account_holder' => 'Dapur Roti Hajatan',
            ]
        );
    }
}
