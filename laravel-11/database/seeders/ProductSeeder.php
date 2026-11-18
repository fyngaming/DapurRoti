<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name' => 'Roti Sobek Cokelat Keju',
                'slug' => 'roti-sobek-cokelat-keju',
                'description' => 'Roti sobek lembut isi selai cokelat lumer dan taburan keju cheddar parut panggang. Cocok untuk suguhan keluarga maupun hantaran.',
                'price' => 18000,
                'image' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Roti Manis Pisang Cokelat',
                'slug' => 'roti-manis-pisang-cokelat',
                'description' => 'Roti manis empuk dengan isian pisang raja manis dan cokelat batang premium yang lumer di setiap gigitan.',
                'price' => 5000,
                'image' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Roti Sosis Mayo',
                'slug' => 'roti-sosis-mayo',
                'description' => 'Roti gurih lembut berbalut sosis sapi pilihan, saus tomat, mayones creamy, dan taburan peterseli harum.',
                'price' => 6500,
                'image' => 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Paket Box Hajatan Hemat',
                'slug' => 'paket-box-hajatan-hemat',
                'description' => 'Isi 2 roti manis pilihan, 1 risoles ragout ayam renyah, dan air mineral botol 220ml dalam kemasan dus kraft rapi.',
                'price' => 15000,
                'image' => 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Paket Box Hajatan Komplit',
                'slug' => 'paket-box-hajatan-komplit',
                'description' => 'Paket istimewa berisi 1 roti almond premium, 1 pastel gurih, 1 kue lapis legit, dan 1 puding karamel dalam box elegan berpita.',
                'price' => 22000,
                'image' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Roti Sisir Mentega Klasik',
                'slug' => 'roti-sisir-mentega-klasik',
                'description' => 'Roti sisir berlapis olesan mentega wisman dan gula pasir halus dengan tekstur berserat lembut dan aroma klasik.',
                'price' => 16000,
                'image' => 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Roti Abon Sapi Spesial',
                'slug' => 'roti-abon-sapi-spesial',
                'description' => 'Roti gulung lembut dengan olesan mayones manis gurih dan taburan melimpah abon sapi asli renyah.',
                'price' => 7500,
                'image' => 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=80',
                'is_available' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(['slug' => $product['slug']], $product);
        }
    }
}
